import os
import subprocess
import datetime
import cv2
import shutil
import random
from PIL import Image, ImageOps, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

class RevisedChronoShortsAgent:
    def __init__(self, rui_roots, rui_photo_dir, indian_roots, indian_photo_dir, output_base, rui_audio_path):
        self.rui_roots = rui_roots
        self.indian_roots = indian_roots
        self.rui_photos = self.get_photos(rui_photo_dir)
        self.indian_photos = self.get_photos(indian_photo_dir)
        
        self.output_base = os.path.join(output_base, "Revised_Shorts")
        self.rui_audio_path = rui_audio_path
        os.makedirs(self.output_base, exist_ok=True)
        
        self.indian_audio_path = os.path.join(self.output_base, "Indian_Master_Audio.mp3")

    def get_photos(self, directory):
        photos = []
        if os.path.exists(directory):
            for f in os.listdir(directory):
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    photos.append(os.path.join(directory, f))
        return sorted(photos)

    def get_rotation(self, path):
        cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream_tags=rotate', '-of', 'default=noprint_wrappers=1:nokey=1', path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        return res.stdout.strip()

    def get_resolution(self, path):
        cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        try:
            w, h = map(int, res.stdout.strip().split('x'))
            rot = self.get_rotation(path)
            if rot in ["90", "270"]: return h, w
            return w, h
        except: return 1920, 1080

    def extract_audio(self, roots, out_path):
        if os.path.exists(out_path): return
        largest = None
        max_size = 0
        for root in roots:
            if not os.path.exists(root): continue
            for r, d, files in os.walk(root):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(r, f)
                        size = os.path.getsize(path)
                        if size > max_size:
                            max_size = size
                            largest = path
        if largest:
            subprocess.run(['ffmpeg', '-i', largest, '-vn', '-acodec', 'libmp3lame', '-ab', '192k', '-ar', '44100', '-y', out_path], capture_output=True)

    def scan_and_sort(self, roots, event_type):
        clips = []
        for root in roots:
            if not os.path.exists(root): continue
            for r, d, files in os.walk(root):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(r, f)
                        
                        # Tag mit Rui Range Filter
                        if event_type == "rui" and f.lower().startswith('dsc_'):
                            try:
                                num = int(f[4:8])
                                if not (5245 <= num <= 5440): continue
                            except: continue
                            
                        if os.path.getsize(path) > 1 * 1024 * 1024:
                            clips.append({'path': path, 'time': os.path.getmtime(path)})
        clips.sort(key=lambda x: x['time'])
        return clips

    def process_video_segment(self, path, out_path, orientation, duration, force_rotate=False):
        rot = self.get_rotation(path)
        transpose = ""
        
        # User requested manual 90 deg left rotation for specific clips
        if force_rotate:
            transpose = "transpose=2,"
            # Swap w/h for the logic below since we forced a rotation
            h, w = self.get_resolution(path) 
        else:
            w, h = self.get_resolution(path)
            if rot == "90": transpose = "transpose=1,"
            elif rot == "270": transpose = "transpose=2,"
            elif rot == "180": transpose = "transpose=2,transpose=2,"

        if orientation == "vertical":
            if w > h:
                vf = f"{transpose}scale=-1:1920,crop=1080:1920:iw*0.5-540:0,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
            else:
                vf = f"{transpose}scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
        else: # Landscape
            if h > w:
                vf = f"{transpose}split[main][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=40:40[bg_out];[main]scale=1920:1080:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
            else:
                vf = f"{transpose}scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
        
        cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', path, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        subprocess.run(cmd, capture_output=True)

    def process_photo_segment(self, path, out_path, orientation, duration):
        img = Image.open(path)
        img = ImageOps.exif_transpose(img)
        tmp = out_path + ".tmp.jpg"
        img.save(tmp)
        
        if orientation == "vertical":
            vf = "split[main][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:40[bg_out];[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,zoompan=z='min(zoom+0.001,1.1)':d=1:s=1080x1920,format=yuv420p,fps=25"
        else:
            vf = "split[main][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=40:40[bg_out];[main]scale=1920:1080:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,zoompan=z='min(zoom+0.001,1.1)':d=1:s=1920x1080,format=yuv420p,fps=25"

        cmd = ['ffmpeg', '-loop', '1', '-t', str(duration), '-i', tmp, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        subprocess.run(cmd, capture_output=True)
        if os.path.exists(tmp): os.remove(tmp)

    def create_video(self, event_type, clips, photos, name, orientation, audio_path, target_dur=45):
        print(f"[*] Creating Revised Short: {name} ({orientation})")
        temp_dir = os.path.join(self.output_base, f"temp_{name.lower()}_{orientation}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Interleave Logic: Select 20 videos, and use photos every 3rd or 4th segment
        step = max(1, len(clips) // 20)
        selected_clips = clips[::step][:20]
        
        processed = []
        current_dur = 0
        clip_idx = 0
        photo_idx = 0
        
        for i in range(30): # max segments
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            # Accelerate pacing
            seg_dur = 2.5 if current_dur < target_dur/2 else 1.5
            
            is_photo = False
            # Every 4th segment is a photo if available
            if i > 0 and i % 4 == 0 and photo_idx < len(photos):
                is_photo = True
            
            if is_photo:
                self.process_photo_segment(photos[photo_idx], out, orientation, seg_dur)
                photo_idx += 1
            else:
                if clip_idx >= len(selected_clips): break
                c_path = selected_clips[clip_idx]['path']
                
                # Check for Indian Festival targeted rotation fixes
                force_rot = False
                if event_type == "indian":
                    # Fix 0:24-0:26 and 0:29
                    if 23 <= current_dur <= 27 or 28 <= current_dur <= 30:
                        force_rot = True
                        
                self.process_video_segment(c_path, out, orientation, seg_dur, force_rot)
                clip_idx += 1

            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_base, f"{name}_{orientation.capitalize()}.mp4")
        
        af = "compand=attacks=0.3:decays=0.8:points=-90/-90|-45/-45|-27/-25|0/-15|20/-15:soft-knee=6:gain=2,loudnorm=I=-14:LRA=11:TP=-1.5"
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', audio_path, '-filter_complex', f"[1:a]{af}[mastered]", '-map', '0:v', '-map', '[mastered]', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Revised Video Ready: {final_out}")

    def run(self):
        print("=== Starting Revised Shorts Creation ===")
        # 1. Indian Festival
        self.extract_audio(self.indian_roots, self.indian_audio_path)
        indian_clips = self.scan_and_sort(self.indian_roots, "indian")
        if indian_clips:
            random.shuffle(self.indian_photos) # Shuffle to get varied photos
            self.create_video("indian", indian_clips, self.indian_photos, "Indian_Day_Festival_Revised", "vertical", self.indian_audio_path, target_dur=45)
            self.create_video("indian", indian_clips, self.indian_photos, "Indian_Day_Festival_Revised", "landscape", self.indian_audio_path, target_dur=45)
        
        # 2. Tag mit Rui
        rui_clips = self.scan_and_sort(self.rui_roots, "rui")
        if rui_clips:
            random.shuffle(self.rui_photos)
            self.create_video("rui", rui_clips, self.rui_photos, "Tag_Mit_Rui_Revised", "vertical", self.rui_audio_path, target_dur=60)
            self.create_video("rui", rui_clips, self.rui_photos, "Tag_Mit_Rui_Revised", "landscape", self.rui_audio_path, target_dur=60)
            
        print("=== Revised Shorts Complete ===")

if __name__ == "__main__":
    RUI_ROOTS = [r"D:\tag mit rui\105NZ502", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped"]
    RUI_PHOTOS = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Ready_To_Post\Tag_Mit_Rui_Portraits"
    
    INDIAN_ROOTS = [r"d:\circle-d-flow-web\00_INBOX_RAW_ENERGY\Indian DayFestival"]
    INDIAN_PHOTOS = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Ready_To_Post\Indian_Festival_Portraits"
    
    OUT_BASE = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Ready_To_Post"
    RUI_AUDIO = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts\Immersive_Audio_5332.mp3"
    
    agent = RevisedChronoShortsAgent(RUI_ROOTS, RUI_PHOTOS, INDIAN_ROOTS, INDIAN_PHOTOS, OUT_BASE, RUI_AUDIO)
    agent.run()
