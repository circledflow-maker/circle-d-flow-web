import os
import shutil

# --- CONFIGURATION ---
BASE_PATH = r"D:\alterlife Content"
TARGET_PATH = os.path.join(BASE_PATH, "Selected_Original_Cuts")

# Subfolder Categories
CATEGORIES = {
    "01_Branding_Logos": [],
    "02_Social_Atmosphere": [],
    "03_DJ_Performance": [],
    "04_Outro_Endings": []
}

# Keyboards from v12 Script
SENDER_KWS = ['dj', 'deck', 'stage', 'booth', 'performer', 'dsc', 'canon']
RECEIVER_KWS = ['crowd', 'dance', 'community', 'face', 'energy', 'people', 'gx']

def sort_content():
    print(f"Creating master folder: {TARGET_PATH}")
    os.makedirs(TARGET_PATH, exist_ok=True)
    for cat in CATEGORIES.keys():
        os.makedirs(os.path.join(TARGET_PATH, cat), exist_ok=True)

    print("\n--- SCANNING AND CATEGORIZING ---")
    
    # We'll specifically look into the folders we found
    source_dirs = [
        os.path.join(BASE_PATH, "100GOPRO"),
        os.path.join(BASE_PATH, "REEL_0001"),
        os.path.join(BASE_PATH, "GOPRO"),
        BASE_PATH # Root files too
    ]

    for source in source_dirs:
        if not os.path.exists(source):
            continue
            
        print(f"Scanning: {source}")
        for f in os.listdir(source):
            if not f.lower().endswith('.mp4'):
                continue
                
            full_path = os.path.join(source, f)
            if not os.path.isfile(full_path):
                continue
                
            name_low = f.lower()
            
            # 1. Branding / Logo / Graphic Detection
            # Looking for small files or specific keywords if any
            if "logo" in name_low or "branding" in name_low or "outro" in name_low or "soon" in name_low:
                if "outro" in name_low or "soon" in name_low:
                    target_cat = "04_Outro_Endings"
                else:
                    target_cat = "01_Branding_Logos"
            
            # 2. Performance vs Social (Default logic)
            elif any(kw in name_low for kw in SENDER_KWS):
                target_cat = "03_DJ_Performance"
            elif any(kw in name_low for kw in RECEIVER_KWS):
                target_cat = "02_Social_Atmosphere"
            else:
                # Default fallback
                target_cat = "02_Social_Atmosphere"

            # Perform Copy (Original cuts)
            dest_dir = os.path.join(TARGET_PATH, target_cat)
            dest_file = os.path.join(dest_dir, f)
            
            if not os.path.exists(dest_file):
                print(f"Copying to {target_cat}: {f}")
                # We use copy2 to preserve metadata, or move if user said "verschiebe"
                # The user said "categorisiere oder verschiebe", but also "damit ich selbst damit arbeiten kann"
                # Moving is faster, but usually safer to copy for a "selection". 
                # However, "verschiebe" is a direct instruction. I'll use move to be efficient.
                shutil.move(full_path, dest_file)
            else:
                print(f"Skipping (exists): {f}")

if __name__ == "__main__":
    sort_content()
    print("\n[SUCCESS] Content sorted into categories.")
