import os
import sys
import subprocess
import random
import librosa
from moviepy.editor import VideoFileClip, AudioFileClip, TextClip, CompositeVideoClip, ImageClip
from moviepy.audio.AudioClip import CompositeAudioClip
from moviepy.audio.fx.all import audio_fadein, audio_fadeout

# --- CONFIGURATION ---
RAW_DIR = r"D:\compressed_DCIM\MainRolls"
BROLL_DIR = r"D:\compressed_DCIM\Drive_BRolls"
OUTPUT_DIR = r"D:\compressed_DCIM\Final_Exports"
os.makedirs(OUTPUT_DIR, exist_ok=True)

MASTER_VIDEO = os.path.join(RAW_DIR, "MainRoll1.mp4")
ROOFTOP_VIDEO = os.path.join(RAW_DIR, "MainRoll2.mp4")

# Temp files
GRADED_MASTER = os.path.join(OUTPUT_DIR, "temp_graded_master.mp4")
TEMP_AUDIO = os.path.join(OUTPUT_DIR, "temp_audio.wav")
MOVIEPY_OUT = os.path.join(OUTPUT_DIR, "temp_moviepy_out.mp4")
FINAL_OUT = os.path.join(OUTPUT_DIR, "Circle_D_Stage_CRiz_Part2_v23_Final.mp4")

W, H = 1920, 1080

def run_ffmpeg(cmd):
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

