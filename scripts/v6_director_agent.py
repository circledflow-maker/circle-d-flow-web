import os
import json
import time
import requests
import subprocess
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
import io

load_dotenv()

# --- CONFIG ---
PORT = 8080
AGENT_NAME = "V6_Director_Director"
SOKOSUMI_KEY = os.getenv("SOKOSUMI_API_KEY")
LOCAL_BRIDGE = "http://localhost:3001"
N8N_WEBHOOK = "https://feathered-swan.pikapod.net/webhook/agentic-sync" # Fallback
RAW_STORAGE = "D:/Vision_World/Raw"
TOKEN_FILE = 'token.json'

app = FastAPI(title=AGENT_NAME)

# --- MODELS ---
class VideoJob(BaseModel):
    category: str
    source_url: str # This is the GDrive File ID
    title: str = "Untitled Project"

# --- HELPERS ---

def download_from_gdrive(file_id, destination):
    if not os.path.exists(TOKEN_FILE):
        return False, "token.json missing"
    
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
    service = build('drive', 'v3', credentials=creds)
    
    request = service.files().get_media(fileId=file_id)
    fh = io.FileIO(destination, 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
        print(f"[SYNC] Download {int(status.progress() * 100)}%.")
    return True, "Success"

# --- MIP-003 ENDPOINTS ---

@app.get("/input_schema")
async def get_input_schema():
    return {
        "category": "string (CircleDJam, SoulOfLisbon, FlowPhilosophy)",
        "source_url": "string (GDrive File ID)",
        "title": "string (The suggested title for the short)"
    }

@app.get("/availability")
async def get_availability():
    return {"status": "available", "free_space_gb": 1900}

@app.post("/start_job")
async def start_job(job: VideoJob, background_tasks: BackgroundTasks):
    job_id = f"JOB_{int(time.time())}"
    background_tasks.add_task(orchestrate_pipeline, job_id, job)
    return {"status": "started", "job_id": job_id}

# --- ORCHESTRATION LOGIC ---

def orchestrate_pipeline(job_id, job):
    print(f"[V6] Starting Pipeline for {job_id}...")
    
    # 1. Sync from GDrive
    category_path = os.path.join(RAW_STORAGE, job.category)
    os.makedirs(category_path, exist_ok=True)
    local_path = os.path.join(category_path, f"{job.title}.mp4")
    
    success, msg = download_from_gdrive(job.source_url, local_path)
    if not success:
        print(f"[V6] Sync Failed: {msg}")
        return

    # 2. Trigger DaVinci Render
    print(f"[V6] Triggering DaVinci Bridge for {job.title}...")
    try:
        # We run the bridge script as a separate process
        subprocess.run(["python", "scripts/davinci_bridge.py", "--project", job.title], check=True)
    except Exception as e:
        print(f"[V6] Resolve Bridge Error: {e}")

    # 3. Validation Signal
    message = f"*Mission:* {job.title}\n*Category:* {job.category}\n*Status:* DOWNLOADED & RENDER TRIGGERED\n\nApprove for Multi-Platform posting? Reply 'YES'."
    send_signal(message)

def send_signal(message):
    payload = {"message": message, "type": "USER_VALIDATION_REQUIRED"}
    try:
        response = requests.post(LOCAL_BRIDGE, json=payload, timeout=2)
        if response.status_code == 200:
            print("[COMM] Signal sent via LOCAL BRIDGE.")
            return
    except:
        print("[COMM] Local Bridge Offline. Reaching out to n8n Fallback...")

    try:
        requests.post(N8N_WEBHOOK, json=payload)
        print("[COMM] Signal sent via n8n (Pikapods).")
    except Exception as e:
        print(f"[COMM] CRITICAL: All communication channels failed. {e}")

if __name__ == "__main__":
    import uvicorn
    print(f"--- {AGENT_NAME} v6.0 - MIP-003 ONLINE ---")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
