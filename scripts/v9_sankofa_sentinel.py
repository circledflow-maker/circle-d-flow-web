import os
import json
import requests
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.http import MediaIoBaseDownload
import io
from dotenv import load_dotenv

load_dotenv()

# --- CONFIG ---
TOKEN_FILE = os.path.join(os.path.dirname(__file__), '..', 'token.json')
INVENTORY_PATH = "D:/Vision_World/inventory.json"
ARCHIVE_ROOT = "D:/Vision_World/Archive"

class SankofaSentinel:
    """
    Weekly Archive Agent: Package curated volumes from the inventory.
    """
    
    def __init__(self):
        self.creds = Credentials.from_authorized_user_file(TOKEN_FILE)
        self.service = build('drive', 'v3', credentials=self.creds)

    def int_to_roman(self, n):
        val = [10, 9, 5, 4, 1]
        syb = ["X", "IX", "V", "IV", "I"]
        roman_num = ''
        i = 0
        while n > 0:
            for _ in range(n // val[i]):
                roman_num += syb[i]
                n -= val[i]
            i += 1
        return roman_num

    def archive_volume(self, vol_number):
        roman_vol = self.int_to_roman(vol_number)
        vol_path = os.path.join(ARCHIVE_ROOT, f"Vol_{roman_vol}")
        os.makedirs(vol_path, exist_ok=True)

        # 1. Load Inventory
        with open(INVENTORY_PATH, 'r', encoding='utf-8') as f:
            inventory = json.load(f)

        categories = [
            "Urban Nodes (Obsidian)",
            "Neon Oases (Amethyst)",
            "The Bazaar (Amber)",
            "The Tribe (Jade)"
        ]

        selection = []
        for cat in categories:
            cat_files = [f for f in inventory if f['chakra'] == cat and not f['is_archived']]
            # Take top 25 (highest score)
            sorted_files = sorted(cat_files, key=lambda x: x['score'], reverse=True)
            selection.extend(sorted_files[:25])

        print(f"[SENTINEL] Archiving {len(selection)} items into Vol_{roman_vol}...")

        # 2. Download loop
        for item in selection:
            target_file = os.path.join(vol_path, item['name'])
            request = self.service.files().get_media(fileId=item['id'])
            fh = io.FileIO(target_file, 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            # Mark as archived
            for inv_item in inventory:
                if inv_item['id'] == item['id']:
                    inv_item['is_archived'] = True

        # 3. Save Inventory
        with open(INVENTORY_PATH, 'w', encoding='utf-8') as f:
            json.dump(inventory, f, indent=4)
        
        print(f"[SUCCESS] Volume {roman_vol} complete.")

if __name__ == "__main__":
    sentinel = SankofaSentinel()
    sentinel.archive_volume(1) # Immediate Trigger for Vol I
