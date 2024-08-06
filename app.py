from flask import Flask, render_template, request
import requests
import json
import markdown

app = Flask(__name__)

# Set your new RapidAPI key and endpoint details
RAPIDAPI_KEY = '31fe4e5fdfmshf6bf2c27eb8cd00p1099bdjsn178775d76e01'
RAPIDAPI_HOST = 'gpt-4o.p.rapidapi.com'
RAPIDAPI_URL = 'https://gpt-4o.p.rapidapi.com/chat/completions'

def query_rapidapi(prompt):
    headers = {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
    }
    data = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": prompt}]
    }
    response = requests.post(RAPIDAPI_URL, headers=headers, data=json.dumps(data))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 200:
        return response.json()
    else:
        return None

def get_function_info(function_name):
    prompt = f"Provide detailed information about the Python built-in function '{function_name}'."
    response = query_rapidapi(prompt)
    if response and 'choices' in response:
        return response['choices'][0]['message']['content'].strip()
    else:
        return "Error: Unable to fetch function information."

def get_code_snippets(function_name):
    prompt = f"Provide three code snippets for the Python built-in function '{function_name}' with single-line comments displaying the output."
    response = query_rapidapi(prompt)
    if response and 'choices' in response:
        return response['choices'][0]['message']['content'].strip()
    else:
        return "Error: Unable to fetch code snippets."

@app.route('/', methods=['GET', 'POST'])
def index():
    function_info = None
    code_snippets = None
    if request.method == 'POST':
        function_name = request.form['function_name']
        function_info = get_function_info(function_name)
        code_snippets = get_code_snippets(function_name)
        function_info = markdown.markdown(function_info)
        code_snippets = markdown.markdown(code_snippets)
    return render_template('index.html', function_info=function_info, code_snippets=code_snippets)

if __name__ == '__main__':
    app.run(debug=True)
