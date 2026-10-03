"""
Google Drive OAuth setup for Circle D Flow.

Uses FULL Drive scope so organization moves can update parents on existing files.
(drive.file alone cannot move files the app did not create → 403 appNotAuthorizedToFile)

  python scripts/gdrive_setup.py
  python scripts/gdrive_setup.py --force   # delete token.json and re-consent
"""
from __future__ import annotations

import argparse
import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Full Drive access required for moving existing shared/project files
SCOPES = ["https://www.googleapis.com/auth/drive"]
CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token.json"


def setup_gdrive(force: bool = False) -> None:
    if force and os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)
        print(f"[AUTH] Removed old {TOKEN_FILE} — re-consent required for full Drive scope")

    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        # Old tokens may lack full drive scope
        have = set(creds.scopes or [])
        if not set(SCOPES).issubset(have):
            print(f"[AUTH] token scopes {sorted(have)} missing {SCOPES} — forcing re-consent")
            os.remove(TOKEN_FILE)
            creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("[SYNC] Refreshing expired token...")
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"[AUTH] Refresh failed ({e}) — re-consent")
                creds = None

        if not creds or not creds.valid:
            if not os.path.exists(CREDENTIALS_FILE):
                print("[ERROR] 'credentials.json' not found!")
                print("1. Google Cloud Console → enable Google Drive API")
                print("2. OAuth client (Desktop App) → download JSON as credentials.json")
                return

            print("[AUTH] Browser login — grant FULL Google Drive access (not read-only)")
            print(f"[AUTH] Scopes: {SCOPES}")
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=8081)

        with open(TOKEN_FILE, "w", encoding="utf-8") as token:
            token.write(creds.to_json())
        print(f"[OK] GDrive Token saved to: {TOKEN_FILE}")
        print("[OK] Scope: https://www.googleapis.com/auth/drive (write/move OK)")
    else:
        print(f"[OK] Existing token valid: {TOKEN_FILE}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Circle D Flow — Google Drive OAuth setup")
    ap.add_argument("--force", action="store_true", help="Delete token.json and re-consent")
    args = ap.parse_args()
    print("--- circle.d.flow - GDrive Bridge Setup (full Drive scope) ---")
    setup_gdrive(force=args.force)
