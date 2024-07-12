import sys
import io

#provide buffer for IO errors 
#logfile = io.StringIO()
#sys.stdout = logfile
#sys.stderr = logfile
import eel
import requests

eel.init('app')

API_KEY  = "your API key goes here";
API_URL= "https://api.openai.com/v1/chat/completions";

@eel.expose
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

@eel.expose
def getChatTitle(personality_description):
    messages = [
        {
            "role": "system",
            "content": "for each user input you provide a unicode emoji and a title like description, as if it was a personality, of maximum two words which best fit the user input"
        },{
            "role": "user",
            "content": personality_description
        }
    ]
    
    data = {
        "model": "gpt-4-turbo-preview",
        "messages": messages,
        "temperature": 0.7
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
            eel.onGPTPersonalityCallback(response_content)

    except requests.exceptions.HTTPError as http_err:
        eel.handleError(f'HTTP error occurred: {http_err}, \n{headers}, \n{data}')  # Call JavaScript error handler
    except Exception as err:
        eel.handleError(f'There has been a problem with the request: {err}')  # Call JavaScript error handler
    

eel.start('app.html', size=(800, 600))