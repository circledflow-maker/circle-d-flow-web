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
    def __init__(self, source_paths, output_dir, music_path):
        self.source_paths = source_paths
        self.output_dir = output_dir
        self.music_path = music_path
        self.clips = []
        self.photos = []
        os.makedirs(output_dir, exist_ok=True)

    def get_hash(self, filepath):
        hasher = hashlib.md5()
        with open(filepath, 'rb') as f:
            buf = f.read(65536)
            hasher.update(buf)
        return hasher.hexdigest()

    def scan_media(self):
        print(f"[*] Scanning paths: {self.source_paths}")
        seen_hashes = set()
        for src in self.source_paths:
            if not os.path.exists(src): continue
            for root, dirs, files in os.walk(src):
                for f in files:
                    ext = f.lower()
                    path = os.path.join(root, f)
                    if ext.endswith('.nef'): continue # Skip raw for now
                    if ext.endswith(('.mov', '.mp4', '.jpg', '.jpeg', '.png')):
                        h = self.get_hash(path)
                        if h in seen_hashes: continue
                        seen_hashes.add(h)
                        mtime = os.path.getmtime(path)
                        if ext.endswith(('.mov', '.mp4')):
                            self.clips.append({'path': path, 'type': 'video', 'time': mtime})
                        elif ext.endswith(('.jpg', '.jpeg', '.png')):
                            self.photos.append({'path': path, 'type': 'photo', 'time': mtime})
        self.clips.sort(key=lambda x: x['time'])
        self.photos.sort(key=lambda x: x['time'])

    def process_asset(self, asset, out_path, format_type, duration=2.5, force_rotate=0):
        """Processes asset with 'Fit' mode and rotation support."""
        if asset['type'] == 'video':
            # Rotation logic
            rotate_filter = ""
            if force_rotate == 90: rotate_filter = ",transpose=1"
            elif force_rotate == 180: rotate_filter = ",transpose=2,transpose=2"
            elif force_rotate == 270: rotate_filter = ",transpose=2"
            
            if format_type == 'portrait':
                # Full Body / Fit mode with blurred background
                vf = f"split[main][bg];[bg]{rotate_filter}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]{rotate_filter}scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=25"
            else:
                vf = f"{rotate_filter}scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fps=25"
            
            subprocess.run(['ffmpeg', '-ss', '0.5', '-t', str(duration), '-i', asset['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '20', '-preset', 'ultrafast', '-an', '-y', out_path], capture_output=True)
        else:
            # Photos
            img = Image.open(asset['path'])
            img = ImageOps.exif_transpose(img)
            tmp = out_path + ".revised.jpg"
            img.save(tmp)
            
            if format_type == 'portrait':
                vf = "split[main][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=25"
            else:
                vf = "split[main][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=40:40[bg_out];[main]scale=1920:1080:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=25"
            
            subprocess.run(['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '20', '-preset', 'ultrafast', '-an', '-y', out_path], capture_output=True)
            if os.path.exists(tmp): os.remove(tmp)

    def render_aftermovie(self, name_prefix, format_type='portrait', garden_at_end=False, ind_rotate=False):
        print(f"[*] Rendering {name_prefix}...")
        temp_dir = os.path.join(self.output_dir, f"temp_rev_{name_prefix.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Selection
        clips_sel = self.clips[::max(1, len(self.clips)//25)][:25]
        photos_sel = self.photos[::max(1, len(self.photos)//10)][:10]
        
        # Garden at end logic
        if garden_at_end:
            garden_clips = [c for c in clips_sel if 'garden' in c['path'].lower()]
            other_clips = [c for c in clips_sel if 'garden' not in c['path'].lower()]
            clips_sel = other_clips + garden_clips
            
        interleaved = []
        for i in range(max(len(clips_sel), len(photos_sel))):
            if i < len(clips_sel): interleaved.append(clips_sel[i])
            if i < len(photos_sel): interleaved.append(photos_sel[i])
            
        processed = []
        total_dur = 0
        for i, asset in enumerate(interleaved):
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            # Rotation hack for Indian Day (assuming 90deg CW is what's needed for 'sideways' portrait)
            rot = 90 if ind_rotate and asset['type'] == 'video' else 0
            self.process_asset(asset, out, format_type, duration=2.2, force_rotate=rot)
            if os.path.exists(out):
                processed.append(out)
                total_dur += 2.2

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"{name_prefix}_Revised_{format_type.capitalize()}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.music_path, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(total_dur), '-y', final_out])
        print(f"[+] Finished: {final_out}")

if __name__ == "__main__":
    # 1. Rui Revision
    RUI_SRC = [r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"]
    RUI_DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    RUI_MUSIC = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_V6_Audio.mp3"
    
    rui_agent = VideoProductionAgent(RUI_SRC, RUI_DEST, RUI_MUSIC)
    rui_agent.scan_media()
    rui_agent.render_aftermovie("Rui_V19_GardenEnding", 'portrait', garden_at_end=True)
    rui_agent.render_aftermovie("Rui_V19_GardenEnding", 'landscape', garden_at_end=True)

    # 2. Indian Revision
    IND_SRC = [r"d:\circle-d-flow-web\00_INBOX_RAW_ENERGY\Indian DayFestival"]
    IND_DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Indian_Festival"
    IND_MUSIC = r"d:\circle-d-flow-web\Music\qter-deelem edit 2 @256.mp3"
    
    ind_agent = VideoProductionAgent(IND_SRC, IND_DEST, IND_MUSIC)
    ind_agent.scan_media()
    # ind_rotate=True assumes most portrait-intended videos are recorded sideways
    ind_agent.render_aftermovie("Indian_Day_Festival_Rev", 'portrait', ind_rotate=True)
