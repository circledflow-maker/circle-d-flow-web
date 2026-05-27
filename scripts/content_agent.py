import os
import shutil
import glob
import random
from pathlib import Path

def setup_daily_folders(base_dir, days=30):
    """Creates the 30 daily folders for Instagram content."""
    daily_folders = []
    for i in range(1, days + 1):
        folder_path = os.path.join(base_dir, f"Day_{i:02d}")
        os.makedirs(folder_path, exist_ok=True)
        daily_folders.append(folder_path)
    return daily_folders

def scan_for_content(source_dirs):
    """Scans the source directories for media files."""
    media_files = []
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.mp4', '*.mov']
    
    for src in source_dirs:
        if not os.path.exists(src):
            continue
        for ext in extensions:
            # Using rglob to recursively find files if using pathlib, or glob with recursive=True
            for file_path in glob.glob(os.path.join(src, '**', ext), recursive=True):
                media_files.append(file_path)
                
    return media_files

def distribute_content(media_files, daily_folders):
    """Distributes media into daily folders using a simulated algorithm."""
    if not media_files:
        print("No media files found to distribute.")
        return

    # Shuffle to simulate an 'algorithm' mixing content types
    random.shuffle(media_files)
    
    files_per_day = max(1, len(media_files) // len(daily_folders))
    
    current_file_idx = 0
    for day_folder in daily_folders:
        day_files = media_files[current_file_idx:current_file_idx + files_per_day]
        current_file_idx += files_per_day
        
        # Write a content manifest for the day
        manifest_path = os.path.join(day_folder, 'content_manifest.txt')
        with open(manifest_path, 'w', encoding='utf-8') as f:
            f.write(f"Content for {os.path.basename(day_folder)}\n")
            f.write("Categories: Artist, Musicant, Creator, Energy Transformer, Multi Artist, Designer, Painter, was isch vegas\n\n")
            
            for file in day_files:
                # Copy file to daily folder
                try:
                    dest_file = os.path.join(day_folder, os.path.basename(file))
                    if not os.path.exists(dest_file):
                        shutil.copy2(file, dest_file)
                    f.write(f"Categorized File: {os.path.basename(file)}\n")
                except Exception as e:
                    print(f"Error copying {file}: {e}")

def main():
    print("🤖 Starting Wu Wei Content Agent...")
    
    # Base directory for the 30-day pipeline
    pipeline_dir = "D:\\circle-d-flow-web\\Pipeline_Ready_to_Publish"
    os.makedirs(pipeline_dir, exist_ok=True)
    
    # 1. Setup Daily Folders
    daily_folders = setup_daily_folders(pipeline_dir, days=30)
    print(f"✅ Prepared {len(daily_folders)} daily folders in {pipeline_dir}")
    
    # 2. Define sources: Google Drive, Lightroom, D: Drive
    source_dirs = [
        "G:\\My Drive",  # Placeholder for Google Drive
        "D:\\Lightroom", # Placeholder for Lightroom
        "D:\\Portfolio_Content" # Current known folder
    ]
    
    # 3. Scan for Content
    print("🔍 Scanning sources for content...")
    media_files = scan_for_content(source_dirs)
    print(f"📸 Found {len(media_files)} media files.")
    
    # 4. Categorize and Distribute
    print("🧠 Categorizing and distributing content into Instagram carousel logic...")
    distribute_content(media_files, daily_folders)
    
    print("✅ Wu Wei Content Agent finished! Content is ready for posting.")

if __name__ == "__main__":
    main()
