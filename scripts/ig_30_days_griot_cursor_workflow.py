"""
30-Day Instagram Griot — Cursor workflow copy.
- Does NOT modify ig_30_days_griot.py, .env, HTML/JS, or Excel.
- Writes output to Assets/IG_30_Days_cursor_workflow/ (separate from Antigravity run).
"""
from __future__ import annotations

import base64
import json
import os
import random
import shutil
import time

from gemini_helper_cursor_workflow import configure_genai, generate_with_fallback

genai = configure_genai()

ROOT = r"D:\circle-d-flow-web"
ASSETS_DIRS = [
    os.path.join(ROOT, "Assets", "lightroom_sync"),
    os.path.join(ROOT, "Assets", "gdrive_sync"),
]
OUTPUT_DIR = os.path.join(ROOT, "Assets", "IG_30_Days_cursor_workflow")


def gather_assets():
    all_files = []
    for d in ASSETS_DIRS:
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.lower().endswith((".jpg", ".png", ".mp4", ".mov")):
                    all_files.append(os.path.join(d, f))
    return all_files


def generate_caption(day_num, day_type, selected_files):
    image_parts = []
    has_image = False

    for f in selected_files:
        if f.lower().endswith((".jpg", ".png")):
            try:
                with open(f, "rb") as image_file:
                    encoded = base64.b64encode(image_file.read()).decode("utf-8")
                    mime = "image/png" if f.lower().endswith(".png") else "image/jpeg"
                    image_parts.append({"mime_type": mime, "data": encoded})
                    has_image = True
                    break
            except OSError:
                pass

    format_type = "Carousel" if len(selected_files) > 1 else "Single Post"
    if any(f.lower().endswith((".mp4", ".mov")) for f in selected_files):
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
    gen_cfg = {"response_mime_type": "application/json"}
    try:
        if has_image:
            parts = [system_prompt, image_parts[0]]
        else:
            parts = system_prompt
        response, model_used = generate_with_fallback(genai, parts, generation_config=gen_cfg)
        if day_num == 1:
            print(f"  Using Gemini model: {model_used}")
        return json.loads(response.text)
    except RuntimeError as e:
        print(f"Fatal for Day {day_num}: {e}")
        raise
    except Exception as e:
        print(f"Error generating caption for Day {day_num}: {e}")
        return {
            "day": f"Day_{day_num:02d}",
            "format_type": format_type,
            "caption": {
                "hook": "Embrace the Flow.",
                "body": "A moment captured in the heart of Lisbon.",
                "cta": "Join the Circle D Flow community.",
            },
            "hashtags": "#KissYourHeart #CircleDFlow",
            "target_goal": "Community Engagement",
            "_fallback": True,
        }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_assets = gather_assets()
    random.shuffle(all_assets)

    images = [f for f in all_assets if f.lower().endswith((".jpg", ".png"))]
    videos = [f for f in all_assets if f.lower().endswith((".mp4", ".mov"))]

    rhythms = [
        "The Philosophy (Saves & Shares) - Focus on deep quotes, Wu Wei, and mindfulness.",
        "The Art (Trust & B2B) - Focus on high-end portraits and professionalism.",
        "The Movement (Reach) - Focus on Jam sessions, motion, energy, and community in Lisbon.",
        "The Forge & The Ask (Conversion) - Behind the scenes, the Griot at work. Sell Photo Walks or Brand Shootings.",
    ]

    print(f"Cursor workflow — output: {OUTPUT_DIR}")
    print(f"Pool: {len(images)} images, {len(videos)} videos.")

    for day in range(1, 31):
        print(f"Generating Day {day} / 30...")
        day_type = rhythms[(day - 1) % 4]

        selected_files = []
        if (day - 1) % 4 == 2 and videos:
            selected_files.append(videos.pop())
        elif (day - 1) % 4 == 0 and len(images) > 3:
            selected_files = [images.pop() for _ in range(3)]
        elif images:
            selected_files.append(images.pop())

        if not selected_files:
            print("Not enough media left. Stopping.")
            break

        data = generate_caption(day, day_type.split(" ")[1], selected_files)

        folder_name = f"Day_{day:02d}_{data['format_type'].replace(' ', '')}"
        day_dir = os.path.join(OUTPUT_DIR, folder_name)
        os.makedirs(day_dir, exist_ok=True)

        for f in selected_files:
            shutil.copy2(f, os.path.join(day_dir, os.path.basename(f)))

        caption_text = (
            f"{data['caption'].get('hook', '')}\n\n"
            f"{data['caption'].get('body', '')}\n\n"
            f"{data['caption'].get('cta', '')}\n\n"
            f"{data.get('hashtags', '')}"
        )
        with open(os.path.join(day_dir, "caption.txt"), "w", encoding="utf-8") as text_file:
            text_file.write(caption_text)

        with open(os.path.join(day_dir, "metadata.json"), "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, indent=4)

        time.sleep(6)

    print("30-Day Instagram Prep Complete (cursor_workflow).")


if __name__ == "__main__":
    main()
