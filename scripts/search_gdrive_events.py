import os
import io
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.http import MediaIoBaseDownload

TOKEN_FILE = 'token.json'

def main():
    if not os.path.exists(TOKEN_FILE):
        print("token.json missing.")
        return

    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    print("Searching Drive for documents...")
    # Search for Google Docs or plain text files
    query = "mimeType='application/vnd.google-apps.document' or mimeType='text/plain' or mimeType='application/pdf'"
    results = service.files().list(q=query, pageSize=10, fields="files(id, name, mimeType)").execute()
    
    files = results.get('files', [])
    for f in files:
        print(f"Found: {f['name']} ({f['mimeType']})")
        if f['mimeType'] == 'application/vnd.google-apps.document':
            try:
                # Export Google Doc as text
                request = service.files().export_media(fileId=f['id'], mimeType='text/plain')
                fh = io.BytesIO()
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                content = fh.getvalue().decode('utf-8')
                
                if "Listening Party" in content or "Circle" in content or "Flow" in content or "C-RIZ" in content:
                    print(f"--- MATCH IN {f['name']} ---")
                    print(content[:1000]) # print snippet
            except Exception as e:
                print(f"Error reading {f['name']}: {e}")

if __name__ == '__main__':
    main()