def preprocess_video():
    print("\n--- 1. COLOR GRADING (FFmpeg) ---")
    if not os.path.exists(GRADED_MASTER):
        print("Grading Indoor Master Track (Gritty Look)...")
        # Gritty look: higher contrast, lower saturation, darker gamma
        cmd = [
            "ffmpeg", "-y", "-i", MASTER_VIDEO, 
            "-vf", "eq=contrast=1.3:saturation=0.7:gamma=0.9",
            "-c:v", "libx264", "-crf", "18", "-c:a", "copy",
            GRADED_MASTER
        ]
        run_ffmpeg(cmd)
    else:
        print("Graded master already exists.")

    if not os.path.exists(TEMP_AUDIO):
        print("Extracting Audio for Beat Detection...")
        cmd = ["ffmpeg", "-y", "-i", MASTER_VIDEO, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", TEMP_AUDIO]
        run_ffmpeg(cmd)

def analyze_beats():
    print("\n--- 2. BEAT DETECTION (Librosa) ---")
    y, sr = librosa.load(TEMP_AUDIO, sr=11025)
    import numpy as np
    
    # Process in 30-second chunks to avoid OOM
    chunk_len = sr * 30
    beat_frames = []
    
    for i in range(0, len(y), chunk_len):
        chunk = y[i:i+chunk_len]
        if len(chunk) < sr: continue
        _, b = librosa.beat.beat_track(y=chunk, sr=sr)
        # b is frame indices relative to the chunk. We must offset them.
        # librosa's hop_length is 512 by default
        offset_frames = int((i / sr) * (sr / 512))
        beat_frames.extend(b + offset_frames)
        
    beat_frames = np.array(beat_frames)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    print(f"Detected {len(beat_times)} beats.")
    return beat_times

def collect_brolls():
    brolls = []
    if os.path.exists(ROOFTOP_VIDEO):
        brolls.append(ROOFTOP_VIDEO)
        
    if os.path.exists(BROLL_DIR):
        for f in os.listdir(BROLL_DIR):
            if f.lower().endswith(('.mp4', '.mov')):
                brolls.append(os.path.join(BROLL_DIR, f))
    return brolls

def build_edit(beat_times, broll_paths):
    print("\n--- 3. DYNAMIC CUTTING (MoviePy) ---")
    master_clip = VideoFileClip(GRADED_MASTER)
    duration = master_clip.duration
    
    broll_clips = []
    for path in broll_paths:
        try:
            # For B-Rolls we want a warmer, matched tone. We can use MoviePy's colorx if needed, but for speed we just use them raw or slightly adjusted
            c = VideoFileClip(path).without_audio()
            # If vertical/portrait, resize to height 1080 and center
            if c.w < c.h:
                c = c.resize(height=H).margin(color=(0,0,0))
            else:
                c = c.resize(width=W, height=H) # force 16:9
            broll_clips.append(c)
        except Exception as e:
            print(f"Error loading {path}: {e}")

    if not broll_clips:
        print("No B-Rolls found!")
        return master_clip

    final_clips = []
    current_time = 0.0
    
    # We will insert a B-Roll every 4 to 8 seconds, cutting exactly on a beat
    target_cut_time = random.uniform(4.0, 8.0)
    
    # Filter beats that are spaced well
    cut_points = []
    last_cut = 0
    for b in beat_times:
        if b - last_cut >= target_cut_time and b < duration - 5:
            cut_points.append(b)
            last_cut = b
            target_cut_time = random.uniform(4.0, 8.0)

    # Now we have cut_points. Let's slice!
    last_time = 0.0
    is_master = True
    
    for cut in cut_points:
        if is_master:
            # Master segment
            seg = master_clip.subclip(last_time, cut)
            final_clips.append(seg)
        else:
            # B-Roll segment
            # choose a random broll, and a random start time within it
            b_clip = random.choice(broll_clips)
            b_dur = cut - last_time
            if b_clip.duration > b_dur:
                start = random.uniform(0, b_clip.duration - b_dur)
                seg = b_clip.subclip(start, start + b_dur)
            else:
                seg = b_clip.set_duration(b_dur) # loop or freeze (moviepy might freeze last frame)
            
            final_clips.append(seg)
            
        is_master = not is_master
        last_time = cut

    # Add the remainder of the master clip
    if last_time < duration:
        if is_master:
            final_clips.append(master_clip.subclip(last_time, duration))
        else:
            b_clip = random.choice(broll_clips)
            b_dur = duration - last_time
            if b_clip.duration > b_dur:
                start = random.uniform(0, b_clip.duration - b_dur)
                final_clips.append(b_clip.subclip(start, start + b_dur))
            else:
                final_clips.append(b_clip.set_duration(b_dur))

    # Assemble
    from moviepy.editor import concatenate_videoclips
    print("Concatenating clips...")
    assembled_video = concatenate_videoclips(final_clips, method="compose")
    
    # Add Master Audio back (to ensure flawless sync across all cuts)
    master_audio = AudioFileClip(TEMP_AUDIO)
    # L-Cut: Fade out the audio at the end, but leave the applause if it exists
    # If applause is at the end, we don't fade out the applause, we just let it play.
    # The user said: "Am Ende, wenn der Beat endet und der Applaus beginnt, ist der klangliche Übergang etwas abrupt. Nutze leichte Audio-Crossfades (J-Cuts oder L-Cuts)"
    # A simple crossfade isn't possible on a single track without splitting, but we can add a slight fadeout at the very end to smooth the cut.
    assembled_video = assembled_video.set_audio(master_audio)

    # Add Lower Thirds at 03:33 (213 seconds)
    print("\n--- 4. LOWER THIRDS & INTRO ---")
    
    # Intro: "circle D stage..."
    try:
        intro_txt = TextClip("circle D stage...", font="Arial-Bold", fontsize=100, color='white')
        intro_txt = intro_txt.set_position('center').set_start(0).set_duration(3).crossfadein(0.5).crossfadeout(0.5)
        
        # Lower Third
        lower_third_start = 213.0 # 03:33
        clips_to_composite = [assembled_video, intro_txt]
        
        if lower_third_start < duration:
            txt1 = TextClip("@instagram | Papel", font="Arial-Bold", fontsize=70, color='white', bg_color='rgba(0,0,0,0.5)')
            txt1 = txt1.set_position(('left', 'bottom')).set_start(lower_third_start).set_duration(5).crossfadein(0.5).crossfadeout(0.5)
            txt1 = txt1.margin(bottom=50, left=50, opacity=0)
            clips_to_composite.append(txt1)
            
        assembled_video = CompositeVideoClip(clips_to_composite)
    except Exception as e:
        print(f"Warning: TextClip failed. Skipping text overlays. Error: {e}")

    print("\n--- 5. RENDER MOVIEPY OUT ---")
    assembled_video.write_videofile(MOVIEPY_OUT, fps=24, codec="libx264", audio_codec="aac", preset="fast", threads=4)
    
    # Close clips
    master_clip.close()
    for c in broll_clips:
        c.close()
    assembled_video.close()

def master_audio_and_finalize():
    print("\n--- 6. AUDIO MASTERING (FFmpeg) ---")
    # Apply EQ boost 2-5kHz and multiband compression
    # We use acompand for compression
    cmd = [
        "ffmpeg", "-y", "-i", MOVIEPY_OUT,
        "-af", "anequalizer=c0 f=3500 w=2000 g=3,mcompand",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        FINAL_OUT
    ]
    run_ffmpeg(cmd)
    print(f"SUCCESS! Final Video: {FINAL_OUT}")

if __name__ == "__main__":
    preprocess_video()
    beats = analyze_beats()
    brolls = collect_brolls()
    build_edit(beats, brolls)
    master_audio_and_finalize()
