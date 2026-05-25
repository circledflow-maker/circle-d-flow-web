import os
import json
import shutil
import time
import subprocess
try:
    from PIL import Image, ImageEnhance
except ImportError:
    Image = None

# ==========================================
# KYHEARTLX MASTER AGENT v17 (ARCHIVE POET)
# ==========================================

# Paths
BASE_DIR = r"D:\circle-d-flow-web\Portfolio_Content"
SOURCE_DRIVE = os.path.join(BASE_DIR, "Source_Drive") # (Google Drive Ingest)
SOURCE_LR = os.path.join(BASE_DIR, "Source_Lightroom") # (Lightroom fallback)
SOURCE_PORTRAIT = r"D:\circle-d-flow-web\Assets\images\Portrait"
FLOW_TALKS_RAW = os.path.join(BASE_DIR, "Flow_Talks_RAW")
READY_INTERVIEWS = os.path.join(BASE_DIR, "Ready_Interviews")
LIVE_SITE = os.path.join(BASE_DIR, "Live_Website")

STATE_FILE = os.path.join(BASE_DIR, "portfolio_state.json")
JS_DATA_FILE = r"D:\circle-d-flow-web\js\data\portfolio_data.js"

CATEGORY_MAP = {
    "secret garden": "The Secret Garden",
    "secret": "The Secret Garden",
    "hempy roots": "Brand & Culture",
    "hemp": "Brand & Culture",
    "nature": "Nature & Mysticism",
    "grafitti": "Urban Adventure",
    "urban": "Urban Adventure",
    "model picture": "Visual & Portrait",
    "manz": "Visual & Portrait",
    "model": "Visual & Portrait",
    "studio": "Studio Exclusives",
    "professional": "Studio Exclusives",
    "art": "The Atelier",
    "creative": "The Atelier",
    "product": "Purposeful Product",
    "dj": "Soundwaves",
    "manga": "Narrative & Philosophy",
    "spotlight": "Artist Spotlight",
    "portrait": "Artist Spotlight",
    "performance": "Performance & Art"
}

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"published_images": [], "manga_candidates": [], "website_slots": {}}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

def generate_poet_caption(filename, category):
    """
    Generates a caption following the [Anchor | Crack | Flow] formula.
    """
    trace_id = f"TRACE {int(time.time()) % 1000:03}"
    name = filename.split('.')[0].replace('_', ' ').title()
    
    if category == "Artist Spotlight":
        anchor = f"[{trace_id}] INDIVIDUAL: {name}."
        crack = "Behind the gaze lies a story untold, a frozen frequency of the soul."
        flow = "A focused alignment of identity and expression. Witnessed in the depths of the archive."
    elif category == "Narrative & Philosophy":
        anchor = f"[{trace_id}] PHILOSOPHY: {name}."
        crack = "The silence between the frames is where the truth resides."
        flow = "A meditation on existence. The flow state as a bridge between the physical and the metaphysical."
    else:
        anchor = f"[{trace_id}] ARCHIVE RECORD: {name}."
        crack = "A fragment of the urban odyssey, captured in the heart of Lisbon."
        flow = "The frequency of the city synchronizing with the creator's rhythm."
        
    return f"{anchor}\n{crack}\n{flow}"

def process_image(src, dst):
    if not Image:
        shutil.copy2(src, dst)
        return
    try:
        with Image.open(src) as img:
            # Subtle enhancements for the Archive Poet vibe
            enhancer = ImageEnhance.Contrast(img); img = enhancer.enhance(1.1)
            enhancer = ImageEnhance.Sharpness(img); img = enhancer.enhance(1.2)
            dst_webp = os.path.splitext(dst)[0] + ".webp"
            img.save(dst_webp, "WEBP", quality=85)
            return os.path.basename(dst_webp)
    except Exception as e:
        print(f"Image enhancement failed: {e}")
        shutil.copy2(src, dst)
        return os.path.basename(dst)

def generate_video_assets(video_path, output_dir):
    """
    Generates Thumbnail and Subtitles (.srt) for the video.
    """
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    thumb_path = os.path.join(output_dir, f"thumb_{base_name}.jpg")
    srt_path = os.path.join(output_dir, f"{base_name}.srt")
    
    # 1. Extract Thumbnail
    print(f"-> Extracting thumbnail for {base_name}...")
    cmd_thumb = ['ffmpeg', '-y', '-ss', '00:00:02', '-i', video_path, '-frames:v', '1', '-q:v', '4', thumb_path]
    subprocess.run(cmd_thumb, capture_output=True)
    
    # 2. Transcription (Draft SRT if faster-whisper is missing)
    print(f"-> Generating SRT manifest for {base_name}...")
    # Placeholder SRT logic (Agent would use faster-whisper here if installed)
    with open(srt_path, "w") as f:
        f.write("1\n00:00:00,000 --> 00:00:05,000\n[PROCESSED BY MASTER AGENT v17]\n\n")
        f.write("2\n00:00:05,000 --> 00:00:10,000\n(Check transcript manifest in Google Drive for manual sync)\n")
    
    return f"thumb_{base_name}.jpg", f"{base_name}.srt"

