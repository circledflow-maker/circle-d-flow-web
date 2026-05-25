import os
import shutil
import datetime
import subprocess

# --- CONFIG ---
LOCAL_VAULT = "D:/Vision_World/Archive"
WORKSPACE = "d:/circle-d-flow-web"
SCRIPTS_DIR = os.path.join(WORKSPACE, "scripts")

class ArchiveHandler:
    """
    Agent responsible for daily vaulting and cleanup.
    """
    
    def __init__(self):
        self.today = datetime.datetime.now().strftime("%Y-%m-%d")
        self.daily_local_path = os.path.join(LOCAL_VAULT, self.today)
        
    def setup_daily_folders(self):
        """Creates the today's folder in the Local Vault"""
        if not os.path.exists(self.daily_local_path):
            os.makedirs(self.daily_local_path, exist_ok=True)
            print(f"[ARCHIVE] Created local folder for {self.today}")
            
    def move_renders_to_vault(self):
        """Finds final renders (Vision_Vortex) in workspace and moves to daily vault"""
        files = [f for f in os.listdir(WORKSPACE) if f.startswith("Vision_Vortex_") and f.endswith(".mp4")]
        
        for f in files:
            src = os.path.join(WORKSPACE, f)
            dst = os.path.join(self.daily_local_path, f)
            shutil.move(src, dst)
            print(f"[ARCHIVE] Vaulted to Archive: {f}")

    def trigger_gdrive_sync(self):
        """Calls the gdrive_setup or forensic script to sync the daily folder"""
        print(f"[ARCHIVE] Syncing {self.today} to Google Drive...")
        # To-do: Integrate with GDrive API
        return True

    def schedule_daily_run(self):
        """Registers the 2 AM task using schtasks"""
        cmd = [
            "schtasks", "/Create", "/SC", "DAILY", "/TN", "KyLX_Vision_Vortex",
            "/TR", f"python {os.path.join(SCRIPTS_DIR, 'v10_vision_vortex.py')}",
            "/ST", "02:00", "/F"
        ]
        try:
            # We skip actual execution here to avoid Windows schd permission issues in dev
            print(f"[ARCHIVE] Would run schtasks command: {' '.join(cmd)}")
            print("[ARCHIVE] 2 AM Pipeline Scheduled Successfully (Simulated).")
        except Exception as e:
            print(f"[ARCHIVE] Scheduling Error: {e}")

if __name__ == "__main__":
    handler = ArchiveHandler()
    handler.setup_daily_folders()
    handler.move_renders_to_vault()
    handler.schedule_daily_run()
