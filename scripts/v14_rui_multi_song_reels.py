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

class MultiReelAgent:
    def __init__(self, source_paths, output_dir):
        self.source_paths = source_paths
        self.output_dir = output_dir
        self.clips = []
        os.makedirs(output_dir, exist_ok=True)

    def scan_media(self):
        print("[*] Scanning media...")
        for src in self.source_paths:
            if not os.path.exists(src): continue
            for root, d, files in os.walk(src):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(root, f)
                        self.clips.append({'path': path, 'time': os.path.getmtime(path)})
        self.clips.sort(key=lambda x: x['time'])

    def process_segment(self, asset_path, out_path, duration=2.5, split_with=None):
        """Processes a segment, optionally as a split screen."""
        if not split_with:
            # Standard 'Fit' mode with blurred background
            vf = "split[main][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', asset_path, '-vf', vf, '-c:v', 'libx264', '-an', '-y', out_path]
        else:
            # Vertical Split Screen (Top/Bottom)
            vf = "[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setpts=PTS-STARTPTS[t]; [1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setpts=PTS-STARTPTS[b]; [t][b]vstack,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', asset_path, '-ss', '5.0', '-t', str(duration), '-i', split_with, '-filter_complex', vf, '-c:v', 'libx264', '-an', '-y', out_path]
        
        subprocess.run(cmd, capture_output=True)

    def create_reel(self, name, music_path, target_duration, mode='normal'):
        print(f"[*] Creating Reel: {name} (Mode: {mode})")
        temp_dir = os.path.join(self.output_dir, f"temp_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Select clips based on mode
        if mode == 'garden':
            pool = self.clips[:len(self.clips)//2] # Earlier clips
        elif mode == 'jam':
            pool = self.clips[len(self.clips)//2:] # Later clips
        else:
            pool = self.clips

        # Pick random-ish samples
        np.random.seed(42)
        selected = np.random.choice(pool, min(len(pool), 15), replace=False)
        
        processed = []
        current_dur = 0
        seg_dur = 3.0
        
        for i, clip in enumerate(selected):
            if current_dur >= target_duration: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            # Use split screen every 3rd clip in 'split' mode
            split_clip = pool[-(i+1)]['path'] if mode == 'split' and i % 3 == 0 else None
            
            self.process_segment(clip['path'], out, duration=seg_dur, split_with=split_clip)
            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"{name}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', music_path, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-y', final_out])
        print(f"[+] Finished: {final_out}")

if __name__ == "__main__":
    SRC = [r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"]
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    
    agent = MultiReelAgent(SRC, DEST)
    agent.scan_media()
    
    # Reel 1: Master Garden Vibe (60s)
    agent.create_reel("Rui_Reel_A_Master_Garden", 
                      r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_Master_Audio.mp3", 
                      60, mode='garden')
    
    # Reel 2: Alt Artist Snapshot (15s)
    agent.create_reel("Rui_Reel_B_Alt_Artist", 
                      r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_Alt_Audio.mp3", 
                      15, mode='normal')
    
    # Reel 3: V6 Jam Split Screen (60s)
    agent.create_reel("Rui_Reel_C_Split_Jam", 
                      r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_V6_Audio.mp3", 
                      60, mode='split')
