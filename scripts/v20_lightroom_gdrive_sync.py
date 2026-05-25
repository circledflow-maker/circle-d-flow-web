import os
import io
import time
import hashlib
from datetime import datetime
from PIL import Image
import exifread
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials

# --- CONFIGURATION ---
TOKEN_FILE = 'token.json'
WATCHED_FOLDER = r"D:\circle-d-flow-web\Portfolio_Content\Source_Lightroom\Auto_Import"
ERROR_FOLDER = r"D:\circle-d-flow-web\Portfolio_Content\Err"
LOG_FILE = "ingestion_log.txt"

# Ensure directories exist
os.makedirs(WATCHED_FOLDER, exist_ok=True)
os.makedirs(ERROR_FOLDER, exist_ok=True)

# Extended Category Rule Map for Keywords
CATEGORY_MAP = {
    "resin": "Brand & Culture",
    "jewelry": "Brand & Culture",
    "tuktuk": "Brand & Culture",
    "nails": "Brand & Culture",
    "outbreak": "Brand & Culture",
    "handicraft": "Brand & Culture",
    "japan": "Nature & Mysticism",
    "nature": "Nature & Mysticism",
    "tao": "Nature & Mysticism",
    "zen": "Nature & Mysticism",
    "street": "Urban Adventure",
    "graffiti": "Urban Adventure",
    "urban": "Urban Adventure",
    "walk": "Urban Adventure",
    "portrait": "Visual & Portrait",
    "nikon": "Visual & Portrait",
    "artist": "Visual & Portrait",
    "studio": "Studio Exclusives",
    "fashion": "Studio Exclusives",
    "professional": "Studio Exclusives",
    "event": "The Atelier",
    "hero": "The Atelier",
    "meetup": "The Atelier",
    "atelier": "The Atelier",
    "circle": "Circle D Flow",
    "energy": "Circle D Flow",
    "living": "Circle D Flow",
    "community": "Circle D Flow",
    "secret garden": "The Secret Garden",
    "secret": "The Secret Garden"
}

def log_action(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_msg = f"[{timestamp}] {message}"
    print(log_msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_msg + "\n")

class DriveHandler:
    def __init__(self):
        if not os.path.exists(TOKEN_FILE):
            raise Exception("token.json missing. Cannot connect to Google Drive.")
        self.creds = Credentials.from_authorized_user_file(TOKEN_FILE)
        self.service = build('drive', 'v3', credentials=self.creds)

    def get_recent_images(self, limit=20):
        log_action(f"Scouting Google Drive for {limit} recent images...")
        query = "mimeType contains 'image/'"
        results = self.service.files().list(
            q=query,
            pageSize=limit,
            orderBy="createdTime desc",
            fields="files(id, name, mimeType, parents)"
        ).execute()
        return results.get('files', [])

    def get_folder_name(self, folder_id):
        try:
            folder = self.service.files().get(fileId=folder_id, fields="name").execute()
            return folder.get('name', '')
        except:
            return ""

    def download_file(self, file_id, destination):
        request = self.service.files().get_media(fileId=file_id)
        fh = io.FileIO(destination, 'wb')
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        fh.close()

class ImageProcessor:
    def __init__(self, drive_handler):
        self.drive = drive_handler
        self.processed_hashes = self.load_hashes()

    def load_hashes(self):
        hash_file = "processed_hashes.txt"
        if os.path.exists(hash_file):
            with open(hash_file, "r") as f:
                return set(f.read().splitlines())
        return set()

    def save_hash(self, file_hash):
        self.processed_hashes.add(file_hash)
        with open("processed_hashes.txt", "a") as f:
            f.write(file_hash + "\n")

    def get_file_hash(self, filepath):
        hasher = hashlib.md5()
        with open(filepath, 'rb') as afile:
            buf = afile.read()
            hasher.update(buf)
        return hasher.hexdigest()

    def check_integrity(self, filepath):
        try:
            with Image.open(filepath) as img:
                img.verify()
            return True
        except Exception as e:
            log_action(f"Integrity check failed for {filepath}: {e}")
            return False

    def generate_xmp(self, image_path, category, date_str):
        base = os.path.splitext(image_path)[0]
        xmp_path = f"{base}.xmp"
        xmp_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:subject>
    <rdf:Bag>
     <rdf:li>{category}</rdf:li>
    </rdf:Bag>
   </dc:subject>
   <dc:date>
    <rdf:Seq>
     <rdf:li>{date_str}</rdf:li>
    </rdf:Seq>
   </dc:date>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
"""
        with open(xmp_path, "w", encoding="utf-8") as f:
            f.write(xmp_content)

    def process_file(self, drive_file):
        original_name = drive_file['name']
        file_id = drive_file['id']
        parents = drive_file.get('parents', [])
        
        # Determine Keyword/Category
        category = "Uncategorized"
        search_string = original_name.lower()
        if parents:
            folder_name = self.drive.get_folder_name(parents[0])
            search_string += " " + folder_name.lower()
            
        for kw, cat in CATEGORY_MAP.items():
            if kw in search_string:
                category = cat
                break

        # Fix .tmp extension
        clean_name = original_name
        if clean_name.endswith('.tmp'):
            clean_name = clean_name[:-4]
            log_action(f"Removing .tmp extension from {original_name}")

        temp_path = os.path.join(WATCHED_FOLDER, clean_name)
        
        log_action(f"Downloading {clean_name} (Category: {category})...")
        try:
            self.drive.download_file(file_id, temp_path)
        except Exception as e:
            log_action(f"Download failed for {clean_name}: {e}")
            return

        # Duplicate Hash Check
        file_hash = self.get_file_hash(temp_path)
        if file_hash in self.processed_hashes:
            log_action(f"Duplicate detected based on hash. Skipping {clean_name}.")
            os.remove(temp_path)
            return

        # Integrity Check
        if not self.check_integrity(temp_path):
            err_path = os.path.join(ERROR_FOLDER, clean_name)
            os.rename(temp_path, err_path)
            log_action(f"Moved corrupted file to {err_path}")
            return

        # EXIF Date Extraction
        date_str = datetime.now().strftime("%Y-%m-%d")
        try:
            with open(temp_path, 'rb') as f:
                tags = exifread.process_file(f, details=False)
                if 'Image DateTime' in tags:
                    raw_date = str(tags['Image DateTime'])
                    # EXIF format: 2026:04:30 14:00:00 -> 2026-04-30
                    date_str = raw_date.split(' ')[0].replace(':', '-')
        except Exception:
            pass

        # Organize into YYYY/MM_Event folder structure inside Watched Folder
        year_month = date_str[:7].replace('-', '_') # e.g. 2026_04
        event_folder = os.path.join(WATCHED_FOLDER, str(date_str[:4]), f"{year_month}_{category.replace(' ', '')}")
        os.makedirs(event_folder, exist_ok=True)
        
        final_path = os.path.join(event_folder, clean_name)
        os.rename(temp_path, final_path)
        
        # Generate XMP
        self.generate_xmp(final_path, category, date_str)
        
        self.save_hash(file_hash)
        log_action(f"Successfully processed {clean_name} into {event_folder}")

def main():
    try:
        drive_handler = DriveHandler()
        processor = ImageProcessor(drive_handler)
        
        files = drive_handler.get_recent_images(limit=100) # Increased to 100 for batch processing
        if not files:
            log_action("No new images found.")
            return
            
        for f in files:
            processor.process_file(f)
            
    except Exception as e:
        log_action(f"CRITICAL ERROR: {e}")

if __name__ == '__main__':
    main()
