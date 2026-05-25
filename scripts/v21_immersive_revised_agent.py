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

class RevisedImmersiveAgent:
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
                                    self.clips.append({'path': path, 'num': num})
                                    if num == self.audio_file_num:
                                        self.extract_audio(path, num)
                                elif ext.endswith(('.jpg', '.jpeg', '.png')):
                                    self.photos.append({'path': path, 'num': num})
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

    def process_asset(self, asset, out_path, is_video, duration=2.0):
        if is_video:
            rot = self.get_rotation(asset['path'])
            transpose = ""
            if rot == "90": transpose = "transpose=1,"
            elif rot == "270": transpose = "transpose=2,"
            elif rot == "180": transpose = "transpose=2,transpose=2,"
            
            vf = f"{transpose}scale=-1:1920,crop=1080:1920:iw*0.5-540:0,eq=brightness=0.04:contrast=1.3,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', asset['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        else:
            img = Image.open(asset['path'])
            img = ImageOps.exif_transpose(img)
            tmp = out_path + ".tmp.jpg"
            img.save(tmp)
            vf = "split[main][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,zoompan=z='min(zoom+0.001,1.1)':d=1:s=1080x1920,format=yuv420p,fps=25"
            cmd = ['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        
        subprocess.run(cmd, capture_output=True)
        if not is_video and os.path.exists(tmp): os.remove(tmp)

    def produce_aftermovie(self, name, target_dur=60):
        print(f"[*] Producing Revised Immersive Aftermovie: {name}")
        temp_dir = os.path.join(self.output_dir, f"temp_imm_revised_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        selected = self.clips[::max(1, len(self.clips)//35)][:35]
        
        processed = []
        current_dur = 0
        for i, clip in enumerate(selected):
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            seg_dur = 2.0 # Standard
            
            # Specific Timestamp Fixes: 0:16 (seg 8), 0:24 (seg 12), 0:33 (seg 16)
            is_fix_zone = False
            if 15 <= current_dur <= 20 or 23 <= current_dur <= 26 or 32 <= current_dur <= 35:
                is_fix_zone = True
            
            if is_fix_zone and self.photos:
                # Replace with a photo to be safe and varied
                p_idx = i % len(self.photos)
                self.process_asset(self.photos[p_idx], out, False, duration=seg_dur)
            else:
                self.process_asset(clip, out, True, duration=seg_dur)
            
            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Immersive_Revised_{name}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.master_audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Revised Immersive Movie Ready: {final_out}")

if __name__ == "__main__":
    ROOTS = [r"D:\tag mit rui\105NZ502"]
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    
    agent = RevisedImmersiveAgent(ROOTS, DEST, 5245, 5440, 5332)
    agent.scan_media()
    agent.produce_aftermovie("Live_Experience_V2", target_dur=60)
