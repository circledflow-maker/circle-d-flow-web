import os
import json
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# --- CONFIG ---
TOKEN_FILE = 'token.json'

def search_videos():
    if not os.path.exists(TOKEN_FILE):
        print("❌ token.json missing.")
        return

    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    # Search for MP4 files
    results = service.files().list(
        q="mimeType='video/mp4'",
        pageSize=5, fields="files(id, name)"
    ).execute()
    
    files = results.get('files', [])
    if not files:
        print("No MP4 files found in GDrive.")
    else:
        print("--- GDrive Test Assets ---")
        for f in files:
            print(f"- {f['name']} (ID: {f['id']})")

if __name__ == '__main__':
    search_videos()
