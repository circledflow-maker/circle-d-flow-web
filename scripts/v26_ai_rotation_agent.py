import os
import subprocess
import datetime
import cv2
import shutil
import random
from PIL import Image, ImageOps, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

try:
    import mediapipe as mp
    from mediapipe.python.solutions import face_detection as mp_face_detection
except ImportError:
    mp_face_detection = None

class AIRotationAgent:
    def __init__(self, indian_roots, indian_photo_dir, output_base):
        self.indian_roots = indian_roots
        self.indian_photos = self.get_photos(indian_photo_dir)
        
        self.output_base = os.path.join(output_base, "AI_Fixed_Shorts")
        os.makedirs(self.output_base, exist_ok=True)
        
        self.indian_audio_path = os.path.join(self.output_base, "Indian_Master_Audio.mp3")
        self.rotation_cache = {}

    def get_photos(self, directory):
        photos = []
        if os.path.exists(directory):
            for f in os.listdir(directory):
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    photos.append(os.path.join(directory, f))
        return sorted(photos)

    def detect_true_rotation(self, path):
        if path in self.rotation_cache:
            return self.rotation_cache[path]
            
        if not mp_face_detection:
            return "0" # Fallback if no AI

        cap = cv2.VideoCapture(path)
        # Skip first second to avoid black frames or camera movement
        cap.set(cv2.CAP_PROP_POS_MSEC, 1000) 
        ret, frame = cap.read()
        cap.release()
        
        if not ret or frame is None:
            return "0"

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Test 3 orientations: Original, 90 Left (CCW), 90 Right (CW)
        orientations = {
            "0": frame_rgb,
            "90": cv2.rotate(frame_rgb, cv2.ROTATE_90_CLOCKWISE),
            "270": cv2.rotate(frame_rgb, cv2.ROTATE_90_COUNTERCLOCKWISE)
        }
        
        best_rot = "0"
        max_score = 0.0
        
        with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as face_detection:
            for rot_val, test_frame in orientations.items():
                results = face_detection.process(test_frame)
                if results.detections:
                    score = sum([d.score[0] for d in results.detections])
                    if score > max_score:
                        max_score = score
                        best_rot = rot_val
        
        print(f"[*] AI Rotation for {os.path.basename(path)}: {best_rot} (Score: {max_score:.2f})")
        self.rotation_cache[path] = best_rot
        return best_rot

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

    def scan_and_sort(self, roots):
        clips = []
        for root in roots:
            if not os.path.exists(root): continue
            for r, d, files in os.walk(root):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(r, f)
                        if os.path.getsize(path) > 1 * 1024 * 1024:
                            clips.append({'path': path, 'time': os.path.getmtime(path)})
        clips.sort(key=lambda x: x['time'])
        return clips

    def process_video_segment(self, path, out_path, orientation, duration):
        rot = self.detect_true_rotation(path)
        transpose = ""
        
        # Determine actual dimensions after intended rotation
        cmd_dim = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', path]
        res = subprocess.run(cmd_dim, capture_output=True, text=True)
        try:
            w, h = map(int, res.stdout.strip().split('x'))
        except:
            w, h = 1920, 1080
            
        if rot == "90": 
            transpose = "transpose=1,"
            w, h = h, w
        elif rot == "270": 
            transpose = "transpose=2,"
            w, h = h, w
        elif rot == "180": 
            transpose = "transpose=2,transpose=2,"

        if orientation == "vertical":
            if w > h:
                vf = f"{transpose}scale=-1:1920,crop=1080:1920:iw*0.5-540:0,eq=brightness=0.04:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
            else:
                vf = f"{transpose}scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.04:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
        else: # Landscape
            if h > w:
                vf = f"{transpose}split[main][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=40:40[bg_out];[main]scale=1920:1080:force_original_aspect_ratio=decrease[fg];[bg_out][fg]overlay=(W-w)/2:(H-h)/2,eq=brightness=0.04:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
            else:
                vf = f"{transpose}scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.04:contrast=1.2:saturation=1.1,format=yuv420p,fps=25"
        
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

    def create_video(self, clips, photos, name, orientation, audio_path, target_dur=45):
        print(f"[*] Creating AI Fixed Short: {name} ({orientation})")
        temp_dir = os.path.join(self.output_base, f"temp_ai_{name.lower()}_{orientation}")
        os.makedirs(temp_dir, exist_ok=True)
        
        step = max(1, len(clips) // 25)
        selected_clips = clips[::step][:25]
        
        processed = []
        current_dur = 0
        clip_idx = 0
        photo_idx = 0
        
        for i in range(35):
            if current_dur >= target_dur: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            # Fast pacing
            seg_dur = 2.0 if current_dur < target_dur/2 else 1.5
            
            is_photo = False
            # Mix media: randomly decide to use photo, or force if out of clips
            if photos and (clip_idx >= len(selected_clips) or (i > 0 and i % 3 == 0)):
                is_photo = True
            
            if is_photo and photo_idx < len(photos):
                self.process_photo_segment(photos[photo_idx], out, orientation, seg_dur)
                photo_idx += 1
                if photo_idx >= len(photos): photo_idx = 0 # loop photos if needed
            else:
                if clip_idx >= len(selected_clips): break
                c_path = selected_clips[clip_idx]['path']
                self.process_video_segment(c_path, out, orientation, seg_dur)
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
        print(f"[+] AI Fixed Video Ready: {final_out}")

    def run(self):
        print("=== Starting AI Rotation Correction ===")
        self.extract_audio(self.indian_roots, self.indian_audio_path)
        indian_clips = self.scan_and_sort(self.indian_roots)
        if indian_clips:
            random.shuffle(self.indian_photos)
            self.create_video(indian_clips, self.indian_photos, "Indian_Day_Festival_AI_Fixed", "vertical", self.indian_audio_path, target_dur=45)
            self.create_video(indian_clips, self.indian_photos, "Indian_Day_Festival_AI_Fixed", "landscape", self.indian_audio_path, target_dur=45)
        print("=== AI Rotation Correction Complete ===")

if __name__ == "__main__":
    INDIAN_ROOTS = [r"d:\circle-d-flow-web\00_INBOX_RAW_ENERGY\Indian DayFestival"]
    INDIAN_PHOTOS = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Ready_To_Post\Indian_Festival_Portraits"
    OUT_BASE = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Ready_To_Post"
    
    agent = AIRotationAgent(INDIAN_ROOTS, INDIAN_PHOTOS, OUT_BASE)
    agent.run()
