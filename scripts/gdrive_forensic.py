import os
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# --- CONFIG ---
TOKEN_FILE = 'token.json'

def get_full_path(file_id):
    if not os.path.exists(TOKEN_FILE):
        return "token.json missing"
    
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)
    
    # 1. Get file metadata with parents
    file = service.files().get(fileId=file_id, fields='name, parents').execute()
    path = [file.get('name')]
    
    # 2. Trace parents up to root
    parents = file.get('parents')
    while parents:
        folder = service.files().get(fileId=parents[0], fields='name, parents').execute()
        path.append(folder.get('name'))
        parents = folder.get('parents')
    
    return " / ".join(reversed(path))

if __name__ == '__main__':
    target_id = "1FjPegWdupWtR22zJ9Hfxeu58LkA6prWU" # C0166.MP4
    print(f"Tracing origin for {target_id}...")
    try:
        full_path = get_full_path(target_id)
        print(f"Found in: {full_path}")
    except Exception as e:
        print(f"Error: {e}")
