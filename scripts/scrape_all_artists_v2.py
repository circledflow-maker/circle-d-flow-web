import gdown
import json
import requests
import re
import html

# The 25 IDs provided by the user
gdrive_ids = [
    "1crgVRzjOIedbtf1RrgFCRzQaYMIciCv5",
    "1Pf6Fp6LF63nuBTB0wv3qH9EQzPS4AUWF",
    "18XtQbCY1pyYVANRqf2OX4-ODi4rJXr9k",
    "1TBAiImBCui1VHSft2JAodvcXoqCAKoYO",
    "1kGdpPY1uulIgkN9q8gI0VhYHeamjrWZo",
    "1PQX3fASvyMeeaqZX1SZovluFRRTqRyYw",
    "1i06xuswoy75Hhqgg2BhNmLyD0jKT6YKH",
    "1pgpFcKB5Jv9fb8R3iFE5IOpV-uyou5gz",
    "1gntd-LvGXMN3jOsiifqPzdfCVGKhsGzs",
    "186A9Wuqq9-DfADfWQtLp4Cih2FEWWGmY",
    "17vW_TYS4wthvPQJkzcfBbC7MmDz7FSF-",
    "1oqp9ZjJ851X8KzWEtsb3md5JM4dIuNqd",
    "1XKU7lVBpozSlWsT3JAMUP6VS2vnUYVZH",
    "1zQirr9syKBRZRz7pOB4Bk2V6M5VddkmH",
    "1xvfdDsUA8s8C_J0iHiPfuaPfvUqt5UlJ",
    "1iLgoxnGgjy3VAkU1DD1gVZcpPwFLGzWB",
    "1h3rkbrzvz_bMdNknX3rfxo1ElRP870eg",
    "1tqqsLvCDCqTopZZXCI5Sz_EA_IOucZQ_",
    "1sqF3XgJsgIeimREnm5eblsKC_tRwsq0S",
    "10AReatvo2twiQrfJm_MQ9LaDTiBlNpH_",
    "1IJccVePiniN1YP0znpH_XT0i0eqyASk-",
    "11Wr8HkAXSHewNxfsoclMCrOQHgANuQ-l",
    "1zZMuDk_yi0J6GDHXID7bhT4GQiKhdqGR",
    "1gry2WEiLBXWFOMxFyS3CuqFv2UvJas45",
    "1noZs793lQIPZk540TkwY47fGcyrA8-Ly"
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
        
        selected_files = files[:11]
        
        # We need a robust ID for the HTML
        clean_id = re.sub(r'[^a-zA-Z0-9]', '_', folder_name).lower()
        
        akademie_data.append({
            "name": folder_name,
            "id": clean_id,
            "gdriveFolder": gid,
            "files": selected_files
        })
        print(f"  -> Found {len(selected_files)} valid media files.")
    except Exception as e:
        print(f"  -> Failed: {str(e)}")
        clean_id = re.sub(r'[^a-zA-Z0-9]', '_', folder_name).lower()
        akademie_data.append({
            "name": folder_name,
            "id": clean_id,
            "gdriveFolder": gid,
            "files": []
        })

js_content = f"const AkademieData = {json.dumps(akademie_data, indent=4)};\n\nif (typeof window !== 'undefined') {{\n    window.AkademieData = AkademieData;\n}}\nif (typeof module !== 'undefined' && module.exports) {{\n    module.exports = AkademieData;\n}}\n"

with open("D:/circle-d-flow-web/js/data/akademie_data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("akademie_data.js successfully written!")
