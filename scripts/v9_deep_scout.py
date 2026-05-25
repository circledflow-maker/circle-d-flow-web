import os
import json
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv

load_dotenv()

# --- CONFIG ---
TOKEN_FILE = os.path.join(os.path.dirname(__file__), '..', 'token.json')
if not os.path.exists(TOKEN_FILE):
    TOKEN_FILE = 'token.json' # Fallback to local
INVENTORY_PATH = "D:/Vision_World/inventory.json"

class DeepScout:
    """
    Inventory Agent: Systematically crawls GDrive to create a master database.
    Performs initial Chakra-Classification with 'Lebensfreude' priority.
    """
    
    def __init__(self):
        self.creds = Credentials.from_authorized_user_file(TOKEN_FILE)
        self.service = build('drive', 'v3', credentials=self.creds)
        self.inventory = []

    def classify(self, name, folder_name=""):
        """Flow Matrix Intelligence: Returns the category and a confidence score."""
        name_lower = f"{name} {folder_name}".lower()
        
        scores = {
            "Performance & Art": 0,
            "Narrative & Philosophy": 0,
            "Kinesthetic": 0,
            "Urban Adventure": 0,
            "Collective": 0,
            "Visual & Portrait": 0,
            "Landscape & Canvas": 0,
            "Purposeful Product": 0
        }

        # Flow Matrix Keyword Mapping
        keywords = {
            "Performance & Art": ["music", "tiny desk", "session", "art", "hip-hop", "rap", "dj", "performance", "beatbox"],
            "Narrative & Philosophy": ["interview", "documentary", "talk", "philosophy", "word", "story", "struggle", "triumph"],
            "Kinesthetic": ["basketball", "movement", "skate", "sport", "rhythm", "park", "physic", "zone"],
            "Urban Adventure": ["tour", "architecture", "street", "city", "discovery", "wander", "corner", "alfama", "graca"],
            "Collective": ["party", "social", "dance", "nightlife", "connection", "crowd", "event", "ecstatic"],
            "Visual & Portrait": ["portrait", "human", "essence", "bts", "photo", "camera", "eye", "soul", "face"],
            "Landscape & Canvas": ["graffiti", "mural", "landscape", "sunset", "view", "canvas", "texture", "mural"],
            "Purposeful Product": ["product", "brand", "advert", "collab", "authentic", "commercial"]
        }

        for category, words in keywords.items():
            for word in words:
                if word in name_lower:
                    scores[category] += 2 # Direct match
        
        # Folder Context Boost
        if folder_name.lower() != "root":
            for category, words in keywords.items():
                for word in words:
                    if word in folder_name.lower():
                        scores[category] += 3 # Strong context boost
        
        # Find winner
        winner = max(scores, key=scores.get)
        if scores[winner] == 0: return "Urban Adventure", 1 # Default to Urban Flow if unsure
        return winner, scores[winner]

    def crawl_folder(self, folder_id, folder_name="Root"):
        """Systematic recursive search"""
        print(f"[SCOUT] Crawling: {folder_name} ({folder_id})...")
        query = f"'{folder_id}' in parents and trashed = false"
        results = self.service.files().list(q=query, fields="files(id, name, mimeType, size)").execute()
        
        for f in results.get('files', []):
            if f['mimeType'] == 'application/vnd.google-apps.folder':
                self.crawl_folder(f['id'], f['name'])
            else:
                chakra, score = self.classify(f['name'], folder_name)
                self.inventory.append({
                    "id": f['id'],
                    "name": f['name'],
                    "chakra": chakra,
                    "score": score,
                    "size_mb": int(f.get('size', 0)) / (1024 * 1024),
                    "is_archived": False,
                    "professional_name": f"[Clean] {f['name']}" # Placeholder for renaming
                })

    def run_total_inventory(self, root_folders):
        for f_id in root_folders:
            self.crawl_folder(f_id)
        
        with open(INVENTORY_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.inventory, f, indent=4)
        print(f"[SCOUT] Total Inventory complete: {len(self.inventory)} files indexed.")

if __name__ == "__main__":
    print("--- Deep Scout v9.4.2 ---")
    scout = DeepScout()
    # Pulling from 'Kiss Your heart World' root folder ID (needs searching first)
    # Placeholder root ID for demo run
    # scout.run_total_inventory(['FOLDER_ID_HERE'])
