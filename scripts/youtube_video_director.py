import os
import json
import base64
import time
from datetime import datetime
from collections import defaultdict
import google.generativeai as genai
from dotenv import load_dotenv
import cv2

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

ASSETS_DIRS = [
    r'D:\circle-d-flow-web\Assets\lightroom_sync',
    r'D:\circle-d-flow-web\Assets\gdrive_sync'
]
OUTPUT_DIR = r'D:\circle-d-flow-web\Assets\YouTube_Sessions'

def gather_videos():
    all_videos = []
    for d in ASSETS_DIRS:
        if os.path.exists(d):
            for f in os.listdir(d):
                if f.lower().endswith(('.mp4', '.mov')):
                    path = os.path.join(d, f)
                    # Group by modification date (simulating shoot date)
                    mod_time = os.path.getmtime(path)
                    date_str = datetime.fromtimestamp(mod_time).strftime('%Y-%m-%d')
                    all_videos.append({"path": path, "date": date_str, "name": f})
    return all_videos

def analyze_session(date, videos):
    # Pass metadata to Gemini to decide format
    video_names = ", ".join([v['name'] for v in videos])
    
    system_prompt = f"""You are the Lead Video Director for "Circle D Flow" (Lisbon).
You are analyzing a batch of raw video files shot on {date}.
The files are: {video_names}.

Task: Based on typical Lisbon underground music/art scenarios, classify this session into ONE of three formats:
1. Big Stage Jam (Casa Mocamba / Secret Garden LX - Loud, bands, dynamic)
2. Flow Talks (Artist Interviews - Speaking, storytelling, calm)
3. Tiny Cypher (Acoustic, intimate, rap/vocals in a small circle)

If it is "Flow Talks", you MUST generate 3 insightful interview questions/chapters based on typical artist struggles (e.g., Finding flow, Lisbon's vibe, The art process) with dummy timestamps.

Respond STRICTLY in English JSON:
{{
  "detected_session_date": "{date}",
  "format_selected": "Big Stage Jam | Flow Talks | Tiny Cypher",
  "youtube_title": "Circle D [Format] | Lisbon Art | Purer Flow",
  "youtube_description": "Experience the raw energy of Lisbon... (Include BAZAR and Event links)",
  "technical_instructions": {{
    "audio_processing_applied": ["Vocal Isolation", "Bass Normalization"],
    "color_grade": "Cinematic Warm Amber & Deep Violet",
    "editing_style": "Dynamic Beat-Cut OR A/B-Roll Storytelling"
  }},
  "tags": ["Lisbon Artists", "Flow Talks", "Kiss Your Heart", "Interview"],
  "flow_talks_chapters": [
    {{"timestamp": "00:00", "chapter": "Intro: Welcome to the Flow"}},
    {{"timestamp": "02:15", "chapter": "The struggle of creating art in a noisy world"}},
    {{"timestamp": "05:30", "chapter": "Why Lisbon is the perfect canvas"}}
  ]
}}
"""
    try:
        response = model.generate_content(system_prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating session concept for {date}: {e}")
        return {
            "format_selected": "Flow Talks",
            "youtube_title": "Circle D Flow Talks | Lisbon",
            "technical_instructions": {"editing_style": "A/B-Roll Storytelling"},
            "tags": ["Lisbon Artists"]
        }

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    videos = gather_videos()
    
    if not videos:
        print("No videos found in Assets folders.")
        return
        
    sessions = defaultdict(list)
    for v in videos:
        sessions[v['date']].append(v)
        
    print(f"Found {len(sessions)} distinct session days.")
    
    for date, session_videos in sessions.items():
        print(f"Processing session for {date} ({len(session_videos)} clips)...")
        data = analyze_session(date, session_videos)
        
        format_clean = data.get('format_selected', 'Unknown_Format').replace(' ', '_')
        folder_name = f"Session_{date}_{format_clean}"
        session_dir = os.path.join(OUTPUT_DIR, folder_name)
        
        os.makedirs(session_dir, exist_ok=True)
        
        # We don't actually copy the 10GB video files here to save disk space,
        # we will create symlinks or just a text file referencing them.
        ref_file = os.path.join(session_dir, "raw_media_references.txt")
        with open(ref_file, "w", encoding="utf-8") as rf:
            rf.write("Source files for this edit:\n")
            for v in session_videos:
                rf.write(f"- {v['path']}\n")
                
        # Write JSON instructions
        with open(os.path.join(session_dir, "Editing_Instructions.json"), "w", encoding="utf-8") as jf:
            json.dump(data, jf, indent=4)
            
        # Generate DaVinci Resolve EDL
        edl_path = os.path.join(session_dir, "DaVinci_Timeline.edl")
        title = data.get("youtube_title", f"Session_{date}")
        with open(edl_path, "w", encoding="utf-8") as f:
            f.write(f"TITLE: {title}\n")
            f.write("FCM: NON-DROP FRAME\n\n")
            
            current_timeline_frames = 0
            
            for i, video in enumerate(session_videos):
                path = video['path']
                name = video['name']
                
                try:
                    cap = cv2.VideoCapture(path)
                    fps = cap.get(cv2.CAP_PROP_FPS)
                    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                    cap.release()
                    if fps <= 0 or frame_count <= 0:
                        raise ValueError("Invalid metadata")
                except:
                    fps = 24.0
                    frame_count = 240.0
                
                def f2tc(frames, fps_val):
                    h = int(frames // (fps_val * 3600))
                    f_rem = frames % (fps_val * 3600)
                    m = int(f_rem // (fps_val * 60))
                    f_rem %= (fps_val * 60)
                    s = int(f_rem // fps_val)
                    fr = int(f_rem % fps_val)
                    return f"{h:02d}:{m:02d}:{s:02d}:{fr:02d}"
                
                src_start = "00:00:00:00"
                src_end = f2tc(frame_count, fps)
                rec_start = f2tc(current_timeline_frames, fps)
                current_timeline_frames += frame_count
                rec_end = f2tc(current_timeline_frames, fps)
                
                f.write(f"{i+1:03d}  AX       V     C        {src_start} {src_end} {rec_start} {rec_end}\n")
                f.write(f"* FROM CLIP NAME: {name}\n\n")
            
        time.sleep(2) # rate limit
        
    print("YouTube Sessions Prep Complete!")

if __name__ == "__main__":
    main()
