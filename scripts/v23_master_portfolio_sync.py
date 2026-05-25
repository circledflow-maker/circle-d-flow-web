import os
import json
import random
import time
import urllib.request
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

TOKEN_FILE_GDRIVE = 'token.json'
TOKEN_FILE_ADOBE = 'adobe_token.json'
JS_DATA_FILE = r'D:\circle-d-flow-web\js\data\portfolio_data.js'
LR_SYNC_DIR = r'D:\circle-d-flow-web\assets\lightroom_sync'
LR_BASE_URL = "https://lr.adobe.io/v2"
ADOBE_CLIENT_ID = "1bcdcc8dcd38454591e74bec5b652311"

CATEGORY_MAP = {
    "resin": "Brand & Culture", "jewelry": "Brand & Culture", "tuktuk": "Brand & Culture", 
    "nails": "Brand & Culture", "outbreak": "Brand & Culture", "handicraft": "Brand & Culture",
    "japan": "Nature & Mysticism", "nature": "Nature & Mysticism", "tao": "Nature & Mysticism", "zen": "Nature & Mysticism",
    "street": "Urban Adventure", "graffiti": "Urban Adventure", "urban": "Urban Adventure", "walk": "Urban Adventure",
    "portrait": "Visual & Portrait", "nikon": "Visual & Portrait", "artist": "Visual & Portrait",
    "studio": "Studio Exclusives", "fashion": "Studio Exclusives", "professional": "Studio Exclusives",
    "event": "The Atelier", "hero": "The Atelier", "meetup": "The Atelier", "atelier": "The Atelier",
    "circle": "Circle D Flow", "energy": "Circle D Flow", "living": "Circle D Flow", "community": "Circle D Flow",
    "secret garden": "The Secret Garden", "secret": "The Secret Garden",
    "beatbox": "Circle D Flow", "village underground": "Urban Adventure", "website kyh": "The Archive",
    "malingua": "The Atelier", "hempy": "The Atelier", "team": "The Atelier"
}

TARGET_CATEGORIES = [
    "Brand & Culture", "Nature & Mysticism", "Urban Adventure",
    "Visual & Portrait", "Studio Exclusives", "The Atelier",
    "Circle D Flow", "The Secret Garden", "The Archive"
]

def generate_poet_caption(name, category, source="GDrive"):
    trace_id = f"TRACE {random.randint(100, 999)} - {source}"
    if category == "Visual & Portrait": return f"[{trace_id}] INDIVIDUAL: {name}.\nBehind the gaze lies a story untold."
    elif category == "Nature & Mysticism" or category == "The Secret Garden": return f"[{trace_id}] EARTH: {name}.\nThe silence between the leaves is where the truth resides."
    elif category == "Brand & Culture": return f"[{trace_id}] ARTIFACT: {name}.\nCrafted with intention, woven into the cultural fabric."
    elif category == "Studio Exclusives": return f"[{trace_id}] STUDIO: {name}.\nControlled light molding reality into pure aesthetic."
    elif category == "Circle D Flow": return f"[{trace_id}] ENERGY: {name}.\nThe collective heartbeat of the living room session."
    elif category == "The Atelier": return f"[{trace_id}] CREATION: {name}.\nWhere local heroes forge their legends."
    else: return f"[{trace_id}] ARCHIVE RECORD: {name}.\nA fragment of the odyssey."

def parse_adobe_json(response_bytes):
    text = response_bytes.decode('utf-8', errors='ignore')
    if text.startswith("while (1) {}"):
        text = text[12:].strip()
    return json.loads(text)

def adobe_request(url, access_token, stream=False):
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("X-Api-Key", ADOBE_CLIENT_ID)
    try:
        response = urllib.request.urlopen(req)
        if stream:
            return response.read()
        return parse_adobe_json(response.read())
    except Exception as e:
        print(f"Adobe API Error on {url}: {e}")
        return None

