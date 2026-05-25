import os
import time
import subprocess
import json

# Configuration
BASE_DIR = r"D:\circle-d-flow-web\scripts"
ROUTER_SCRIPT = os.path.join(BASE_DIR, "content_router.py")
MANGA_SCRIPT = os.path.join(BASE_DIR, "manga_maker.py")
REEL_SCRIPT = os.path.join(BASE_DIR, "v12_alterlife_master_reel.py")
STATE_FILE = r"D:\circle-d-flow-web\Portfolio_Content\portfolio_state.json"

POLL_INTERVAL_S = 300 # 5 minutes

def run_script(path):
    print(f"[{time.strftime('%H:%M:%S')}] Executing: {os.path.basename(path)}")
    try:
        # Using subprocess.run to execute the python scripts
        subprocess.run(['python', path], check=True)
    except Exception as e:
        print(f"Error executing {path}: {e}")

def main():
    print("====================================")
    print(" KYHEARTLX MASTER FLOW AGENT (v15) ")
    print(" Status: ACTIVE / MONITORING      ")
    print("====================================\n")
    
    # Track last reel generation to avoid over-running it (once per hour)
    last_reel_time = 0
    REEL_COOLDOWN = 3600 # 1 hour
    
    try:
        while True:
            # 1. Content Routing (High Priority)
            run_script(ROUTER_SCRIPT)
            
            # 2. Manga Check
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, 'r') as f:
                    state = json.load(f)
                    queue = state.get("manga_queue", [])
                    if len(queue) >= 3:
                        print(f"Manga queue threshold met ({len(queue)}). Triggering Manga Maker...")
                        run_script(MANGA_SCRIPT)
            
            # 3. Reel Generation (Low Frequency)
            now = time.time()
            if now - last_reel_time > REEL_COOLDOWN:
                run_script(REEL_SCRIPT)
                last_reel_time = now
            
            print(f"\n[{time.strftime('%H:%M:%S')}] Cycle complete. Sleeping for {POLL_INTERVAL_S}s...\n")
            time.sleep(POLL_INTERVAL_S)
            
    except KeyboardInterrupt:
        print("\nAgent stopped by user.")

if __name__ == "__main__":
    main()
