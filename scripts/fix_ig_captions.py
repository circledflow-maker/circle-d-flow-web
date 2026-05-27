import os
import json
import time
from ig_30_days_griot import generate_caption, OUTPUT_DIR

def main():
    rhythms = [
        "The Philosophy (Saves & Shares) - Focus on deep quotes, Wu Wei, and mindfulness.",
        "The Art (Trust & B2B) - Focus on high-end portraits and professionalism.",
        "The Movement (Reach) - Focus on Jam sessions, motion, energy, and community in Lisbon.",
        "The Forge & The Ask (Conversion) - Behind the scenes, the Griot at work. Sell Photo Walks or Brand Shootings."
    ]
    
    if not os.path.exists(OUTPUT_DIR):
        print(f"Output dir {OUTPUT_DIR} does not exist.")
        return
        
    folders = sorted(os.listdir(OUTPUT_DIR))
    for folder in folders:
        if not folder.startswith("Day_"):
            continue
            
        day_dir = os.path.join(OUTPUT_DIR, folder)
        caption_file = os.path.join(day_dir, "caption.txt")
        
        if os.path.exists(caption_file):
            with open(caption_file, "r", encoding="utf-8") as f:
                content = f.read()
                
            if "Embrace the Flow." in content:
                # Extract day number
                try:
                    day_num = int(folder.split("_")[1])
                except ValueError:
                    continue
                    
                day_type = rhythms[(day_num - 1) % 4]
                
                # Gather files
                selected_files = []
                for file in os.listdir(day_dir):
                    if file.lower().endswith(('.jpg', '.png', '.mp4', '.mov')):
                        selected_files.append(os.path.join(day_dir, file))
                        
                print(f"Regenerating caption for {folder}...")
                data = generate_caption(day_num, day_type.split(' ')[1], selected_files)
                
                if data['caption'].get('hook', '') == 'Embrace the Flow.':
                    print("Rate limit hit or fallback triggered. Stopping for today.")
                    break
                
                # Write caption.txt
                caption_text = f"{data['caption'].get('hook', '')}\n\n"
                caption_text += f"{data['caption'].get('body', '')}\n\n"
                caption_text += f"{data['caption'].get('cta', '')}\n\n"
                caption_text += f"{data.get('hashtags', '')}"
                
                with open(caption_file, "w", encoding="utf-8") as text_file:
                    text_file.write(caption_text)
                    
                # Write JSON meta
                with open(os.path.join(day_dir, "metadata.json"), "w", encoding="utf-8") as json_file:
                    json.dump(data, json_file, indent=4)
                    
                time.sleep(6) # Respect rate limits

    print("Fix complete!")

if __name__ == "__main__":
    main()
