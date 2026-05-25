import os
import json
import subprocess
import shutil

MANIFEST_PATH = r"D:\KyheartLx_Studio\alter_life_2026\ingest_manifest.json"
FFPROBE_PATH = r"C:\Users\user\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffprobe.exe"

def get_metadata(file_path):
    cmd = [
        FFPROBE_PATH, "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=avg_frame_rate,width,height,duration",
        "-of", "json", file_path
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        stream = data.get('streams', [{}])[0]
        
        # Parse FPS (e.g. "25/1" or "2997/100")
        fps_raw = stream.get('avg_frame_rate', '25/1')
        if '/' in fps_raw:
            num, den = fps_raw.split('/')
            fps = float(num) / float(den) if float(den) != 0 else 25.0
        else:
            fps = float(fps_raw)
            
        return {
            "fps": round(fps, 3),
            "width": stream.get('width'),
            "height": stream.get('height'),
            "duration": float(stream.get('duration', 0))
        }
    except Exception as e:
        print(f"Error probing {file_path}: {e}")
        return None

def scout_media():
    if not os.path.exists(MANIFEST_PATH):
        print("Manifest not found.")
        return

    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)

    print(f"--- Media Scout Agent v11: Analyzing {len(manifest)} items ---")
    
    updated = False
    for i, item in enumerate(manifest):
        # We check the proxy path (which I moved to web assets earlier)
        proxy_path = item.get('proxy_path')
        if not proxy_path or not os.path.exists(proxy_path):
            # Try to find it in the new web assets dir if the path is old
            filename = os.path.basename(proxy_path) if proxy_path else item['filename']
            alt_path = os.path.join(r"D:\circle-d-flow-web\assets\live_ingest", f"proxy_{filename}" if "proxy" not in filename else filename)
            if os.path.exists(alt_path):
                proxy_path = alt_path
                item['proxy_path'] = alt_path # Update manifest path
                updated = True
        
        if proxy_path and os.path.exists(proxy_path):
            if "fps" not in item:
                meta = get_metadata(proxy_path)
                if meta:
                    item.update(meta)
                    print(f"[{i+1}] {item['filename']}: {meta['fps']}fps, {meta['duration']:.1f}s")
                    updated = True
        else:
            print(f"[{i+1}] Warning: Proxy missing for {item['filename']}")

    if updated:
        with open(MANIFEST_PATH, 'w') as f:
            json.dump(manifest, f, indent=4)
        print("Manifest enhanced with technical intelligence.")

if __name__ == "__main__":
    scout_media()
