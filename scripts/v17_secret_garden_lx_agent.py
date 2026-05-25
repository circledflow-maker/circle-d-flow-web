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

class LXProductionAgent:
    def __init__(self, source_path, output_dir, start_num, end_num):
        self.source_path = source_path
        self.output_dir = output_dir
        self.start_num = start_num
        self.end_num = end_num
        self.clips = []
        self.master_audio = None
        os.makedirs(output_dir, exist_ok=True)

    def scan_range(self):
        print(f"[*] Scanning range DSC_{self.start_num} to DSC_{self.end_num}...")
        all_files = os.listdir(self.source_path)
        for f in all_files:
            if f.lower().startswith('dsc_') and f.lower().endswith(('.mov', '.mp4', '.jpg', '.jpeg')):
                try:
                    num = int(f[4:8])
                    if self.start_num <= num <= self.end_num:
                        path = os.path.join(self.source_path, f)
                        self.clips.append({'path': path, 'num': num, 'type': 'video' if f.lower().endswith(('.mov', '.mp4')) else 'photo'})
                except: continue
        self.clips.sort(key=lambda x: x['num'])
        print(f"[+] Found {len(self.clips)} assets in range.")

    def extract_concert_audio(self):
        print("[*] Identifying master audio from recordings...")
        # Find the largest MOV file in the range
        video_clips = [c for c in self.clips if c['type'] == 'video']
        if not video_clips: return
        largest = max(video_clips, key=lambda x: os.path.getsize(x['path']))
        
        audio_path = os.path.join(self.output_dir, f"LX_Concert_Audio_{largest['num']}.mp3")
        if not os.path.exists(audio_path):
            print(f"[*] Extracting audio from {largest['path']}...")
            subprocess.run(['ffmpeg', '-i', largest['path'], '-vn', '-acodec', 'libmp3lame', '-ab', '192k', '-ar', '44100', '-y', audio_path], capture_output=True)
        self.master_audio = audio_path
        print(f"[+] Master Audio Ready: {self.master_audio}")

    def analyze_asset(self, path):
        """Finds face center and close-up status."""
        if not mp_face_detection: return 0.5, False
        cap = cv2.VideoCapture(path)
        is_close = False
        centers = []
        for i in range(3):
            cap.set(cv2.CAP_PROP_POS_MSEC, 2000 * (i+1))
            ret, frame = cap.read()
            if not ret: break
            with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as face_detection:
                results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if results.detections:
                    bbox = results.detections[0].location_data.relative_bounding_box
                    centers.append(bbox.xmin + bbox.width / 2)
                    if bbox.height > 0.35: is_close = True
        cap.release()
        return (np.mean(centers) if centers else 0.5), is_close

    def process_segment(self, asset, out_path, duration=2.0):
        if asset['type'] == 'video':
            cx, is_close = self.analyze_asset(asset['path'])
            vf = f"scale=-1:1920,crop=1080:1920:iw*{cx}-540:0,eq=brightness=0.04:contrast=1.2:saturation=1.2,unsharp=3:3:1.0,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-ss', '2.0', '-t', str(duration), '-i', asset['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-an', '-y', out_path]
            subprocess.run(cmd, capture_output=True)
            return is_close
        else:
            # Photos
            img = Image.open(asset['path'])
            img = ImageOps.exif_transpose(img)
            tmp = out_path + ".tmp.jpg"
            img.save(tmp)
            vf = "split[main][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=25"
            subprocess.run(['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-an', '-y', out_path], capture_output=True)
            if os.path.exists(tmp): os.remove(tmp)
            return False

    def produce_aftermovie(self, name, target_dur=45, filter_type='all'):
        print(f"[*] Producing LX Aftermovie: {name}")
        temp_dir = os.path.join(self.output_dir, f"temp_lx_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        processed = []
        current_dur = 0
        pool = self.clips[::2] # Variety
        
        for i, asset in enumerate(pool):
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            seg_dur = 1.5 if i % 2 == 0 else 2.5
            is_close = self.process_segment(asset, out, duration=seg_dur)
            
            if os.path.exists(out):
                if filter_type == 'close_ups' and not is_close and asset['type'] == 'video':
                    os.remove(out)
                    continue
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_LX_{name}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.master_audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] LX Movie Ready: {final_out}")

if __name__ == "__main__":
    SRC = r"D:\tag mit rui\105NZ502"
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    
    agent = LXProductionAgent(SRC, DEST, 5245, 5439)
    agent.scan_range()
    agent.extract_concert_audio()
    
    # 1. LX Master Cut (60s)
    agent.produce_aftermovie("Master_LX_FullDay", target_dur=60, filter_type='all')
    
    # 2. Artist Close-Up Vision (30s)
    agent.produce_aftermovie("Artist_LX_CloseUp", target_dur=30, filter_type='close_ups')
