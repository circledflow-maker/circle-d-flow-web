import gdown
import json
import requests
import re
import html
import random

# The 7 IDs provided by the user
gdrive_ids = [
    "1h3rkbrzvz_bMdNknX3rfxo1ElRP870eg", # Tiago Silver
    "1noZs793lQIPZk540TkwY47fGcyrA8-Ly", # soqhiejewels
    "1iLgoxnGgjy3VAkU1DD1gVZcpPwFLGzWB", # Sandu
    "1kGdpPY1uulIgkN9q8gI0VhYHeamjrWZo", # Irene 25 Birthday
    "1oqp9ZjJ851X8KzWEtsb3md5JM4dIuNqd", # KreativlonArt
    "1FQItgHRVSUoI3-iVzbobksPlmBZgK6sL", # C-Riz
    "1V3okQhtQgswdLz5zXtteC_qMo4wSH0Jc"  # naru the token
]

valid_exts = ['.jpg', '.jpeg', '.png', '.mp4', '.mov']
akademie_data = []

print("Starting to parse updated Google Drive folders...")

for gid in gdrive_ids:
    folder_name = f"Unknown_{gid}"
    try:
        req = requests.get(f'https://drive.google.com/drive/folders/{gid}?usp=drive_link', timeout=10)
        match = re.search(r'<title>(.*?)</title>', req.text)
        if match:
            raw_title = html.unescape(match.group(1))
            # Remove " - Google Drive" or similar
            folder_name = re.sub(r'\s*.\s*Google Drive$', '', raw_title).strip()
    except Exception as e:
        print(f"Could not fetch title for {gid}: {e}")

    print(f"Parsing {folder_name} ({gid})...")
    
    try:
        res = gdown.download_folder(id=gid, skip_download=True, quiet=True)
        files = []
        for f in res:
            if not f.id:
                continue
            lower_path = f.path.lower()
            if lower_path.endswith('.jpg') or lower_path.endswith('.jpeg') or lower_path.endswith('.png'):
                files.append({"id": f.id, "type": "image"})
            elif lower_path.endswith('.mp4') or lower_path.endswith('.mov'):
                files.append({"id": f.id, "type": "video"})
        
        # Randomize files and pick 13 to avoid similarities
        random.shuffle(files)
        selected_files = files[:13]
        
        # We need a robust ID for the HTML
        clean_id = re.sub(r'[^a-zA-Z0-9]', '_', folder_name).lower()
        
        if len(selected_files) > 0:
            akademie_data.append({
                "name": folder_name,
                "id": clean_id,
                "gdriveFolder": gid,
                "files": selected_files
            })
            print(f"  -> Found {len(selected_files)} valid media files. Added.")
        else:
            print(f"  -> Found 0 valid media files. SKIPPING folder.")
    except Exception as e:
        print(f"  -> Failed: {str(e)}")
        # Do not append empty folders on failure
        pass

js_content = f"const AkademieData = {json.dumps(akademie_data, indent=4)};\n\nif (typeof window !== 'undefined') {{\n    window.AkademieData = AkademieData;\n}}\nif (typeof module !== 'undefined' && module.exports) {{\n    module.exports = AkademieData;\n}}\n"

with open("D:/circle-d-flow-web/js/data/akademie_data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("akademie_data.js successfully written!")
