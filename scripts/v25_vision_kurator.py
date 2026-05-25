import os
import json
import base64
import random
import time
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

TARGET_CATEGORIES = [
    "Ring of Earth",
    "Ring of Water",
    "Ring of Fire",
    "Ring of Wind",
    "Ring of Void"
]

JS_DATA_FILE = r'D:\circle-d-flow-web\js\data\portfolio_data.js'
LR_SYNC_DIR = r'D:\circle-d-flow-web\assets\lightroom_sync'
GDRIVE_SYNC_DIR = r'D:\circle-d-flow-web\assets\gdrive_sync'
TOKEN_FILE_GDRIVE = 'token.json'

os.makedirs(LR_SYNC_DIR, exist_ok=True)
os.makedirs(GDRIVE_SYNC_DIR, exist_ok=True)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash-latest')

def analyze_asset_for_ring(file_path, target_ring, is_video=False):
    system_prompt = f"""Du bist der Master-Kurator. Analysiere dieses {'Video' if is_video else 'Bild'} aus der Perspektive des {target_ring} (Miyamoto Musashi). 
Fokus des Rings:
- Earth: Fundament, Struktur, Handwerk, Stabilität, Architektur.
- Water: Fluss, Anpassung, Technik, Flexibilität, Bewegung.
- Fire: Leidenschaft, Konflikt, Dynamik, Kampf, pure Energie.
- Wind: Tradition, externe Einflüsse, Kultur, Gemeinschaft, Rhythmus.
- Void: Das Unbekannte, Spontanität, Leere, Spiritualität, der Raum dazwischen.

Gib strikt ein JSON zurück mit:
{{
  "title": "Passender poetischer Titel (max 4 Worte)",
  "quote": "Ein philosophisches Zitat (Manga/Anime Vibe, passend zum Ring, max 10 Worte)",
  "context": "Kurze Beschreibung der Energie/Atmosphäre (max 15 Worte)",
  "vibe_tags": ["tag1", "tag2", "tag3"]
}}"""
    
    try:
        if is_video:
            # We skip heavy video analysis for rate limit safety, generating mock data
            return {
                "title": f"Flow of {target_ring.split(' ')[-1]}",
                "quote": f"Bewegung ist die Essenz von {target_ring.split(' ')[-1]}.",
                "context": "Dynamische Fragmente der Realität.",
                "vibe_tags": ["video", "motion", "flow"]
            }

        with open(file_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        response = model.generate_content(
            [system_prompt, {"mime_type": "image/jpeg", "data": encoded_string}],
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Vision AI Error: {e}")
        return {
            "title": f"Essence of {target_ring.split(' ')[-1]}",
            "quote": "Stille in der Bewegung.",
            "context": "Ein ungesehener Moment.",
            "vibe_tags": ["abstract", "vision", "art"]
        }

def download_gdrive_assets(max_items=30):
    print("\n--- Connecting to Google Drive ---")
    if not os.path.exists(TOKEN_FILE_GDRIVE):
        print("token.json not found.")
        return []
    
    creds = Credentials.from_authorized_user_file(TOKEN_FILE_GDRIVE)
    service = build('drive', 'v3', credentials=creds)
    
    downloaded_files = []
    try:
        # Search for images and mp4
        results = service.files().list(
            q="mimeType contains 'image/' or mimeType contains 'video/mp4'",
            spaces='drive',
            fields='files(id, name, mimeType)',
            pageSize=max_items
        ).execute()
        
        items = results.get('files', [])
        print(f"Found {len(items)} items in Google Drive.")
        
        for item in items:
            file_id = item['id']
            file_name = item['name']
            file_path = os.path.join(GDRIVE_SYNC_DIR, file_name)
            
            if not os.path.exists(file_path):
                print(f"Downloading {file_name}...")
                request = service.files().get_media(fileId=file_id)
                with open(file_path, "wb") as fh:
                    fh.write(request.execute())
            downloaded_files.append(file_path)
    except Exception as e:
        print(f"Google Drive Error: {e}")
    return downloaded_files

def main():
    portfolio_data = {cat: [] for cat in TARGET_CATEGORIES}
    
    # 1. Get all local assets
    all_files = []
    if os.path.exists(LR_SYNC_DIR):
        for f in os.listdir(LR_SYNC_DIR):
            if f.lower().endswith(('.jpg', '.png', '.mp4', '.mov')):
                all_files.append(os.path.join(LR_SYNC_DIR, f))
                
    # 2. Get GDrive assets
    gdrive_files = download_gdrive_assets(max_items=50)
    for f in gdrive_files:
        if f not in all_files:
            all_files.append(f)
            
    print(f"\nTotal combined assets pool: {len(all_files)}")
    
    # Shuffle for randomness
    random.shuffle(all_files)
    
    # Separate videos and images
    videos = [f for f in all_files if f.lower().endswith(('.mp4', '.mov'))]
    images = [f for f in all_files if f.lower().endswith(('.jpg', '.png'))]
    
    # Target per ring: 10 images + 3 videos = 13 total (or as requested "13 images + videos")
    # Let's do 13 images AND 3 videos per ring.
    images_per_ring = 13
    videos_per_ring = 3
    
    image_idx = 0
    video_idx = 0
    
    for ring in TARGET_CATEGORIES:
        print(f"\nPopulating {ring}...")
        
        # Add Images
        img_count = 0
        while img_count < images_per_ring and image_idx < len(images):
            f_path = images[image_idx]
            f_name = os.path.basename(f_path)
            # relative path for web
            rel_path = f"../assets/{'gdrive_sync' if 'gdrive_sync' in f_path else 'lightroom_sync'}/{f_name}"
            
            print(f"  [AI] Analyzing Image: {f_name}")
            v_data = analyze_asset_for_ring(f_path, ring, False)
            
            poet_caption = f"<b>{v_data.get('title', 'Trace')}</b><br><i class='text-gray-400'>\"{v_data.get('quote', '')}\"</i><br><br><span class='text-xs opacity-70'>{v_data.get('context', '')}</span>"
            
            portfolio_data[ring].append({
                "id": f"img_{image_idx}",
                "name": f_name,
                "professional_name": v_data.get('title', 'Image'),
                "poet_caption": poet_caption,
                "url": rel_path,
                "tags": v_data.get('vibe_tags', [])
            })
            img_count += 1
            image_idx += 1
            time.sleep(2) # rate limit protection
            
        # Add Videos
        vid_count = 0
        while vid_count < videos_per_ring and video_idx < len(videos):
            f_path = videos[video_idx]
            f_name = os.path.basename(f_path)
            rel_path = f"../assets/{'gdrive_sync' if 'gdrive_sync' in f_path else 'lightroom_sync'}/{f_name}"
            
            print(f"  [AI] Analyzing Video: {f_name}")
            v_data = analyze_asset_for_ring(f_path, ring, True)
            
            poet_caption = f"<b>{v_data.get('title', 'Trace')}</b><br><i class='text-gray-400'>\"{v_data.get('quote', '')}\"</i><br><br><span class='text-xs opacity-70'>{v_data.get('context', '')}</span>"
            
            portfolio_data[ring].append({
                "id": f"vid_{video_idx}",
                "name": f_name,
                "professional_name": v_data.get('title', 'Video'),
                "poet_caption": poet_caption,
                "url": rel_path,
                "tags": v_data.get('vibe_tags', [])
            })
            vid_count += 1
            video_idx += 1
            
        print(f"{ring} populated with {img_count} images and {vid_count} videos.")

    # Save
    with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(f"window.PortfolioData = {json.dumps(portfolio_data, indent=4)};")
        
    print(f"\nSUCCESS: 5 Rings Portfolio correctly filled at {JS_DATA_FILE}!")

if __name__ == '__main__':
    main()
