import os
import random
import time
import subprocess
import glob
import xml.etree.ElementTree as ET
import urllib.parse

# --- CONFIGURATION ---
BASE_PATH = r"D:\alterlife Content"
PROXY_DIR = r"D:\KyheartLx_Studio\alter_life_2026\02_Proxies"
PROJECT_ROOT = r"D:\KyheartLx_Studio\alter_life_2026\03_DaVinci_Projects"
OUTPUT_XML = os.path.join(PROJECT_ROOT, "alter_life_60s_Story_Split.xml")

os.makedirs(PROXY_DIR, exist_ok=True)
os.makedirs(PROJECT_ROOT, exist_ok=True)

FPS = 24.0

def get_dayparty_bucket(filepath):
    mtime = os.path.getmtime(filepath)
    hour = time.localtime(mtime).tm_hour
    if 10 <= hour < 17: return "DAYTIME"
    elif 17 <= hour < 20: return "GOLDEN_HOUR"
    else: return "NIGHT"

def ensure_proxy(src, dst):
    """Generates a 720p proxy if it doesn't exist"""
    if os.path.exists(dst):
        return True
    try:
        print(f"Generating Proxy: {os.path.basename(src)}")
        cmd = [
            'ffmpeg', '-y', '-i', src,
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '26',
            '-vf', 'scale=-2:720,format=yuv420p',
            '-c:a', 'aac', '-b:a', '128k',
            dst
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"Proxy failed for {src}: {e}")
        return False

def scan_and_bin():
    print("\n--- PHASE 1: MEDIA SCAN & BINNING ---")
    valid_exts = {'.mp4', '.mov', '.avi', '.mkv'}
    
    # Bins: { category: { bucket: [clips] } }
    bins = {
        "SENDER": {"DAYTIME": [], "GOLDEN_HOUR": [], "NIGHT": []},
        "RECEIVER": {"DAYTIME": [], "GOLDEN_HOUR": [], "NIGHT": []}
    }
    
    sender_kws = ['dj', 'deck', 'stage', 'booth', 'performer', 'dsc', 'canon'] # Added more sender keywords
    receiver_kws = ['crowd', 'dance', 'community', 'face', 'energy', 'people', 'gx']
    
    for root, dirs, files in os.walk(BASE_PATH):
        for f in files:
            if os.path.splitext(f)[1].lower() in valid_exts:
                full_path = os.path.join(root, f)
                bucket = get_dayparty_bucket(full_path)
                
                # Proxy setup
                proxy_name = f"proxy_{os.path.basename(full_path)}"
                if not proxy_name.lower().endswith('.mp4'):
                    proxy_name = os.path.splitext(proxy_name)[0] + ".mp4"
                proxy_path = os.path.join(PROXY_DIR, proxy_name)
                
                # Classify
                name_low = f.lower()
                is_sender = any(kw in name_low for kw in sender_kws)
                is_receiver = any(kw in name_low for kw in receiver_kws) or not is_sender
                
                clip_data = {
                    "original": full_path,
                    "proxy": proxy_path,
                    "filename": proxy_name,
                    "timestamp": os.path.getmtime(full_path)
                }
                
                if is_sender: bins["SENDER"][bucket].append(clip_data)
                if is_receiver: bins["RECEIVER"][bucket].append(clip_data)
                
    return bins

