import os
import json
import subprocess
import time

# Paths
JS_DATA_FILE = r"D:\circle-d-flow-web\js\data\portfolio_data.js"
LIVE_SITE = r"D:\circle-d-flow-web\Portfolio_Content\Live_Website"

# Reuse logic from content_router (simplified)
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

def detect_category(filename):
    name = filename.lower()
    if any(kw in name for kw in ["portrait", "spotlight", "artist", "studio"]):
        return "Artist Spotlight"
    for kw, cat in CATEGORY_MAP.items():
        if kw in name:
            return cat
    return "Urban Adventure"

def clean_professional_name(filename):
    name = filename.split('.')[0]
    name = name.replace('[CLEAN]', '').replace('[LIVE]', '').replace('_', ' ').strip()
    if name.startswith('DSC '): name = f"Vision Trace {name[4:]}"
    if name.startswith('GX'): name = f"Flow Capture {name[2:]}"
    return name.title()

def generate_thumbnail(video_path, output_path):
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

def main():
    print("[AGENTS] Starting Portfolio Health Check...")
    if not os.path.exists(JS_DATA_FILE):
        print("Data file not found.")
        return

    with open(JS_DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_idx = content.find('{')
    end_idx = content.rfind('}') + 1
    data = json.loads(content[start_idx:end_idx])

    all_items = []
    for cat in list(data.keys()):
        for item in data[cat]:
            item['old_category'] = cat # Temporary tag
            all_items.append(item)
        data[cat] = [] # Clear to re-categorize

    fixed_count = 0
    thumb_count = 0

    for item in all_items:
        filename = item.get('name', '')
        old_cat = item.pop('old_category', 'Urban Adventure')
        
        # 1. Re-Categorize (Respect Artist Spotlight if already set)
        if old_cat == "Artist Spotlight":
            new_cat = "Artist Spotlight"
        else:
            new_cat = detect_category(filename)
            
        if new_cat not in data: data[new_cat] = []
        
        # 2. Clean Name
        item['professional_name'] = clean_professional_name(filename)
        
        # 3. Fix Thumbnails for local content
        if filename.lower().endswith(('.mp4', '.mov')):
            # Determine local path
            local_path = ""
            if "Live_Website" in item.get('url', ''):
                local_path = os.path.join(LIVE_SITE, filename)
            elif "live_ingest" in item.get('url', ''):
                 local_path = os.path.join(r"D:\circle-d-flow-web\assets\live_ingest", filename)
            
            if local_path and os.path.exists(local_path):
                thumb_name = f"thumb_{os.path.splitext(filename)[0]}.jpg"
                thumb_local_path = os.path.join(os.path.dirname(local_path), thumb_name)
                
                if not item.get('thumb_url'):
                    if generate_thumbnail(local_path, thumb_local_path):
                        item['thumb_url'] = item['url'].replace(filename, thumb_name)
                        thumb_count += 1
        
        data[new_cat].append(item)
        fixed_count += 1

    # Save back
    new_content = f"window.PortfolioData = {json.dumps(data, indent=4)};"
    with open(JS_DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("[SUCCESS] Health check complete.")
    print(f"-> Items Re-Categorized/Cleaned: {fixed_count}")
    print(f"-> Thumbnails Generated: {thumb_count}")

if __name__ == "__main__":
    main()
