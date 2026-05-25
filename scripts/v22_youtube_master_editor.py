import os
import random
import moviepy.editor as mp
import glob
from PIL import Image, ImageDraw, ImageFont
import tempfile
import numpy as np

# --- CONFIGURATION ---
PROJECT_NAME = "Kiss Your Heart"
OUTPUT_DIR = r"D:\KYHeart_Social_Media\YouTube_Master_Renders"
TEMP_DIR = r"D:\circle-d-flow-web\temp_youtube"

# Topics / Folders
TOPICS = {
    "Jam Session": r"G:\My Drive\Nova Era\KissYourHeart World\Story board lisbon\Circle D Flow 2026",
    "Flow Talk": r"G:\My Drive\Nova Era\KissYourHeart World\Story board lisbon\NarutheToken",
    "Cipher": r"G:\My Drive\Nova Era\KissYourHeart World\Story board lisbon\Cipher lx"
}

# Assets
INTRO_FILE = r"G:\My Drive\Nova Era\KissYourHeart World\Graphics\Cutt sequence.mp4"
MASCOT_FILE = r"D:\circle-d-flow-web\assets\mascot_transparent.png"
TARGET_SIZE = (1920, 1080)

def create_metadata(event_type, main_artist, video_index):
    """Generates the structured YouTube Metadata."""
    metadata_path = os.path.join(OUTPUT_DIR, f"{event_type}_{main_artist}_Vol{video_index}_YT_Metadata.txt")
    
    title = f"The True Pulse of Lisbon: Circle D {event_type} Vol. {video_index} @ Secret Garden LX | KYHeart"
    hook = f"Was passiert, wenn sich Musiker und Künstler in Lissabon treffen, um ohne Absprache im puren Flow zu kreieren? Tauche ein in die heutige Circle D {event_type} mit {main_artist}."
    
    content = f"""Titel: {title}

{hook}

0:00 - Intro & The Vibe
1:30 - Entering the Flow State
4:00 - The Peak / Community Reaction
7:00 - The Final Get-Together

🤝 Support & Advertisement:
Join the Flow: Komm in unsere Community [Link zur Telegram/Discord-Gruppe]
Support the Art: Hilf uns, diese Events kostenlos zu halten (Patreon / Buy me a Coffee / GoFundMe)
Cooperations: Interessiert an einer Zusammenarbeit oder Sponsor unseres nächsten Events? Business Inquiries: contact@kissyourheart.com

Credits: @SecretGardenLX & {main_artist}
#LisbonCommunity #JamSession #KissYourHeart #CircleDFlow #LisbonMusic #FlowState #UndergroundArt
"""
    with open(metadata_path, "w", encoding="utf-8") as f:
        f.write(content)

def process_video_clip(filepath, remove_audio=False):
    """Loads a clip, resizes to 1080p, and optionally mutes it."""
    try:
        clip = mp.VideoFileClip(filepath)
    except Exception as e:
        print(f"  Error loading {filepath}: {e}")
        return None
        
    w, h = clip.size
    target_aspect = TARGET_SIZE[0] / TARGET_SIZE[1]
    clip_aspect = w / h
    
    if clip_aspect > target_aspect:
        clip = clip.resize(height=TARGET_SIZE[1])
        new_w = clip.size[0]
        x_center = new_w / 2
        clip = clip.crop(x1=x_center - TARGET_SIZE[0]/2, y1=0, x2=x_center + TARGET_SIZE[0]/2, y2=TARGET_SIZE[1])
    else:
        clip = clip.resize(width=TARGET_SIZE[0])
        new_h = clip.size[1]
        y_center = new_h / 2
        clip = clip.crop(x1=0, y1=y_center - TARGET_SIZE[1]/2, x2=TARGET_SIZE[0], y2=y_center + TARGET_SIZE[1]/2)
        
    if remove_audio:
        clip = clip.without_audio()
        
    return clip

def add_mascot_animation(timeline_duration):
    """Creates a transparent mascot moving across the screen."""
    if not os.path.exists(MASCOT_FILE):
        return None
        
    mascot_clip = mp.ImageClip(MASCOT_FILE)
    mascot_clip = mascot_clip.resize(height=300)
    
    def move_mascot(t):
        x = -300 + (t / 5.0) * 2300
        return (int(x), 700)
        
    mascot_clip = mascot_clip.set_position(move_mascot).set_duration(5.0)
    start_time = random.uniform(5.0, max(5.0, timeline_duration - 10.0))
    mascot_clip = mascot_clip.set_start(start_time)
    
    return mascot_clip

