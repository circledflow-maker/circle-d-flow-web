import os
import subprocess

QUEUE_FILE = r"D:\circle-d-flow-web\scripts\render_queue.txt"

def main():
    print("Forcing Queue Processing...")
    if not os.path.exists(QUEUE_FILE):
        print("Queue is empty.")
        return

    with open(QUEUE_FILE, "r") as f:
        tasks = [line.strip() for line in f if line.strip()]

    if not tasks:
        print("Queue is empty.")
        return



    for task in tasks:
        print(f"Executing: {task}")
        try:
            subprocess.run(["python", task], check=True)
            print(f"Success: {task}")
        except Exception as e:
            print(f"Failed: {task} - Error: {e}")

    # Clear queue
    with open(QUEUE_FILE, "w") as f:
        f.write("")
        
    print("All tasks completed.")

if __name__ == "__main__":
    main()
