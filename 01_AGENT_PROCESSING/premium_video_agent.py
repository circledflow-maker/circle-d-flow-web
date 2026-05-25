import os
import subprocess
import json
import datetime

class PremiumVideoAgent:
    def __init__(self, source_paths, output_dir, music_path):
        self.source_paths = source_paths
        self.output_dir = output_dir
        self.music_path = music_path
        self.clips = []
        self.credits = ["Sandu", "Matheus", "Mimi", "Mir", "Hope"]

    def scan_media(self):
        print("[*] Scanning all source paths (Filtering for May 8th)...")
        for src in self.source_paths:
            if not os.path.exists(src): continue
            for root, dirs, files in os.walk(src):
                for f in files:
                    if f.lower().endswith(('.mov', '.mp4')):
                        path = os.path.join(root, f)
                        try:
                            cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', path]
                            res = subprocess.check_output(cmd).decode('utf-8')
                            data = json.loads(res)
                            
                            creation_time = data['format'].get('tags', {}).get('creation_time', "")
                            if not creation_time:
                                creation_time = datetime.datetime.fromtimestamp(os.path.getmtime(path)).isoformat()
                            
                            # CRITICAL FIX: Only include content from May 8th, 2026
                            if "2026-05-08" in creation_time:
                                self.clips.append({
                                    'path': path,
                                    'timestamp': creation_time,
                                    'duration': float(data['format'].get('duration', 0))
                                })
                        except: pass
        self.clips.sort(key=lambda x: x['timestamp'])
        print(f"[*] Found {len(self.clips)} valid clips for May 8th.")

    def render_reel(self, format_type='portrait'):
        print(f"[*] Rendering {format_type} aftermovie (Ultra Smooth v4.0)...")
        temp_dir = os.path.join(self.output_dir, f"temp_{format_type}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Slower pacing: fewer clips, longer durations
        target_count = 20 
        step = max(1, len(self.clips) // target_count)
        highlights = self.clips[::step][:target_count]
        
        processed = []
        for i, clip in enumerate(highlights):
            out = os.path.join(temp_dir, f"seg_{i}.mp4")
            
            # Ultra-Smooth Pacing
            if i < target_count * 0.3: # Morning Garden
                duration = 6.0
            elif i < target_count * 0.6: # City Journey
                duration = 4.0
            else: # Jam Session
                duration = 3.0
                
            start = 1.0 # Skip the very beginning of the clip
            
            # Technical Fix for Jitter: Force 25fps, yuv420p, and reset timestamps
            vf = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p,fps=25,setpts=PTS-STARTPTS"
            if format_type == 'portrait':
                vf = "scale=1920:1080:force_original_aspect_ratio=increase,crop=607:1080,scale=1080:1920,format=yuv420p,fps=25,setpts=PTS-STARTPTS"
            
            cmd = ['ffmpeg', '-ss', str(start), '-t', str(duration), '-i', clip['path'], 
                   '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-an', '-y', out]
            subprocess.run(cmd, capture_output=True)
            processed.append(out)

        # INSERT LARGE SPLITSCREEN (5s)
        if len(processed) > 10:
            split_out = os.path.join(temp_dir, "seg_splitscreen.mp4")
            c_city = highlights[5]['path']
            c_band = highlights[-5]['path']
            
            s_vf = "[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,setpts=PTS-STARTPTS[l]; [1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,setpts=PTS-STARTPTS[r]; [l][r]hstack,format=yuv420p,fps=25"
            if format_type == 'portrait':
                s_vf = "[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setpts=PTS-STARTPTS[t]; [1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setpts=PTS-STARTPTS[b]; [t][b]vstack,format=yuv420p,fps=25"
            
            subprocess.run(['ffmpeg', '-t', '5', '-i', c_city, '-t', '5', '-i', c_band, '-filter_complex', s_vf, '-c:v', 'libx264', '-an', '-y', split_out], capture_output=True)
            processed.insert(10, split_out)

        list_path = os.path.join(temp_dir, "list.txt")
        with open(list_path, 'w') as f:
            for p in processed: f.write(f"file '{os.path.abspath(p).replace('\\', '/')}'\n")
            
        final_out = os.path.join(self.output_dir, f"Rui_Lisbon_{format_type.capitalize()}_V4_Smooth.mp4")
        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-i', self.music_path, 
                        '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-shortest', '-y', final_out])
        print(f"[+] Rendered Ultra Smooth V4: {final_out}")

if __name__ == "__main__":
    SRC = [r"D:\tag mit rui\105NZ502", r"D:\circle-d-flow-web\01_AGENT_PROCESSING\unzipped"]
    DEST = r"D:\circle-d-flow-web\01_AGENT_PROCESSING\Premium_Cuts"
    MUSIC = r"D:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel\Rui_Session_Master_Audio.mp3"
    
    agent = PremiumVideoAgent(SRC, DEST, MUSIC)
    agent.scan_media()
    agent.render_reel('portrait')
    agent.render_reel('landscape')
