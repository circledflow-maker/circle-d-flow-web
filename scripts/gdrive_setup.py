import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# --- CONFIG ---
SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'

def setup_gdrive():
    """
    Guides the user through the Google Drive OAuth flow.
    """
    creds = None
    # 1. Check for existing token
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    # 2. If no valid creds, let's login
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("[SYNC] Refreshing expired token...")
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print("[ERROR] 'credentials.json' not found!")
                print("Please follow these steps:")
                print("1. Go to https://console.cloud.google.com/")
                print("2. Create a project and enable 'Google Drive API'.")
                print("3. Create 'OAuth 2.0 Client ID' (Desktop App).")
                print("4. Download the JSON and rename it to 'credentials.json' in this folder.")
                return

            print("[AUTH] Starting Browser Authentication...")
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=8081)
        
        # 3. Save the token
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
        print(f"[OK] GDrive Token saved to: {TOKEN_FILE}")

if __name__ == '__main__':
    print("--- circle.d.flow - GDrive Bridge Setup ---")
    setup_gdrive()
