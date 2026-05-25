import os
import json
import time

# Paths
BASE_DIR = r"D:\circle-d-flow-web\Portfolio_Content"
LIVE_SITE = os.path.join(BASE_DIR, "Live_Website")
STATE_FILE = os.path.join(BASE_DIR, "portfolio_state.json")
JS_DATA_FILE = r"D:\circle-d-flow-web\js\data\portfolio_data.js"

CATEGORY_MAP = {
    "model": "Visual & Portrait",
    "nature": "Narrative & Philosophy",
    "art": "The Atelier",
    "creative": "The Atelier",
    "product": "Purposeful Product",
    "urban": "Urban Adventure",
    "dj": "Soundwaves",
    "manga": "Narrative & Philosophy",
    "spotlight": "Artist Spotlight",
    "portrait": "Artist Spotlight",
    "performance": "Performance & Art"
}

def generate_poet_caption(filename, category):
    trace_id = f"TRACE {abs(hash(filename)) % 1000:03}"
    name = filename.split('.')[0].replace('_', ' ').title()
    if category == "Artist Spotlight":
        anchor = f"[{trace_id}] INDIVIDUAL: {name}."
        crack = "Behind the gaze lies a story untold, a frozen frequency of the soul."
        flow = "A focused alignment of identity and expression."
    elif category == "Narrative & Philosophy":
        anchor = f"[{trace_id}] PHILOSOPHY: {name}."
        crack = "The silence between the frames is where the truth resides."
        flow = "A meditation on existence."
    else:
        anchor = f"[{trace_id}] ARCHIVE RECORD: {name}."
        crack = "A fragment of the urban odyssey."
        flow = "The frequency of the city synchronizing."
    return f"{anchor}\n{crack}\n{flow}"

def repair():
    print("Repairing Portfolio Data...")
    if not os.path.exists(STATE_FILE): return
    with open(STATE_FILE, "r") as f:
        state = json.load(f)
    
    published = state.get("published_images", [])
    data = {}
    
    for i, f in enumerate(published):
        cat = "Urban Adventure"
        for kw, c in CATEGORY_MAP.items():
            if kw in f.lower(): cat = c; break
            
        if cat not in data: data[cat] = []
        
        # Check if it was already processed as webp or similar
        clean_name = f
        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
            webp_check = os.path.splitext(f)[0] + ".webp"
            if os.path.exists(os.path.join(LIVE_SITE, webp_check)):
                clean_name = webp_check
        
        asset = {
            "id": f"repair_{i}_{int(time.time())}",
            "name": clean_name,
            "professional_name": clean_name.split('.')[0].replace('_', ' ').replace('-', ' ').title(),
            "url": f"../Portfolio_Content/Live_Website/{clean_name}",
            "poet_caption": generate_poet_caption(clean_name, cat)
        }
        
        if clean_name.lower().endswith(('.mp4', '.mov')):
            asset["type"] = "video"
            base = os.path.splitext(clean_name)[0]
            if os.path.exists(os.path.join(LIVE_SITE, f"thumb_{base}.jpg")):
                asset["thumb_url"] = f"../Portfolio_Content/Live_Website/thumb_{base}.jpg"
            if os.path.exists(os.path.join(LIVE_SITE, f"{base}.srt")):
                asset["srt_url"] = f"../Portfolio_Content/Live_Website/{base}.srt"
        
        data[cat].insert(0, asset)

    new_content = f"window.PortfolioData = {json.dumps(data, indent=4)};"
    with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Successfully repaired {len(published)} assets.")

if __name__ == "__main__":
    repair()
