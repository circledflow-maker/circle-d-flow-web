import os
import json
import random
import xml.etree.ElementTree as ET
from datetime import datetime

# --- CONFIG ---
MANIFEST_PATH = r"D:\KyheartLx_Studio\alter_life_2026\ingest_manifest.json"
PROJECT_ROOT = r"D:\KyheartLx_Studio\alter_life_2026\03_DaVinci_Projects"
ASSETS_DIR = r"D:\circle-d-flow-web\assets\live_ingest"
MUSIC_PATH = r"D:\circle-d-flow-web\Music\qter-deelem edit 2 @256.mp3"
LOGO_PATH = r"D:\circle-d-flow-web\CDF Black.logo.png"
MASTER_FPS = 25.0
BPM = 124.0 

def create_fcp7_xml(name, track1_clips, track2_clips, music_path, logos):
    root = ET.Element("xmeml", version="4")
    
    # Calculate total duration based on track1_clips
    total_duration = 0
    if track1_clips:
        last_clip = track1_clips[-1]
        total_duration = last_clip['start_frame'] + last_clip['duration_frames']

    sequence = ET.SubElement(root, "sequence", id=f"seq_{name}")
    ET.SubElement(sequence, "name").text = name
    ET.SubElement(sequence, "duration").text = str(int(total_duration))
    
    s_rate = ET.SubElement(sequence, "rate")
    ET.SubElement(s_rate, "timebase").text = str(int(MASTER_FPS))
    ET.SubElement(s_rate, "ntsc").text = "FALSE"
    
    media = ET.SubElement(sequence, "media")
    video = ET.SubElement(media, "video")
    
    v_format = ET.SubElement(video, "format")
    sample_char = ET.SubElement(v_format, "samplecharacteristics")
    ET.SubElement(sample_char, "width").text = "1920"
    ET.SubElement(sample_char, "height").text = "1080"
    ET.SubElement(sample_char, "pixelaspectratio").text = "square"
    f_rate = ET.SubElement(sample_char, "rate")
    ET.SubElement(f_rate, "timebase").text = str(int(MASTER_FPS))
    ET.SubElement(f_rate, "ntsc").text = "FALSE"

    def build_track(track_parent, clips_list, track_idx):
        if not clips_list: return
        track = ET.SubElement(track_parent, "track")
        for i, clip in enumerate(clips_list):
            clipitem = ET.SubElement(track, "clipitem", id=f"clip_t{track_idx}_{i}")
            ET.SubElement(clipitem, "name").text = clip['name']
            ET.SubElement(clipitem, "duration").text = str(int(clip['src_duration_frames']))
            
            c_rate = ET.SubElement(clipitem, "rate")
            ET.SubElement(c_rate, "timebase").text = str(int(MASTER_FPS))
            ET.SubElement(c_rate, "ntsc").text = "FALSE"
            
            ET.SubElement(clipitem, "start").text = str(int(clip['start_frame']))
            ET.SubElement(clipitem, "end").text = str(int(clip['start_frame'] + clip['duration_frames']))
            ET.SubElement(clipitem, "in").text = "0"
            ET.SubElement(clipitem, "out").text = str(int(clip['duration_frames']))
            
            file_node = ET.SubElement(clipitem, "file", id=f"file_t{track_idx}_{i}")
            ET.SubElement(file_node, "name").text = os.path.basename(clip['path'])
            clean_path = clip['path'].replace('\\', '/')
            ET.SubElement(file_node, "pathurl").text = f"file:///{clean_path}"
            
            f_rate_node = ET.SubElement(file_node, "rate")
            ET.SubElement(f_rate_node, "timebase").text = str(int(MASTER_FPS))
            ET.SubElement(f_rate_node, "ntsc").text = "FALSE"
            ET.SubElement(file_node, "duration").text = str(int(clip['src_duration_frames']))
            
            tc_node = ET.SubElement(file_node, "timecode")
            tc_rate = ET.SubElement(tc_node, "rate")
            ET.SubElement(tc_rate, "timebase").text = str(int(MASTER_FPS))
            ET.SubElement(tc_rate, "ntsc").text = "FALSE"
            ET.SubElement(tc_node, "string").text = "00:00:00:00"
            ET.SubElement(tc_node, "frame").text = "0"
            ET.SubElement(tc_node, "displayformat").text = "NDF"
            
            # SPLIT SCREEN BASIC MOTION FILTER
            if 'split_scale' in clip and 'split_center' in clip:
                filter_node = ET.SubElement(clipitem, "filter")
                effect = ET.SubElement(filter_node, "effect")
                ET.SubElement(effect, "name").text = "Basic Motion"
                ET.SubElement(effect, "effectid").text = "basic"
                ET.SubElement(effect, "effectcategory").text = "motion"
                ET.SubElement(effect, "effecttype").text = "motion"
                ET.SubElement(effect, "mediatype").text = "video"
                
                # Scale param
                param_scale = ET.SubElement(effect, "parameter")
                ET.SubElement(param_scale, "parameterid").text = "scale"
                ET.SubElement(param_scale, "name").text = "Scale"
                ET.SubElement(param_scale, "value").text = str(clip['split_scale'])
                
                # Center param
                param_center = ET.SubElement(effect, "parameter")
                ET.SubElement(param_center, "parameterid").text = "center"
                ET.SubElement(param_center, "name").text = "Center"
                val_node = ET.SubElement(param_center, "value")
                ET.SubElement(val_node, "horiz").text = str(clip['split_center'][0])
                ET.SubElement(val_node, "vert").text = str(clip['split_center'][1])
                
    # --- VIDEO TRACK 1 (Main Content/Split Left/Split Top) ---
    build_track(video, track1_clips, 1)
    
    # --- VIDEO TRACK 2 (Split Right/Split Bottom) ---
    build_track(video, track2_clips, 2)
    
    # --- VIDEO TRACK 3 (Logos) ---
    if logos:
        track_logo = ET.SubElement(video, "track")
        logo_files = [
            {"id": "logo_start", "name": "Logo_Start", "start": 0, "end": int(MASTER_FPS * 5)},
            {"id": "logo_end", "name": "Logo_End", "start": int(max(0, total_duration - MASTER_FPS * 5)), "end": int(total_duration)}
        ]
        
        for l in logo_files:
            if l['end'] <= l['start']: continue
            l_item = ET.SubElement(track_logo, "clipitem", id=l['id'])
            ET.SubElement(l_item, "name").text = l['name']
            l_rate = ET.SubElement(l_item, "rate")
            ET.SubElement(l_rate, "timebase").text = str(int(MASTER_FPS))
            ET.SubElement(l_rate, "ntsc").text = "FALSE"
            ET.SubElement(l_item, "start").text = str(l['start'])
            ET.SubElement(l_item, "end").text = str(l['end'])
            ET.SubElement(l_item, "in").text = "0"
            ET.SubElement(l_item, "out").text = str(l['end'] - l['start'])
            
            l_file = ET.SubElement(l_item, "file", id="file_logo")
            ET.SubElement(l_file, "pathurl").text = f"file:///{LOGO_PATH.replace('\\','/')}"
            lf_rate = ET.SubElement(l_file, "rate")
            ET.SubElement(lf_rate, "timebase").text = str(int(MASTER_FPS))
            ET.SubElement(lf_rate, "ntsc").text = "FALSE"
            
    # --- AUDIO TRACK (Music) ---
    audio = ET.SubElement(media, "audio")
    a_track = ET.SubElement(audio, "track")
    a_clip = ET.SubElement(a_track, "clipitem", id="music_main")
    ET.SubElement(a_clip, "name").text = os.path.basename(music_path)
    
    a_rate = ET.SubElement(a_clip, "rate")
    ET.SubElement(a_rate, "timebase").text = str(int(MASTER_FPS))
    ET.SubElement(a_rate, "ntsc").text = "FALSE"
    
    ET.SubElement(a_clip, "start").text = "0"
    ET.SubElement(a_clip, "end").text = str(int(total_duration))
    ET.SubElement(a_clip, "in").text = "0"
    ET.SubElement(a_clip, "out").text = str(int(total_duration))
    
    a_file = ET.SubElement(a_clip, "file", id="file_music")
    # Resolve issue where drive letter must be lowercased or simply valid
    ET.SubElement(a_file, "pathurl").text = f"file:///{music_path.replace('\\','/')}"
    af_rate = ET.SubElement(a_file, "rate")
    ET.SubElement(af_rate, "timebase").text = str(int(MASTER_FPS))
    ET.SubElement(af_rate, "ntsc").text = "FALSE"

    return ET.tostring(root, encoding='utf-8')


