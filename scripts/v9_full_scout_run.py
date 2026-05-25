import os
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from v9_deep_scout import DeepScout
from dotenv import load_dotenv

load_dotenv()

TOKEN_FILE = 'token.json'

def run_main_scout():
    # 1. Connect
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)
    
    # 2. Find Root
    print("[INIT] Locating 'Kiss Your heart World'...")
    results = service.files().list(
        q="name = 'Kiss Your heart World' and mimeType = 'application/vnd.google-apps.folder'",
        pageSize=1, fields="files(id, name)"
    ).execute()
    
    files = results.get('files', [])
    if not files:
        print("[ERROR] Root folder not found.")
        return

    root_id = files[0]['id']
    print(f"[OK] Root found: {root_id}")

    # 3. Run Deep Scout
    scout = DeepScout()
    scout.run_total_inventory([root_id])
    print("[SUCCESS] Inventory database created.")

if __name__ == "__main__":
    run_main_scout()
