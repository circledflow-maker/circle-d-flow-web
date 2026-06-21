import os
import sys
import random
from moviepy.editor import VideoFileClip, ImageClip, CompositeVideoClip, clips_array

# --- CONFIGURATION ---
INPUT_DIR = r"D:\circle-d-flow-web\scratch\c_riz_project\folder1\Compressed_1080p"
PORTRAIT_DIR = r"D:\circle-d-flow-web\Assets\images"
OUTPUT_DIR = r"D:\circle-d-flow-web\Assets\generated_videos"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "C_Riz_5Min_MusicVideo.mp4")

TOTAL_DURATION = 300  # 5 minutes in seconds
W, H = 1920, 1080

def get_video_files():
    files = []
    for f in os.listdir(INPUT_DIR):
        if f.lower().endswith(('.mp4', '.mov')):
            files.append(os.path.join(INPUT_DIR, f))
    return sorted(files)

def build_music_video():
    print("[Music Video Agent] Initializing 5-Minute Render Pipeline...")
    
    video_files = get_video_files()
    if not video_files:
        print("[Music Video Agent] ERROR: No video files found in", INPUT_DIR)
        return

    print(f"[Music Video Agent] Found {len(video_files)} video clips.")
    
    # 1. Master Track (Video + Audio)
    master_path = video_files[0]
    print(f"[Music Video Agent] Loading Master Track: {os.path.basename(master_path)}")
    master_clip = VideoFileClip(master_path).subclip(0, min(TOTAL_DURATION, VideoFileClip(master_path).duration))
    actual_duration = master_clip.duration
    
    # Load B-Roll clips and strip their audio
    b_roll_clips = []
    for vp in video_files[1:]:
        print(f"[Music Video Agent] Loading B-Roll: {os.path.basename(vp)}")
        # Mute B-roll to avoid echoing
        clip = VideoFileClip(vp).subclip(0, min(actual_duration, VideoFileClip(vp).duration)).without_audio()
        b_roll_clips.append(clip)
        
    if not b_roll_clips:
        # Fallback if only 1 video exists: duplicate it for split-screen effect
        b_roll_clips.append(master_clip.without_audio())

    print("[Music Video Agent] Assembling dynamic timeline...")
    
    # Base layer is the master track
    overlays = []
    overlays.append(master_clip)
    
    # 2. Add Split-Screen / B-Roll transitions every 20 seconds
    current_time = 15
    while current_time < actual_duration - 10:
        segment_duration = random.randint(5, 12)
        b_roll = random.choice(b_roll_clips)
        
        # Determine effect type
        effect_type = random.choice(['fullscreen', 'split_left', 'split_right', 'pip'])
        
        # Subclip the B-roll so it matches chronologically
        segment = b_roll.subclip(current_time, current_time + segment_duration)
        
        if effect_type == 'fullscreen':
            # Full screen B-roll covering the master track
            segment = segment.resize(newsize=(W, H)).set_position('center')
        elif effect_type == 'split_left':
            segment = segment.resize(newsize=(W//2, H)).set_position(('left', 'center'))
        elif effect_type == 'split_right':
            segment = segment.resize(newsize=(W//2, H)).set_position(('right', 'center'))
        elif effect_type == 'pip':
            # Picture in picture
            segment = segment.resize(newsize=(W//3, H//3)).set_position(('right', 'bottom'))
            
        # Apply crossfade for smooth transition
        segment = segment.set_start(current_time).crossfadein(1).crossfadeout(1)
        overlays.append(segment)
        
        current_time += segment_duration + random.randint(5, 15)

    # 3. Portrait Overlays
    print("[Music Video Agent] Adding Portrait Overlays...")
    portraits = [
        os.path.join(PORTRAIT_DIR, "DSC_3614.JPG"),
        os.path.join(PORTRAIT_DIR, "DSC_3615.JPG"),
        os.path.join(PORTRAIT_DIR, "DSC_6730_1.JPG")
    ]
    # Filter only existing portraits
    portraits = [p for p in portraits if os.path.exists(p)]
    
    if portraits:
        current_time = 30
        while current_time < actual_duration - 10:
            portrait_path = random.choice(portraits)
            img = ImageClip(portrait_path).resize(height=H//2)
            
            # Place on left or right randomly
            pos_x = random.choice(['left', 'right'])
            
            img = img.set_start(current_time).set_duration(3).set_position((pos_x, 'center')).crossfadein(0.5).crossfadeout(0.5)
            # Add slight opacity for artistic effect
            img = img.set_opacity(0.85)
            
            overlays.append(img)
            current_time += random.randint(40, 60) # Every 40-60 seconds

    # 4. Final Composite
    print("[Music Video Agent] Compositing final video...")
    final_video = CompositeVideoClip(overlays, size=(W, H)).set_duration(actual_duration)
    
    # Fade out at the end
    final_video = final_video.fadeout(2)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"[Music Video Agent] Starting massive render job: {OUTPUT_FILE}")
    print("[Music Video Agent] WARNING: This will take a long time and use significant CPU.")
    final_video.write_videofile(OUTPUT_FILE, fps=24, codec="libx264", audio_codec="aac", threads=4, preset="fast")
    print("[Music Video Agent] Render completed successfully!")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    build_music_video()
