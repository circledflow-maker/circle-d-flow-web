import os
import json
import random
import time
import urllib.request
import base64
import google.generativeai as genai

# Load env variables (assuming dotenv is used, or fallback)
from dotenv import load_dotenv
load_dotenv(r'D:\circle-d-flow-web\.env')

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: No GEMINI_API_KEY found in .env!")

# Use the Gemini 1.5 Pro or Flash model (Flash is faster for bulk processing)
model = genai.GenerativeModel('gemini-1.5-flash')

SYSTEM_PROMPT = """
Du bist der digitale Griot und Master-Kurator für das Fotografie- und Video-Portfolio von "Kiss Your Heart" und der "Circle D Flow" Community in Lissabon. Deine Aufgabe ist es, hochgeladene visuelle Medien (Bilder/Videos) autonom zu analysieren, ihre Qualität zu prüfen, sie in das philosophische Konzept der "5 Ringe" (Miyamoto Musashi) einzuordnen und passende, Manga-inspirierte Texte zu generieren. 

Du handelst nach dem Prinzip des "Wu Wei" (müheloses Handeln) und spiegelst den "Will of D" wider.

### 1. QUALITÄTSKONTROLLE (Professionalität)
Prüfe das Bild/Video zuerst auf High-End-Standards: 
- Ist es unscharf (außer bewusster Motion-Blur), schlecht ausgeleuchtet oder ein unfertiger Schnappschuss? -> Setze Status auf "DRAFT".
- Ist es gestochen scharf, professionell komponiert, fängt es den Vibe, die Energie oder die Klarheit perfekt ein? -> Setze Status auf "APPROVED".

### 2. KATEGORISIERUNG (Die 5 Ringe Logik)
Wenn "APPROVED", analysiere das Motiv und ordne es zwingend EINEM dieser Ringe zu:
- **Ring of Earth:** Weite Landschaften, Lissabon, Favela LX, Architektur. (Vibe: Erkundung. Zielgruppe: Touristen, Explorer).
- **Ring of Water:** DJs, Künstler in Aktion, Musiker im Flow-Zustand. (Vibe: Dynamik. Zielgruppe: Event-Veranstalter, Festival-Booker, Konzerte).
- **Ring of Fire:** Graffiti, Street Art, Tattoos, rohe urbane Kontraste, Hip-Hop-Kultur. (Vibe: Rebellion. Zielgruppe: Individualisten, Underground).
- **Ring of Wind:** Lachende Menschen, Gruppen, C4C Jams, Interaktion. (Vibe: Zusammenhalt. Zielgruppe: Community, Locals).
- **Ring of Void:** Ruhige, intensive Close-Up Porträts, Fokus auf das Innere, Studio-Vibe. (Vibe: Balance & Klarheit. Zielgruppe: High-End B2B, Private Shootings).

### 3. TEXT-GENERIERUNG (Tone of Voice)
Generiere für das WIX-CMS folgende Begleittexte. Der Stil ist Manga/Anime-inspiriert (denke an Vagabond, Samurai Champloo, One Piece), tiefgründig und energiegeladen:
- **title:** Ein epischer, kurzer Titel (max. 4 Worte).
- **quote:** Ein tiefgründiges Zitat (inspiriert von Musashi, Taoismus oder Anime), das Willenskraft, Flow oder Balance thematisiert.
- **context:** Ein kurzer Satz (max. 15 Worte), der den Ort/Vibe beschreibt (z.B. "Die rohe Energie Lissabons, eingefangen im Moment.").

### 4. AUSGABE-FORMAT (Strict JSON)
Gib deine Antwort AUSSCHLIESSLICH als valides JSON-Objekt zurück. Keine Erklärungen davor oder danach. Dies ist für eine API-Übergabe an WIX.

{
  "status": "APPROVED",
  "ring_category": "[Name des Rings]",
  "target_audience": "[Zielgruppe]",
  "title": "[Generierter Titel]",
  "quote": "[Generiertes Zitat]",
  "context": "[Generierter Kontext]",
  "mobile_autoplay": true,
  "vibe_tags": ["tag1", "tag2", "tag3"]
}
"""

TOKEN_FILE_GDRIVE = 'token.json'
TOKEN_FILE_ADOBE = 'adobe_token.json'
JS_DATA_FILE = r'D:\circle-d-flow-web\js\data\portfolio_data.js'
LR_SYNC_DIR = r'D:\circle-d-flow-web\assets\lightroom_sync'
LR_BASE_URL = "https://lr.adobe.io/v2"
ADOBE_CLIENT_ID = "1bcdcc8dcd38454591e74bec5b652311"

TARGET_CATEGORIES = [
    "Ring of Earth", "Ring of Water", "Ring of Fire",
    "Ring of Wind", "Ring of Void"
]

def analyze_image_with_vision(local_filepath):
    """Sends the image to Gemini Vision to get the Ring Category and metadata."""
    if not GEMINI_API_KEY:
        # Fallback if no API key
        return {
            "status": "APPROVED", "ring_category": random.choice(TARGET_CATEGORIES),
            "title": "Vision Offline", "quote": "The mind sees what the eye cannot.",
            "context": "Awaiting API connection.", "vibe_tags": ["offline", "sync"]
        }
    
    try:
        sample_file = genai.upload_file(path=local_filepath, display_name="portfolio_image")
        response = model.generate_content([sample_file, SYSTEM_PROMPT])
        
        # Clean up JSON markdown blocks
        raw_text = response.text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:]
        if raw_text.endswith("```"): raw_text = raw_text[:-3]
        
        data = json.loads(raw_text.strip())
        return data
    except Exception as e:
        print(f"Vision API Error: {e}")
        return {
            "status": "APPROVED", "ring_category": "Ring of Void",
            "title": "Unknown Trace", "quote": "Lost in the matrix.",
            "context": "Analysis failed.", "vibe_tags": ["error"]
        }

