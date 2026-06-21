import os
import io
import argparse
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from PIL import Image
import imagehash

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive']
FOLDERS = [
    "1SlKAQLkWv7VWAkvLqQZETl4srkdkb6pc",
    "1pbuFkZaATtpy5MWoUog_fydCITMWBmCF"
]

def authenticate_drive():
    creds = None
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("⚠️ Error: credentials.json not found in the current directory.")
                return None
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('drive', 'v3', credentials=creds)

def download_image_hash(service, file_id):
    """Download image to memory and compute perceptual hash."""
    request = service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        status, done = downloader.next_chunk()
    fh.seek(0)
    try:
        img = Image.open(fh)
        return imagehash.average_hash(img)
    except Exception as e:
        print(f"  [Error processing image {file_id}]: {e}")
        return None

def clean_folder(service, folder_id, dry_run=True):
    print(f"\n🔍 Scanning Folder ID: {folder_id}")
    
    # Query for all image files in the folder
    query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"
    results = service.files().list(q=query, pageSize=1000, fields="nextPageToken, files(id, name, mimeType)").execute()
    items = results.get('files', [])

    if not items:
        print('No images found in this folder.')
        return

    print(f"Found {len(items)} images. Analyzing for visual similarity...")
    
    hashes = {}
    duplicates = []
    
    # Iterate and hash
    for i, item in enumerate(items):
        print(f"  Analyzing {i+1}/{len(items)}: {item['name']}", end='\r')
        img_hash = download_image_hash(service, item['id'])
        if img_hash is None:
            continue
            
        is_duplicate = False
        # Compare against existing hashes
        for original_id, original_data in hashes.items():
            # A Hamming distance < 5 means the images are extremely similar (like burst shots)
            if img_hash - original_data['hash'] < 5:
                is_duplicate = True
                duplicates.append({
                    'original_name': original_data['name'],
                    'duplicate_id': item['id'],
                    'duplicate_name': item['name']
                })
                break
                
        if not is_duplicate:
            hashes[item['id']] = {'name': item['name'], 'hash': img_hash}

    print(f"\n\n🚨 Found {len(duplicates)} visually similar/duplicate images!")
    
    for dup in duplicates:
        print(f"   - {dup['duplicate_name']} is a duplicate of {dup['original_name']}")
        
    if dry_run:
        print("\n🛡️  DRY RUN MODE: No files were actually deleted.")
        print("To actually delete these files, run the script with the --run flag.")
    else:
        print("\n🗑️  DELETING DUPLICATES...")
        for dup in duplicates:
            try:
                service.files().delete(fileId=dup['duplicate_id']).execute()
                print(f"   Deleted {dup['duplicate_name']}")
            except Exception as e:
                print(f"   Error deleting {dup['duplicate_name']}: {e}")
        print("✅ Cleanup complete.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Google Drive AI Cleaner')
    parser.add_argument('--run', action='store_true', help='Execute deletion (otherwise runs in Dry-Run mode)')
    args = parser.parse_args()
    
    print("========================================")
    print("🤖 CIRCLE D FLOW: GOOGLE DRIVE CLEANER 🤖")
    print("========================================")
    
    service = authenticate_drive()
    if not service:
        exit(1)
        
    for folder_id in FOLDERS:
        clean_folder(service, folder_id, dry_run=not args.run)
