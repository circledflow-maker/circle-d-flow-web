import os
import json
import time
import random

# Paths
BASE_DIR = r"D:\circle-d-flow-web\Portfolio_Content"
LIVE_SITE = os.path.join(BASE_DIR, "Live_Website")
STATE_FILE = os.path.join(BASE_DIR, "portfolio_state.json")
JS_DATA_FILE = r"D:\circle-d-flow-web\js\data\portfolio_data.js"

# Extended Category Rule Map for Google Drive & Lightroom ingestion
CATEGORY_MAP = {
    "secret garden": "The Secret Garden",
    "secret": "The Secret Garden",
    
    "resin": "Brand & Culture",
    "jewelry": "Brand & Culture",
    "tuktuk": "Brand & Culture",
    "nails": "Brand & Culture",
    "outbreak": "Brand & Culture",
    "handicraft": "Brand & Culture",
    
    "japan": "Nature & Mysticism",
    "nature": "Nature & Mysticism",
    "tao": "Nature & Mysticism",
    "zen": "Nature & Mysticism",
    
    "street": "Urban Adventure",
    "graffiti": "Urban Adventure",
    "urban": "Urban Adventure",
    "walk": "Urban Adventure",
    
    "portrait": "Visual & Portrait",
    "nikon": "Visual & Portrait",
    "artist": "Visual & Portrait",
    
    "studio": "Studio Exclusives",
    "fashion": "Studio Exclusives",
    "professional": "Studio Exclusives",
    
    "event": "The Atelier",
    "hero": "The Atelier",
    "meetup": "The Atelier",
    "atelier": "The Atelier",
    
    "circle": "Circle D Flow",
    "energy": "Circle D Flow",
    "living": "Circle D Flow",
    "community": "Circle D Flow"
}

# The Target Categories so we can evenly distribute the generic DSC files for UI testing
TARGET_CATEGORIES = [
    "The Secret Garden",
    "Brand & Culture",
    "Nature & Mysticism",
    "Urban Adventure",
    "Visual & Portrait",
    "Studio Exclusives",
    "The Atelier",
    "Circle D Flow"
]

def generate_poet_caption(filename, category):
    trace_id = f"TRACE {abs(hash(filename)) % 1000:03}"
    name = filename.split('.')[0].replace('_', ' ').title()
    if category == "Visual & Portrait":
        anchor = f"[{trace_id}] INDIVIDUAL: {name}."
        crack = "Behind the gaze lies a story untold, a frozen frequency of the soul."
        flow = "A focused alignment of identity and expression."
    elif category == "Nature & Mysticism" or category == "The Secret Garden":
        anchor = f"[{trace_id}] EARTH: {name}."
        crack = "The silence between the leaves is where the truth resides."
        flow = "A meditation on the organic network."
    elif category == "Brand & Culture":
        anchor = f"[{trace_id}] ARTIFACT: {name}."
        crack = "Crafted with intention, woven into the cultural fabric."
        flow = "The frequency of mindful creation."
    elif category == "Studio Exclusives":
        anchor = f"[{trace_id}] STUDIO: {name}."
        crack = "Controlled light molding reality into pure aesthetic."
        flow = "A masterclass in professional vision."
    elif category == "Circle D Flow":
        anchor = f"[{trace_id}] ENERGY: {name}."
        crack = "The collective heartbeat of the living room session."
        flow = "Pure community connection and flow state."
    elif category == "The Atelier":
        anchor = f"[{trace_id}] CREATION: {name}."
        crack = "Where local heroes forge their legends."
        flow = "The hospitality of shared creative spaces."
    elif category == "The Archive":
        anchor = f"[{trace_id}] ARCHIVE RECORD: {name}."
        crack = "A fragment of the odyssey."
        flow = "The frequency of the past."
    else:
        anchor = f"[{trace_id}] ARCHIVE RECORD: {name}."
        crack = "A fragment of the urban odyssey."
        flow = "The frequency of the city synchronizing."
    return f"{anchor}\n{crack}\n{flow}"

def fix_portfolio():
    print("Fixing Portfolio Data and Applying Rules...")
    
    if not os.path.exists(LIVE_SITE):
        print(f"Error: {LIVE_SITE} does not exist.")
        return
        
    data = {}
    for cat in TARGET_CATEGORIES:
        data[cat] = []
        
    # Get all actual files from Live_Website to eliminate duplicates
    live_files = [f for f in os.listdir(LIVE_SITE) if os.path.isfile(os.path.join(LIVE_SITE, f))]
    live_files.sort()
    
    # Optional: read existing state to avoid re-generating IDs if possible, but actually wiping is safer
    published = []
    
    # We will distribute files into the categories based on filename rules, or round-robin if no rule matches
    # Since we know they are DSC_*.webp, let's chunk them
    for i, f in enumerate(live_files):
        # Determine category based on filename directly (if they ever get named properly)
        cat = None
        for kw, c in CATEGORY_MAP.items():
            if kw in f.lower():
                cat = c
                break
                
        # If no strict name match (like generic DSC files), assign them to a generic archive
        if not cat:
            cat = "The Archive"
            
        if cat not in data:
            data[cat] = []
            
        asset = {
            "id": f"fix_{i}_{int(time.time())}",
            "name": f,
            "professional_name": f.split('.')[0].replace('_', ' ').replace('-', ' ').title(),
            "url": f"../Portfolio_Content/Live_Website/{f}",
            "poet_caption": generate_poet_caption(f, cat)
        }
        
        # Handle Video Specifics
        if f.lower().endswith(('.mp4', '.mov')):
            asset["type"] = "video"
            base = os.path.splitext(f)[0]
            if os.path.exists(os.path.join(LIVE_SITE, f"thumb_{base}.jpg")):
                asset["thumb_url"] = f"../Portfolio_Content/Live_Website/thumb_{base}.jpg"
            if os.path.exists(os.path.join(LIVE_SITE, f"{base}.srt")):
                asset["srt_url"] = f"../Portfolio_Content/Live_Website/{base}.srt"
                
        # Append to proper list (avoiding thumb_ and .srt files being treated as main assets if we want, but keeping it simple)
        if not f.startswith("thumb_") and not f.endswith(".srt"):
            data[cat].append(asset)
            published.append(f)

    # Save to JS data file
    new_content = f"window.PortfolioData = {json.dumps(data, indent=4)};"
    with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    # Save a clean portfolio state file
    clean_state = {
        "published_images": published,
        "manga_candidates": [],
        "website_slots": {}
    }
    with open(STATE_FILE, "w") as f:
        json.dump(clean_state, f, indent=4)
        
    print(f"Successfully repaired portfolio: {len(published)} valid assets distributed across newly mapped categories.")

if __name__ == "__main__":
    fix_portfolio()
