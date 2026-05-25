import os
import random
import moviepy as mp
import subprocess
import glob

# --- CONFIGURATION ---
ARTIST_NAME = "Naru the Token"
THEME = "Shadow Work"
SOURCE_DIR = r"G:\My Drive\Nova Era\KissYourHeart World\Story board lisbon\NarutheToken"
INTRO_OUTRO_FILE = r"G:\My Drive\Nova Era\KissYourHeart World\Graphics\Cutt sequence.mp4"
OUTPUT_DIR = r"D:\KYHeart_Social_Media\02_Flow_Talks_Interviews"
YT_BG_TRACK = "https://www.youtube.com/watch?v=5ECYpkzbMWI"
TARGET_SIZE = (1920, 1080)
TEMP_DIR = r"D:\circle-d-flow-web\temp_flowtalk"

def download_bg_track():
    """Downloads the YouTube audio track using yt-dlp."""
    print("Downloading background track from YouTube...")
    os.makedirs(TEMP_DIR, exist_ok=True)
    out_path = os.path.join(TEMP_DIR, "bg_track.mp3")
    
    if os.path.exists(out_path):
        print("Background track already downloaded.")
        return out_path
        
    cmd = [
        "yt-dlp",
        "-x", "--audio-format", "mp3",
        "-o", out_path,
        YT_BG_TRACK
    ]
    subprocess.run(cmd, check=True)
    return out_path

