import os
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

TOKEN_FILE = r'd:\circle-d-flow-web\token.json'

def check_sizes():
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    ids = [
        "1RmZuYi2gyVw9pONb9wwGMuB72VgDqgEn",
        "1XwhKBgEhc3IzMwv_wSgHUkDeclClIAai",
        "1csrwBWx-3T4AOLbZTuW2OMEvRLEW-In6",
        "15CP1hgrcXCcwVGGnTfbmjhMZG0zeMLQa",
        "1zrkLyUY9ZIBEQsvtj0Nxvy9EzjznVfhs",
        "1_GeGLS2kDzfTrRusUyLpp2NAeh2Vf4Uf"
    ]
    
    for vid in ids:
        try:
            f = service.files().get(fileId=vid, fields="name, size").execute()
            size_mb = int(f.get('size', 0)) / (1024 * 1024)
            print(f"{f.get('name')}: {size_mb:.2f} MB")
        except Exception as e:
            print(f"Error {vid}: {e}")

if __name__ == '__main__':
    check_sizes()