def fetch_lightroom_assets(portfolio_data):
    print("\n--- Connecting to Adobe Lightroom Web ---")
    if not os.path.exists(TOKEN_FILE_ADOBE):
        print("adobe_token.json not found. Run v22_lightroom_api_bridge.py first.")
        return
        
    with open(TOKEN_FILE_ADOBE, "r") as f:
        adobe_tokens = json.load(f)
    access_token = adobe_tokens.get('access_token')
    
    catalog = adobe_request(f"{LR_BASE_URL}/catalog", access_token)
    if not catalog: return
    catalog_id = catalog.get('id')
    
    albums_data = adobe_request(f"{LR_BASE_URL}/catalogs/{catalog_id}/albums", access_token)
    if not albums_data: return
    
    albums = albums_data.get('resources', [])
    print(f"Found {len(albums)} Adobe Albums.")
    
    for album in albums:
        album_name = album.get('payload', {}).get('name', '')
        album_id = album.get('id')
        
        cat = None
        for kw, mapped_cat in CATEGORY_MAP.items():
            if kw in album_name.lower():
                cat = mapped_cat
                break
                
        if not cat:
            print(f"   Skipping album (no category match): '{album_name}'")
            continue 
            
        print(f"Fetching assets from Adobe Album: '{album_name}' -> [{cat}]")
        assets_data = adobe_request(f"{LR_BASE_URL}/catalogs/{catalog_id}/albums/{album_id}/assets?embed=asset", access_token)
        if not assets_data: continue
        
        assets = assets_data.get('resources', [])
        # Only take up to 20 assets per album to avoid massive downloads
        for item in assets[:20]:
            # With embed=asset, the actual asset data is inside item['asset']
            asset = item.get('asset', {})
            asset_id = asset.get('id')
            if not asset_id: continue
                
            # Determine best rendition
            links = asset.get('links', {})
            rendition_path = None
            for r_type in ['/rels/rendition_type/2048', '/rels/rendition_type/1080p', '/rels/rendition_type/thumbnail2x']:
                if r_type in links:
                    rendition_path = links[r_type]['href']
                    break
                    
            if not rendition_path:
                print(f"   No suitable rendition for {asset_id}")
                continue
                
            local_filename = f"{asset_id}.jpg"
            local_filepath = os.path.join(LR_SYNC_DIR, local_filename)
            
            if not os.path.exists(local_filepath):
                print(f"   Downloading Lightroom Image: {asset_id}...")
                image_bytes = adobe_request(f"{LR_BASE_URL}/catalogs/{catalog_id}/{rendition_path}", access_token, stream=True)
                if image_bytes:
                    with open(local_filepath, "wb") as img_file:
                        img_file.write(image_bytes)
                else:
                    print(f"   Failed to download rendition for {asset_id}")
                    continue
                    
            clean_name = album_name + " Edit"
            # In HTML, assets are served from 'assets/...' relative to the root
            web_path = f"assets/lightroom_sync/{local_filename}"
            
            asset_obj = {
                "id": f"lr_{asset_id}",
                "name": local_filename,
                "professional_name": clean_name,
                "poet_caption": generate_poet_caption(clean_name, cat, source="Adobe Lightroom"),
                "url": f"../{web_path}" # Added ../ so it works relatively from the HTML folder
            }
            portfolio_data[cat].append(asset_obj)

def fetch_gdrive_assets(portfolio_data):
    print("\n--- Connecting to Google Drive ---")
    if not os.path.exists(TOKEN_FILE_GDRIVE):
        print("token.json not found.")
        return

    creds = Credentials.from_authorized_user_file(TOKEN_FILE_GDRIVE)
    service = build('drive', 'v3', credentials=creds)

    matched_folders = {}
    try:
        page_token = None
        while True:
            response = service.files().list(
                q="mimeType='application/vnd.google-apps.folder'", spaces='drive',
                fields='nextPageToken, files(id, name)', pageToken=page_token
            ).execute()
            for folder in response.get('files', []):
                fname = folder.get('name', '').lower()
                for kw, mapped_cat in CATEGORY_MAP.items():
                    if kw in fname:
                        matched_folders[folder.get('id')] = mapped_cat
                        break
            page_token = response.get('nextPageToken', None)
            if not page_token: break
    except Exception as e: print(e)

    for folder_id, category in matched_folders.items():
        print(f"Fetching Google Drive Folder -> [{category}]")
        try:
            response = service.files().list(
                q=f"'{folder_id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')",
                spaces='drive', fields='files(id, name, mimeType)', pageSize=20
            ).execute()
            
            for f in response.get('files', []):
                name, file_id, mime = f.get('name', ''), f.get('id', ''), f.get('mimeType', '')
                if name.lower().endswith(('.tmp', '.nef', '.dng', '.cr2', '.arw')): continue
                    
                clean_name = name.split('.')[0].replace('_', ' ').title()
                asset = {
                    "id": file_id, "name": name, "professional_name": clean_name,
                    "poet_caption": generate_poet_caption(clean_name, category, source="Google Drive")
                }
                if 'video' in mime:
                    asset["type"] = "video"
                    asset["video_url"] = f"https://drive.google.com/uc?export=download&id={file_id}"
                
                portfolio_data[category].append(asset)
        except Exception as e: print(e)

def main():
    os.makedirs(LR_SYNC_DIR, exist_ok=True)
    portfolio_data = {cat: [] for cat in TARGET_CATEGORIES}
    
    # 1. Fetch from Adobe Lightroom Web
    fetch_lightroom_assets(portfolio_data)
    
    # 2. Fetch from Google Drive Web
    fetch_gdrive_assets(portfolio_data)
    
    print("\n--- Finalizing Portfolio & Applying Smart Fallbacks ---")
    
    # Identify all available assets for global fallback
    all_assets = []
    for cat in portfolio_data:
        all_assets.extend(portfolio_data[cat])
    
    for cat in TARGET_CATEGORIES:
        items = portfolio_data[cat]
        
        # Smart Fallback: If category is empty, pull 5-10 random items from the global pool
        if not items and all_assets:
            print(f"   [!] Category '{cat}' is empty. Injecting fallback traces...")
            fallback_sample = random.sample(all_assets, min(len(all_assets), 12))
            # Mark them as fallback so the UI/Poet could theoretically know
            for fb_item in fallback_sample:
                new_item = fb_item.copy()
                new_item["is_fallback"] = True
                new_item["poet_caption"] = f"[FALLBACK TRACE] {new_item.get('poet_caption', '')}"
                items.append(new_item)
        
        # Final curation: limit to 20 items and shuffle
        if len(items) > 20:
            random.shuffle(items)
            portfolio_data[cat] = items[:20]
        else:
            random.shuffle(items)
            
    for cat, items in portfolio_data.items():
        print(f"[{cat}]: {len(items)} assets total.")

    with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(f"window.PortfolioData = {json.dumps(portfolio_data, indent=4)};")
        
    print(f"\nSUCCESS: Unified Web Portfolio with Smart Fallbacks generated at {JS_DATA_FILE}!")

if __name__ == '__main__':
    main()
