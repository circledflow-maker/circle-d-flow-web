import json
import os

MANIFEST_PATH = r"D:\KyheartLx_Studio\alter_life_2026\ingest_manifest.json"
PROJECT_ROOT = r"D:\KyheartLx_Studio\alter_life_2026\03_DaVinci_Projects"
PORTFOLIO_DATA_PATH = r"d:\circle-d-flow-web\js\data\portfolio_data.js"

def update_portfolio():
    if not os.path.exists(MANIFEST_PATH):
        print("Manifest not found.")
        return

    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)

    # Convert manifest items to Portfolio format
    ingest_items = []
    for item in manifest:
        file_name = os.path.basename(item['proxy_path'])
        web_path = f"../assets/live_ingest/{file_name}"
        
        # Thumbnail Mapping
        thumb_url = ""
        if 'thumb_path' in item:
            thumb_name = os.path.basename(item['thumb_path'])
            thumb_url = f"../assets/live_ingest/{thumb_name}"
        
        ingest_items.append({
            "id": f"local_proxy_{item['filename']}",
            "name": item['filename'],
            "professional_name": f"[LIVE] {item['filename']}",
            "url": web_path,
            "thumb_url": thumb_url, 
            "category": "RAW Ingest: alter.life"
        })

    # Scan for Finished Aftermovies
    final_items = []
    finals_dir = r"D:\KyheartLx_Studio\alter_life_2026\05_Ready_to_Post"
    if os.path.exists(finals_dir):
        for f in os.listdir(finals_dir):
            if f.lower().endswith(('.mp4', '.mov')):
                final_items.append({
                    "id": f"final_{f}",
                    "name": f,
                    "professional_name": f"[FINAL] {f}",
                    "url": f"../assets/studio/alter_life_2026/05_Ready_to_Post/{f}",
                    "thumb_url": "", # Thumbnails for finals would be nice too
                    "category": "Aftermovies"
                })

    # Read existing portfolio data
    with open(PORTFOLIO_DATA_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        
    start_idx = content.find('{')
    end_idx = content.rfind('}') + 1
    json_data = json.loads(content[start_idx:end_idx])

    # Scan for XML Comparison Projects AND Rendered Results
    comparison_items = []
    xml_dir = PROJECT_ROOT
    finals_dir = r"D:\KyheartLx_Studio\alter_life_2026\05_Ready_to_Post"
    
    # Define the 6 comparison styles for mapping
    styles = ["Signature_Anime", "Trend_Energy", "Cinematic_Story", "Vertical", "Stickers", "Vlog", "SplitScreen_Alterlife"]
    
    # 1. First, check for rendered MP4s in Ready_to_Post that belong to the Lab
    if os.path.exists(finals_dir):
        for f in os.listdir(finals_dir):
            if not f.lower().endswith(('.mp4', '.mov')): continue
            
            # Check if this file name belongs to one of our comparison styles
            style_match = next((s for s in styles if s.lower() in f.lower()), None)
            
            if style_match:
                import shutil
                web_asset_dir = r"D:\circle-d-flow-web\assets\studio\alter_life_2026\05_Ready_to_Post"
                os.makedirs(web_asset_dir, exist_ok=True)
                src_path = os.path.join(finals_dir, f)
                dest_path = os.path.join(web_asset_dir, f)
                if not os.path.exists(dest_path) or os.path.getmtime(src_path) > os.path.getmtime(dest_path):
                    try:
                        shutil.copy2(src_path, dest_path)
                    except:
                        pass
                
                comparison_items.append({
                    "id": f"lab_render_{f}",
                    "name": f,
                    "professional_name": f"[AI RESULT] {style_match.replace('_', ' ')}",
                    "url": f"../assets/studio/alter_life_2026/05_Ready_to_Post/{f}",
                    "video_url": f"../assets/studio/alter_life_2026/05_Ready_to_Post/{f}",
                    "thumb_url": "", # Will be generated or uses logo
                    "category": "AI Comparison Lab",
                    "description": f"Rendered Output of the {style_match} AI Style."
                })

    # 2. Then, check for XMLs (only add if MP4 doesn't exist for that style, to keep it clean)
    if os.path.exists(xml_dir):
        for f in os.listdir(xml_dir):
            if not f.lower().endswith('.xml'): continue
            
            # Prevent duplicates if the video is already rendered
            style_match = next((s for s in styles if s.lower() in f.lower()), None)
            video_exists = any(style_match.lower() in item['name'].lower() for item in comparison_items if style_match) if style_match else False
            
            if not video_exists:
                comparison_items.append({
                    "id": f"xml_{f}",
                    "name": f,
                    "professional_name": f"[AI PROJECT] {f.replace('.xml','')}",
                    "url": f"file:///{os.path.join(xml_dir, f).replace('\\','/')}",
                    "thumb_url": "../assets/ui/xml_icon.png", 
                    "category": "AI Comparison Lab",
                    "description": "Ready for DaVinci Import (File > Import > Timeline)"
                })

    # Read existing portfolio data
    with open(PORTFOLIO_DATA_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        
    start_idx = content.find('{')
    end_idx = content.rfind('}') + 1
    json_data = json.loads(content[start_idx:end_idx])

    # Inject or overwrite the categories
    json_data["RAW Ingest: alter.life"] = ingest_items
    
    # Filter final_items to exclude those already in the Comparison Lab
    distinct_finals = [f for f in final_items if f['id'] not in [c['id'] for c in comparison_items]]
    if distinct_finals:
        json_data["Aftermovies"] = distinct_finals
        
    if comparison_items:
        json_data["AI Comparison Lab"] = comparison_items

    # Write back
    new_content = "window.PortfolioData = " + json.dumps(json_data, indent=4) + ";"
    with open(PORTFOLIO_DATA_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Updated portfolio: {len(ingest_items)} Ingests, {len(final_items)} Finals, {len(comparison_items)} XMLs.")

if __name__ == "__main__":
    update_portfolio()
