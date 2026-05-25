import os
import json
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

TOKEN_FILE = 'token.json'
KEYWORDS = ['secret garden', 'african queen', 'circle d', 'hip hop', 'poetry', 'art market', 'painting', 'live music']

def search_c4c_assets():
    if not os.path.exists(TOKEN_FILE):
        print("token.json missing. Cannot search Google Drive.")
        return

    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    print("Scouting Google Drive for C4C Event Assets (Pictures & Videos)...")
    
    # We search for images and videos
    query = "(mimeType contains 'image/' or mimeType contains 'video/') and ("
    query += " or ".join([f"name contains '{k}'" for k in KEYWORDS])
    query += ")"

    try:
        results = service.files().list(
            q=query,
            pageSize=30, 
            fields="files(id, name, mimeType, webViewLink)"
        ).execute()
        
        files = results.get('files', [])
        
        if not files:
            print("No specific files found with our exact keywords. Searching for general recent media...")
            # Fallback: just get the 20 most recent videos/images
            results = service.files().list(
                q="(mimeType contains 'image/' or mimeType contains 'video/')",
                pageSize=20,
                orderBy="createdTime desc",
                fields="files(id, name, mimeType, webViewLink)"
            ).execute()
            files = results.get('files', [])

        if not files:
            print("No media files found in GDrive.")
            return

        print(f"\nFound {len(files)} potential assets for the Flyer & Reel:\n")
        
        for f in files:
            type_icon = "[VIDEO]" if "video" in f['mimeType'] else "[PHOTO]"
            print(f"{type_icon} {f['name']}")
            print(f"   Link: {f.get('webViewLink', 'N/A')}\n")

    except Exception as e:
        print(f"Error accessing Google Drive: {e}")

if __name__ == '__main__':
    search_c4c_assets()
