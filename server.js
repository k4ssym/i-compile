import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const RAPIDAPI_KEY = '31fe4e5fdfmshf6bf2c27eb8cd00p1099bdjsn178775d76e01';
const RAPIDAPI_HOST = 'gpt-4o.p.rapidapi.com';
const RAPIDAPI_URL = `https://${RAPIDAPI_HOST}/chat/completions`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/run-code', async (req, res) => {
    const { code } = req.body;

    try {
        const messages = [
            { role: "user", content: `Ignore single line comments, which can start from '#', '//'. JUST GIVE ME AN OUTPUT of the following code if it error free. If there is any mistake, show me my mistake and the line numbers in one sentence. Do not send me the corrected code \n\n${code}\n\n` }
        ];

        const response = await axios.post(RAPIDAPI_URL, {
            model: "gpt-4o",
            messages: messages,
            temperature: 0.2,
            max_tokens: 50,
            top_p: 0.5
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        console.log('API Response:', response.data);

        let aiResponse = response.data.choices[0].message.content.trim();

        res.json({ success: true, output: aiResponse });
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});

app.post('/correct-code', async (req, res) => {
    const { code } = req.body;

    try {
        const messages = [
            { role: "user", content: `Send me the corrected code with single-line comments based on the language type (Like for Python it is //) to show what you have changed. ONLY CODE WITH SINGLE LINE COMMENTS, I dont need your words: \n\n${code}\n\n` }
        ];

        const response = await axios.post(RAPIDAPI_URL, {
            model: "gpt-4o",
            messages: messages,
            temperature: 0.2,
            max_tokens: 500,
            top_p: 0.5
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        console.log('API Response:', response.data);

        let correctedCode = response.data.choices[0]?.message?.content?.trim();

        if (correctedCode) {
            const codeBlockMatch = correctedCode.match(/```([\s\S]+?)```/);
            if (codeBlockMatch) {
                correctedCode = codeBlockMatch[1].trim();
            }

            res.json({ success: true, correctedCode });
        } else {
            throw new Error("AI response did not contain corrected code.");
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'If you got this message, then I have no money to pay for API(' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