def generate_timelines():
    if not os.path.exists(MANIFEST_PATH): return
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)

    portraits = [c for c in manifest if c.get('has_portrait')]
    environment = [c for c in manifest if not c.get('has_portrait')]
    
    frames_per_beat = MASTER_FPS / (BPM / 60.0)
    
    os.makedirs(PROJECT_ROOT, exist_ok=True)
    
    styles = [
        {"name": "01_Signature_Anime", "beats": 4, "limit": 300, "res": (1920, 1080), "split_chance": 0},
        {"name": "02_Trend_Energy", "beats": 1, "limit": 60, "res": (1920, 1080), "split_chance": 0},
        {"name": "03_Cinematic_Story", "beats": 8, "limit": 300, "res": (1920, 1080), "split_chance": 0},
        {"name": "04_CapCut_Vibe_Vertical", "beats": 0.5, "limit": 60, "res": (1080, 1920), "split_chance": 0},
        {"name": "05_CapCut_Vibe_Stickers", "beats": 2, "limit": 300, "res": (1920, 1080), "split_chance": 0},
        {"name": "06_CapCut_Vibe_Vlog", "beats": 6, "limit": 300, "res": (1920, 1080), "split_chance": 0},
        {"name": "07_SplitScreen_Alterlife", "beats": 4, "limit": 120, "res": (1920, 1080), "split_chance": 0.25}
    ]
    
    random.seed(42) # Consistent outputs for testing
    
    for style in styles:
        track1_clips = []
        track2_clips = []
        
        clip_duration_frames = int(style['beats'] * frames_per_beat)
        if clip_duration_frames < 5: clip_duration_frames = 5
        
        # Build Storyline Logic: Intro (Env) -> Body (Mix) -> Outro (Env)
        pool = environment[:20] + (portraits * 5) + environment[20:]
        
        current_frame = 0
        current_time_s = 0
        i = 0
        
        while i < len(pool) and current_time_s < style['limit']:
            raw_clip = pool[i]
            p_path = raw_clip['proxy_path']
            if not os.path.exists(p_path):
                alt_path = p_path.replace('.mp4', '.MP4') if p_path.endswith('.mp4') else p_path.replace('.MP4', '.mp4')
                if os.path.exists(alt_path):
                    p_path = alt_path
                else:
                    i += 1
                    continue
            
            is_split = False
            # Check split screen conditions
            if style['split_chance'] > 0 and i + 1 < len(pool):
                if random.random() < style['split_chance']:
                    # We need a valid second clip
                    raw_clip_2 = pool[i+1]
                    p_path_2 = raw_clip_2['proxy_path']
                    if not os.path.exists(p_path_2):
                        alt_path_2 = p_path_2.replace('.mp4', '.MP4') if p_path_2.endswith('.mp4') else p_path_2.replace('.MP4', '.mp4')
                        if os.path.exists(alt_path_2): p_path_2 = alt_path_2
                    
                    if os.path.exists(p_path_2):
                        is_split = True
            
            if is_split:
                # Decide vertical vs horizontal based on filename heuristics (mock dj vs dance)
                # If neither is explicitly in filename, randomize
                f1_name = raw_clip['filename'].lower()
                f2_name = pool[i+1]['filename'].lower()
                
                is_dj = 'dj' in f1_name or 'dj' in f2_name
                is_dance = 'dance' in f1_name or 'dance' in f2_name
                
                if not is_dj and not is_dance:
                    is_dj = random.random() > 0.5
                    
                if is_dj:
                    # Vertical Split (Side by side)
                    scale = 50
                    t1_center = [-0.25, 0] # Left
                    t2_center = [0.25, 0]  # Right
                else:
                    # Horizontal Split (Top/Bottom)
                    scale = 50
                    t1_center = [0, -0.25] # Top
                    t2_center = [0, 0.25]  # Bottom
                
                # Add Track 1 Layer
                track1_clips.append({
                    "name": raw_clip['filename'], "path": p_path,
                    "start_frame": current_frame, "duration_frames": clip_duration_frames,
                    "src_duration_frames": int(raw_clip.get('duration', 10) * MASTER_FPS),
                    "split_scale": scale, "split_center": t1_center
                })
                # Add Track 2 Layer
                track2_clips.append({
                    "name": pool[i+1]['filename'], "path": p_path_2,
                    "start_frame": current_frame, "duration_frames": clip_duration_frames,
                    "src_duration_frames": int(pool[i+1].get('duration', 10) * MASTER_FPS),
                    "split_scale": scale, "split_center": t2_center
                })
                
                i += 2
            else:
                track1_clips.append({
                    "name": raw_clip['filename'],
                    "path": p_path,
                    "start_frame": current_frame,
                    "duration_frames": clip_duration_frames,
                    "src_duration_frames": int(raw_clip.get('duration', 10) * MASTER_FPS)
                })
                i += 1
                
            current_frame += clip_duration_frames
            current_time_s += (clip_duration_frames / MASTER_FPS)

        if not track1_clips:
            print(f"Skipping {style['name']} - No valid proxies found.")
            continue
            
        xml_data = create_fcp7_xml(style['name'], track1_clips, track2_clips, MUSIC_PATH, True)
        out_path = os.path.join(PROJECT_ROOT, f"{style['name']}.xml")
        with open(out_path, 'wb') as f:
            f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write(xml_data)
        print(f"Generated {style['name']}.xml")

if __name__ == "__main__":
    generate_timelines()
