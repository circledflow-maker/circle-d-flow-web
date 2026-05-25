from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os

TOKEN_FILE = 'token.json'

def find_root():
    if not os.path.exists(TOKEN_FILE):
        return
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)
    
    print("Searching for folders containing 'Kiss Your heart'...")
    results = service.files().list(
        q="name contains 'Kiss Your heart' and mimeType = 'application/vnd.google-apps.folder'",
        fields="files(id, name)"
    ).execute()
    
    files = results.get('files', [])
    for f in files:
        print(f"Found: {f['name']} (ID: {f['id']})")

if __name__ == '__main__':
    find_root()
