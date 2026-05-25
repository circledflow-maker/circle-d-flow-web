import os
import subprocess
import json
import time
import cv2
import shutil

# --- CONFIG ---
SOURCE_DIR = r"D:\alterlife Content"
PROJECT_ROOT = r"D:\KyheartLx_Studio\alter_life_2026"
WEB_PROXY_DIR = r"D:\circle-d-flow-web\assets\live_ingest"
EXCHANGE_DIR = os.path.join(PROJECT_ROOT, "04_AI_Cloud_Exchange")
COMMUNITY_DIR = os.path.join(EXCHANGE_DIR, "Community_Check")
MANIFEST_PATH = os.path.join(PROJECT_ROOT, "ingest_manifest.json")

os.makedirs(WEB_PROXY_DIR, exist_ok=True)
os.makedirs(COMMUNITY_DIR, exist_ok=True)

# Update the variable name used in the rest of the script
PROXY_DIR = os.path.join(PROJECT_ROOT, "02_Proxies")
os.makedirs(PROXY_DIR, exist_ok=True)

# Load Haar Cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def get_video_files(directory):
    valid_exts = ('.mp4', '.mov', '.avi', '.mkv', '.m4v')
    video_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(valid_exts):
                video_files.append(os.path.join(root, file))
    return video_files

def extract_portrait_candidate(video_path, filename):
    """
    Samples frames from video and saves one if a face is detected.
    Used for the Community Credits / Instagram Story workflow.
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0: fps = 25
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    # Sample every 2 seconds
    sample_interval = int(fps * 2)
    
    found_portrait = False
    for fno in range(0, total_frames, sample_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fno)
        ret, frame = cap.read()
        if not ret: break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) > 0:
            # We found a face! Save this frame.
            out_name = f"portrait_{filename}_{fno}.jpg"
            out_path = os.path.join(COMMUNITY_DIR, out_name)
            cv2.imwrite(out_path, frame)
            print(f"  [Scout] Captured portrait candidate: {out_name}")
            found_portrait = True
            break # Just one per clip for now to avoid spam
            
    cap.release()
    return found_portrait

def generate_proxy(video_path, output_path):
    """
    Generates a 1080p proxy using FFmpeg.
    """
    cmd = [
        'ffmpeg', '-y', '-i', video_path,
        '-vf', 'scale=1920:1080',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
        '-c:a', 'aac', '-b:a', '128k',
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception as e:
        print(f"  [Error] FFmpeg failed for {video_path}: {e}")
        return False

def generate_thumbnail(video_path, output_path):
    """
    Extracts a frame from the the 2-second mark (or start) as a thumbnail.
    """
    cmd = [
        'ffmpeg', '-y', '-ss', '00:00:02', '-i', video_path,
        '-frames:v', '1', '-q:v', '2',
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except:
        # Retry at 0 if 2s fails
        cmd[2] = '00:00:00'
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except:
            return False

def main():
    print("=== KyheartLx Ingest Engine v11 ===")
    videos = get_video_files(SOURCE_DIR)
    print(f"Found {len(videos)} video files in source.")
    
    manifest = []
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r') as f:
            manifest = json.load(f)
            
    processed_paths = {m['original_path'] for m in manifest}
    
    for i, v_path in enumerate(videos):
        filename = os.path.basename(v_path)
        proxy_filename = f"proxy_{filename}"
        if not proxy_filename.lower().endswith('.mp4'):
            proxy_filename = os.path.splitext(proxy_filename)[0] + ".mp4"
            
        proxy_path = os.path.join(PROXY_DIR, proxy_filename)
        thumb_filename = f"thumb_{os.path.splitext(filename)[0]}.jpg"
        thumb_path = os.path.join(PROXY_DIR, thumb_filename)

        # Force regeneration if physical proxy is missing!
        if v_path in processed_paths and os.path.exists(proxy_path):
            continue
        
        print(f"[{i+1}/{len(videos)}] Processing: {filename}")
        
        # 1. Proxy & Thumbnail Generation
        start_t = time.time()
        success = generate_proxy(v_path, proxy_path)
        if success:
            generate_thumbnail(proxy_path, thumb_path)
        end_t = time.time()
        
        if success:
            print(f"  [Proxy/Thumb] Done in {end_t - start_t:.1f}s")
            
            # 2. Portrait Scout (Face Detection)
            has_portrait = extract_portrait_candidate(v_path, filename)
            
            # 3. Update Manifest
            manifest.append({
                "original_path": v_path,
                "proxy_path": proxy_path,
                "thumb_path": thumb_path,
                "filename": filename,
                "has_portrait": has_portrait,
                "timestamp": time.time()
            })
            
            # Save manifest incrementally
            with open(MANIFEST_PATH, 'w') as f:
                json.dump(manifest, f, indent=4)
        else:
            print(f"  [Failed] Skipping {filename}")

    print("=== Ingest Complete ===")

if __name__ == "__main__":
    main()