def create_text_clip_pil(text, fontsize, color, duration):
    try:
        font = ImageFont.truetype("arial.ttf", fontsize)
    except:
        font = ImageFont.load_default()
    
    # Create an image with transparent background
    img = Image.new('RGBA', TARGET_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate text bounding box manually instead of using textsize
    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    
    x = (TARGET_SIZE[0] - w) / 2
    # In generate_intro it's position ('center', 800) so we just draw it centered for now
    draw.text((x, 800), text, fill=color, font=font)
    
    # Convert PIL Image to numpy array
    img_array = np.array(img)
    
    # Create ImageClip
    clip = mp.ImageClip(img_array).set_duration(duration)
    return clip

def generate_intro(event_type):
    """Creates an intro sequence either from file or artificially generated."""
    if os.path.exists(INTRO_FILE):
        intro_raw = process_video_clip(INTRO_FILE, remove_audio=False)
        if intro_raw is None:
            intro_raw = mp.ColorClip(size=TARGET_SIZE, color=(0,0,0)).set_duration(4.0)
    else:
        # Generate artificial Intro
        intro_raw = mp.ColorClip(size=TARGET_SIZE, color=(15,15,20)).set_duration(4.0)
        if os.path.exists(MASCOT_FILE):
            mascot_intro = mp.ImageClip(MASCOT_FILE).resize(height=500).set_position('center').set_duration(4.0)
            intro_raw = mp.CompositeVideoClip([intro_raw, mascot_intro])
            
    title_text = create_text_clip_pil(f"Circle D {event_type}", 120, 'white', 3.0)
    title_text = title_text.crossfadein(1.0).crossfadeout(1.0)
    intro_clip = mp.CompositeVideoClip([intro_raw, title_text.set_start(0.5)])
    
    return intro_clip

def create_rules_text_pil(text, duration):
    try:
        font = ImageFont.truetype("arial.ttf", 80)
    except:
        font = ImageFont.load_default()
        
    img = Image.new('RGBA', TARGET_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw text at position (900, center-ish)
    draw.text((900, 300), text, fill='white', font=font)
    
    img_array = np.array(img)
    clip = mp.ImageClip(img_array).set_duration(duration)
    return clip

def generate_rules_screen():
    """Generates the rules screen with mascot and transparent (black) background."""
    duration = 5.0
    bg = mp.ColorClip(size=TARGET_SIZE, color=(0,0,0)).set_duration(duration)
    
    clips = [bg]
    
    if os.path.exists(MASCOT_FILE):
        mascot = mp.ImageClip(MASCOT_FILE).resize(height=700)
        mascot = mascot.set_position((100, 'center')).set_duration(duration)
        clips.append(mascot)
        
    rules_text = (
        "THE CIRCLE D RULES\n\n"
        "1. Respect the Vibe\n"
        "2. Leave Ego Outside\n"
        "3. Pure Flow & Creation\n"
        "4. Community First"
    )
    
    text_clip = create_rules_text_pil(rules_text, duration)
    clips.append(text_clip)
    
    # We add a slight fade in/out so it blends smoothly
    final_rules = mp.CompositeVideoClip(clips).crossfadein(1.0).crossfadeout(1.0)
    return final_rules


def process_topic(topic_name, source_dir):
    print(f"\n--- Processing Topic: {topic_name} ---")
    all_files = []
    if os.path.exists(source_dir):
        for root, _, filenames in os.walk(source_dir):
            for f in filenames:
                all_files.append(os.path.join(root, f))
    else:
        print(f"Source dir {source_dir} not found. Skipping.")
        return
        
    videos = [f for f in all_files if f.lower().endswith(('.mov', '.mp4'))]
    if not videos:
        print(f"No videos found in {source_dir}. Skipping.")
        return

    # Generate 3 videos for this topic
    for i in range(1, 4):
        print(f"  Generating Video {i}/3 for {topic_name}...")
        
        # Pick a random master video
        master_video_path = random.choice(videos)
        
        try:
            main_clip = process_video_clip(master_video_path, remove_audio=False)
            if main_clip is None or main_clip.duration < 10:
                print("  Master video too short or failed. Skipping this iteration.")
                continue
        except Exception as e:
            print(f"  Exception occurred: {e}")
            continue
            
        max_dur = main_clip.duration
        if max_dur > 30: # Cap at 30s for automated quick rendering
            main_clip = main_clip.subclip(0, 30)
            max_dur = 30.0
            
        b_roll_videos = [v for v in videos if v != master_video_path]
        b_roll_interval = 8.0 if topic_name == "Cipher" else 15.0
        
        create_metadata(topic_name, "Community", i)
        
        overlays = []
        current_time = 5.0
        
        while current_time + 4.0 < max_dur and b_roll_videos:
            b_roll_path = random.choice(b_roll_videos)
            b_roll_clip = process_video_clip(b_roll_path, remove_audio=True)
            if b_roll_clip and b_roll_clip.duration >= 4.0:
                b_roll_clip = b_roll_clip.subclip(0, 4.0).set_start(current_time)
                if topic_name != "Cipher":
                    b_roll_clip = b_roll_clip.crossfadein(1.0).crossfadeout(1.0)
                overlays.append(b_roll_clip)
            current_time += b_roll_interval
            
        final_body = mp.CompositeVideoClip([main_clip] + overlays)
        
        mascot = add_mascot_animation(final_body.duration)
        if mascot:
            final_body = mp.CompositeVideoClip([final_body, mascot])
            
        intro_clip = generate_intro(topic_name)
        rules_clip = generate_rules_screen()
        final_video = mp.concatenate_videoclips([intro_clip, rules_clip, final_body], method="compose")
        
        out_path = os.path.join(OUTPUT_DIR, f"{topic_name.replace(' ', '_')}_Vol{i}.mp4")
        
        print(f"    -> Rendering {out_path} ...")
        final_video.write_videofile(
            out_path, fps=30, codec="libx264", audio_codec="aac",
            threads=4, preset="ultrafast", logger=None
        )
        print(f"    -> Render Complete.")
        
        # Cleanup memory
        main_clip.close()
        final_video.close()

def main():
    print("Starting Agent: YouTube Master Editor (Multi-Topic Batch Render)")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for topic, sdir in TOPICS.items():
        process_topic(topic, sdir)
        
    print("YouTube Video Successfully Created!")

if __name__ == "__main__":
    main()
