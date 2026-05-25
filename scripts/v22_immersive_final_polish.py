import os
import subprocess
import json
import datetime
import cv2
import shutil
import random
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

try:
    import mediapipe as mp
    from mediapipe.python.solutions import face_detection as mp_face_detection
except ImportError:
    mp_face_detection = None

class FinalPolishAgent:
    def __init__(self, source_roots, output_dir, start_num, end_num, audio_file_num):
        self.source_roots = source_roots
        self.output_dir = output_dir
        self.start_num = start_num
        self.end_num = end_num
        self.audio_file_num = audio_file_num
        self.clips = []
        self.photos = []
        self.master_audio = None
        os.makedirs(output_dir, exist_ok=True)

    def scan_media(self):
        print(f"[*] Scanning for range DSC_{self.start_num} to DSC_{self.end_num}...")
        for root in self.source_roots:
            if not os.path.exists(root): continue
            for r, d, files in os.walk(root):
                for f in files:
                    ext = f.lower()
                    if f.lower().startswith('dsc_'):
                        try:
                            num = int(f[4:8])
                            if self.start_num <= num <= self.end_num:
                                path = os.path.join(r, f)
                                if ext.endswith(('.mov', '.mp4')):
                                    self.clips.append({'path': path, 'num': num, 'type': 'video'})
                                elif ext.endswith(('.jpg', '.jpeg', '.png')):
                                    self.photos.append({'path': path, 'num': num, 'type': 'photo'})
                                if num == self.audio_file_num:
                                    self.extract_audio(path, num)
                        except: continue
        self.clips.sort(key=lambda x: x['num'])
        self.photos.sort(key=lambda x: x['num'])
        print(f"[+] Found {len(self.clips)} clips and {len(self.photos)} photos.")

    def extract_audio(self, path, num):
        audio_path = os.path.join(self.output_dir, f"Immersive_Audio_{num}.mp3")
        if not os.path.exists(audio_path):
            subprocess.run(['ffmpeg', '-i', path, '-vn', '-acodec', 'libmp3lame', '-ab', '192k', '-ar', '44100', '-y', audio_path], capture_output=True)
        self.master_audio = audio_path

    def get_rotation(self, path):
        cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream_tags=rotate', '-of', 'default=noprint_wrappers=1:nokey=1', path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        return res.stdout.strip()

    def process_asset(self, asset, out_path, duration=2.0):
        if asset['type'] == 'video':
            rot = self.get_rotation(asset['path'])
            transpose = ""
            if rot == "90": transpose = "transpose=1,"
            elif rot == "270": transpose = "transpose=2,"
            elif rot == "180": transpose = "transpose=2,transpose=2,"
            
            vf = f"{transpose}scale=-1:1920,crop=1080:1920:iw*0.5-540:0,eq=brightness=0.04:contrast=1.3,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-ss', '2.0', '-t', str(duration), '-i', asset['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        else:
            img = Image.open(asset['path'])
            img = ImageOps.exif_transpose(img)
            tmp = out_path + ".tmp.jpg"
            img.save(tmp)
            vf = "split[main][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,zoompan=z='min(zoom+0.001,1.1)':d=1:s=1080x1920,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        
        subprocess.run(cmd, capture_output=True)
        if asset['type'] == 'photo' and os.path.exists(tmp): os.remove(tmp)

    def produce_aftermovie(self, name, target_dur=60):
        print(f"[*] Producing Final Polish Immersive Aftermovie: {name}")
        temp_dir = os.path.join(self.output_dir, f"temp_imm_final_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Diversity-First Selection: Avoid consecutive clips from the same block
        all_assets = self.clips + self.photos
        all_assets.sort(key=lambda x: x['num'])
        
        selected = []
        current_dur = 0
        last_num = -100
        
        # Narrative zones
        intro_assets = [a for a in all_assets if a['num'] < self.start_num + 50]
        body_assets = [a for a in all_assets if self.start_num + 50 <= a['num'] <= self.end_num - 20]
        ending_assets = [a for a in all_assets if a['num'] > self.end_num - 20]
        
        i = 0
        while current_dur < target_dur:
            # Fix Zone timestamps
            is_fix_zone = False
            if 19 <= current_dur <= 25 or 48 <= current_dur <= 56:
                is_fix_zone = True
            
            # Select from appropriate narrative block
            if current_dur < 15: block = intro_assets
            elif current_dur < 50: block = body_assets
            else: block = ending_assets
            
            # Find a non-consecutive asset
            # Shuffling the block to ensure variety
            random.shuffle(block)
            pick = None
            for asset in block:
                if abs(asset['num'] - last_num) > 5: # Diversity threshold
                    if is_fix_zone:
                        # For fix zones, prioritize variety (e.g., if last was video, pick photo)
                        if not selected or asset['type'] != selected[-1]['type']:
                            pick = asset
                            break
                    else:
                        pick = asset
                        break
            
            if not pick:
                if block: pick = block[0]
                else: pick = all_assets[0] # Global fallback
            
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            seg_dur = 2.0
            self.process_asset(pick, out, duration=seg_dur)
            
            if os.path.exists(out):
                selected.append(pick)
                last_num = pick['num']
                current_dur += seg_dur
                i += 1
            else:
                # If segment failed (e.g., corrupted file), skip it
                block.remove(pick)

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in sorted(os.listdir(temp_dir)):
                if p.startswith('seg_') and p.endswith('.mp4'):
                    f.write(f"file '{os.path.abspath(os.path.join(temp_dir, p)).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Immersive_Final_Polish.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.master_audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Final Polish Movie Ready: {final_out}")

if __name__ == "__main__":
    ROOTS = [r"D:\tag mit rui\105NZ502"]
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    
    agent = FinalPolishAgent(ROOTS, DEST, 5245, 5440, 5332)
    agent.scan_media()
    agent.produce_aftermovie("Live_Experience_Final", target_dur=60)
