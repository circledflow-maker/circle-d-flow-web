import os, json
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def search():
    creds = Credentials.from_authorized_user_file('token.json')
    service = build('drive', 'v3', credentials=creds)
    results = service.files().list(
        q="mimeType='application/vnd.google-apps.folder' and (name contains 'Secret' or name contains 'graca' or name contains 'Graca')",
        pageSize=10, 
        fields="files(id, name)"
    ).execute()
    
    folders = results.get('files', [])
    for folder in folders:
        print(f"\n--- FOLDER: {folder['name'].encode('ascii', 'ignore').decode()} ({folder['id']}) ---")
        children = service.files().list(
            q=f"'{folder['id']}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')",
            pageSize=10,
            fields="files(id, name, mimeType)"
        ).execute().get('files', [])
        
        for c in children:
            print(f"  - {c['name'].encode('ascii', 'ignore').decode()}")

search()
