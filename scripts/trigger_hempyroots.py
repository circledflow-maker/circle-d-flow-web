import requests
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os

# --- CONFIG ---
TOKEN_FILE = 'token.json'
AGENT_URL = "http://localhost:8080/start_job"

def trigger_hempyroots_test():
    # 1. Connect to GDrive
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)
    
    # 2. Find the target asset
    print("[INIT] Searching for 'hempyroots jam video'...")
    results = service.files().list(
        q="name contains 'hempyroots jam video' and mimeType='video/mp4'",
        pageSize=1, fields="files(id, name)"
    ).execute()
    
    files = results.get('files', [])
    if not files:
        print("[ERROR] Could not find Hempyroots Jam video.")
        return

    asset = files[0]
    print(f"[OK] Found: {asset['name']} (ID: {asset['id']})")

    # 3. Trigger Director Agent
    payload = {
        "category": "Hempyroots",
        "source_url": asset['id'],
        "title": "Hempyroots_Jam_Session_Doku"
    }
    
    print(f"[AUTH] Triggering Director Agent for {payload['title']}...")
    try:
        response = requests.post(AGENT_URL, json=payload, timeout=10)
        if response.status_code == 200:
            print(f"🚀 SUCCESS! Job ID: {response.json().get('job_id')}")
            print("Check your WhatsApp for the approval notification shortly.")
        else:
            print(f"❌ Failed to trigger agent. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    trigger_hempyroots_test()
