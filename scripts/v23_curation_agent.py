import os
import shutil
import datetime
from PIL import Image, ImageOps, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

class PortraitCurationAgent:
    def __init__(self, rui_roots, indian_roots, output_base):
        self.rui_roots = rui_roots
        self.indian_roots = indian_roots
        self.out_rui = os.path.join(output_base, "Tag_Mit_Rui_Portraits")
        self.out_indian = os.path.join(output_base, "Indian_Festival_Portraits")
        
        os.makedirs(self.out_rui, exist_ok=True)
        os.makedirs(self.out_indian, exist_ok=True)

    def scan_and_select(self, roots, output_dir, max_photos=30):
        print(f"[*] Scanning for photos to put in {output_dir}...")
        photos = []
        for root in roots:
            if not os.path.exists(root): continue
            for r, d, files in os.walk(root):
                for f in files:
                    if f.lower().endswith(('.jpg', '.jpeg')):
                        path = os.path.join(r, f)
                        try:
                            # Check orientation
                            with Image.open(path) as img:
                                img = ImageOps.exif_transpose(img)
                                w, h = img.size
                                if h > w: # Portrait
                                    photos.append({'path': path, 'time': os.path.getmtime(path)})
                        except Exception as e:
                            print(f"[!] Error processing {path}: {e}")
                            
        photos.sort(key=lambda x: x['time'])
        print(f"[+] Found {len(photos)} portrait photos. Selecting {min(max_photos, len(photos))}...")
        
        if not photos: return

        # Select a diverse subset chronologically
        step = max(1, len(photos) // max_photos)
        selected = photos[::step][:max_photos]
        
        for i, photo in enumerate(selected):
            ext = os.path.splitext(photo['path'])[1]
            dest = os.path.join(output_dir, f"Portrait_{i:03d}{ext}")
            shutil.copy2(photo['path'], dest)
        print(f"[+] Saved {len(selected)} photos to {output_dir}")

    def run(self):
        print("=== Starting Portrait Curation ===")
        self.scan_and_select(self.rui_roots, self.out_rui, max_photos=20)
        self.scan_and_select(self.indian_roots, self.out_indian, max_photos=20)
        print("=== Curation Complete ===")

if __name__ == "__main__":
    RUI_ROOTS = [r"D:\tag mit rui\105NZ502"]
    INDIAN_ROOTS = [r"d:\circle-d-flow-web\00_INBOX_RAW_ENERGY\Indian DayFestival"]
    OUT_BASE = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Ready_To_Post"
    
    agent = PortraitCurationAgent(RUI_ROOTS, INDIAN_ROOTS, OUT_BASE)
    agent.run()