def create_metadata():
    """Generates the YouTube metadata file."""
    metadata_path = os.path.join(OUTPUT_DIR, f"{ARTIST_NAME.replace(' ', '')}_{THEME.replace(' ', '')}_Metadata.txt")
    content = f"""Titel: {ARTIST_NAME} — Die Tiefe von {THEME} | Flow Talks by KYHeart

Beschreibung:
In dieser Episode tauchen wir in den Flow von {ARTIST_NAME} ein und sprechen über {THEME}. Ein ruhiger, tiefgründiger Einblick in die Gedankenwelt eines echten Künstlers aus Lissabon.
NEW | EDUCATION | COMMUNITY CHANNEL

Kiss Your Heart captures the true essence of people, places, and communities — the moment when someone enters the Zone.

Location: Lissabon, Mobbeat Headquarter
Community: Circle D Flow

Hashtags: #FlowTalks #{ARTIST_NAME.replace(' ', '')} #KYHeart #CircleDFlow #LisbonArtists #{THEME.replace(' ', '')} #WuWei
"""
    with open(metadata_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated Metadata: {metadata_path}")

def process_video_clip(filepath):
    """Loads a clip and resizes/crops to 16:9 1080p without changing speed."""
    try:
        clip = mp.VideoFileClip(filepath)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None
        
    w, h = clip.size
    target_aspect = TARGET_SIZE[0] / TARGET_SIZE[1]
    clip_aspect = w / h
    
    if clip_aspect > target_aspect:
        clip = clip.resized(height=TARGET_SIZE[1])
        new_w = clip.size[0]
        x_center = new_w / 2
        clip = clip.cropped(x1=x_center - TARGET_SIZE[0]/2, y1=0, x2=x_center + TARGET_SIZE[0]/2, y2=TARGET_SIZE[1])
    else:
        clip = clip.resized(width=TARGET_SIZE[0])
        new_h = clip.size[1]
        y_center = new_h / 2
        clip = clip.cropped(x1=0, y1=y_center - TARGET_SIZE[1]/2, x2=TARGET_SIZE[0], y2=y_center + TARGET_SIZE[1]/2)
        
    return clip

def main():
    print("Starting Agent 4: Flow Talk Cut-Master...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    bg_track_path = download_bg_track()
    create_metadata()
    
    print("Analyzing source files...")
    all_files = os.listdir(SOURCE_DIR)
    videos = [os.path.join(SOURCE_DIR, f) for f in all_files if f.lower().endswith(('.mov', '.mp4'))]
    images = [os.path.join(SOURCE_DIR, f) for f in all_files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not videos:
        print("No video files found for the interview!")
        return
        
    if not os.path.exists(INTRO_OUTRO_FILE):
        print(f"Intro/Outro sequence not found at {INTRO_OUTRO_FILE}")
        return
        
    print(f"Found {len(videos)} video clips and {len(images)} B-Roll images.")
    
    # 1. Structure the Video
    raw_intro_outro = process_video_clip(INTRO_OUTRO_FILE)
    
    # Add text overlay to the intro
    font_path = r"C:\Windows\Fonts\arialbd.ttf"
    if not os.path.exists(font_path):
        font_path = "Arial-Bold"
        
    intro_title = mp.TextClip(
        font=font_path,
        text="CIRCLE D FLOW\npresents",
        font_size=100,
        color="white",
        method="caption",
        size=(1920, 1080),
        text_align="center"
    ).with_position(('center', 300)).with_duration(raw_intro_outro.duration)
    
    intro_subtitle = mp.TextClip(
        font=font_path,
        text="FLOWTALK",
        font_size=150,
        color="#F0B27A",
        method="caption",
        size=(1920, 1080),
        text_align="center"
    ).with_position(('center', 600)).with_duration(raw_intro_outro.duration)
    
    intro_outro_clip = mp.CompositeVideoClip([raw_intro_outro, intro_title, intro_subtitle])
    
    # Select longest video for the hook (to guarantee we have at least 5s of good talking)
    main_video = None
    max_dur = 0
    for v in videos:
        clip = mp.VideoFileClip(v)
        if clip.duration > max_dur:
            max_dur = clip.duration
            main_video = clip
            
    if main_video.duration < 10.0:
        print("Main video is too short!")
        return

    # Extract Hook (first 7 seconds)
    hook_clip = main_video.subclipped(0, 7.0)
    
    # Rest of the interview (after hook)
    body_clip = main_video.subclipped(7.0, main_video.duration)
    
    # 2. B-Roll Integration (Overlay on Body Clip)
    # We will overlay B-Roll images onto the body clip every 15 seconds, for 6 seconds each.
    # The audio of the body clip remains intact!
    overlays = []
    current_time = 5.0 # Start first B-roll 5s into the body
    
    while current_time + 6.0 < body_clip.duration and images:
        img_path = random.choice(images)
        # Create image clip
        img_clip = mp.ImageClip(img_path).with_duration(6.0)
        # Resize to fill 1080p
        img_clip = img_clip.resized(height=1080)
        if img_clip.size[0] < 1920:
            img_clip = img_clip.resized(width=1920)
        # Crop center
        x_center, y_center = img_clip.size[0]/2, img_clip.size[1]/2
        img_clip = img_clip.cropped(x1=x_center-960, y1=y_center-540, x2=x_center+960, y2=y_center+540)
        
        # Simple crossfade transitions for the B-Roll
        img_clip = img_clip.with_start(current_time).with_effects([mp.vfx.CrossFadeIn(1.0), mp.vfx.FadeOut(1.0)])
        overlays.append(img_clip)
        
        current_time += random.uniform(15.0, 25.0) # Random interval between 15-25s
        
    # Combine Body with B-Rolls
    if overlays:
        body_with_broll = mp.CompositeVideoClip([body_clip] + overlays)
    else:
        body_with_broll = body_clip
        
    # 3. Assemble Timeline
    # Hook -> Intro -> Body -> Outro
    final_clips = [
        hook_clip.with_effects([mp.vfx.FadeOut(0.5)]),
        intro_outro_clip.with_effects([mp.vfx.CrossFadeIn(0.5), mp.vfx.FadeOut(0.5)]),
        body_with_broll.with_effects([mp.vfx.CrossFadeIn(0.5), mp.vfx.FadeOut(0.5)]),
        intro_outro_clip.with_effects([mp.vfx.CrossFadeIn(0.5), mp.vfx.FadeOut(2.0)])
    ]
    
    final_video = mp.concatenate_videoclips(final_clips, padding=-0.5, method="compose")
    
    # 4. Audio Mixing
    print("Mixing audio...")
    bg_audio = mp.AudioFileClip(bg_track_path)
    
    # Loop bg_audio to match final_video duration
    if bg_audio.duration < final_video.duration:
        bg_audio = bg_audio.with_effects([mp.vfx.Loop(duration=final_video.duration)])
    else:
        bg_audio = bg_audio.subclipped(0, final_video.duration)
        
    # Drop bg volume to 10%
    bg_audio = bg_audio.with_effects([mp.vfx.MultiplyVolume(0.1)])
    
    # Mix voiceover with bg music
    mixed_audio = mp.CompositeAudioClip([final_video.audio, bg_audio])
    final_video = final_video.with_audio(mixed_audio)
    
    # 5. Export
    out_path = os.path.join(OUTPUT_DIR, f"{ARTIST_NAME.replace(' ', '')}_{THEME.replace(' ', '')}_FlowTalk.mp4")
    print(f"Rendering final Flow Talk Video: {out_path}")
    
    final_video.write_videofile(
        out_path,
        fps=30,
        codec="libx264",
        audio_codec="aac",
        threads=4,
        preset="fast"
    )
    
    print("Flow Talk Interview successfully created!")

if __name__ == "__main__":
    main()
