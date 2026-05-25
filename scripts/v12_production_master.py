import os
import subprocess
import json
import datetime
import cv2
import shutil
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, ImageFile
import hashlib

ImageFile.LOAD_TRUNCATED_IMAGES = True

try:
    import mediapipe as mp
    from mediapipe.python.solutions import face_detection as mp_face_detection
except ImportError:
    mp_face_detection = None

class VideoProductionAgent:
    def __init__(self, source_paths, output_dir, music_path, reference_dir=None):
        self.source_paths = source_paths
        self.output_dir = output_dir
        self.music_path = music_path
        self.clips = []
        self.photos = []
        os.makedirs(output_dir, exist_ok=True)

    def get_hash(self, filepath):
        """Simple hash to detect duplicates by content."""
        hasher = hashlib.md5()
        with open(filepath, 'rb') as f:
            buf = f.read(65536)
            hasher.update(buf)
        return hasher.hexdigest()

    def scan_media(self):
        print(f"[*] Scanning paths: {self.source_paths}")
        seen_hashes = set()
        for src in self.source_paths:
            if not os.path.exists(src):
                print(f"[!] Path not found: {src}")
                continue
            for root, dirs, files in os.walk(src):
                for f in files:
                    ext = f.lower()
                    path = os.path.join(root, f)
                    
                    # Skip system files and NEF if JPG exists
                    if ext.endswith('.nef'):
                        jpg_path = path.replace('.NEF', '.JPG').replace('.nef', '.jpg')
                        if os.path.exists(jpg_path): continue
                    
                    if ext.endswith(('.mov', '.mp4', '.jpg', '.jpeg', '.png')):
                        # Content-based deduplication
                        h = self.get_hash(path)
                        if h in seen_hashes:
                            print(f"[-] Skipping duplicate: {f}")
                            continue
                        seen_hashes.add(h)
                        
                        mtime = os.path.getmtime(path)
                        if ext.endswith(('.mov', '.mp4')):
                            self.clips.append({'path': path, 'type': 'video', 'time': mtime})
                        elif ext.endswith(('.jpg', '.jpeg', '.png')):
                            self.photos.append({'path': path, 'type': 'photo', 'time': mtime})
                            
        self.clips.sort(key=lambda x: x['time'])
        self.photos.sort(key=lambda x: x['time'])
        print(f"[+] Found {len(self.clips)} unique clips and {len(self.photos)} unique photos.")

    def enhance_and_rotate(self, photo_path, out_path):
        """Enhances photo and fixes rotation based on EXIF."""
        try:
            img = Image.open(photo_path)
            img = ImageOps.exif_transpose(img) # Automatic rotation based on EXIF
            
            # Color & Contrast
            img = ImageOps.autocontrast(img, cutoff=0.5)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(1.05)
            
            img.save(out_path, quality=90)
        except Exception as e:
            print(f"[!] Error processing photo {photo_path}: {e}")

    def select_instagram_carousel(self, count=10):
        print(f"[*] Creating Instagram Carousel folder with {count} images...")
        carousel_dir = os.path.join(self.output_dir, "IG_Carousel_Output")
        if os.path.exists(carousel_dir): shutil.rmtree(carousel_dir)
        os.makedirs(carousel_dir, exist_ok=True)
        
        if not self.photos:
            print("[!] No photos found for carousel.")
            return

        # Selection: Diverse indices
        indices = np.linspace(0, len(self.photos)-1, count, dtype=int)
        for i, idx in enumerate(indices):
            photo = self.photos[idx]
            name = f"Slide_{i+1:02d}_{os.path.basename(photo['path'])}"
            if not name.lower().endswith('.jpg'): name += ".jpg"
            self.enhance_and_rotate(photo['path'], os.path.join(carousel_dir, name))
        print(f"[+] Carousel ready at {carousel_dir}")

    def get_smart_crop_x(self, video_path):
        if not mp_face_detection: return 0.5
        cap = cv2.VideoCapture(video_path)
        ret, frame = cap.read()
        cap.release()
        if not ret: return 0.5
        with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
            results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if results.detections:
                bbox = results.detections[0].location_data.relative_bounding_box
                return bbox.xmin + bbox.width / 2
        return 0.5

    def process_asset(self, asset, out_path, format_type, duration=2.5):
        """Processes a single asset into a standardized segment."""
        if asset['type'] == 'video':
            cx = self.get_smart_crop_x(asset['path']) if format_type == 'portrait' else 0.5
            if format_type == 'portrait':
                # Portrait: 1080x1920
                vf = f"scale=-1:1920,crop=1080:1920:iw*{cx}-540:0,format=yuv420p,fps=25"
            else:
                # Landscape: 1920x1080
                vf = f"scale=1920:-1,crop=1920:1080,format=yuv420p,fps=25"
            
            # Use -ss 0.5 to skip potential startup lag
            cmd = ['ffmpeg', '-ss', '0.5', '-t', str(duration), '-i', asset['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '20', '-preset', 'ultrafast', '-an', '-y', out_path]
            subprocess.run(cmd, capture_output=True)
        else:
            tmp = out_path + ".rotated.jpg"
            self.enhance_and_rotate(asset['path'], tmp)
            if format_type == 'portrait':
                vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p,fps=25"
            else:
                vf = "split[main][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=40:40[bg_out];[main]scale=1920:1080:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=25"
            
            cmd = ['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '20', '-preset', 'ultrafast', '-an', '-y', out_path]
            subprocess.run(cmd, capture_output=True)
            if os.path.exists(tmp): os.remove(tmp)

    def render_aftermovie(self, name_prefix, format_type='portrait'):
        print(f"[*] Rendering {name_prefix} ({format_type.capitalize()})...")
        temp_dir = os.path.join(self.output_dir, f"temp_{name_prefix.lower()}_{format_type}")
        if os.path.exists(temp_dir): shutil.rmtree(temp_dir)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Select 20 clips and 10 photos
        clips_sel = self.clips[::max(1, len(self.clips)//20)][:20]
        photos_sel = self.photos[::max(1, len(self.photos)//10)][:10]
        
        interleaved = []
        for i in range(max(len(clips_sel), len(photos_sel))):
            if i < len(clips_sel): interleaved.append(clips_sel[i])
            if i < len(photos_sel): interleaved.append(photos_sel[i])
            
        processed = []
        total_duration = 0.0
        for i, asset in enumerate(interleaved):
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            duration = 2.0 if asset['type'] == 'video' else 1.5
            self.process_asset(asset, out, format_type, duration)
            if os.path.exists(out):
                processed.append(out)
                total_duration += duration

        if not processed:
            print("[!] No segments processed.")
            return

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"{name_prefix}_Aftermovie_{format_type.capitalize()}.mp4")
        
        # Audio mapping
        audio_args = ['-i', self.music_path] if os.path.exists(self.music_path) else []
        cmd = ['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path] + audio_args
        if audio_args:
            cmd += ['-map', '0:v', '-map', '1:a', '-shortest']
        cmd += ['-c:v', 'libx264', '-crf', '18', '-t', str(total_duration), '-y', final_out]
        
        subprocess.run(cmd, capture_output=True)
        print(f"[+] Finished: {final_out}")

if __name__ == "__main__":
    # 1. Rui Aftermovie
    RUI_SRC = [r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"]
    RUI_DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    RUI_MUSIC = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_V6_Audio.mp3"
    
    rui_agent = VideoProductionAgent(RUI_SRC, RUI_DEST, RUI_MUSIC)
    rui_agent.scan_media()
    rui_agent.render_aftermovie("Rui_Tag_Mit_Rui", 'portrait')
    rui_agent.render_aftermovie("Rui_Tag_Mit_Rui", 'landscape')
    
    # 2. Indian Day Festival
    IND_SRC = [r"d:\circle-d-flow-web\00_INBOX_RAW_ENERGY\Indian DayFestival"]
    IND_DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Indian_Festival"
    IND_MUSIC = r"d:\circle-d-flow-web\Music\qter-deelem edit 2 @256.mp3"
    
    ind_agent = VideoProductionAgent(IND_SRC, IND_DEST, IND_MUSIC)
    ind_agent.scan_media()
    ind_agent.select_instagram_carousel(10)
    ind_agent.render_aftermovie("Indian_Day_Festival", 'portrait')
