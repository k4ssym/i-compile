import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import session from 'express-session';
import User from './models/user.js';
import sequelize from './models/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

const RAPIDAPI_KEY = '31fe4e5fdfmshf6bf2c27eb8cd00p1099bdjsn178775d76e01';
const RAPIDAPI_HOST = 'gpt-4o.p.rapidapi.com';
const RAPIDAPI_URL = `https://${RAPIDAPI_HOST}/chat/completions`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

sequelize.sync().catch(err => {
    console.error('Database sync error:', err);
    process.exit(1);
});

app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'register.html'));
    }
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });
        req.session.userId = user.id;
        res.json({ success: true });
    } catch (error) {
        console.error('Registration Error:', error);
        res.json({ success: false, message: 'Registration failed.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.json({ success: false, message: 'Login failed.' });
    }
});

app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await User.findByPk(req.session.userId);
        res.json({ name: user.name, email: user.email, icoins: user.icoins });
    } catch (error) {
        console.error('Profile Retrieval Error:', error);
        res.status(500).json({ message: 'Failed to retrieve profile information.' });
    }
});

app.post('/update-profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, email, password } = req.body;

    try {
        const user = await User.findByPk(req.session.userId);

        user.name = name;
        user.email = email;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.post('/run-code', async (req, res) => {
    const { code } = req.body;

    try {
        const user = await User.findByPk(req.session.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (user.icoins < 5) {
            return res.status(400).json({ success: false, message: 'Not enough iCoins.' });
        }

        user.icoins -= 5; // Deduct iCoins
        await user.save(); // Save the updated iCoins balance to the database

        const messages = [
            {
                role: "user",
                content: `Ignore single line comments, which can start from '#', '//'. JUST GIVE ME AN OUTPUT of the following code if it is error-free. If there is any mistake, show me my mistake and the line numbers in one sentence. Do not send me the corrected code \n\n${code}\n\n`
            }
        ];

        console.log('Sending request to AI API with the following data:', messages);

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

        console.log('API Response received:', response.data);

        let aiResponse = response.data.choices?.[0]?.message?.content?.trim();

        if (!aiResponse) {
            aiResponse = "No output provided by the AI";  // Fallback in case of an unexpected response structure
        }

        // Send the extracted content to the frontend
        res.json({ success: true, output: aiResponse, icoins: user.icoins });
    } catch (error) {
        console.error('Run Code Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});


app.post('/correct-code', async (req, res) => {
    const { code } = req.body;

    try {
        const user = await User.findByPk(req.session.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (user.icoins < 30) {
            return res.status(400).json({ success: false, message: 'Not enough iCoins.' });
        }

        user.icoins -= 30;
        await user.save();

        const messages = [
            {
                role: "user",
                content: `Send me the corrected code with single-line comments based on the language type (Like for Python it is //) to show what you have changed. ONLY CODE WITH SINGLE LINE COMMENTS, I don't need your words: \n\n${code}\n\n`
            }
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

        let correctedCode = response.data.choices?.[0]?.message?.content?.trim();

        if (correctedCode) {
            const codeBlockMatch = correctedCode.match(/```([\s\S]+?)```/);
            if (codeBlockMatch) {
                correctedCode = codeBlockMatch[1].trim();
            }

            res.json({ success: true, correctedCode, icoins: user.icoins });
        } else {
            throw new Error("AI response did not contain corrected code.");
        }
    } catch (error) {
        console.error('Correct Code Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
