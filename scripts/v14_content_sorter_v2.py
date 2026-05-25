import os
import shutil

# --- CONFIGURATION ---
BASE_PATH = r"D:\alterlife Content"
TARGET_PATH = os.path.join(BASE_PATH, "Selected_Original_Cuts")

# Subfolder Categories
CATEGORIES = {
    "01_Branding_Graphics": [],
    "02_Social_Atmosphere": [],
    "03_DJ_Performance": [],
    "04_Photography": [],
    "05_Master_Audio": []
}

# Keyboards from v12 Script + Refined Logic
SENDER_KWS = ['dj', 'deck', 'stage', 'booth', 'performer', 'dsc', 'canon', 'nikon', 'nd850', 'nz502']
RECEIVER_KWS = ['crowd', 'dance', 'community', 'face', 'energy', 'people', 'gx']

# Specific targets from visual identification
BRANDING_FILES = ['gx010169.mp4', 'gx010170.mp4', 'a_0001c624a260321_184528qo_canon.mp4']

def sort_content():
    print(f"Creating master folder sequence: {TARGET_PATH}")
    os.makedirs(TARGET_PATH, exist_ok=True)
    for cat in CATEGORIES.keys():
        os.makedirs(os.path.join(TARGET_PATH, cat), exist_ok=True)

    print("\n--- SCANNING AND RE-CATEGORIZING ---")
    
    # We'll specifically look into the folders we found
    source_dirs = [
        os.path.join(BASE_PATH, "100GOPRO"),
        os.path.join(BASE_PATH, "REEL_0001"),
        os.path.join(BASE_PATH, "GOPRO"),
        os.path.join(BASE_PATH, "Hope part 1"),
        os.path.join(BASE_PATH, "Audio Sets"),
        BASE_PATH # Root files too
    ]

    # Also scan previously sorted files in case we want to move them to 'Graphics'
    for cat in ["01_Branding_Logos", "02_Social_Atmosphere", "03_DJ_Performance", "04_Outro_Endings"]:
        old_cat_path = os.path.join(TARGET_PATH, cat)
        if os.path.exists(old_cat_path):
            source_dirs.append(old_cat_path)

    for source in source_dirs:
        if not os.path.exists(source):
            continue
            
        print(f"Scanning: {source}")
        for f in os.listdir(source):
            name_low = f.lower()
            full_path = os.path.join(source, f)
            
            if not os.path.isfile(full_path):
                continue
            
            target_cat = None
            
            # 1. Branding / Logo / Graphic Detection (Explicit list)
            if name_low in BRANDING_FILES or "logo" in name_low or "branding" in name_low or "outro" in name_low:
                target_cat = "01_Branding_Graphics"
            
            # 2. Audio Master Sets
            elif name_low.endswith('.wav'):
                target_cat = "05_Master_Audio"
                
            # 3. Photography
            elif name_low.endswith('.jpg') or name_low.endswith('.jpeg'):
                target_cat = "04_Photography"
            
            # 4. Performance vs Social (Default logic for videos)
            elif name_low.endswith('.mp4') or name_low.endswith('.mov'):
                if any(kw in name_low for kw in SENDER_KWS):
                    target_cat = "03_DJ_Performance"
                elif any(kw in name_low for kw in RECEIVER_KWS):
                    target_cat = "02_Social_Atmosphere"
                else:
                    target_cat = "02_Social_Atmosphere"

            if target_cat:
                dest_dir = os.path.join(TARGET_PATH, target_cat)
                dest_file = os.path.join(dest_dir, f)
                
                # Check if it's already there to avoid recursion errors if scanning TARGET_PATH
                if full_path == dest_file:
                    continue

                print(f"Moving to {target_cat}: {f}")
                try:
                    # Use move (shutil.move handles cross-device if needed, though here stays on D:)
                    if os.path.exists(dest_file):
                        # Avoid collisions
                        base, ext = os.path.splitext(f)
                        dest_file = os.path.join(dest_dir, f"{base}_alt{ext}")
                    
                    shutil.move(full_path, dest_file)
                except Exception as e:
                    print(f"Error moving {f}: {e}")

    # Cleanup old empty folders if they were renamed
    old_folders = ["01_Branding_Logos", "04_Outro_Endings"]
    for old in old_folders:
        old_path = os.path.join(TARGET_PATH, old)
        if os.path.exists(old_path) and not os.listdir(old_path):
            os.rmdir(old_path)

if __name__ == "__main__":
    sort_content()
    print("\n[SUCCESS] Content sorted into 5 categorized selection folders.")
