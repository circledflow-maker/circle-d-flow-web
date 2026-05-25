import os
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# --- CONFIG ---
TOKEN_FILE = 'token.json'

def find_downloadable_videos():
    if not os.path.exists(TOKEN_FILE):
        return
    
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    # 1. Search for binary MP4/MOV files specifically
    query = "mimeType = 'video/mp4' or mimeType = 'video/quicktime'"
    print(f"Searching for binary video assets...")
    
    results = service.files().list(
        q=query, 
        pageSize=10, 
        fields="files(id, name, mimeType, size)"
    ).execute()
    
    files = results.get('files', [])
    if not files:
        print("No binary videos found.")
        return

    print("--- Downloadable Assets Found ---")
    for f in files:
        size_mb = int(f.get('size', 0)) / (1024 * 1024)
        print(f"- {f['name']} (Size: {size_mb:.1f}MB, ID: {f['id']})")

if __name__ == '__main__':
    find_downloadable_videos()
