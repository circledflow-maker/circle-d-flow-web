import os
import io
import subprocess
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials

TOKEN_FILE = r'd:\circle-d-flow-web\token.json'
WORK_DIR = r'd:\circle-d-flow-web\scratch\vibe_video'
OUTPUT_FILE = r'd:\circle-d-flow-web\Assets\Community_Vibe_Reel.mp4'

os.makedirs(WORK_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

VIDEOS = {
    "1RmZuYi2gyVw9pONb9wwGMuB72VgDqgEn": "intro_jam.mp4",
    "15CP1hgrcXCcwVGGnTfbmjhMZG0zeMLQa": "amazing_jam.mp4",
    "1zrkLyUY9ZIBEQsvtj0Nxvy9EzjznVfhs": "sunday_jam.mp4",
    "1_GeGLS2kDzfTrRusUyLpp2NAeh2Vf4Uf": "art_jam.mp4",
    "1csrwBWx-3T4AOLbZTuW2OMEvRLEW-In6": "baptista_hempy.mp4"
}

def download_videos():
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)

    downloaded = []
    for vid, name in VIDEOS.items():
        filepath = os.path.join(WORK_DIR, name)
        if not os.path.exists(filepath):
            print(f"Downloading {name}...")
            request = service.files().get_media(fileId=vid)
            with open(filepath, 'wb') as fh:
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                    if status:
                        print(f"Download {name}: {int(status.progress() * 100)}%")
        else:
            print(f"{name} already downloaded.")
        downloaded.append(filepath)
    return downloaded

def process_videos(filepaths):
    print("Processing and compiling videos...")
    
    list_file = os.path.join(WORK_DIR, "files.txt")
    
    # Trim and format each video to 1080x1920 (Vertical for reel) or 1920x1080, let's use 1080x1920, 30fps
    processed_files = []
    for i, path in enumerate(filepaths):
        out_path = os.path.join(WORK_DIR, f"processed_{i}.mp4")
        if not os.path.exists(out_path):
            print(f"Formatting {path}...")
            # We trim 10 seconds starting from 00:00:05 to avoid blank starts
            # Scale and crop to 1080x1920, 30fps
            cmd = [
                'ffmpeg', '-y', '-ss', '00:00:05', '-i', path,
                '-t', '10', # 10 seconds duration
                '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
                '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
                '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
                out_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        processed_files.append(out_path)
    
    with open(list_file, 'w') as f:
        for p in processed_files:
            # Escape path for ffmpeg concat demuxer
            p_esc = p.replace('\\', '/')
            f.write(f"file '{p_esc}'\n")
            
    print("Concatenating into final reel...")
    cmd_concat = [
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', list_file,
        '-c', 'copy', OUTPUT_FILE
    ]
    subprocess.run(cmd_concat, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Final video generated: {OUTPUT_FILE}")

if __name__ == '__main__':
    files = download_videos()
    process_videos(files)
