import os
import io
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.http import MediaIoBaseDownload
import PyPDF2

TOKEN_FILE = 'token.json'

def download_and_read_pdf(service, file_id, file_name):
    try:
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
            
        fh.seek(0)
        reader = PyPDF2.PdfReader(fh)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print(f"--- CONTENT OF {file_name} ---")
        print(text[:1000]) # First 1000 chars should have location/time
        print("\n\n")
    except Exception as e:
        print(f"Error reading {file_name}: {e}")

def main():
    if not os.path.exists(TOKEN_FILE):
        print("token.json missing.")
        return

    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    print("Searching Drive for documents...")
    query = "mimeType='application/pdf'"
    results = service.files().list(q=query, pageSize=10, fields="files(id, name)").execute()
    
    files = results.get('files', [])
    for f in files:
        if "C-Riz" in f['name'] or "CircleDFlow" in f['name']:
            download_and_read_pdf(service, f['id'], f['name'])

if __name__ == '__main__':
    main()
