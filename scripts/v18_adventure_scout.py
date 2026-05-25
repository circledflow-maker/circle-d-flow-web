import os
import cv2
import json
import random
import numpy as np

SOURCE_DIR = r"G:\My Drive\Privat\Privat Eli &Me"
OUTPUT_JSON = r"D:\Free like a bird\adventure_metadata.json"

def analyze_frame(frame):
    """
    Analyzes an OpenCV frame to score how much 'Waterfall/Horizon' (Blue/White) 
    and 'Nature' (Green) it contains.
    """
    # Resize for massive speedup
    small = cv2.resize(frame, (64, 64))
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    
    # Define color bounds in HSV
    # Blue/Cyan (Sky, Water, Waterfall)
    lower_blue = np.array([80, 40, 40])
    upper_blue = np.array([130, 255, 255])
    
    # White (Waterfall froth, Bright horizon)
    lower_white = np.array([0, 0, 180])
    upper_white = np.array([180, 40, 255])
    
    # Green (Nature, Adventure)
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])
    
    mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)
    mask_white = cv2.inRange(hsv, lower_white, upper_white)
    mask_green = cv2.inRange(hsv, lower_green, upper_green)
    
    # Combine Blue and White for the "Waterfall / Horizon" score
    water_horizon_score = (np.sum(mask_blue > 0) + np.sum(mask_white > 0)) / (64*64)
    nature_score = np.sum(mask_green > 0) / (64*64)
    
    return water_horizon_score, nature_score

def scout_media():
    print("Agent 3 (Vision Scout): Initiating OpenCV Color Analysis...")
    
    if not os.path.exists(SOURCE_DIR):
        print(f"Source dir not found: {SOURCE_DIR}")
        return
        
    all_files = []
    for f in os.listdir(SOURCE_DIR):
        if f.lower().endswith(('.mov', '.mp4')):
            all_files.append(os.path.join(SOURCE_DIR, f))
            
    # Shuffle to get a random sample if there are too many
    random.shuffle(all_files)
    sample_files = all_files[:150] # Analyze 150 videos to find the best
    
    print(f"Scouting {len(sample_files)} videos for Waterfalls and Horizons...")
    
    waterfall_candidates = []
    nature_candidates = []
    
    for idx, filepath in enumerate(sample_files):
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            continue
            
        # Jump to frame 30 to avoid black fades
        cap.set(cv2.CAP_PROP_POS_FRAMES, 30)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            continue
            
        water_score, nature_score = analyze_frame(frame)
        
        filename = os.path.basename(filepath)
        if water_score > 0.15:
            waterfall_candidates.append({"file": filename, "score": water_score})
            print(f"  Found Water/Horizon candidate: {filename} (Score: {water_score:.2f})")
        elif nature_score > 0.15:
            nature_candidates.append({"file": filename, "score": nature_score})
            print(f"  Found Nature candidate: {filename} (Score: {nature_score:.2f})")
            
    # Sort by best scores
    waterfall_candidates = sorted(waterfall_candidates, key=lambda x: x['score'], reverse=True)
    nature_candidates = sorted(nature_candidates, key=lambda x: x['score'], reverse=True)
    
    metadata = {
        "waterfall_horizon": waterfall_candidates[:15],
        "adventure_nature": nature_candidates[:15]
    }
    
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"\nScouting Complete! Best clips saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    scout_media()
