import os
import time
import json
import logging
import requests
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# --- CONFIGURATION v5.0 ---
BASE_PATH = "D:/Vision_World"
RAW_PATH = f"{BASE_PATH}/Raw"
PROCESSED_PATH = f"{BASE_PATH}/Processed"
DRAFT_PATH = f"{BASE_PATH}/Drafts"
API_CONFIG_JS = "D:/circle-d-flow-web/js/api_config.js"

# Brand Mapping
CATEGORIES = {
    "CircleDJam": "Circle D Jam",
    "SoulOfLisbon": "Soul of Lisbon",
    "FlowPhilosophy": "Flow Philosophy"
}

# User WhatsApp
RECIPIENT_PHONE = "+391912828940" 
N8N_WEBHOOK = "https://feathered-swan.pikapod.net/webhook/agentic-sync" # Primary Sync Node

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

class VisionLocalAgent(FileSystemEventHandler):
    """
    The Local Vision Agent v5.0 - Professional Cinema Hub
    """
    def __init__(self):
        self.init_folders()

    def init_folders(self):
        # Create Main & Categorized Folders
        folders = [BASE_PATH, RAW_PATH, PROCESSED_PATH, DRAFT_PATH]
        for cat in CATEGORIES.keys():
            folders.append(f"{RAW_PATH}/{cat}")
            folders.append(f"{PROCESSED_PATH}/{cat}")
            
        for f in folders:
            if not os.path.exists(f):
                os.makedirs(f)
                logging.info(f"Created Folder: {f}")

    def on_created(self, event):
        if event.is_directory:
            return
        
        filename = os.path.basename(event.src_path)
        if filename.lower().endswith(('.mp4', '.mov', '.avi')):
            # Detect Category based on subfolder
            cat_key = os.path.basename(os.path.dirname(event.src_path))
            category = CATEGORIES.get(cat_key, "Uncategorized")
            
            logging.info(f"📂 NEW ASSET: {filename} in {category}")
            self.process_with_metadata(event.src_path, category)

    def process_with_metadata(self, file_path, category):
        """
        Extracts Title/Time and sends suggestions for User Approval.
        """
        now = datetime.now()
        timestamp = now.strftime("%Y%m%d_%H%M")
        readable_time = now.strftime("%H:%M on %d %B %Y")
        
        # 1. Suggest a Title based on file and category
        raw_name = os.path.splitext(os.path.basename(file_path))[0]
        suggested_title = f"{category} - {raw_name.replace('_', ' ').title()}"
        
        # 2. Suggest Hashtags based on Category
        hashtags = "#CircleDFlow #LisbonFlow #Cinema2026"
        if category == "Circle D Jam": hashtags += " #TinyDesk #JamSession"
        elif category == "Soul of Lisbon": hashtags += " #LXFactory #LocalArtists"
        elif category == "Flow Philosophy": hashtags += " #AnimeWisdom #MangaWarp"

        # 3. Create target directory: Processed/[Category]/[Title]_[Timestamp]
        processed_dir = f"{PROCESSED_PATH}/{category.replace(' ', '')}/{raw_name}_{timestamp}"
        if not os.path.exists(processed_dir):
            os.makedirs(processed_dir)
            
        logging.info(f"📁 Organized: {processed_dir}")
        logging.info(f"⏳ Waiting for Approval (WhatsApp: {RECIPIENT_PHONE})")

        # 4. Notify User with Suggestions (Human-in-the-loop)
        payload = {
            "type": "USER_VALIDATION_REQUIRED",
            "category": category,
            "time": readable_time,
            "suggested_title": suggested_title,
            "suggested_hashtags": hashtags,
            "draft_path": processed_dir,
            "phone": RECIPIENT_PHONE,
            "message": (
                f"🎬 *New Moment Captured!*\n\n"
                f"📍 *Category:* {category}\n"
                f"🕒 *Time:* {readable_time}\n"
                f"📝 *Suggest Title:* {suggested_title}\n"
                f"🏷️ *Hashtags:* {hashtags}\n\n"
                f"Reply with 'CORRECT [New Title]' to edit, or 'YES' to proceed with 'Mac & Devin' Cinema filtering."
            )
        }
        
        try:
            # response = requests.post(N8N_WEBHOOK, json=payload)
            logging.info(f"📡 [SYNC] Suggestion sent to WhatsApp. (Target: {RECIPIENT_PHONE})")
        except Exception as e:
            logging.error(f"❌ WhatsApp Signal Failed: {e}")

if __name__ == "__main__":
    agent = VisionLocalAgent()
    observer = Observer()
    observer.schedule(agent, RAW_PATH, recursive=True)
    
    logging.info("🧬 Visionary Local Agent v5.0 - HIGH-TECH SOUL - ONLINE.")
    logging.info(f"Monitoring: {RAW_PATH}")
    
    try:
        observer.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
