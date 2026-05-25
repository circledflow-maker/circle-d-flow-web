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

class PerformanceAgent:
    def __init__(self, source_path, output_dir, music_path, start_num, end_num):
        self.source_path = source_path
        self.output_dir = output_dir
        self.music_path = music_path
        self.start_num = start_num
        self.end_num = end_num
        self.a_roll = []
        self.b_roll = []
        os.makedirs(output_dir, exist_ok=True)

    def scan_media(self):
        print(f"[*] Scanning range DSC_{self.start_num} to DSC_{self.end_num}...")
        all_files = os.listdir(self.source_path)
        for f in all_files:
            if f.lower().startswith('dsc_') and f.lower().endswith(('.mov', '.mp4')):
                try:
                    num = int(f[4:8])
                    if self.start_num <= num <= self.end_num:
                        path = os.path.join(self.source_path, f)
                        # Identify A-roll (long recordings) vs B-roll (short vibes)
                        if os.path.getsize(path) > 500 * 1024 * 1024:
                            self.a_roll.append(path)
                        else:
                            self.b_roll.append(path)
                except: continue
        print(f"[+] Found {len(self.a_roll)} Stage Clips and {len(self.b_roll)} Garden Clips.")

    def process_segment(self, path, out, start, dur):
        # Full Screen Vertical with subject centering
        vf = "scale=-1:1920,crop=1080:1920:iw*0.5-540:0,eq=contrast=1.3:brightness=0.03,format=yuv420p,fps=25"
        cmd = ['ffmpeg', '-ss', str(start), '-t', str(dur), '-i', path, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-an', '-y', out]
        subprocess.run(cmd, capture_output=True)

    def create_video(self, name, target_dur=60):
        print(f"[*] Creating Stage Performance Video: {name}")
        temp_dir = os.path.join(self.output_dir, f"temp_stage_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        processed = []
        current_dur = 0
        
        a_idx = 0
        b_idx = 0
        
        while current_dur < target_dur:
            # Add Stage Performance (5-8s)
            if not self.a_roll: break
            a_path = self.a_roll[a_idx % len(self.a_roll)]
            seg_dur = 6.0
            out = os.path.join(temp_dir, f"seg_{len(processed):03d}_stage.mp4")
            # Take a later part of the stage clip to avoid start/setup
            self.process_segment(a_path, out, 30.0 + (a_idx * 10), seg_dur)
            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur
            a_idx += 1
            
            if current_dur >= target_dur: break
            
            # Add Garden Moment (1.5s)
            if self.b_roll:
                b_path = self.b_roll[b_idx % len(self.b_roll)]
                seg_dur = 1.5
                out = os.path.join(temp_dir, f"seg_{len(processed):03d}_garden.mp4")
                self.process_segment(b_path, out, 1.0, seg_dur)
                if os.path.exists(out):
                    processed.append(out)
                    current_dur += seg_dur
                b_idx += 1

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Stage_Focus_{name}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.music_path, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Stage Video Ready: {final_out}")

if __name__ == "__main__":
    SRC = r"D:\tag mit rui\105NZ502"
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    # Use the extracted concert audio from earlier
    MUSIC = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts\LX_Concert_Audio_5277.mp3"
    
    agent = PerformanceAgent(SRC, DEST, MUSIC, 5245, 5439)
    agent.scan_media()
    
    # Create the Stage + Garden B-roll version
    agent.create_video("Concert_with_Garden_Cuts", target_dur=60)
