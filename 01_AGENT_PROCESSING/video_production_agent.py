import os
import subprocess
import json
import datetime
import cv2
import shutil
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, ImageFile
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

    def scan_media(self):
        print(f"[*] Scanning paths: {self.source_paths}")
        seen = set()
        for src in self.source_paths:
            if not os.path.exists(src): continue
            for root, dirs, files in os.walk(src):
                for f in files:
                    ext = f.lower()
                    path = os.path.join(root, f)
                    if path in seen: continue
                    seen.add(path)
                    mtime = os.path.getmtime(path)
                    if ext.endswith(('.mov', '.mp4')):
                        self.clips.append({'path': path, 'type': 'video', 'time': mtime})
                    elif ext.endswith(('.jpg', '.jpeg', '.png')):
                        self.photos.append({'path': path, 'type': 'photo', 'time': mtime})
        self.clips.sort(key=lambda x: x['time'])
        self.photos.sort(key=lambda x: x['time'])
        print(f"[*] Found {len(self.clips)} unique clips and {len(self.photos)} unique photos.")

    def enhance_and_rotate(self, photo_path, out_path):
        """Enhances photo and fixes rotation based on EXIF."""
        img = Image.open(photo_path)
        img = ImageOps.exif_transpose(img) # Automatic rotation based on EXIF
        
        # Color & Contrast
        img = ImageOps.autocontrast(img, cutoff=0.5)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.25)
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.1)
        
        img.save(out_path, quality=95)

    def select_instagram_carousel(self, count=10):
        print(f"[*] Selecting top {count} images for Instagram Carousel...")
        carousel_dir = os.path.join(self.output_dir, "Instagram_Carousel")
        os.makedirs(carousel_dir, exist_ok=True)
        
        # Selection: Diverse indices from the timeline
        indices = np.linspace(0, len(self.photos)-1, count, dtype=int)
        for i, idx in enumerate(indices):
            photo = self.photos[idx]
            name = f"Carousel_{i+1:02d}_{os.path.basename(photo['path'])}"
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

    def process_asset(self, asset, out_path, format_type, duration=2.2):
        if asset['type'] == 'video':
            cx = self.get_smart_crop_x(asset['path']) if format_type == 'portrait' else 0.5
            if format_type == 'portrait':
                vf = f"scale=-1:1920,crop=1080:1920:iw*{cx}-540:0,format=yuv420p,fps=25"
            else:
                vf = f"scale=1920:-1,crop=1920:1080,format=yuv420p,fps=25"
            subprocess.run(['ffmpeg', '-ss', '0.5', '-t', str(duration), '-i', asset['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', '-an', '-y', out_path], capture_output=True)
        else:
            tmp = out_path + ".rotated.jpg"
            self.enhance_and_rotate(asset['path'], tmp)
            if format_type == 'portrait':
                vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p,fps=25"
            else:
                vf = "split[main][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=40:40[bg_out];[main]scale=1920:1080:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=25"
            subprocess.run(['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', '-an', '-y', out_path], capture_output=True)
            if os.path.exists(tmp): os.remove(tmp)

    def render_aftermovie(self, name_prefix, format_type='portrait'):
        print(f"[*] Rendering {name_prefix} ({format_type.capitalize()})...")
        temp_dir = os.path.join(self.output_dir, f"temp_{name_prefix.lower()}_{format_type}")
        if os.path.exists(temp_dir): shutil.rmtree(temp_dir)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Sample clips and photos for a 60-90s aftermovie
        clips_sel = self.clips[::max(1, len(self.clips)//30)][:30]
        photos_sel = self.photos[::max(1, len(self.photos)//15)][:15]
        
        interleaved = []
        for i in range(max(len(clips_sel), len(photos_sel))):
            if i < len(clips_sel): interleaved.append(clips_sel[i])
            if i < len(photos_sel): interleaved.append(photos_sel[i])
            
        processed = []
        total_duration = 0.0
        for i, asset in enumerate(interleaved):
            out = os.path.join(temp_dir, f"seg_{i}.mp4")
            duration = 2.0 if asset['type'] == 'video' else 1.5
            self.process_asset(asset, out, format_type, duration)
            if os.path.exists(out):
                processed.append(out)
                total_duration += duration

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"{name_prefix}_Aftermovie_{format_type.capitalize()}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.music_path, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(total_duration), '-y', final_out])
        print(f"[+] Finished: {final_out}")

if __name__ == "__main__":
    # 1. Finalize Tag mit Rui
    RUI_SRC = [r"D:\tag mit rui", r"D:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped"]
    RUI_DEST = r"D:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    RUI_MUSIC = r"D:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_V6_Audio.mp3"
    
    rui_agent = VideoProductionAgent(RUI_SRC, RUI_DEST, RUI_MUSIC)
    rui_agent.scan_media()
    # No changes needed if already correct, but this ensures V18 status
    rui_agent.render_aftermovie("Rui_V18_Final", 'portrait')
    
    # 2. Indian Festival (Check if files exist)
    IND_SRC = [r"D:\Indian festival\Raw"]
    IND_DEST = r"D:\Indian festival\Output"
    os.makedirs(IND_DEST, exist_ok=True)
    # Using Rui's music for now as a placeholder or asking user later
    IND_MUSIC = RUI_MUSIC 
    
    if os.path.exists(IND_SRC[0]) and len(os.listdir(IND_SRC[0])) > 10:
        ind_agent = VideoProductionAgent(IND_SRC, IND_DEST, IND_MUSIC)
        ind_agent.scan_media()
        ind_agent.select_instagram_carousel(10)
        ind_agent.render_aftermovie("Indian_Festival", 'portrait')
        ind_agent.render_aftermovie("Indian_Festival", 'landscape')
    else:
        print("[!] Indian Festival source empty or not ready yet.")
