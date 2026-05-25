import os
import datetime
import json

# --- CONFIGURATION ---
BASE_DIR = r"D:\KYHeart_Social_Media"
IG_DIR = os.path.join(BASE_DIR, "Instagram")
YT_DIR = os.path.join(BASE_DIR, "YouTube_Edits")
GDRIVE_DIR = r"G:\My Drive"

# The "Wu Wei" 7-Day Flow Plan
# Maps weekday integer (0=Monday, 6=Sunday) to its theme, hashtags, and a caption template.
FLOW_PLAN = {
    0: {
        "theme": "Community & Jamsession",
        "hashtags": "#CircleDFlow #LisbonCommunity #JamSession #UndergroundArt",
        "caption": "The energy of the weekend still echoing. When the community comes together, pure magic happens. 🎶✨\n\nDrop a comment if you were there or felt the vibe!"
    },
    1: {
        "theme": "Artist Flow",
        "hashtags": "#ArtistFlow #KYHeart #LisbonArtists #CreativeZone",
        "caption": "Spotlight on raw talent. Catching artists in 'The Zone' – that moment when nothing else matters but the flow. 🎨🔥\n\nWho is your favorite local hero?"
    },
    2: {
        "theme": "Wu Wei & Life",
        "hashtags": "#WuWei #FlowState #MindfulArt #KYHeart",
        "caption": "Effortless action. Sometimes the best thing you can do is step back, breathe, and let the current guide you. Nature always knows the way. 🌿💧"
    },
    3: {
        "theme": "City Flow & Architecture",
        "hashtags": "#LisbonX #CityFlow #UrbanPhotography #StreetArt",
        "caption": "The urban stage. Every corner of Lisbon holds a story, a contrast, a hidden rhythm waiting to be captured. 🏙️👁️\n\nWhat's your favorite street in the city?"
    },
    4: {
        "theme": "City Experience & Art",
        "hashtags": "#LisbonExperience #UndergroundArt #WillOfD #WeekendVibes",
        "caption": "The weekend is calling. The anticipation of upcoming gatherings, Secret Gardens, and underground art. Are you ready to merge with the crowd? 🌟🔥"
    },
    5: {
        "theme": "Nature & Kontrast",
        "hashtags": "#NatureFlow #Grounding #Rhythm #CasCasNuts",
        "caption": "Grounding. Connecting back to the roots. Feel the rhythm of the earth and the pulse of the Cas Cas nuts. True flow starts from the ground up. 🌍🌰"
    },
    6: {
        "theme": "The Will of D & Philosophy",
        "hashtags": "#TheWillOfD #CreativeFreedom #FlowPhilosophy #PirateSpirit",
        "caption": "The Pirate Spirit. Uncaged creativity and the relentless pursuit of freedom. This is the philosophy that drives us. Embrace the Will of D. 🏴‍☠️⚓"
    }
}

def setup_youtube_folders():
    """Sets up Agent 2 (Video Master) directory structure."""
    print("Setting up Agent 2: YouTube Video Editor Pipeline...")
    categories = [
        "01_Circle_D_Jam_Highlights",
        "02_Flow_Talks_Interviews",
        "03_Community_Docu_BRoll"
    ]
    for cat in categories:
        cat_path = os.path.join(YT_DIR, cat)
        os.makedirs(cat_path, exist_ok=True)
        # Create a placeholder instructions file for the agent
        with open(os.path.join(cat_path, "_AGENT_INSTRUCTIONS.txt"), "w", encoding="utf-8") as f:
            f.write(f"Agent 2 Target Folder: {cat}\nExtract material from Google Drive and render final videos here.")
            
def generate_30_day_calendar():
    """Sets up Agent 1 (Social Media Manager) 30-Day Instagram Pipeline."""
    print("Setting up Agent 1: 30-Day Auto-Marinated Instagram Pipeline...")
    
    # Start from today
    today = datetime.date.today()
    
    for i in range(30):
        target_date = today + datetime.timedelta(days=i)
        weekday_idx = target_date.weekday()
        weekday_name = target_date.strftime("%A")
        
        flow = FLOW_PLAN[weekday_idx]
        theme_safe = flow["theme"].replace(" & ", "_").replace(" ", "")
        
        folder_name = f"{target_date.strftime('%Y-%m-%d')}_{weekday_name}_{theme_safe}"
        folder_path = os.path.join(IG_DIR, folder_name)
        
        os.makedirs(folder_path, exist_ok=True)
        
        # 1. Create Media Carousel Subfolder
        media_folder = os.path.join(folder_path, "01_Media_Carousel")
        os.makedirs(media_folder, exist_ok=True)
        
        # 2. Write the Caption & Hashtags
        caption_file = os.path.join(folder_path, "Caption.txt")
        with open(caption_file, "w", encoding="utf-8") as f:
            f.write(f"--- AUTO-GENERATED POST FOR {target_date.strftime('%B %d, %Y')} ---\n")
            f.write(f"Theme: {flow['theme']}\n\n")
            f.write("[CAPTION]\n")
            f.write(f"{flow['caption']}\n\n")
            f.write("[HASHTAGS]\n")
            f.write(f"{flow['hashtags']}\n\n")
            f.write("[FIRST COMMENT]\n")
            f.write("Follow @kyheart.lx and @circle.d.flow for more underground art and Flow state experiences in Lisbon! 🌊\n")
            
        print(f"Generated: {folder_name}")

def scan_gdrive_sources():
    """Agent Pre-Scan: Locates target folders in GDrive to feed the Content Engine."""
    print("\nAgent Pre-Scan: Searching GDrive for Source Media (Hempyroots, Jam, Macamba)...")
    sources = {
        "jam_sessions": [],
        "flow_talks": [],
        "b_roll": []
    }
    
    # Simple recursive directory walk to find target folders
    if os.path.exists(GDRIVE_DIR):
        try:
            for root, dirs, files in os.walk(GDRIVE_DIR):
                for d in dirs:
                    d_lower = d.lower()
                    if "hempy" in d_lower or "jam" in d_lower or "macamba" in d_lower:
                        full_path = os.path.join(root, d)
                        sources["jam_sessions"].append(full_path)
                    elif "talk" in d_lower or "interview" in d_lower:
                        full_path = os.path.join(root, d)
                        sources["flow_talks"].append(full_path)
                        
                # Limit depth to avoid infinite scanning of deep drives
                if root.count(os.sep) - GDRIVE_DIR.count(os.sep) > 3:
                    del dirs[:]
        except Exception as e:
            print(f"Warning during GDrive scan: {e}")
            
    # Save the known sources config for the Agents to pull from later
    config_path = os.path.join(BASE_DIR, "Agent_Media_Sources.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(sources, f, indent=4)
        
    print(f"Identified {len(sources['jam_sessions'])} Jam Session source folders.")
    print(f"Identified {len(sources['flow_talks'])} Flow Talk source folders.")
    print(f"Config saved to {config_path}")

def main():
    print("======================================================")
    print("   KYHeart & Circle D Flow Content Engine INIT")
    print("======================================================")
    
    os.makedirs(BASE_DIR, exist_ok=True)
    os.makedirs(IG_DIR, exist_ok=True)
    os.makedirs(YT_DIR, exist_ok=True)
    
    setup_youtube_folders()
    print("-" * 40)
    generate_30_day_calendar()
    print("-" * 40)
    scan_gdrive_sources()
    
    print("\nSUCCESS: Phase 3 Automated Pipeline is LIVE.")
    print(f"Check your fully prepared 30-day calendar at: {IG_DIR}")

if __name__ == "__main__":
    main()
