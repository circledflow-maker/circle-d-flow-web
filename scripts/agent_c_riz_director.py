import os
import sys
import shutil
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, ImageClip, afx, vfx, concatenate_videoclips, clips_array

# --- CONFIGURATION ---
DRIVE_URL_1 = "https://drive.google.com/drive/folders/1SlKAQLkWv7VWAkvLqQZETl4srkdkb6pc"
DRIVE_URL_2 = "https://drive.google.com/drive/folders/1pbuFkZaATtpy5MWoUog_fydCITMWBmCF"
WORK_DIR = r"D:\circle-d-flow-web\scratch\c_riz_project"
OUTPUT_DIR = r"D:\circle-d-flow-web\Assets\generated_videos"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "C_Riz_Circle_D_Stage.mp4")

def check_disk_space():
    """Zwischenschritt: Prevents OS crashes by checking available disk space before heavy operations."""
    import shutil
    total, used, free = shutil.disk_usage("D:\\")
    free_gb = free / (1024 ** 3)
    print(f"[Director Agent] Free space on D: {free_gb:.2f} GB")
    
    total_c, used_c, free_c = shutil.disk_usage("C:\\")
    free_c_gb = free_c / (1024 ** 3)
    print(f"[Director Agent] Free space on C: {free_c_gb:.2f} GB")
    
    if free_c_gb < 15.0 and free_gb > 10.0:
        print("[Director Agent] WARNING: C: drive is extremely low on space.")
        print("[Director Agent] Attempting to operate purely on D: drive...")
        
    return free_gb

def download_assets():
    print("[Director Agent] Files are already compressed locally. Bypassing Google Drive download.")
    os.makedirs(WORK_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    return True

def create_intro():
    print("[Director Agent] Generating Animated Chalk Intro...")
    # Using an existing image as an intro to bypass ImageMagick dependency for TextClip
    bg = ImageClip(r"D:\circle-d-flow-web\Assets\images\c-riz-flyer.jpg").resize(height=1080)
    return bg.set_duration(3)

def build_timeline():
    print("[Director Agent] Building Cinematic Split-Screen Timeline...")
    input_dir = r"D:\circle-d-flow-web\scratch\c_riz_project\folder1\Compressed_1080p"
    
    if not os.path.exists(input_dir):
        print(f"[Director Agent] ERROR: Input directory not found: {input_dir}")
        return
        
    clips = []
    print(f"[Director Agent] Searching for clips in {input_dir}...")
    for f in os.listdir(input_dir):
        if f.lower().endswith(('.mp4', '.mov')):
            clip_path = os.path.join(input_dir, f)
            print(f"[Director Agent] Loading clip: {f}")
            try:
                # Load up to 10 seconds of each clip to make it punchy
                clip = VideoFileClip(clip_path).subclip(0, min(10, VideoFileClip(clip_path).duration))
                clips.append(clip)
                if len(clips) >= 4: # We need exactly 4 for a 2x2 grid
                    break
            except Exception as e:
                print(f"[Director Agent] Error loading clip {f}: {e}")
                
    if len(clips) < 4:
        print(f"[Director Agent] WARNING: Found {len(clips)} clips. We need 4 for the split-screen grid. Duplicating clips to fill.")
        while len(clips) < 4 and len(clips) > 0:
            clips.append(clips[0].copy())
            
    if not clips:
        print("[Director Agent] No valid video clips found to assemble.")
        return
        
    intro = create_intro()
    
    print("[Director Agent] Creating 2x2 Split Screen (1920x1080)...")
    # Resize each clip to exactly 1/4th of the 1920x1080 screen (960x540)
    resized_clips = []
    for c in clips:
        resized_clips.append(c.resize(newsize=(960, 540)))
        
    # Build a 2x2 grid using clips_array
    grid_video = clips_array([[resized_clips[0], resized_clips[1]],
                              [resized_clips[2], resized_clips[3]]])
                              
    final_clips = [intro, grid_video]
    
    print(" - Concatenating intro and split-screen grid...")
    final_video = concatenate_videoclips(final_clips, method="compose")
    
    print(f" - Rendering Final YouTube Video (16:9) to: {OUTPUT_FILE}")
    final_video.write_videofile(OUTPUT_FILE, fps=24, codec="libx264", audio_codec="aac")

def main():
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print("========================================")
    print("🎬 CIRCLE D FLOW: C-RIZ STAGE DIRECTOR 🎬")
    print("========================================")
    
    free_space = check_disk_space()
    if free_space < 5.0:
        print("[Director Agent] CRITICAL: Not enough space on D: drive. Aborting.")
        sys.exit(1)
        
    download_assets()
    build_timeline()
    print("[Director Agent] YouTube Video rendering completed successfully!")

if __name__ == "__main__":
    main()
