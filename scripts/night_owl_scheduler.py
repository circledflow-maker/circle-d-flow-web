import time
import datetime
import subprocess
import os

# Queue file where agents drop tasks
QUEUE_FILE = r"D:\circle-d-flow-web\scripts\render_queue.txt"
LOG_FILE = r"D:\circle-d-flow-web\scripts\night_owl_log.txt"

def log(msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def is_night_time():
    hour = datetime.datetime.now().hour
    # Runs between 1 AM (01:00) and 7:59 AM
    return 1 <= hour < 8

def process_queue():
    if not os.path.exists(QUEUE_FILE):
        return

    with open(QUEUE_FILE, "r") as f:
        tasks = [line.strip() for line in f if line.strip()]

    if not tasks:
        return

    log(f"Night Owl activated! Found {len(tasks)} tasks.")
    
    remaining_tasks = []
    
    for task_script in tasks:
        if not is_night_time():
            log("Window closed! (8:00 AM reached). Pausing remaining tasks.")
            remaining_tasks.append(task_script)
            continue
            
        log(f"Starting heavy render: {task_script}")
        try:
            subprocess.run(["python", task_script], check=True)
            log(f"✅ Success: {task_script}")
        except Exception as e:
            log(f"❌ Failed: {task_script} - Error: {e}")
            
    # Write back remaining tasks
    with open(QUEUE_FILE, "w") as f:
        for rt in remaining_tasks:
            f.write(rt + "\n")

if __name__ == "__main__":
    log("Night Owl Scheduler Started. Sleeping during the day...")
    while True:
        if is_night_time():
            process_queue()
        time.sleep(600)  # Check every 10 minutes
