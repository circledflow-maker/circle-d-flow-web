import os
import json
import base64
import random
import time
import shutil
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

ASSETS_DIRS = [
    r'D:\circle-d-flow-web\Assets\lightroom_sync',
    r'D:\circle-d-flow-web\Assets\gdrive_sync'
]
OUTPUT_DIR = r'D:\circle-d-flow-web\Assets\IG_30_Days'

def gather_assets():
    all_files = []
    for d in ASSETS_DIRS:
        if os.path.exists(d):
            for f in os.listdir(d):
                if f.lower().endswith(('.jpg', '.png', '.mp4', '.mov')):
                    all_files.append(os.path.join(d, f))
    return all_files

def generate_caption(day_num, day_type, selected_files):
    # Only encode the first image to save API tokens, just to give context.
    # If there are videos, we'll just rely on text context for now to save bandwidth.
    image_parts = []
    has_image = False
    
    for f in selected_files:
        if f.lower().endswith(('.jpg', '.png')):
            try:
                with open(f, "rb") as image_file:
                    encoded = base64.b64encode(image_file.read()).decode('utf-8')
                    image_parts.append({"mime_type": "image/jpeg", "data": encoded})
                    has_image = True
                    break # Just use 1 image for context
            except Exception:
                pass

    format_type = "Carousel" if len(selected_files) > 1 else "Single Post"
    if any(f.lower().endswith(('.mp4', '.mov')) for f in selected_files):
        format_type = "Reel"

    system_prompt = f"""You are the Instagram Content Manager and "Griot" for the photographer/visionary behind "Kiss Your Heart" and "Circle D Flow" in Lisbon.
Target Audience: Lisbon locals, tourists, and artists.
Your goal is to write the perfect, algorithm-optimized Instagram caption IN ENGLISH.
Philosophy: Wu Wei, Flow, Anime vibe (Miyamoto Musashi, One Piece), community unity.

Today's Rhythm (Focus): {day_type}
Post Format: {format_type}

Follow this exact structure:
1. Hook: A powerful first sentence to stop the scroll.
2. Body (The Griot's Tale): A story about the image/video, using metaphors from the 5 Rings or Anime. Dynamic and emotional.
3. Value: Why this matters to the viewer.
4. CTA (Call To Action): Depending on the rhythm, use one of these:
   - "Link in bio for your Artist-Shooting."
   - "Secure your spot at the next Lisbon Flow Photo Walk."
   - "Save this post if you feel the vibe."
   - "Join our Circle D Flow community."

Respond STRICTLY in valid JSON:
{{
  "day": "Day_{day_num:02d}",
  "format_type": "{format_type}",
  "caption": {{
    "hook": "...",
    "body": "...",
    "cta": "..."
  }},
  "hashtags": "#KissYourHeart #CircleDFlow #LisbonPhotographer #LisbonArt #WuWei #MiyamotoMusashi #FlowState #LisbonEvents #StreetPhotographyLX",
  "target_goal": "Brand Awareness | Booking CTA | Community Engagement"
}}
"""
    try:
        if has_image:
            response = model.generate_content([system_prompt, image_parts[0]], generation_config={"response_mime_type": "application/json"})
        else:
            response = model.generate_content(system_prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating caption for Day {day_num}: {e}")
        return {
            "day": f"Day_{day_num:02d}",
            "format_type": format_type,
            "caption": {
                "hook": "Embrace the Flow.",
                "body": "A moment captured in the heart of Lisbon.",
                "cta": "Join the Circle D Flow community."
            },
            "hashtags": "#KissYourHeart #CircleDFlow",
            "target_goal": "Community Engagement"
        }

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_assets = gather_assets()
    random.shuffle(all_assets)
    
    images = [f for f in all_assets if f.lower().endswith(('.jpg', '.png'))]
    videos = [f for f in all_assets if f.lower().endswith(('.mp4', '.mov'))]
    
    rhythms = [
        "The Philosophy (Saves & Shares) - Focus on deep quotes, Wu Wei, and mindfulness.",
        "The Art (Trust & B2B) - Focus on high-end portraits and professionalism.",
        "The Movement (Reach) - Focus on Jam sessions, motion, energy, and community in Lisbon.",
        "The Forge & The Ask (Conversion) - Behind the scenes, the Griot at work. Sell Photo Walks or Brand Shootings."
    ]
    
    print(f"Starting 30-Day Instagram generation. Pool: {len(images)} images, {len(videos)} videos.")
    
    for day in range(1, 31):
        print(f"Generating Day {day} / 30...")
        day_type = rhythms[(day - 1) % 4]
        
        # Decide media based on type
        selected_files = []
        if (day - 1) % 4 == 2 and videos: # The Movement -> prioritize Reels
            selected_files.append(videos.pop())
        elif (day - 1) % 4 == 0 and len(images) > 3: # Philosophy -> Carousel
            selected_files = [images.pop() for _ in range(3)]
        else:
            if images:
                selected_files.append(images.pop())
                
        if not selected_files:
            print("Not enough media left. Stopping.")
            break
            
        data = generate_caption(day, day_type.split(' ')[1], selected_files)
        
        folder_name = f"Day_{day:02d}_{data['format_type'].replace(' ', '')}"
        day_dir = os.path.join(OUTPUT_DIR, folder_name)
        os.makedirs(day_dir, exist_ok=True)
        
        # Copy files
        for f in selected_files:
            shutil.copy2(f, os.path.join(day_dir, os.path.basename(f)))
            
        # Write caption.txt
        caption_text = f"{data['caption'].get('hook', '')}\n\n"
        caption_text += f"{data['caption'].get('body', '')}\n\n"
        caption_text += f"{data['caption'].get('cta', '')}\n\n"
        caption_text += f"{data.get('hashtags', '')}"
        
        with open(os.path.join(day_dir, "caption.txt"), "w", encoding="utf-8") as text_file:
            text_file.write(caption_text)
            
        # Write JSON meta
        with open(os.path.join(day_dir, "metadata.json"), "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, indent=4)
            
        time.sleep(6) # Respect rate limits
        
    print("30-Day Instagram Prep Complete!")

if __name__ == "__main__":
    main()
