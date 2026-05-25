import os
import json
import time
try:
    from PIL import Image, ImageDraw, ImageOps, ImageFilter
except ImportError:
    Image = None

# Paths
BASE_DIR = r"D:\circle-d-flow-web\Portfolio_Content"
LIVE_SITE = os.path.join(BASE_DIR, "Live_Website")
NARRATIVE_DIR = os.path.join(LIVE_SITE, "Narrative")
STATE_FILE = os.path.join(BASE_DIR, "portfolio_state.json")
JS_DATA_FILE = r"D:\circle-d-flow-web\js\data\portfolio_data.js"

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"published_images": [], "manga_candidates": []}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

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
        data[category].insert(0, new_asset)
        new_content = f"window.PortfolioData = {json.dumps(data, indent=4)};"
        with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
    except Exception as e:
        print(f"Failed to update JS: {e}")

def create_manga_collage(image_names, output_filename):
    if not Image: return False
    print(f"Synthesizing Weekly Manga from {len(image_names)} candidates...")
    
    images = []
    for f in image_names:
        path = os.path.join(LIVE_SITE, f)
        if os.path.exists(path):
            img = Image.open(path).convert('L') # Grayscale for the Archive Poet vibe
            img = ImageOps.autocontrast(img)
            images.append(img)
            
    if len(images) < 3:
        print("Not enough candidates for synthesis (3 required).")
        return False
        
    canvas_w = 1000
    canvas_h = 1500 # Vertical Manga Style
    canvas = Image.new('L', (canvas_w, canvas_h), color=255)
    
    # Layout: Top (50%), Middle Left (25%), Middle Right (25%), Bottom (25%)
    gap = 10
    
    # 1. Top Panel
    top_p = ImageOps.fit(images[0], (canvas_w-gap*2, 700))
    canvas.paste(top_p, (gap, gap))
    
    # 2. Middle Row
    mid_h = 400
    mid_w = (canvas_w // 2) - gap - gap//2
    mid1_p = ImageOps.fit(images[1], (mid_w, mid_h))
    mid2_p = ImageOps.fit(images[2], (mid_w, mid_h))
    canvas.paste(mid1_p, (gap, 700+gap*2))
    canvas.paste(mid2_p, (canvas_w//2 + gap//2, 700+gap*2))
    
    # 3. Bottom Panel (if 4th exists)
    if len(images) > 3:
        bot_p = ImageOps.fit(images[3], (canvas_w-gap*2, 350))
        canvas.paste(bot_p, (gap, 1100+gap*3))
    
    # Draw Borders & Stylization
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([0, 0, canvas_w, canvas_h], outline=0, width=5)
    
    # Save as Noir WebP
    out_path = os.path.join(NARRATIVE_DIR, output_filename)
    canvas.save(out_path, "WEBP", quality=90)
    print(f"Success -> {output_filename}")
    return True

def main():
    print("================================")
    print(" WEEKLY MANGA SYNTHESIZER v17")
    print("================================\n")
    state = load_state()
    candidates = state.get("manga_candidates", [])
    
    if len(candidates) < 3:
        print(f"Only {len(candidates)} candidates. Waiting for the full weekly flow.")
        return
        
    out_name = f"manga_syn_week_{int(time.time())}.webp"
    if create_manga_collage(candidates[:4], out_name):
        caption = "[ARCHIVE ENTRY] WEEKLY SYNTHESIS: WILL & HEART.\nThree moments, zerschnitten und neu zusammengesetzt.\nDer Künstler ist nicht mehr Beobachter, sondern Teil der Frequenz."
        
        new_asset = {
            "id": f"manga_{int(time.time())}",
            "name": out_name,
            "professional_name": "Weekly Synthesis: Will & Heart",
            "url": f"../Portfolio_Content/Live_Website/Narrative/{out_name}",
            "poet_caption": caption
        }
        update_js_data(new_asset, "Narrative & Philosophy")
        
        # Partially clear candidates but keep some flow
        state["manga_candidates"] = candidates[3:]
        save_state(state)

if __name__ == "__main__":
    main()