def update_js_data(new_asset, category):
    if not os.path.exists(JS_DATA_FILE): return
    with open(JS_DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    start_idx = content.find("{")
    end_idx = content.rfind("}") + 1
    if start_idx == -1: return
    try:
        data = json.loads(content[start_idx:end_idx])
        if category not in data: data[category] = []
        # Insert at top
        data[category].insert(0, new_asset)
        new_content = f"window.PortfolioData = {json.dumps(data, indent=4)};"
        with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
    except Exception as e:
        print(f"Failed to update JS: {e}")

def fill_slots(source_path, state, priority_name, force_cat=None):
    if not os.path.exists(source_path): return
    print(f"Checking {priority_name}...")
    added = 0
    for root, dirs, files in os.walk(source_path):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov')):
                if f not in state["published_images"]:
                    cat = force_cat or "Urban Adventure"
                    # Category detection if not forced
                    if not force_cat:
                        for kw, c in CATEGORY_MAP.items():
                            if kw in f.lower() or kw in root.lower(): cat = c; break
                    
                    print(f"  + Slot Found: {f} -> {cat}")
                    src_file = os.path.join(root, f)
                    dst_file = os.path.join(LIVE_SITE, f)
                    
                    clean_f = process_image(src_file, dst_file)
                    caption = generate_poet_caption(clean_f, cat)
                    
                    new_asset = {
                        "id": f"v17_{int(time.time())}_{added}",
                        "name": clean_f,
                        "professional_name": clean_f.split('.')[0].replace('_', ' ').title(),
                        "url": f"../Portfolio_Content/Live_Website/{clean_f}",
                        "poet_caption": caption
                    }
                    
                    if clean_f.lower().endswith(('.mp4', '.mov')):
                        thumb, srt = generate_video_assets(os.path.join(LIVE_SITE, clean_f), LIVE_SITE)
                        new_asset["thumb_url"] = f"../Portfolio_Content/Live_Website/{thumb}"
                        new_asset["srt_url"] = f"../Portfolio_Content/Live_Website/{srt}"
                        new_asset["type"] = "video"

                    update_js_data(new_asset, cat)
                    state["published_images"].append(f)
                    added += 1
                    
                    # Manga candidate logic
                    if any(kw in f.lower() for kw in ["will", "heart", "manga"]):
                        state["manga_candidates"].append(clean_f)
    print(f"-> Synced {added} items from {priority_name}.")

def main():
    print("================================")
    print(" KYHEARTLX MASTER AGENT v17  ")
    print("================================\n")
    state = load_state()
    
    # Priority Ingestion
    fill_slots(SOURCE_DRIVE, state, "Google Drive (Priority 1)")
    fill_slots(SOURCE_LR, state, "Lightroom Exports (Priority 2)")
    fill_slots(SOURCE_PORTRAIT, state, "Portrait Showcase (Direct)", force_cat="Artist Spotlight")
    
    # Flow Talk Engine
    print("\n[ENGAGING] Flow Talk Engine...")
    for f in os.listdir(FLOW_TALKS_RAW):
        if f.lower().endswith(('.mp4', '.mov')):
            if f not in state["published_images"]:
                print(f"Processing Flow Talk: {f}")
                src = os.path.join(FLOW_TALKS_RAW, f)
                dst = os.path.join(READY_INTERVIEWS, f)
                shutil.copy2(src, dst)
                thumb, srt = generate_video_assets(dst, READY_INTERVIEWS)
                
                # These wait for YouTube upload, but we log the manifest
                manifest = {
                    "name": f,
                    "thumb": thumb,
                    "srt": srt,
                    "location": "Ready_Interviews",
                    "status": "WAITING_FOR_YOUTUBE"
                }
                with open(os.path.join(READY_INTERVIEWS, f"{f}_manifest.json"), "w") as m:
                    json.dump(manifest, m, indent=4)
                
                state["published_images"].append(f)
                
    save_state(state)
    print("\n[SUCCESS] Archive synchronized.")

if __name__ == "__main__":
    main()
