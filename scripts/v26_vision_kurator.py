import os
import json
import base64
import random
import time
import numpy as np
from sklearn.cluster import DBSCAN
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import google.generativeai as genai
from dotenv import load_dotenv

try:
    from deepface import DeepFace
    HAS_DEEPFACE = True
except ImportError:
    HAS_DEEPFACE = False
    print("Warning: deepface not installed. Facial recognition will be skipped.")

load_dotenv()

TARGET_CATEGORIES = [
    "Ring of Earth",
    "Ring of Water",
    "Ring of Fire",
    "Ring of Wind",
    "Ring of Void",
    "Jamsession",
    "City Vibe",
    "Animal live",
    "D Motion"
]

JS_DATA_FILE = r'D:\circle-d-flow-web\js\data\portfolio_data.js'
LR_SYNC_DIR = r'D:\circle-d-flow-web\Assets\lightroom_sync'
GDRIVE_SYNC_DIR = r'D:\circle-d-flow-web\Assets\gdrive_sync'
TOKEN_FILE_GDRIVE = 'token.json'

os.makedirs(LR_SYNC_DIR, exist_ok=True)
os.makedirs(GDRIVE_SYNC_DIR, exist_ok=True)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash-latest')

def download_gdrive_assets(max_items=50):
    print("\n--- Connecting to Google Drive ---")
    if not os.path.exists(TOKEN_FILE_GDRIVE):
        return []
    
    creds = Credentials.from_authorized_user_file(TOKEN_FILE_GDRIVE)
    service = build('drive', 'v3', credentials=creds)
    
    downloaded_files = []
    try:
        results = service.files().list(
            q="mimeType contains 'image/' or mimeType contains 'video/mp4'",
            spaces='drive',
            fields='files(id, name, mimeType)',
            pageSize=max_items
        ).execute()
        
        items = results.get('files', [])
        for item in items:
            file_id = item['id']
            file_name = item['name']
            file_path = os.path.join(GDRIVE_SYNC_DIR, file_name)
            
            if not os.path.exists(file_path):
                request = service.files().get_media(fileId=file_id)
                with open(file_path, "wb") as fh:
                    fh.write(request.execute())
            downloaded_files.append(file_path)
    except Exception as e:
        pass
    return downloaded_files