def build_narrative_timeline(bins):
    print("--- PHASE 2: CONSTRUCTING 60s NARRATIVE ---")
    timeline = { "V1": [], "V2": [], "A1": [], "A2": [] } # A1: Music, A2: Crowd
    
    current_frame = 0
    total_duration = 60.0
    
    def add_clip(track, clip, start_f, dur_f, scale=100, cx=0, cy=0):
        if not ensure_proxy(clip['original'], clip['proxy']): return
        timeline[track].append({
            "clip": clip, "start": start_f, "dur": dur_f,
            "scale": scale, "cx": cx, "cy": cy
        })

    # 1. 0-5s: The Hook (Full Screen Crowd - Night/Golden)
    hook_dur = int(5.0 * FPS)
    hook_choices = bins["RECEIVER"]["NIGHT"] + bins["RECEIVER"]["GOLDEN_HOUR"]
    if not hook_choices: hook_choices = bins["RECEIVER"]["DAYTIME"]
    
    if hook_choices:
        add_clip("V1", random.choice(hook_choices), 0, hook_dur, scale=178) 
    current_frame = hook_dur

    # 2. 5-20s: The Gathering (Daytime Split)
    while current_frame < int(20.0 * FPS):
        dur = int(random.uniform(2, 4) * FPS)
        sender = random.choice(bins["SENDER"]["DAYTIME"]) if bins["SENDER"]["DAYTIME"] else None
        receiver = random.choice(bins["RECEIVER"]["DAYTIME"]) if bins["RECEIVER"]["DAYTIME"] else None
        
        # Split: Top=Sender (-480), Bottom=Receiver (480)
        if sender: add_clip("V2", sender, current_frame, dur, scale=100, cy=-480)
        if receiver: add_clip("V1", receiver, current_frame, dur, scale=100, cy=480)
        current_frame += dur

    # 3. 20-45s: The Flow (Golden Hour Split)
    current_frame = max(current_frame, int(20.0 * FPS))
    while current_frame < int(45.0 * FPS):
        dur = int(1.2 * FPS) 
        sender = random.choice(bins["SENDER"]["GOLDEN_HOUR"]) if bins["SENDER"]["GOLDEN_HOUR"] else None
        receiver = random.choice(bins["RECEIVER"]["GOLDEN_HOUR"]) if bins["RECEIVER"]["GOLDEN_HOUR"] else None
        
        if sender: add_clip("V2", sender, current_frame, dur, scale=100, cy=-480)
        if receiver: add_clip("V1", receiver, current_frame, dur, scale=100, cy=480)
        current_frame += dur

    # 4. 45-55s: The Climax (Night Chaos)
    current_frame = max(current_frame, int(45.0 * FPS))
    while current_frame < int(55.0 * FPS):
        dur = int(0.6 * FPS) 
        mode = random.choice(["FULL_S", "FULL_R", "SPLIT"])
        s = random.choice(bins["SENDER"]["NIGHT"]) if bins["SENDER"]["NIGHT"] else None
        r = random.choice(bins["RECEIVER"]["NIGHT"]) if bins["RECEIVER"]["NIGHT"] else None
        
        if mode == "FULL_S" and s: add_clip("V1", s, current_frame, dur, scale=178)
        elif mode == "FULL_R" and r: add_clip("V1", r, current_frame, dur, scale=178)
        elif mode == "SPLIT":
            if s: add_clip("V2", s, current_frame, dur, scale=100, cy=-480)
            if r: add_clip("V1", r, current_frame, dur, scale=100, cy=480)
        current_frame += dur

    # 5. 55-60s: The Afterglow
    current_frame = max(current_frame, int(55.0 * FPS))
    outro_dur = int(60 * FPS) - current_frame
    if outro_dur > 0:
        choices = bins["RECEIVER"]["DAYTIME"] if bins["RECEIVER"]["DAYTIME"] else bins["RECEIVER"]["GOLDEN_HOUR"]
        if choices:
            add_clip("V1", random.choice(choices), current_frame, outro_dur, scale=178)

    return timeline

