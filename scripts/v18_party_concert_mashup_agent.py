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

class MashupProductionAgent:
    def __init__(self, source_paths, output_dir, music_path):
        self.source_paths = source_paths
        self.output_dir = output_dir
        self.music_path = music_path
        self.clips = []
        self.photos = []
        os.makedirs(output_dir, exist_ok=True)

    def scan_media(self):
        print("[*] Scanning for mashup material...")
        for src in self.source_paths:
            if not os.path.exists(src): continue
            for root, d, files in os.walk(src):
                for f in files:
                    ext = f.lower()
                    path = os.path.join(root, f)
                    if ext.endswith(('.mov', '.mp4')):
                        self.clips.append({'path': path, 'time': os.path.getmtime(path)})
                    elif ext.endswith(('.jpg', '.jpeg', '.png')):
                        self.photos.append({'path': path, 'time': os.path.getmtime(path)})
        self.clips.sort(key=lambda x: x['time'])
        self.photos.sort(key=lambda x: x['time'])

    def analyze_asset(self, path):
        if not mp_face_detection: return 0.5
        cap = cv2.VideoCapture(path)
        centers = []
        for i in range(3):
            cap.set(cv2.CAP_PROP_POS_MSEC, 1500 * (i+1))
            ret, frame = cap.read()
            if not ret: break
            with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as face_detection:
                results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if results.detections:
                    bbox = results.detections[0].location_data.relative_bounding_box
                    centers.append(bbox.xmin + bbox.width / 2)
        cap.release()
        return np.mean(centers) if centers else 0.5

    def process_asset(self, asset, out_path, is_video, duration=2.0):
        if is_video:
            cx = self.analyze_asset(asset['path'])
            vf = f"scale=-1:1920,crop=1080:1920:iw*{cx}-540:0,eq=contrast=1.3:saturation=1.2,unsharp=3:3:1.0,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', asset['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-an', '-y', out_path]
        else:
            img = Image.open(asset['path'])
            img = ImageOps.exif_transpose(img)
            tmp = out_path + ".tmp.jpg"
            img.save(tmp)
            # Portrait with blurred bg and micro-zoom
            vf = "split[main][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,zoompan=z='min(zoom+0.002,1.2)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-an', '-y', out_path]
        
        subprocess.run(cmd, capture_output=True)
        if not is_video and os.path.exists(tmp): os.remove(tmp)

    def produce_mashup(self, name, target_dur=45):
        print(f"[*] Producing Party/Concert Mashup: {name}")
        temp_dir = os.path.join(self.output_dir, f"temp_mashup_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Build interleave list
        interleaved = []
        v_pool = self.clips[::4]
        p_pool = self.photos[::8]
        
        for i in range(max(len(v_pool), len(p_pool))):
            if i < len(v_pool): interleaved.append((v_pool[i], True))
            if i < len(p_pool) and i % 3 == 0: # Only occasionally add portraits
                interleaved.append((p_pool[i], False))
        
        processed = []
        current_dur = 0
        for i, (asset, is_v) in enumerate(interleaved):
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            # Pacing: 3s for start (intro), then 1.5s (party)
            seg_dur = 3.0 if current_dur < 10 else 1.5
            self.process_asset(asset, out, is_v, duration=seg_dur)
            
            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Mashup_{name}.mp4")
        
        # Audio Mastering Chain: compand (compressor) + loudnorm (normalize)
        af = "compand=attacks=0.3:decays=0.8:points=-90/-90|-45/-45|-27/-25|0/-15|20/-15:soft-knee=6:gain=2,loudnorm=I=-14:LRA=11:TP=-1.5"
        
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.music_path, '-filter_complex', f"[1:a]{af}[mastered]", '-map', '0:v', '-map', '[mastered]', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Mashup Ready: {final_out}")

if __name__ == "__main__":
    SRC = [r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"]
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    MUSIC = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts\LX_Concert_Audio_5277.mp3"
    
    agent = MashupProductionAgent(SRC, DEST, MUSIC)
    agent.scan_media()
    
    # Version 1: Party & Concert Mastered Mashup (45s)
    agent.produce_mashup("Festival_Vibe_V1", target_dur=45)
