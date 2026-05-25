import os
import random
import moviepy as mp
import datetime

# --- CONFIGURATION ---
SOURCE_ROOT = r"G:\My Drive\Nova Era\KissYourHeart World\Story board lisbon"
OUTPUT_DIR = r"D:\KYHeart_Social_Media\YouTube"
TARGET_W, TARGET_H = 1920, 1080  # Landscape format for YouTube
MAX_DURATION = 180.0  # Max 3 minutes per YouTube Jam cut
MASCOT_IMG = r"C:\Users\user\.gemini\antigravity\brain\1de40712-13df-481b-bf76-549b5152e55c\circle_d_flow_mascot_1779281988049.png"

def create_intro(duration=5.0):
    """
    Creates a cinematic text intro matching the requested branding.
    """
    # Create black background
    bg = mp.ColorClip(size=(TARGET_W, TARGET_H), color=(0, 0, 0), duration=duration)
    
    # We use Arial as a safe fallback on Windows since Impact might have scaling issues
    font_path = r"C:\Windows\Fonts\arialbd.ttf"
    if not os.path.exists(font_path):
        font_path = "Arial-Bold" # Fallback to system font name if absolute path fails

    # Main Title
    title = mp.TextClip(
        font=font_path,
        text="Circle D Flow presents\nCircleD Jam",
        font_size=120,
        color="white",
        method="caption",
        size=(TARGET_W, TARGET_H),
        text_align="center"
    ).with_position('center').with_duration(duration)
    
    # Subtitle details
    details_text = (
        "Location: Lisbon Underground\n"
        "Artists: The Circle D Flow Community\n"
    )
    
    details = mp.TextClip(
        font=font_path,
        text=details_text,
        font_size=60,
        color="#F0B27A", # Warm golden color
        method="caption",
        size=(TARGET_W, int(TARGET_H/2)),
        text_align="center"
    ).with_position(('center', 800)).with_duration(duration)
    
    clips_to_comp = [bg, title, details]
    
    # Mascot Image
    if os.path.exists(MASCOT_IMG):
        mascot = mp.ImageClip(MASCOT_IMG).with_duration(duration)
        mascot = mascot.resized(height=600)
        # Position mascot on the left
        mascot = mascot.with_position(('left', 'bottom'))
        clips_to_comp.append(mascot)
    
    # Composite the text and mascot
    intro = mp.CompositeVideoClip(clips_to_comp)
    
    # Fade in/out
    intro = intro.with_effects([mp.vfx.FadeIn(1.0), mp.vfx.FadeOut(1.0)])
    return intro

def process_video_clip(filepath):
    """Loads a clip, scales/crops it to 1920x1080 landscape, and limits duration."""
    try:
        clip = mp.VideoFileClip(filepath)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None
        
    if clip.duration is None or clip.duration < 2.0:
        return None
        
    # Take a 15 to 30 second chunk from the video to keep it dynamic
    chunk_dur = min(clip.duration, random.uniform(15.0, 30.0))
    start_time = random.uniform(0, max(0, clip.duration - chunk_dur))
    clip = clip.subclipped(start_time, start_time + chunk_dur)
    
    # Resize and crop to Landscape 16:9 (1920x1080)
    w, h = clip.size
    target_aspect = TARGET_W / TARGET_H
    clip_aspect = w / h
    
    if clip_aspect > target_aspect:
        # Clip is wider than 16:9
        clip = clip.resized(height=TARGET_H)
        new_w = clip.size[0]
        x_center = new_w / 2
        clip = clip.cropped(x1=x_center - TARGET_W/2, y1=0, x2=x_center + TARGET_W/2, y2=TARGET_H)
    else:
        # Clip is taller than 16:9 (e.g. vertical phone recording)
        # We need to zoom in severely to fill the 16:9 frame, or add blurred background.
        # Let's crop the center to fill width
        clip = clip.resized(width=TARGET_W)
        new_h = clip.size[1]
        y_center = new_h / 2
        clip = clip.cropped(x1=0, y1=y_center - TARGET_H/2, x2=TARGET_W, y2=y_center + TARGET_H/2)
        
    return clip

def main():
    print("Starting Agent 3: YouTube Jam Session Cut-Master...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Dynamically find all subfolders in the root that contain .mp4 or .mov
    valid_dirs = []
    for root, dirs, files in os.walk(SOURCE_ROOT):
        has_video = any(f.lower().endswith(('.mp4', '.mov')) for f in files)
        if has_video:
            valid_dirs.append(root)
            
    if not valid_dirs:
        print("No source folders found with video files!")
        return
        
    chosen_source = random.choice(valid_dirs)
    folder_name = os.path.basename(chosen_source)
    print(f"Chosen Jam Source: {folder_name} ({chosen_source})")
        
    # Get all video files
    video_files = [f for f in os.listdir(chosen_source) if f.lower().endswith(('.mp4', '.mov'))]
    if not video_files:
        print("No videos found in the Jam folder!")
        return
        
    # Pick a random subset of videos to create a ~3 minute Jam Session
    random.shuffle(video_files)
    
    selected_clips = []
    current_duration = 0.0
    
    print("Analyzing source files...")
    for f in video_files:
        path = os.path.join(chosen_source, f)
        clip = process_video_clip(path)
        if clip is not None:
            selected_clips.append(clip)
            current_duration += clip.duration
            print(f"  Added {f} (Duration: {clip.duration:.1f}s)")
            if current_duration >= MAX_DURATION:
                break
                
    if not selected_clips:
        print("Could not process any valid clips.")
        return
        
    print("\nCreating Cinematic Intro...")
    intro_clip = create_intro(duration=6.0)
    
    # Assembly
    print("Assembling final timeline with crossfades...")
    final_clips = [intro_clip]
    
    for clip in selected_clips:
        # Add 1-second crossfade
        c = clip.with_effects([mp.vfx.CrossFadeIn(1.0)])
        final_clips.append(c)
        
    final_video = mp.concatenate_videoclips(final_clips, padding=-1.0, method="compose")
    
    # Add fade out at the end
    final_video = final_video.with_effects([mp.vfx.FadeOut(2.0)])
    
    date_str = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    out_path = os.path.join(OUTPUT_DIR, f"JamSession_YT_{date_str}.mp4")
    
    print(f"Rendering final YouTube Video: {out_path}")
    
    final_video.write_videofile(
        out_path,
        fps=30,
        codec="libx264",
        audio_codec="aac",
        threads=4,
        preset="fast"
    )
    
    # Cleanup
    final_video.close()
    for c in final_clips:
        c.close()
        
    print(f"YouTube Jam Session successfully created!")

if __name__ == "__main__":
    main()