def write_xml(timeline, out_path):
    # Calculate total duration in frames
    last_v1 = timeline["V1"][-1] if timeline["V1"] else None
    last_v2 = timeline["V2"][-1] if timeline["V2"] else None
    total_frames = max((last_v1['start'] + last_v1['dur'] if last_v1 else 0), 
                      (last_v2['start'] + last_v2['dur'] if last_v2 else 0))

    root = ET.Element("xmeml", version="5")
    sequence = ET.SubElement(root, "sequence")
    ET.SubElement(sequence, "name").text = "alter_life_60s_Story_Split"
    ET.SubElement(sequence, "duration").text = str(total_frames)
    
    # Mandatory Sequence Rate
    s_rate = ET.SubElement(sequence, "rate")
    ET.SubElement(s_rate, "timebase").text = str(int(FPS))
    ET.SubElement(s_rate, "ntsc").text = "FALSE"
    
    media = ET.SubElement(sequence, "media")
    video = ET.SubElement(media, "video")
    v_format = ET.SubElement(video, "format")
    sample = ET.SubElement(v_format, "samplecharacteristics")
    ET.SubElement(sample, "width").text = "1080"
    ET.SubElement(sample, "height").text = "1920"
    v_rate = ET.SubElement(sample, "rate")
    ET.SubElement(v_rate, "timebase").text = str(int(FPS))
    ET.SubElement(v_rate, "ntsc").text = "FALSE"
    
    def build_track(parent, clips, track_id):
        track = ET.SubElement(parent, "track")
        for i, c in enumerate(clips):
            item = ET.SubElement(track, "clipitem", id=f"clip_{track_id}_{i}")
            ET.SubElement(item, "name").text = c['clip']['filename']
            ET.SubElement(item, "duration").text = str(c['dur'] * 2) # FCP7 quirk: often uses 2x for duration in some places or just dur
            
            # Clip Rate
            c_rate = ET.SubElement(item, "rate")
            ET.SubElement(c_rate, "timebase").text = str(int(FPS))
            ET.SubElement(c_rate, "ntsc").text = "FALSE"
            
            ET.SubElement(item, "start").text = str(c['start'])
            ET.SubElement(item, "end").text = str(c['start'] + c['dur'])
            ET.SubElement(item, "in").text = "0"
            ET.SubElement(item, "out").text = str(c['dur'])
            
            file = ET.SubElement(item, "file", id=f"file_{track_id}_{i}")
            ET.SubElement(file, "name").text = c['clip']['filename']
            
            # ABSOLUTE URI ENCODED PATH (file:///D:/...)
            f_path = c['clip']['proxy'].replace('\\', '/')
            if not os.path.exists(c['clip']['proxy']):
                print(f"!!! CRITICAL: Proxy file missing: {c['clip']['proxy']}")
            
            # Resolve prefers file:/// with encoded special chars
            encoded_path = urllib.parse.quote(f_path, safe='/:')
            path_url = f"file:///{f_path}" # Simple absolute path works best in Resolve 20
            ET.SubElement(file, "pathurl").text = path_url
            
            # File Rate and Duration
            f_rate = ET.SubElement(file, "rate")
            ET.SubElement(f_rate, "timebase").text = str(int(FPS))
            ET.SubElement(f_rate, "ntsc").text = "FALSE"
            ET.SubElement(file, "duration").text = str(c['dur'] * 2)
            
            # Simple Motion Filter 
            filter_node = ET.SubElement(item, "filter")
            effect = ET.SubElement(filter_node, "effect")
            ET.SubElement(effect, "name").text = "Basic Motion"
            ET.SubElement(effect, "effectid").text = "basic"
            ET.SubElement(effect, "effectcategory").text = "motion"
            ET.SubElement(effect, "effecttype").text = "motion"
            ET.SubElement(effect, "mediatype").text = "video"
            
            p_scale = ET.SubElement(effect, "parameter")
            ET.SubElement(p_scale, "parameterid").text = "scale"
            ET.SubElement(p_scale, "name").text = "Scale"
            ET.SubElement(p_scale, "value").text = str(c['scale'])
            
            p_center = ET.SubElement(effect, "parameter")
            ET.SubElement(p_center, "parameterid").text = "center"
            ET.SubElement(p_center, "name").text = "Center"
            val = ET.SubElement(p_center, "value")
            ET.SubElement(val, "horiz").text = str(c['cx'])
            ET.SubElement(val, "vert").text = str(c['cy'])

    build_track(video, timeline["V1"], "v1")
    build_track(video, timeline["V2"], "v2")
    
    audio = ET.SubElement(media, "audio")
    a_track2 = ET.SubElement(audio, "track")
    for i, c in enumerate(timeline["V1"]):
        a_item = ET.SubElement(a_track2, "clipitem", id=f"audio_amb_{i}")
        ET.SubElement(a_item, "name").text = c['clip']['filename']
        ET.SubElement(a_item, "duration").text = str(c['dur'] * 2)
        
        arate = ET.SubElement(a_item, "rate")
        ET.SubElement(arate, "timebase").text = str(int(FPS))
        ET.SubElement(arate, "ntsc").text = "FALSE"
        
        ET.SubElement(a_item, "start").text = str(c['start'])
        ET.SubElement(a_item, "end").text = str(c['start'] + c['dur'])
        ET.SubElement(a_item, "in").text = "0"
        ET.SubElement(a_item, "out").text = str(c['dur'])
        
        file = ET.SubElement(a_item, "file", id=f"file_a_v1_{i}")
        path = c['clip']['proxy'].replace('\\', '/')
        ET.SubElement(file, "pathurl").text = f"file:///{path}"
        
        # Audio Rate
        frate = ET.SubElement(file, "rate")
        ET.SubElement(frate, "timebase").text = str(int(FPS))
        ET.SubElement(frate, "ntsc").text = "FALSE"
        ET.SubElement(file, "duration").text = str(c['dur'] * 2)
        
        filter_node = ET.SubElement(a_item, "filter")
        effect = ET.SubElement(filter_node, "effect")
        ET.SubElement(effect, "name").text = "Audio Levels"
        ET.SubElement(effect, "effectid").text = "audiolevels"
        param = ET.SubElement(effect, "parameter")
        ET.SubElement(param, "parameterid").text = "level"
        ET.SubElement(param, "value").text = "-15"

    with open(out_path, 'wb') as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write(ET.tostring(root, encoding='utf-8'))

def main():
    print("====================================")
    print(" ALTER.LIFE STORYTELLING ENGINE v15 ")
    print("====================================\n")
    
    bins = scan_and_bin()
    timeline = build_narrative_timeline(bins)
    write_xml(timeline, OUTPUT_XML)
    
    print(f"\n[SUCCESS] XML Masterpiece Generated:")
    print(f" -> {OUTPUT_XML}")

if __name__ == "__main__":
    main()
