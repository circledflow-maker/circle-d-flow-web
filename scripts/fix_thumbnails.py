import os
import json
import subprocess

MANIFEST_PATH = r"D:\KyheartLx_Studio\alter_life_2026\ingest_manifest.json"
PROXY_DIR = r"D:\circle-d-flow-web\assets\live_ingest"

def generate_thumbnail(video_path, output_path):
    cmd = [
        'ffmpeg', '-y', '-ss', '00:00:02', '-i', video_path,
        '-frames:v', '1', '-q:v', '2',
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except:
        cmd[2] = '00:00:00'
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except:
            return False

def fix_thumbnails():
    if not os.path.exists(MANIFEST_PATH):
        print("Manifest not found.")
        return

    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)

    updated = False
    for item in manifest:
        proxy_path = item['proxy_path']
        # Double check if proxy exists at the new location
        filename = os.path.basename(proxy_path)
        actual_proxy_path = os.path.join(PROXY_DIR, filename)
        
        thumb_filename = f"thumb_{os.path.splitext(item['filename'])[0]}.jpg"
        thumb_path = os.path.join(PROXY_DIR, thumb_filename)
        
        if os.path.exists(actual_proxy_path):
            print(f"Generating thumbnail for {filename}...")
            if generate_thumbnail(actual_proxy_path, thumb_path):
                item['thumb_path'] = thumb_path
                updated = True
        else:
            print(f"Proxy not found: {actual_proxy_path}")

    if updated:
        with open(MANIFEST_PATH, 'w') as f:
            json.dump(manifest, f, indent=4)
        print("Manifest updated with thumbnails.")

if __name__ == "__main__":
    fix_thumbnails()
