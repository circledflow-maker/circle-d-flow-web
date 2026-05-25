import os
import glob
import json
import shutil
import time
import subprocess
try:
    from PIL import Image, ImageEnhance
except ImportError:
    Image = None

# Paths
BASE_DIR = r"D:\circle-d-flow-web\Portfolio_Content"
SOURCE_DRIVE = os.path.join(BASE_DIR, "Source_Drive")
SOURCE_LR = os.path.join(BASE_DIR, "Source_Lightroom")
SOURCE_PORTRAIT = r"D:\circle-d-flow-web\Assets\images\Portrait"
LIVE_SITE = os.path.join(BASE_DIR, "Live_Website")
STATE_FILE = os.path.join(BASE_DIR, "portfolio_state.json")
JS_DATA_FILE = r"D:\circle-d-flow-web\js\data\portfolio_data.js"

# Category Mapping (The 8-Category Flow Matrix + Artist Spotlight)
CATEGORY_MAP = {
    "model": "Visual & Portrait",
    "nature": "Narrative & Philosophy",
    "canvas": "Narrative & Philosophy",
    "art": "The Atelier",
    "creative": "The Atelier",
    "product": "Purposeful Product",
    "collab": "Purposeful Product",
    "urban": "Urban Adventure",
    "dj": "Soundwaves",
    "manga": "Narrative & Philosophy",
    "spotlight": "Artist Spotlight",
    "portrait": "Artist Spotlight",
    "artist": "Artist Spotlight",
    "studio": "Artist Spotlight",
    "performance": "Performance & Art"
}

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"published_images": [], "manga_queue": []}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

def update_js_data(new_asset, category):
    if not os.path.exists(JS_DATA_FILE):
        return
    with open(JS_DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    start_idx = content.find("{")
    end_idx = content.rfind("}") + 1
    if start_idx == -1 or end_idx == 0: return
    try:
        data_json = content[start_idx:end_idx]
        data = json.loads(data_json)
        if category not in data: data[category] = []
        if not any(item.get("name") == new_asset["name"] for item in data[category]):
            data[category].insert(0, new_asset)
        new_content = f"window.PortfolioData = {json.dumps(data, indent=4)};"
        with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
    except Exception as e:
        print(f"Error updating JS data: {e}")

def clean_professional_name(filename):
    name = filename.split('.')[0]
    name = name.replace('[CLEAN]', '').replace('[LIVE]', '').replace('_', ' ').strip()
    if name.startswith('DSC '): name = f"Vision Trace {name[4:]}"
    elif name.startswith('GX'): name = f"Flow Capture {name[2:]}"
    return name.title()

def generate_video_thumbnail(video_path, output_path):
    print(f"Generating thumbnail for {os.path.basename(video_path)}...")
    cmd = ['ffmpeg', '-y', '-ss', '00:00:02', '-i', video_path, '-frames:v', '1', '-q:v', '4', output_path]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except:
        cmd[2] = '00:00:00'
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return True
        except: return False

def detect_category(filename, force_category=None):
    if force_category: return force_category
    name = filename.lower()
    if any(kw in name for kw in ["portrait", "spotlight", "artist", "studio"]):
        return "Artist Spotlight"
    for kw, cat in CATEGORY_MAP.items():
        if kw in name: return cat
    return "Urban Adventure"

def ingest_directory(source_path, state, force_category=None):
    if not os.path.exists(source_path): return 0
    valid_ext = {'.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'}
    files_added = 0
    for f in os.listdir(source_path):
        ext = os.path.splitext(f)[1].lower()
        if ext in valid_ext:
            # For force_category (Spotlight), we always ensure it's in the data
            if f not in state["published_images"] or force_category:
                src_file = os.path.join(source_path, f)
                dst_file = os.path.join(LIVE_SITE, f)
                print(f"Routing asset -> {f}")
                
                # Check for existing destination (duplicates)
                if os.path.exists(dst_file) and f not in state["published_images"]:
                     state["published_images"].append(f)

                # Process Images
                if Image and ext in {'.jpg', '.jpeg', '.png', '.webp'}:
                    try:
                        with Image.open(src_file) as img:
                            enhancer = ImageEnhance.Contrast(img); img = enhancer.enhance(1.1)
                            enhancer = ImageEnhance.Sharpness(img); img = enhancer.enhance(1.2)
                            dst_file_webp = os.path.splitext(dst_file)[0] + ".webp"
                            img.save(dst_file_webp, "WEBP", quality=85)
                            f = os.path.basename(dst_file_webp)
                    except Exception as e:
                        print(f"Enhance failed for {f}: {e}")
                        shutil.copy2(src_file, dst_file)
                # Process Videos
                elif ext in {'.mp4', '.mov'}:
                    try:
                        dst_file_mp4 = os.path.splitext(dst_file)[0] + ".mp4"
                        if not os.path.exists(dst_file_mp4):
                            print(f"Transcoding {f}...")
                            cmd = ['ffmpeg', '-y', '-i', src_file, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', dst_file_mp4]
                            subprocess.run(cmd, check=True, capture_output=True)
                        f = os.path.basename(dst_file_mp4)
                        dst_file = dst_file_mp4
                    except Exception as e:
                        print(f"Transcode failed: {e}")
                        shutil.copy2(src_file, dst_file)
                else:
                    shutil.copy2(src_file, dst_file)
                
                category = detect_category(f, force_category)
                asset_url = f"../Portfolio_Content/Live_Website/{f}"
                
                thumb_url = ""
                if f.lower().endswith(('.mp4', '.mov')):
                    thumb_name = f"thumb_{os.path.splitext(f)[0]}.jpg"
                    local_thumb_path = os.path.join(LIVE_SITE, thumb_name)
                    if generate_video_thumbnail(dst_file, local_thumb_path):
                        thumb_url = f"../Portfolio_Content/Live_Website/{thumb_name}"
                
                new_asset = {
                    "id": f"local_{int(time.time())}_{f}",
                    "name": f,
                    "professional_name": clean_professional_name(f),
                    "url": asset_url,
                    "video_url": asset_url if f.lower().endswith(('.mp4', '.mov')) else None,
                    "thumb_url": thumb_url
                }
                update_js_data(new_asset, category)
                state["published_images"].append(f)
                files_added += 1
    return files_added

def main():
    print("================================")
    print(" KYHEARTLX CONTENT AGENT v2.0   ")
    print("================================\n")
    os.makedirs(LIVE_SITE, exist_ok=True)
    state = load_state()
    
    print("Ingesting: Source_Drive...")
    added_drive = ingest_directory(SOURCE_DRIVE, state)
    print(f"-> Added {added_drive}\n")
    
    print("Ingesting: Source_Lightroom...")
    added_lr = ingest_directory(SOURCE_LR, state)
    print(f"-> Added {added_lr}\n")
    
    print("Ingesting: Portrait Showcase...")
    added_portrait = ingest_directory(SOURCE_PORTRAIT, state, force_category="Artist Spotlight")
    print(f"-> Added {added_portrait}\n")
    
    save_state(state)
    print("[SUCCESS] All sources synced to central location.")

if __name__ == "__main__":
    main()