def analyze_asset_for_categories(file_path, is_video=False):
    system_prompt = """Du bist der Master-Kurator. Analysiere dieses Asset.
Wähle aus folgenden Kategorien die PASSENDSTE aus:
- Ring of Earth (Struktur, Handwerk, Architektur)
- Ring of Water (Fluss, Technik, Bewegung)
- Ring of Fire (Leidenschaft, Konflikt, Dynamik)
- Ring of Wind (Tradition, Kultur, Rhythmus)
- Ring of Void (Spontanität, Leere)
- Jamsession (Music, Band, Auftritt)
- City Vibe (Lisbon, Tour, Architektur)
- Animal live (Natur, Tiere)
- D Motion (Energie, Tanz, Community)

Gib strikt ein JSON zurück mit:
{
  "category": "Name der Kategorie (exakt wie oben geschrieben)",
  "title": "Passender poetischer Titel (max 4 Worte)",
  "quote": "Ein philosophisches Zitat (Manga/Anime Vibe, max 10 Worte)",
  "context": "Kurze Beschreibung der Energie/Atmosphäre (max 15 Worte)",
  "vibe_tags": ["tag1", "tag2", "tag3"]
}"""
    
    if is_video:
        return {
            "category": random.choice(["Jamsession", "D Motion", "Ring of Water", "Ring of Fire"]),
            "title": "Flow in Motion",
            "quote": "Bewegung ist die Essenz.",
            "context": "Dynamische Fragmente der Realität.",
            "vibe_tags": ["video", "motion", "flow"]
        }

    try:
        with open(file_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        response = model.generate_content(
            [system_prompt, {"mime_type": "image/jpeg", "data": encoded_string}],
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception:
        return {
            "category": "Ring of Void",
            "title": "Essence of Unknown",
            "quote": "Stille in der Bewegung.",
            "context": "Ein ungesehener Moment.",
            "vibe_tags": ["abstract", "vision"]
        }

def analyze_artist_profession(file_path):
    system_prompt = """Analysiere diese Person. Weise ihr eine kreative Rolle zu (z.B. Lyric, Musikant, Creator, Energy Transformer, Multi Artist, Designer, Painter).
Gib strikt JSON zurück:
{
  "profession": "Rolle",
  "quote": "Passendes Manga/Anime Zitat",
  "context": "Kurze Beschreibung der Energie"
}"""
    try:
        with open(file_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        response = model.generate_content(
            [system_prompt, {"mime_type": "image/jpeg", "data": encoded_string}],
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except:
        return {"profession": "Creator", "quote": "Die Aura spricht Bände.", "context": "Kreative Präsenz."}

def main():
    portfolio_data = {cat: [] for cat in TARGET_CATEGORIES}
    artist_vault = {}
    
    all_files = []
    if os.path.exists(LR_SYNC_DIR):
        for f in os.listdir(LR_SYNC_DIR):
            if f.lower().endswith(('.jpg', '.png', '.mp4', '.mov')):
                all_files.append(os.path.join(LR_SYNC_DIR, f))
                
    gdrive_files = download_gdrive_assets()
    for f in gdrive_files:
        if f not in all_files:
            all_files.append(f)
            
    images = [f for f in all_files if f.lower().endswith(('.jpg', '.png'))]
    videos = [f for f in all_files if f.lower().endswith(('.mp4', '.mov'))]
    
    random.shuffle(images)
    
    # --- FACE CLUSTERING ---
    clustered_images = set()
    if HAS_DEEPFACE and images:
        print("\n--- Running Facial Recognition & Clustering ---")
        embeddings = []
        valid_images = []
        for img_path in images[:40]: # limit to avoid extreme long times
            try:
                # represent returns list of faces
                res = DeepFace.represent(img_path=img_path, model_name="Facenet", enforce_detection=True)
                if len(res) > 0:
                    # use the largest face
                    face = max(res, key=lambda x: x['facial_area']['w'] * x['facial_area']['h'])
                    embeddings.append(face['embedding'])
                    valid_images.append(img_path)
            except Exception:
                pass # No face found
                
        if len(embeddings) > 0:
            X = np.array(embeddings)
            # cosine distance for Facenet is good with eps ~ 0.4
            db = DBSCAN(eps=0.4, min_samples=2, metric='cosine').fit(X)
            labels = db.labels_
            
            unique_labels = set(labels)
            artist_id = 1
            for k in unique_labels:
                if k == -1:
                    continue # noise
                
                artist_key = f"Artist {artist_id}"
                artist_vault[artist_key] = []
                
                # Get the first image of this person to determine profession
                first_img = valid_images[list(labels).index(k)]
                prof_data = analyze_artist_profession(first_img)
                
                for idx, label in enumerate(labels):
                    if label == k:
                        f_path = valid_images[idx]
                        f_name = os.path.basename(f_path)
                        rel_path = f"../Assets/{'gdrive_sync' if 'gdrive_sync' in f_path else 'lightroom_sync'}/{f_name}"
                        
                        artist_vault[artist_key].append({
                            "id": f"art_{artist_id}_{idx}",
                            "name": f_name,
                            "professional_name": prof_data.get('profession', 'Creator'),
                            "poet_caption": f"<b>{prof_data.get('profession', 'Creator')}</b><br><i class='text-gray-400'>\"{prof_data.get('quote', '')}\"</i><br><br><span class='text-xs opacity-70'>{prof_data.get('context', '')}</span>",
                            "url": rel_path,
                            "tags": ["portrait", "artist", prof_data.get('profession', 'Creator').lower()]
                        })
                        clustered_images.add(f_path)
                
                print(f"Grouped {len(artist_vault[artist_key])} images into {artist_key} ({prof_data.get('profession', 'Creator')})")
                artist_id += 1

    # --- CATEGORIZE REMAINING ASSETS ---
    print("\n--- Categorizing remaining assets into 5 Rings & Archives ---")
    for f_path in images + videos:
        if f_path in clustered_images:
            continue
            
        f_name = os.path.basename(f_path)
        is_vid = f_path in videos
        rel_path = f"../Assets/{'gdrive_sync' if 'gdrive_sync' in f_path else 'lightroom_sync'}/{f_name}"
        
        print(f"  [AI] Analyzing {'Video' if is_vid else 'Image'}: {f_name}")
        v_data = analyze_asset_for_categories(f_path, is_video=is_vid)
        
        cat = v_data.get("category", "Ring of Void")
        if cat not in TARGET_CATEGORIES:
            cat = "Ring of Void"
            
        portfolio_data[cat].append({
            "id": f"item_{int(time.time()*1000)}_{random.randint(0,100)}",
            "name": f_name,
            "professional_name": v_data.get('title', 'Trace'),
            "poet_caption": f"<b>{v_data.get('title', 'Trace')}</b><br><i class='text-gray-400'>\"{v_data.get('quote', '')}\"</i><br><br><span class='text-xs opacity-70'>{v_data.get('context', '')}</span>",
            "url": rel_path,
            "tags": v_data.get('vibe_tags', [])
        })
        time.sleep(2) # rate limit

    # Combine everything into JS
    js_content = f"window.PortfolioData = {json.dumps(portfolio_data, indent=4)};\n"
    js_content += f"window.ArtistVault = {json.dumps(artist_vault, indent=4)};\n"
    
    with open(JS_DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"\nSUCCESS: Portfolio data updated at {JS_DATA_FILE}")

if __name__ == "__main__":
    main()
