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
    from mediapipe.python.solutions import pose as mp_pose
except ImportError:
    mp_face_detection = None
    mp_pose = None

class FestivalAftermovieAgent:
    def __init__(self, source_paths, output_dir, music_path):
        self.source_paths = source_paths
        self.output_dir = output_dir
        self.music_path = music_path
        self.clips = []
        os.makedirs(output_dir, exist_ok=True)

    def scan_media(self):
        print("[*] Scanning all media for festival energy...")
        for src in self.source_paths:
            if not os.path.exists(src): continue
            for root, d, files in os.walk(src):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(root, f)
                        # Filter out small files or previously processed ones
                        if os.path.getsize(path) > 1024 * 1024:
                            self.clips.append({'path': path, 'time': os.path.getmtime(path)})
        self.clips.sort(key=lambda x: x['time'])
        print(f"[+] Found {len(self.clips)} clips ready for production.")

    def get_subject_center(self, video_path):
        """Finds the horizontal center of interest (face or pose)."""
        if not mp_face_detection: return 0.5
        cap = cv2.VideoCapture(video_path)
        # Check a few frames in the first 2 seconds
        centers = []
        for i in range(5):
            cap.set(cv2.CAP_PROP_POS_MSEC, 500 * (i+1))
            ret, frame = cap.read()
            if not ret: break
            
            with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as face_detection:
                results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if results.detections:
                    bbox = results.detections[0].location_data.relative_bounding_box
                    centers.append(bbox.xmin + bbox.width / 2)
                else:
                    # Fallback to pose if face not found
                    if mp_pose:
                        with mp_pose.Pose(static_image_mode=True) as pose:
                            results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                            if results.pose_landmarks:
                                centers.append(results.pose_landmarks.landmark[mp_pose.PoseLandmark.NOSE].x)
        cap.release()
        if centers:
            return np.mean(centers)
        return 0.5

    def process_cinematic_segment(self, asset_path, out_path, duration=1.8):
        """Processes a segment with smart tracking and color boost."""
        cx = self.get_subject_center(asset_path)
        
        # FFmpeg filter: Smart crop + Color boost (eq filter)
        # eq: brightness=0.05, contrast=1.2, saturation=1.3
        vf = f"scale=-1:1920,crop=1080:1920:iw*{cx}-540:0,eq=brightness=0.05:contrast=1.2:saturation=1.3,format=yuv420p,fps=25"
        
        # Subtle zoom effect using zoompan
        vf += ",zoompan=z='min(zoom+0.001,1.1)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920"
        
        cmd = ['ffmpeg', '-ss', '0.5', '-t', str(duration), '-i', asset_path, '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-an', '-y', out_path]
        subprocess.run(cmd, capture_output=True)

    def produce_aftermovie(self, name, target_duration=45, clip_stride=3):
        print(f"[*] Producing Aftermovie: {name} (Duration: {target_duration}s)")
        temp_dir = os.path.join(self.output_dir, f"temp_{name.lower()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Selection: Skip every N clips to get variety
        highlights = self.clips[::clip_stride]
        
        processed = []
        current_dur = 0
        
        for i, clip in enumerate(highlights):
            if current_dur >= target_duration: break
            out = os.path.join(temp_dir, f"seg_{i:03d}.mp4")
            
            # Fast pace for festival vibe
            seg_dur = 1.5 if i % 2 == 0 else 2.2
            
            self.process_cinematic_segment(clip['path'], out, duration=seg_dur)
            if os.path.exists(out):
                processed.append(out)
                current_dur += seg_dur

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Festival_{name}.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.music_path, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-t', str(current_dur), '-shortest', '-y', final_out])
        print(f"[+] Final Aftermovie Ready: {final_out}")

if __name__ == "__main__":
    SRC = [r"d:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped", r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"]
    DEST = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    MUSIC = r"d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_V6_Audio.mp3"
    
    agent = FestivalAftermovieAgent(SRC, DEST, MUSIC)
    agent.scan_media()
    
    # Version 1: High Energy Mashup (45s)
    agent.produce_aftermovie("Ultimate_Energy_V1", target_duration=45, clip_stride=4)
    
    # Version 2: Artist & Band Focus (30s)
    agent.produce_aftermovie("Performance_Spotlight_V2", target_duration=30, clip_stride=6)
    
    # Version 3: Community & Vibe (30s)
    agent.produce_aftermovie("Garden_Community_V3", target_duration=30, clip_stride=8)
