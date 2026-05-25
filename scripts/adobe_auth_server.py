import os
import requests
from flask import Flask, request, redirect
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CLIENT_ID = os.environ.get('ADOBE_CLIENT_ID', '1bcdcc8dcd38454591e74bec5b652311')
CLIENT_SECRET = os.environ.get('ADOBE_CLIENT_SECRET', 'p8e-cjNESy_Xflak6qZ18WoNaWd_8TJsvRKV')
REDIRECT_URI = 'http://localhost:8000/callback'
SCOPES = 'lr_partner_apis,AdobeID,lr_partner_rendition_apis,offline_access,openid'

@app.route('/')
def login():
    auth_url = (
        f"https://ims-na1.adobelogin.com/ims/authorize/v2"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={SCOPES}"
        f"&response_type=code"
    )
    return f'<h2>Adobe Lightroom Auth</h2><a href="{auth_url}">Click here to Login to Adobe</a>'

@app.route('/callback')
def callback():
    code = request.args.get('code')
    if not code:
        return "Error: No code provided", 400

    token_url = "https://ims-na1.adobelogin.com/ims/token/v3"
    payload = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'code': code,
        'redirect_uri': REDIRECT_URI
    }
    
    response = requests.post(token_url, data=payload)
    if response.status_code == 200:
        token_data = response.json()
        with open('adobe_token.json', 'w') as f:
            json.dump(token_data, f, indent=4)
        return "<h3>Success!</h3><p>Adobe Token saved to adobe_token.json. You can now close this window and return to your terminal.</p>"
    else:
        return f"<h3>Error {response.status_code}</h3><p>{response.text}</p>"

if __name__ == '__main__':
    print(f"Starting Adobe Auth Server on http://localhost:8000")
    print(f"Please open http://localhost:8000 in your browser to login.")
    app.run(port=8000)
