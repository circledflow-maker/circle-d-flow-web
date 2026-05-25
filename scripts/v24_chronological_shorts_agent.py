import os
import subprocess
import datetime
import cv2
import numpy as np

class ChronoShortsAgent:
    def __init__(self, rui_roots, indian_roots, output_base, rui_audio_path):
        self.rui_roots = rui_roots
        self.indian_roots = indian_roots
        self.output_base = os.path.join(output_base, "Short_Videos")
        self.rui_audio_path = rui_audio_path
        os.makedirs(self.output_base, exist_ok=True)
        
        # Audio extraction for Indian Festival
        self.indian_audio_path = os.path.join(self.output_base, "Indian_Master_Audio.mp3")

    def get_rotation(self, path):
        cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream_tags=rotate', '-of', 'default=noprint_wrappers=1:nokey=1', path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        return res.stdout.strip()

    def get_resolution(self, path):
        cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        try:
            w, h = map(int, res.stdout.strip().split('x'))
            # Adjust for rotation
            rot = self.get_rotation(path)
            if rot in ["90", "270"]:
                return h, w
            return w, h
        except:
            return 1920, 1080

    def extract_audio_from_folder(self, roots, out_path):
        if os.path.exists(out_path): return
        print("[*] Finding audio track...")
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
            print(f"[*] Extracting audio from {largest}...")
            subprocess.run(['ffmpeg', '-i', largest, '-vn', '-acodec', 'libmp3lame', '-ab', '192k', '-ar', '44100', '-y', out_path], capture_output=True)

    def scan_and_sort(self, roots):
        clips = []
        for root in roots:
            if not os.path.exists(root): continue
            for r, d, files in os.walk(root):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(r, f)
                        # Filter out small files or corrupted ones
                        if os.path.getsize(path) > 1 * 1024 * 1024:
                            clips.append({'path': path, 'time': os.path.getmtime(path)})
        clips.sort(key=lambda x: x['time'])
        return clips

    def process_segment(self, clip, out_path, orientation, duration=2.0):
        rot = self.get_rotation(clip['path'])
        transpose = ""
        if rot == "90": transpose = "transpose=1,"
        elif rot == "270": transpose = "transpose=2,"
        elif rot == "180": transpose = "transpose=2,transpose=2,"
        
        w, h = self.get_resolution(clip['path'])
        
        if orientation == "vertical":
            if w > h: # Landscape source to Vertical output
                vf = f"{transpose}scale=-1:1920,crop=1080:1920:iw*0.5-540:0,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
            else: # Vertical source to Vertical output
                vf = f"{transpose}scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
        else: # Landscape (YouTube)
            if h > w: # Vertical source to Landscape output (Blurred BG)
                vf = f"{transpose}split[main][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=40:40[bg_out];[main]scale=1920:1080:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
            else: # Landscape source to Landscape output
                vf = f"{transpose}scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.03:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
        
        cmd = ['ffmpeg', '-ss', '1.0', '-t', str(duration), '-i', clip['path'], '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'ultrafast', '-an', '-y', out_path]
        subprocess.run(cmd, capture_output=True)

    def create_video(self, clips, name, orientation, audio_path, target_dur=45):
        print(f"[*] Creating Chronological Short: {name} ({orientation})")
        temp_dir = os.path.join(self.output_base, f"temp_{name.lower()}_{orientation}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Select 25 evenly spaced clips chronologically
        step = max(1, len(clips) // 25)
        selected = clips[::step][:25]
        
        processed = []
        current_dur = 0
        for i, clip in enumerate(selected):
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            # Accelerate pacing towards the evening
            seg_dur = 2.5 if i < len(selected)//2 else 1.5
            
            self.process_segment(clip, out, orientation, duration=seg_dur)
            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_base, f"{name}_{orientation.capitalize()}.mp4")
        
        # Audio Mastering: compand for punchiness
        af = "compand=attacks=0.3:decays=0.8:points=-90/-90|-45/-45|-27/-25|0/-15|20/-15:soft-knee=6:gain=2,loudnorm=I=-14:LRA=11:TP=-1.5"
        
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', audio_path, '-filter_complex', f"[1:a]{af}[mastered]", '-map', '0:v', '-map', '[mastered]', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Video Ready: {final_out}")

    def run(self):
        print("=== Starting Chronological Shorts Creation ===")
        # 1. Indian Festival
        self.extract_audio_from_folder(self.indian_roots, self.indian_audio_path)
        indian_clips = self.scan_and_sort(self.indian_roots)
        if indian_clips:
            self.create_video(indian_clips, "Indian_Day_Festival_Chrono", "vertical", self.indian_audio_path, target_dur=45)
            self.create_video(indian_clips, "Indian_Day_Festival_Chrono", "landscape", self.indian_audio_path, target_dur=45)
        
        # 2. Tag mit Rui
        rui_clips = self.scan_and_sort(self.rui_roots)
        if rui_clips:
            self.create_video(rui_clips, "Tag_Mit_Rui_Chrono", "vertical", self.rui_audio_path, target_dur=60)
            self.create_video(rui_clips, "Tag_Mit_Rui_Chrono", "landscape", self.rui_audio_path, target_dur=60)
            
        print("=== Chronological Shorts Complete ===")

if __name__ == "__main__":
    RUI_ROOTS = [r"D:\tag mit rui\105NZ502", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped"]
    INDIAN_ROOTS = [r"d:\circle-d-flow-web\00_INBOX_RAW_ENERGY\Indian DayFestival"]
    OUT_BASE = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Ready_To_Post"
    RUI_AUDIO = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts\Immersive_Audio_5332.mp3"
    
    agent = ChronoShortsAgent(RUI_ROOTS, INDIAN_ROOTS, OUT_BASE, RUI_AUDIO)
    agent.run()
