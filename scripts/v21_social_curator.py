import os
import shutil
import datetime
import random
import time
try:
    from PIL import Image, ImageEnhance
except ImportError:
    print("Pillow not installed. Please run: pip install Pillow")
    exit(1)

def safe_copy(src, dst):
    """Copies large files in chunks to avoid Windows Error 1450."""
    if os.path.exists(dst):
        return
    chunk_size = 1024 * 1024 * 16 # 16 MB chunks
    with open(src, 'rb') as fsrc:
        with open(dst, 'wb') as fdst:
            while True:
                chunk = fsrc.read(chunk_size)
                if not chunk:
                    break
                fdst.write(chunk)
    time.sleep(0.05)

def apply_kyheart_look(img_path, dest_path):
    """Applies the KYHeart 'Lightroom' look via Pillow and crops to 4:5."""
    try:
        with Image.open(img_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            # 1. Auto-Crop to 4:5 (Instagram Carousel Standard)
            target_ratio = 4.0 / 5.0
            w, h = img.size
            current_ratio = w / h
            
            if current_ratio > target_ratio:
                # Image is too wide, crop width
                new_w = int(h * target_ratio)
                left = (w - new_w) / 2
                right = left + new_w
                img = img.crop((left, 0, right, h))
            elif current_ratio < target_ratio:
                # Image is too tall, crop height
                new_h = int(w / target_ratio)
                top = (h - new_h) / 2
                bottom = top + new_h
                img = img.crop((0, top, w, bottom))
                
            # 2. Cinematic Urban Look Grading
            # Contrast +20
            img = ImageEnhance.Contrast(img).enhance(1.20)
            # Shadows/Highlights approx (Brightness slightly up to save shadows)
            img = ImageEnhance.Brightness(img).enhance(1.05)
            # Clarity/Dehaze approx (Sharpness)
            img = ImageEnhance.Sharpness(img).enhance(1.15)
            # Saturation -5
            img = ImageEnhance.Color(img).enhance(0.95)
            
            # Save
            img.save(dest_path, quality=95)
            return True
    except Exception as e:
        print(f"Failed to process image {img_path}: {e}")
        return False

# --- CONFIGURATION ---
SOURCE_BASE = r"G:\My Drive\Nova Era\KissYourHeart World\Story board lisbon"
DEST_BASE = r"D:\KYHeart_Social_Media\Instagram\Schedule"

# Mapping of Weekday (0=Monday, 6=Sunday)
WEEKDAY_MAPPING = {
    0: {
        "suffix": "Monday_Community_Jamsession",
        "theme": "Community",
        "hook": "The raw frequency of the collective soul. 🌊",
        "philosophy": "When the community gathers without a script, true magic happens. This is the pure, unfiltered essence of the Zone—where individual ego dissolves into the collective rhythm.",
        "hashtags": "#KissYourHeart #CircleDFlow #LisbonCommunity #JamSession #FlowState #UndergroundArt #MusicIsLife #LisbonVibes #CollectiveEnergy #WuWei"
    },
    1: {
        "suffix": "Tuesday_ArtistFlow",
        "theme": "Artist Flow",
        "hook": "There is a specific moment when the noise fades and only the rhythm remains. 🎨",
        "philosophy": "Dropping into the zone. When artists align with their craft, you don't just hear the music or see the art—you feel the shadow work behind it. No scripts, just pure expression.",
        "hashtags": "#KissYourHeart #ArtistFlow #CircleDFlow #LisbonUnderground #WuWei #ShadowWork #CreativeZone #StreetPhotography #LisbonArtists #ArtLife"
    },
    2: {
        "suffix": "Wednesday_Animals",
        "theme": "Animals",
        "hook": "Spontaneous connections and the untamed spirit of the city. 🐕",
        "philosophy": "Animals remind us to live purely in the present. Their flow is instinctive and unbroken. Observing them is a masterclass in Wu Wei.",
        "hashtags": "#KissYourHeart #Animals #CityPets #StreetLife #PureInstinct #CircleDFlow #LisbonDogs #PresentMoment"
    },
    3: {
        "suffix": "Thursday_Architecture",
        "theme": "Architecture",
        "hook": "Symmetry, shadows, and the silent heartbeat of the city. 🏛️",
        "philosophy": "Lisbon isn't just a backdrop; it's an active participant in our flow. We let the structure of the streets and the urban contrast guide our vision.",
        "hashtags": "#KissYourHeart #CityFlow #LisbonArchitecture #UrbanExploration #ConcreteJungle #StreetPhotography #CityVibes #UrbanArt #LisbonStreets #CircleDFlow"
    },
    4: {
        "suffix": "Friday_Graffiti_Art",
        "theme": "Graffiti",
        "hook": "The streets are breathing in colors. 💥",
        "philosophy": "Graffiti is the voice of the underground. We capture the raw expressions painted on the city's canvas, representing the untold stories of the streets.",
        "hashtags": "#KissYourHeart #CityExperience #Graffiti #StreetArt #LisbonArt #UndergroundVibes #CreativeLisbon #HipHopCulture #CircleDFlow"
    },
    5: {
        "suffix": "Saturday_Nature_Kontrast",
        "theme": "Nature",
        "hook": "Disconnecting from the noise to reconnect with the roots. 🌿",
        "philosophy": "Nature provides the ultimate contrast to the city hustle. It grounds the spirit and offers the silence necessary for the next wave of creativity to build.",
        "hashtags": "#KissYourHeart #NatureContrast #Grounding #EarthVibes #NaturalFlow #DisconnectToConnect #LisbonNature #MindfulLiving #WuWei #CircleDFlow"
    },
    6: {
        "suffix": "Sunday_WuWei_Life",
        "theme": "Wu Wei",
        "hook": "Effortless action. The art of flowing like water through the concrete jungle. 💧",
        "philosophy": "Wu Wei is not about doing nothing. It’s about listening to the environment and moving perfectly in sync with it. Capturing these candid moments reminds us to stop forcing and start living.",
        "hashtags": "#KissYourHeart #WuWei #Mindfulness #EffortlessAction #LisbonLife #DocumentaryPhotography #CandidMoments #SpiritualGrowth #FlowState #CircleDFlow"
    }
}

CTAS = [
    "What puts you in your flow state today? Drop it in the comments. 👇",
    "If you feel this energy, share it with someone who needs the vibe today. ✨",
    "Join the movement. How are you connecting with your community this week? 🌊"
]

ASSETS_PER_DAY = 7
TOTAL_DAYS = 30

def generate_caption(mapping):
    """Generates the structured English SEO caption."""
    hook = mapping["hook"]
    context = "Capturing the true essence of the community in Lisbon."
    philosophy = mapping["philosophy"]
    cta = random.choice(CTAS)
    hashtags = mapping["hashtags"]
    
    caption = f"{hook}\n\n{context} {philosophy}\n\n{cta}\n\n{hashtags}"
    return caption

def get_all_files(folder_path):
    files = []
    for root, _, filenames in os.walk(folder_path):
        for f in filenames:
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.mp4', '.mov')):
                full_path = os.path.join(root, f)
                files.append(full_path)
    return files

def analyze_and_categorize(all_files):
    print("  [Agent] Analyzing and categorizing files based on parameters...")
    categorized = {
        "Community": [], "Artist Flow": [], "Animals": [], 
        "Architecture": [], "Graffiti": [], "Nature": [], "Wu Wei": []
    }
    
    # AI Parameters / Keywords for classification
    params = {
        "Animals": ["tier", "animal", "dog", "cat", "rui", "pet"],
        "Graffiti": ["graffiti", "art", "paint", "hiphop", "ceramic", "wall", "mocambo"],
        "Architecture": ["architektur", "architecture", "city", "building", "street", "komplex", "story"],
        "Nature": ["natur", "nature", "park", "tree", "sun", "outdoor", "vibe"],
        "Community": ["jam", "community", "crowd", "people", "session", "hempy", "secret", "chapit"],
        "Artist Flow": ["artist", "flow", "music", "create", "manu", "riz", "naru"],
    }
    
    for f in all_files:
        assigned = False
        lower_path = f.lower()
        for theme, keywords in params.items():
            if any(kw in lower_path for kw in keywords):
                categorized[theme].append(f)
                assigned = True
                break
        if not assigned:
            categorized["Wu Wei"].append(f)
            
    # Guarantee we have enough assets per bucket for 30 days
    all_f_shuffled = list(all_files)
    random.shuffle(all_f_shuffled)
    
    for theme in categorized:
        if len(categorized[theme]) < (TOTAL_DAYS * ASSETS_PER_DAY):
            # Fill with random assets to ensure folders are not empty
            needed = (TOTAL_DAYS * ASSETS_PER_DAY) - len(categorized[theme])
            categorized[theme].extend(random.sample(all_f_shuffled, min(len(all_f_shuffled), needed)))
            
    return categorized

def main():
    print(f"Starting Agent 5: 30-Day Social Media Curator (AI Parameter Analysis)...")
    
    if os.path.exists(DEST_BASE):
        shutil.rmtree(DEST_BASE)
    os.makedirs(DEST_BASE, exist_ok=True)
    
    print(f"Scanning entire directory for assets: {SOURCE_BASE}")
    all_files = get_all_files(SOURCE_BASE)
    
    if not all_files:
        print("No media files found in source base!")
        return
        
    print(f"Found {len(all_files)} total assets. Running AI classification...")
    categorized_assets = analyze_and_categorize(all_files)
    
    today = datetime.datetime.now()
    
    for day_offset in range(TOTAL_DAYS):
        target_date = today + datetime.timedelta(days=day_offset)
        date_str = target_date.strftime("%Y-%m-%d")
        weekday_num = target_date.weekday()
        
        mapping = WEEKDAY_MAPPING[weekday_num]
        theme = mapping["theme"]
        dest_folder = os.path.join(DEST_BASE, f"{date_str}_{mapping['suffix']}")
        os.makedirs(dest_folder, exist_ok=True)
        
        print(f"\nProcessing Day {day_offset+1}/30: {mapping['suffix']} (Theme: {theme})...")
        
        # 1. Generate Caption
        caption_path = os.path.join(dest_folder, "instagram_post.txt")
        try:
            with open(caption_path, "w", encoding="utf-8") as f:
                f.write(generate_caption(mapping))
            print("  Created English SEO caption.")
        except Exception as e:
            pass
        
        # 2. Curate and Edit Assets
        pool = categorized_assets[theme]
        if not pool:
            print("  No media files available for this theme!")
            continue
            
        # Pop files so we don't repeat them too often
        selected_files = []
        for _ in range(min(ASSETS_PER_DAY, len(pool))):
            selected_files.append(pool.pop(0))
            
        print(f"  Processing {len(selected_files)} assets for {theme}...")
        
        for i, filepath in enumerate(selected_files):
            ext = os.path.splitext(filepath)[1].lower()
            safe_theme = theme.replace(' ', '').replace(',', '')
            new_filename = f"{safe_theme}_{i+1:02d}{ext}"
            dest_path = os.path.join(dest_folder, new_filename)
            
            if ext in ['.jpg', '.jpeg', '.png']:
                # Image -> Apply PIL "Lightroom" Look
                apply_kyheart_look(filepath, dest_path)
            else:
                # Video -> Just copy
                safe_copy(filepath, dest_path)

    print("\nSocial Media Schedule built and Color Graded for the next 30 days!")

if __name__ == "__main__":
    main()

