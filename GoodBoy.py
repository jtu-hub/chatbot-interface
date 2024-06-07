import sys
import io

#provide buffer for IO errors 
logfile = io.StringIO()
sys.stdout = logfile
sys.stderr = logfile

import eel
import requests

eel.init('app')  # 'web' is the folder where your index.html, js, css, and img folders are located

API_KEY  = "your API key goes here";
API_URL= "https://api.openai.com/v1/chat/completions";

@eel.expose  # Expose this function to JavaScript
def getGPT3ChatResponse(messages, temperature):
    data = {
        "model": "gpt-4-turbo-preview",
        "messages": messages,
        "temperature": temperature
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    try:
        response = requests.post(API_URL, json=data, headers=headers)
        response.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code

        result = response.json()
        if result.get("choices") and len(result["choices"]) > 0:
            response_content = result["choices"][0]["message"]["content"].strip()
            
            # Use eel to call the JavaScript callback with the response content
            eel.onGPTAnswerCallback(response_content)

    except requests.exceptions.HTTPError as http_err:
        eel.handleError(f'HTTP error occurred: {http_err}')  # Call JavaScript error handler
    except Exception as err:
        eel.handleError(f'There has been a problem with the request: {err}')  # Call JavaScript error handler

eel.start('app.html', size=(800, 600))