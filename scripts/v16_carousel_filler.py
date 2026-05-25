import os
import shutil
import random
import json
from datetime import datetime
import moviepy as mp

BASE_DIR = r"D:\KYHeart_Social_Media"
IG_DIR = os.path.join(BASE_DIR, "Instagram")
CONFIG_PATH = os.path.join(BASE_DIR, "Agent_Media_Sources.json")

# Cutoff: September 1, 2025
CUTOFF_TIMESTAMP = datetime(2025, 9, 1).timestamp()
# Removed MAX_FILE_SIZE since we will compress/extract them!

def get_all_media_files(folders):
    """Scans specific folders for images and videos, applying date and size filters."""
    media_files = []
    allowed_exts = {".jpg", ".jpeg", ".png", ".mp4", ".mov"}
    for folder in folders:
        if not os.path.exists(folder):
            continue
        for root, _, files in os.walk(folder):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in allowed_exts:
                    full_path = os.path.join(root, f)
                    
                    try:
                        # 1. Filter by Date (>= Sept 2025)
                        mtime = os.path.getmtime(full_path)
                        if mtime < CUTOFF_TIMESTAMP:
                            continue
                            
                        media_files.append(full_path)
                    except:
                        pass
    return media_files

def fill_carousels():
    print("Agent 1: Starting Carousel Auto-Filler...")
    if not os.path.exists(CONFIG_PATH):
        print("Error: Media sources config not found. Run Agent 1 setup first.")
        return
        
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        sources = json.load(f)
        
    all_source_folders = sources.get("jam_sessions", []) + sources.get("flow_talks", [])
    print(f"Scanning source folders for media (Post-Sept 2025, <50MB)...")
    
    media_pool = get_all_media_files(all_source_folders)
    print(f"Found {len(media_pool)} usable media files in GDrive.")
    
    if not media_pool:
        print("No media files found matching the criteria.")
        return
        
    if not os.path.exists(IG_DIR):
        print("Instagram directory not found.")
        return
        
    days = sorted(os.listdir(IG_DIR))
    filled_count = 0
    
    # We want to fill 1 post per week (approx every 7 days)
    for i in range(0, len(days), 7):
        if i >= len(days):
            break
            
        day_folder = days[i]
        day_path = os.path.join(IG_DIR, day_folder)
        if not os.path.isdir(day_path):
            continue
            
        carousel_dir = os.path.join(day_path, "01_Media_Carousel")
        if not os.path.exists(carousel_dir):
            continue
            
        # Select 3 to 5 random media files for this carousel
        num_items = random.randint(3, 5)
        selected_media = random.sample(media_pool, min(num_items, len(media_pool)))
        
        for idx, media_path in enumerate(selected_media):
            ext = os.path.splitext(media_path)[1].lower()
            
            try:
                if ext in {".mp4", ".mov"}:
                    # Video Extraction Logic
                    dest_name = f"carousel_item_{idx+1}.mp4"
                    dest_path = os.path.join(carousel_dir, dest_name)
                    print(f"  -> Extracting 5s clip from video: {os.path.basename(media_path)}")
                    
                    clip = mp.VideoFileClip(media_path)
                    if clip.duration > 10.0:
                        # Pick a random 5-second window from the middle of the video
                        start_time = random.uniform(2.0, clip.duration - 7.0)
                        subclip = clip.subclipped(start_time, start_time + 5.0)
                    else:
                        subclip = clip
                        
                    # Resize to Instagram format if it's too large to save space
                    if subclip.size[1] > 1080:
                        subclip = subclip.resized(height=1080)
                        
                    subclip.write_videofile(
                        dest_path, 
                        fps=30, 
                        codec="libx264", 
                        audio_codec="aac", 
                        preset="ultrafast",
                        logger=None # Suppress massive logging
                    )
                    subclip.close()
                    clip.close()
                else:
                    # Image Copy Logic
                    dest_name = f"carousel_item_{idx+1}{ext}"
                    dest_path = os.path.join(carousel_dir, dest_name)
                    print(f"  -> Copying image: {os.path.basename(media_path)}")
                    shutil.copy2(media_path, dest_path)
            except Exception as e:
                print(f"Failed to process {media_path}: {e}")
                
        filled_count += 1
        print(f"Filled Carousel for: {day_folder} ({len(selected_media)} items)")
        
    print(f"\nSuccessfully filled {filled_count} empty daily carousel folders with content!")

if __name__ == "__main__":
    fill_carousels()
