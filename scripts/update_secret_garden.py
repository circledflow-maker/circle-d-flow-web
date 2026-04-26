import os
import json
import re
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

TOKEN_FILE = 'token.json'
JS_FILE = 'js/data/portfolio_data.js'

# Folder IDs found in Drive
FOLDERS = [
    '1aW1uQqoYh_XtJrNp8yQZo5pyvFx2WLIk', # Secret Garden LX 16.09
    '1l7UqdtiKDKco49ouO6FqHJGhWX2kvqBf', # Secret Garden Moment
    '1vFOdEUyfe8tJMeL85_11oEE0Kea6kk8J', # Secret garden
    '1qLtWQqlSmDCZdB6vKMbpxZr8GiEtC8ks'  # SecretGardenLXFilmProject
]

def update_portfolio():
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)
    
    new_assets = []
    
    print("Fetching files from Google Drive...")
    for folder_id in FOLDERS:
        page_token = None
        while True:
            results = service.files().list(
                q=f"'{folder_id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')",
                pageSize=50,
                fields="nextPageToken, files(id, name, mimeType)",
                pageToken=page_token
            ).execute()
            
            files = results.get('files', [])
            for f in files:
                is_video = 'video' in f['mimeType']
                asset = {
                    "id": f['id'],
                    "name": f['name'],
                    "professional_name": f['name'].split('.')[0].replace('_', ' ').title(),
                    "poet_caption": "[TRACE G-DRIVE] EARTH: Secret Garden LX.\nThe silence between the leaves is where the truth resides.\nA meditation on the organic network."
                }
                if is_video:
                    asset['type'] = 'video'
                new_assets.append(asset)
                
            page_token = results.get('nextPageToken')
            if not page_token:
                break

    print(f"Found {len(new_assets)} assets for Secret Garden.")
    
    if not new_assets:
        print("No assets found.")
        return

    # Update JS File
    print(f"Reading {JS_FILE}...")
    with open(JS_FILE, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We need to extract the JSON object from `window.PortfolioData = { ... }`
    match = re.search(r'window\.PortfolioData\s*=\s*(\{.*\});?', content, re.DOTALL)
    if not match:
        print("Could not parse portfolio_data.js")
        return
        
    try:
        # Extract the javascript object, fix formatting if needed
        json_str = match.group(1)
        # JavaScript allows trailing commas, Python's json.loads does not.
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}")
        # Manual fallback string replacement just for "The Secret Garden"
        print("Attempting manual replacement...")
        start_idx = content.find('"The Secret Garden": [')
        if start_idx == -1:
            print("Failed to find category")
            return
            
        end_idx = content.find('],', start_idx) + 1
        if end_idx == 0: # Try without comma
            end_idx = content.find(']', start_idx) + 1
            
        new_json_arr = json.dumps(new_assets, indent=8)
        new_content = content[:start_idx] + f'"The Secret Garden": {new_json_arr}' + content[end_idx:]
        
        with open(JS_FILE, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print("Successfully updated via fallback.")
        return

    # Update Data
    data["The Secret Garden"] = new_assets
    
    # Write back
    new_js = "window.PortfolioData = " + json.dumps(data, indent=4) + ";"
    with open(JS_FILE, 'w', encoding='utf-8') as file:
        file.write(new_js)
        
    print(f"Success! Updated '{JS_FILE}'.")

if __name__ == '__main__':
    update_portfolio()