def fetch_lightroom_assets_with_vision(portfolio_data):
    print("\n--- Connecting to Adobe Lightroom Web (Vision Kurator Mode) ---")
    if not os.path.exists(TOKEN_FILE_ADOBE):
        print("adobe_token.json not found.")
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
            
        print(f"Fetching assets from Adobe Album: '{album_name}'")
        assets_data = adobe_request(f"{LR_BASE_URL}/catalogs/{catalog_id}/albums/{album_id}/assets?embed=asset", access_token)
        if not assets_data: continue
        
        assets = assets_data.get('resources', [])
        for item in assets[:5]: # Process 5 per album to save API costs during test
            asset = item.get('asset', {})
            asset_id = asset.get('id')
            if not asset_id: continue
                
            links = asset.get('links', {})
            rendition_path = None
            for r_type in ['/rels/rendition_type/2048', '/rels/rendition_type/1080p', '/rels/rendition_type/thumbnail2x']:
                if r_type in links:
                    rendition_path = links[r_type]['href']
                    break
                    
            if not rendition_path: continue
                
            local_filename = f"{asset_id}.jpg"
            local_filepath = os.path.join(LR_SYNC_DIR, local_filename)
            
            if not os.path.exists(local_filepath):
                print(f"   Downloading Lightroom Image: {asset_id}...")
                image_bytes = adobe_request(f"{LR_BASE_URL}/catalogs/{catalog_id}/{rendition_path}", access_token, stream=True)
                if image_bytes:
                    with open(local_filepath, "wb") as img_file:
                        img_file.write(image_bytes)
                else: continue
            
            print(f"   [Vision Kurator] Analyzing {local_filename}...")
            vision_data = analyze_image_with_vision(local_filepath)
            
            if vision_data.get("status") == "DRAFT":
                print("      -> Rejected (Draft quality). Skipping.")
                continue
                
            cat = vision_data.get("ring_category", "Ring of Void")
            if cat not in TARGET_CATEGORIES:
                cat = "Ring of Void" # Fallback
                
            web_path = f"assets/lightroom_sync/{local_filename}"
            
            # Format poet caption with Manga quote
            poet_caption = f"<b>{vision_data.get('title', 'Trace')}</b><br><i class='text-gray-400'>\"{vision_data.get('quote', '')}\"</i><br><br><span class='text-xs opacity-70'>{vision_data.get('context', '')}</span>"
            
            asset_obj = {
                "id": f"lr_{asset_id}",
                "name": local_filename,
                "professional_name": vision_data.get('title', album_name),
                "poet_caption": poet_caption,
                "url": f"../{web_path}",
                "tags": vision_data.get('vibe_tags', [])
            }
            portfolio_data[cat].append(asset_obj)

def adobe_request(url, access_token, stream=False):
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("X-Api-Key", ADOBE_CLIENT_ID)
    try:
        response = urllib.request.urlopen(req)
        if stream: return response.read()
        text = response.read().decode('utf-8', errors='ignore')
        if text.startswith("while (1) {}"): text = text[12:].strip()
        return json.loads(text)
    except Exception as e:
        print(f"Adobe API Error on {url}: {e}")
        return None

def fetch_local_assets_with_vision(portfolio_data):
    print("\n--- Scanning Local Assets (Offline Vision Kurator) ---")
    files = os.listdir(LR_SYNC_DIR)
    jpgs = [f for f in files if f.lower().endswith('.jpg') or f.lower().endswith('.png')]
    print(f"Found {len(jpgs)} local images.")
    for local_filename in jpgs[:15]: # Process up to 15 images
        local_filepath = os.path.join(LR_SYNC_DIR, local_filename)
        print(f"   [Vision Kurator] Analyzing {local_filename}...")
        vision_data = analyze_image_with_vision(local_filepath)
        if vision_data.get("status") == "DRAFT": continue
        
        cat = vision_data.get("ring_category", "Ring of Void")
        if cat not in TARGET_CATEGORIES: cat = "Ring of Void"
        
        poet_caption = f"<b>{vision_data.get('title', 'Trace')}</b><br><i class='text-gray-400'>\"{vision_data.get('quote', '')}\"</i><br><br><span class='text-xs opacity-70'>{vision_data.get('context', '')}</span>"
        
        asset_obj = {
            "id": f"lr_{local_filename.split('.')[0]}",
            "name": local_filename,
            "professional_name": vision_data.get('title', 'Offline Trace'),
            "poet_caption": poet_caption,
            "url": f"../assets/lightroom_sync/{local_filename}",
            "tags": vision_data.get('vibe_tags', [])
        }
        # Prevent duplicates
        if not any(a['name'] == local_filename for a in portfolio_data[cat]):
            portfolio_data[cat].append(asset_obj)

def main():
    os.makedirs(LR_SYNC_DIR, exist_ok=True)
    portfolio_data = {cat: [] for cat in TARGET_CATEGORIES}
    
    fetch_lightroom_assets_with_vision(portfolio_data)
    fetch_local_assets_with_vision(portfolio_data)
    
    # We skip GDrive direct vision analysis for now unless we download them. 
    # But for a quick integration, Lightroom is fully Vision AI driven.
    
    for cat, items in portfolio_data.items():
        print(f"[{cat}]: {len(items)} assets approved.")

    with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(f"window.PortfolioData = {json.dumps(portfolio_data, indent=4)};")
        
    print(f"\nSUCCESS: Unified Web Portfolio (5 Rings) generated at {JS_DATA_FILE}!")

if __name__ == '__main__':
    main()
