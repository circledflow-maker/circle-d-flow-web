import os
import time
import subprocess
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv

load_dotenv()

# --- CONFIG ---
TOKEN_FILE = 'token.json'
RAW_STORAGE = "D:/Vision_World/Raw"
DOC_CATEGORY = "Hempyroots"

class DocAgent:
    """
    Agent responsible for storyboarding and creative assembly.
    Focuses on build-up of space, jam vibrant sessions, and community.
    """
    
    def __init__(self):
        self.creds = Credentials.from_authorized_user_file(TOKEN_FILE)
        self.service = build('drive', 'v3', credentials=self.creds)

    def scan_hempyroots_content(self):
        """Find footage in the 'Kiss Your heart World' tree related to Jam Sessions"""
        query = "name contains 'Jam' or name contains 'Session' and mimeType='video/mp4'"
        results = self.service.files().list(q=query, pageSize=10).execute()
        return results.get('files', [])

    def trigger_production(self, file_id, title):
        """Calls the Director Agent to pull and render the file"""
        from v6_director_agent import VideoJob # Assuming local import works
        import requests
        
        print(f"[DOC] Triggering Production for {title}...")
        payload = {
            "category": DOC_CATEGORY,
            "source_url": file_id,
            "title": title
        }
        response = requests.post("http://localhost:8080/start_job", json=payload)
        return response.json()

    def identify_slow_mo_candidat(self, file_path):
        """
        Logic: Use ffprobe to detect bitrate variance or high motion.
        For now: Use a heuristic (size > 100MB usually means high motion 4K)
        """
        size = os.path.getsize(file_path)
        if size > 200 * 1024 * 1024: # 200MB+ for a short clip
            print(f"[DOC] High-motion detected in {file_path}. Marking for Slow-Mo.")
            return True
        return False

if __name__ == "__main__":
    print("--- Doc Agent v7.2 ---")
    agent = DocAgent()
    files = agent.scan_hempyroots_content()
    for f in files:
        print(f"- Found: {f['name']} (ID: {f['id']})")
