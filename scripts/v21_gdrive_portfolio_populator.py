import os
import json
import random
import time
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

TOKEN_FILE = 'token.json'
JS_DATA_FILE = r'D:\circle-d-flow-web\js\data\portfolio_data.js'

CATEGORY_MAP = {
    "resin": "Brand & Culture", "jewelry": "Brand & Culture", "tuktuk": "Brand & Culture", 
    "nails": "Brand & Culture", "outbreak": "Brand & Culture", "handicraft": "Brand & Culture",
    "japan": "Nature & Mysticism", "nature": "Nature & Mysticism", "tao": "Nature & Mysticism", "zen": "Nature & Mysticism",
    "street": "Urban Adventure", "graffiti": "Urban Adventure", "urban": "Urban Adventure", "walk": "Urban Adventure",
    "portrait": "Visual & Portrait", "nikon": "Visual & Portrait", "artist": "Visual & Portrait",
    "studio": "Studio Exclusives", "fashion": "Studio Exclusives", "professional": "Studio Exclusives",
    "event": "The Atelier", "hero": "The Atelier", "meetup": "The Atelier", "atelier": "The Atelier",
    "circle": "Circle D Flow", "energy": "Circle D Flow", "living": "Circle D Flow", "community": "Circle D Flow",
    "secret garden": "The Secret Garden", "secret": "The Secret Garden"
}

# The Target Categories so the UI renders them even if empty
TARGET_CATEGORIES = [
    "Brand & Culture",
    "Nature & Mysticism",
    "Urban Adventure",
    "Visual & Portrait",
    "Studio Exclusives",
    "The Atelier",
    "Circle D Flow",
    "The Secret Garden",
    "The Archive"
]

def generate_poet_caption(name, category):
    trace_id = f"TRACE {random.randint(100, 999)}"
    if category == "Visual & Portrait":
        return f"[{trace_id}] INDIVIDUAL: {name}.\nBehind the gaze lies a story untold."
    elif category == "Nature & Mysticism" or category == "The Secret Garden":
        return f"[{trace_id}] EARTH: {name}.\nThe silence between the leaves is where the truth resides."
    elif category == "Brand & Culture":
        return f"[{trace_id}] ARTIFACT: {name}.\nCrafted with intention, woven into the cultural fabric."
    elif category == "Studio Exclusives":
        return f"[{trace_id}] STUDIO: {name}.\nControlled light molding reality into pure aesthetic."
    elif category == "Circle D Flow":
        return f"[{trace_id}] ENERGY: {name}.\nThe collective heartbeat of the living room session."
    elif category == "The Atelier":
        return f"[{trace_id}] CREATION: {name}.\nWhere local heroes forge their legends."
    else:
        return f"[{trace_id}] ARCHIVE RECORD: {name}.\nA fragment of the odyssey."

def main():
    print("Connecting to Google Drive...")
    if not os.path.exists(TOKEN_FILE):
        print("Error: token.json not found.")
        return

    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    print("Fetching folders matching categories...")
    matched_folders = {} # {folder_id: category}
    try:
        page_token = None
        while True:
            response = service.files().list(
                q="mimeType='application/vnd.google-apps.folder'",
                spaces='drive',
                fields='nextPageToken, files(id, name)',
                pageToken=page_token
            ).execute()
            for folder in response.get('files', []):
                fname = folder.get('name', '').lower()
                # Find which category this folder belongs to
                cat = None
                for kw, mapped_cat in CATEGORY_MAP.items():
                    if kw in fname:
                        cat = mapped_cat
                        break
                if cat:
                    matched_folders[folder.get('id')] = cat
            page_token = response.get('nextPageToken', None)
            if page_token is None:
                break
    except Exception as e:
        print(f"Error fetching folders: {e}")

    print(f"Found {len(matched_folders)} folders matching our categories.")
    
    portfolio_data = {cat: [] for cat in TARGET_CATEGORIES}

    print("Fetching images directly from these mapped folders...")
    for folder_id, category in matched_folders.items():
        try:
            # Get up to 50 files from this specific folder
            response = service.files().list(
                q=f"'{folder_id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')",
                spaces='drive',
                fields='files(id, name, mimeType, thumbnailLink)',
                pageSize=50
            ).execute()
            
            for f in response.get('files', []):
                name = f.get('name', '')
                file_id = f.get('id', '')
                mime = f.get('mimeType', '')
                
                if name.lower().endswith(('.tmp', '.nef', '.dng', '.cr2', '.arw')):
                    continue
                    
                clean_name = name.split('.')[0].replace('_', ' ').title()
                asset = {
                    "id": file_id,
                    "name": name,
                    "professional_name": clean_name,
                    "poet_caption": generate_poet_caption(clean_name, category)
                }
                if 'video' in mime:
                    asset["type"] = "video"
                    asset["video_url"] = f"https://drive.google.com/uc?export=download&id={file_id}"
                
                portfolio_data[category].append(asset)
        except Exception as e:
            print(f"Error reading folder {folder_id}: {e}")

    # Fallback: Also get some recent generic files for "The Archive"
    print("Fetching some recent files for The Archive...")
    try:
        response = service.files().list(
            q="(mimeType contains 'image/' or mimeType contains 'video/')",
            spaces='drive',
            fields='files(id, name, mimeType)',
            orderBy='createdTime desc',
            pageSize=50
        ).execute()
        for f in response.get('files', []):
            name = f.get('name', '')
            if name.lower().endswith(('.tmp', '.nef', '.dng', '.cr2', '.arw')): continue
            
            # Only add to archive if we don't already have it
            file_id = f.get('id', '')
            exists = any(file_id == a["id"] for cat_list in portfolio_data.values() for a in cat_list)
            if not exists:
                clean_name = name.split('.')[0].replace('_', ' ').title()
                asset = {
                    "id": file_id, "name": name, "professional_name": clean_name,
                    "poet_caption": generate_poet_caption(clean_name, "The Archive")
                }
                if 'video' in f.get('mimeType', ''):
                    asset["type"] = "video"
                    asset["video_url"] = f"https://drive.google.com/uc?export=download&id={file_id}"
                portfolio_data["The Archive"].append(asset)
    except Exception as e:
        pass
        
    # ROTATION LOGIC: Limit each category to a reasonable number to avoid UI lag,
    # but randomize it so it feels fresh!
    print("Applying weekly rotation shuffle...")
    for cat in portfolio_data:
        items = portfolio_data[cat]
        if len(items) > 20:
            # Keep top 5 latest, randomize the rest, cap at 20
            latest = items[:5]
            rest = items[5:]
            random.shuffle(rest)
            portfolio_data[cat] = latest + rest[:15]
            
    # Output stats
    for cat, items in portfolio_data.items():
        print(f"[{cat}]: {len(items)} assets assigned.")

    # Write to JS file
    print(f"Writing to {JS_DATA_FILE}...")
    new_content = f"window.PortfolioData = {json.dumps(portfolio_data, indent=4)};"
    with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("SUCCESS: Portfolio fully populated from Google Drive!")

if __name__ == '__main__':
    main()
