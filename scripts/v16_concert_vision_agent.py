import os
import subprocess
import json
import datetime
import cv2
import shutil
import numpy as np
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

try:
    import mediapipe as mp
    from mediapipe.python.solutions import face_detection as mp_face_detection
except ImportError:
    mp_face_detection = None

class ConcertVisionAgent:
    def __init__(self, source_paths, output_dir, music_path):
        self.source_paths = source_paths
        self.output_dir = output_dir
        self.music_path = music_path
        self.clips = []
        os.makedirs(output_dir, exist_ok=True)

    def scan_media(self):
        print("[*] Reactive Scanning: Looking for new concert content...")
        self.clips = []
        for src in self.source_paths:
            if not os.path.exists(src): continue
            for root, d, files in os.walk(src):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(root, f)
                        if os.path.getsize(path) > 2 * 1024 * 1024:
                            self.clips.append({'path': path, 'time': os.path.getmtime(path)})
        self.clips.sort(key=lambda x: x['time'])
        print(f"[+] Scan Complete: {len(self.clips)} clips available.")

    def analyze_clip(self, video_path):
        """Analyzes clip for close-up and subject position."""
        if not mp_face_detection: return 0.5, False
        cap = cv2.VideoCapture(video_path)
        is_close = False
        centers = []
        
        # Sample 3 frames
        for i in range(3):
            cap.set(cv2.CAP_PROP_POS_MSEC, 1000 * (i+1))
            ret, frame = cap.read()
            if not ret: break
            
            with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as face_detection:
                results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if results.detections:
                    bbox = results.detections[0].location_data.relative_bounding_box
                    centers.append(bbox.xmin + bbox.width / 2)
                    # If face height > 30% of frame, consider it a close-up
                    if bbox.height > 0.3:
                        is_close = True
        cap.release()
        cx = np.mean(centers) if centers else 0.5
        return cx, is_close

    def process_concert_seg(self, clip, out_path, duration=1.5):
        cx, is_close = self.analyze_clip(clip['path'])
        
        # Concert Filter: Brighten + Sharpness + Full Vertical Crop
        # eq: brightness=0.02, contrast=1.2; unsharp for extra detail
        vf = f"scale=-1:1920,crop=1080:1920:iw*{cx}-540:0,eq=brightness=0.02:contrast=1.2,unsharp=3:3:1.5,format=yuv420p,fps=25"
        
        cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', clip['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        subprocess.run(cmd, capture_output=True)
        return is_close

    def create_version(self, name, target_dur=30, filter_type='all'):
        print(f"[*] Creating Concert Version: {name}")
        temp_dir = os.path.join(self.output_dir, f"temp_concert_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        processed = []
        current_dur = 0
        
        # Filter clips
        if filter_type == 'close_ups':
            pool = self.clips # We'll check each one
        elif filter_type == 'evening':
            pool = self.clips[len(self.clips)//2:] # Later half
        else:
            pool = self.clips

        for i, clip in enumerate(pool):
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            # For 'close_ups' filter, we only keep the ones that are close
            is_close = self.process_concert_seg(clip, out, duration=1.2 if filter_type == 'close_ups' else 1.8)
            
            if os.path.exists(out):
                if filter_type == 'close_ups' and not is_close:
                    os.remove(out)
                    continue
                processed.append(out)
                current_dur += 1.2 if filter_type == 'close_ups' else 1.8

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Concert_{name}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.music_path, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Version Ready: {final_out}")

if __name__ == "__main__":
    SRC = [r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"]
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    MUSIC = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_Master_Audio.mp3"
    
    agent = ConcertVisionAgent(SRC, DEST, MUSIC)
    agent.scan_media()
    
    # 1. Performance Close-Ups
    agent.create_version("CloseUp_Vision", target_dur=20, filter_type='close_ups')
    
    # 2. Secret Garden Evening (Full Concert Flow)
    agent.create_version("Evening_Set_Garden", target_dur=45, filter_type='evening')
    
    # 3. Artist & Band Master Set
    agent.create_version("Artist_Band_Master", target_dur=30, filter_type='all')
