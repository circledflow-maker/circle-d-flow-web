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

class ImmersiveAgent:
    def __init__(self, source_roots, output_dir, start_num, end_num, audio_file_num):
        self.source_roots = source_roots
        self.output_dir = output_dir
        self.start_num = start_num
        self.end_num = end_num
        self.audio_file_num = audio_file_num
        self.clips = []
        self.master_audio = None
        os.makedirs(output_dir, exist_ok=True)

    def scan_media(self):
        print(f"[*] Scanning for range DSC_{self.start_num} to DSC_{self.end_num}...")
        for root in self.source_roots:
            if not os.path.exists(root): continue
            for r, d, files in os.walk(root):
                for f in files:
                    if f.lower().startswith('dsc_') and f.lower().endswith(('.mov', '.mp4')):
                        try:
                            num = int(f[4:8])
                            if self.start_num <= num <= self.end_num:
                                path = os.path.join(r, f)
                                self.clips.append({'path': path, 'num': num})
                                if num == self.audio_file_num:
                                    self.extract_audio(path, num)
                        except: continue
        self.clips.sort(key=lambda x: x['num'])
        print(f"[+] Found {len(self.clips)} clips in range.")

    def extract_audio(self, path, num):
        audio_path = os.path.join(self.output_dir, f"Immersive_Audio_{num}.mp3")
        if not os.path.exists(audio_path):
            print(f"[*] Extracting audio from {path}...")
            subprocess.run(['ffmpeg', '-i', path, '-vn', '-acodec', 'libmp3lame', '-ab', '192k', '-ar', '44100', '-y', audio_path], capture_output=True)
        self.master_audio = audio_path

    def analyze_asset(self, path):
        if not mp_face_detection: return 0.5
        cap = cv2.VideoCapture(path)
        centers = []
        for i in range(2):
            cap.set(cv2.CAP_PROP_POS_MSEC, 1000 * (i+1))
            ret, frame = cap.read()
            if not ret: break
            with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as face_detection:
                results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if results.detections:
                    bbox = results.detections[0].location_data.relative_bounding_box
                    centers.append(bbox.xmin + bbox.width / 2)
        cap.release()
        return np.mean(centers) if centers else 0.5

    def process_segment(self, clip, out_path, duration=2.0):
        cx = self.analyze_asset(clip['path'])
        # Full Screen Vertical + Color Pop
        vf = f"scale=-1:1920,crop=1080:1920:iw*{cx}-540:0,eq=brightness=0.04:contrast=1.3:saturation=1.2,format=yuv420p,fps=25"
        cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', clip['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        subprocess.run(cmd, capture_output=True)

    def produce_aftermovie(self, name, target_dur=60):
        print(f"[*] Producing Immersive Aftermovie: {name}")
        temp_dir = os.path.join(self.output_dir, f"temp_imm_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Narrative Split: Intro (15%), Body (75%), Ending (10%)
        intro_pool = [c for c in self.clips if c['num'] < self.start_num + (self.end_num - self.start_num) * 0.2]
        ending_pool = [c for c in self.clips if c['num'] > self.end_num - (self.end_num - self.start_num) * 0.1]
        body_pool = [c for c in self.clips if c not in intro_pool and c not in ending_pool]
        
        selected = []
        # Sample from pools
        selected += intro_pool[::max(1, len(intro_pool)//5)][:5]
        selected += body_pool[::max(1, len(body_pool)//20)][:20]
        selected += ending_pool[-5:] # Ensure the very last ones are there
        
        processed = []
        current_dur = 0
        for i, clip in enumerate(selected):
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            # Ending gets slightly longer cuts for impact
            seg_dur = 2.5 if clip in ending_pool else (1.5 if i % 2 == 0 else 2.0)
            
            self.process_segment(clip, out, duration=seg_dur)
            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Immersive_Aftermovie_{name}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.master_audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Immersive Movie Ready: {final_out}")

if __name__ == "__main__":
    ROOTS = [r"D:\tag mit rui\105NZ502"] # os.walk will find the nested one
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    
    agent = ImmersiveAgent(ROOTS, DEST, 5245, 5440, 5332)
    agent.scan_media()
    
    if agent.master_audio:
        agent.produce_aftermovie("Live_Experience_V1", target_dur=60)
    else:
        print("[!] Audio source DSC_5332 not found or failed.")
