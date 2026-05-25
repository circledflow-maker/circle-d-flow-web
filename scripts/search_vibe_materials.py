import os
import json
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

TOKEN_FILE = r'd:\circle-d-flow-web\token.json'

def search_vibe_materials():
    if not os.path.exists(TOKEN_FILE):
        print("❌ token.json missing.")
        return

    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    keywords = ["Hempy", "Lisbon", "community", "jam", "session", "hip hop", "pillar"]
    
    # Build query
    queries = []
    for kw in keywords:
        queries.append(f"fullText contains '{kw}'")
    
    query_str = " or ".join(queries)
    full_query = f"({query_str}) and (mimeType contains 'video' or mimeType contains 'image')"

    print(f"Searching for: {full_query}")
    results = service.files().list(
        q=full_query,
        pageSize=50, 
        fields="files(id, name, mimeType, parents)"
    ).execute()
    
    files = results.get('files', [])
    if not files:
        print("No matching files found in GDrive.")
    else:
        print(f"--- Found {len(files)} Assets ---")
        for f in files:
            print(f"- {f['name']} ({f['mimeType']}) - ID: {f['id']}")

if __name__ == '__main__':
    search_vibe_materials()
