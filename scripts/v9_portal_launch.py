import webbrowser
import subprocess
import os
import time
import socket

PORT = 3000
URL = f"http://localhost:{PORT}/pages/vision_sanctuary.html?reset=true&v=9.7.8"

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def launch():
    print(f"[LAUNCHER] Checking portal status at port {PORT}...")
    
    if is_port_open(PORT):
        print("[LAUNCHER] Portal already active. Rerouting now...")
    else:
        print("[LAUNCHER] Lighting the fires... Starting Python bridge.")
        # Start server in background
        subprocess.Popen(
            ["C:\\Users\\user\\AppData\\Local\\Programs\\Python\\Python312\\python.exe", "-m", "http.server", str(PORT)],
            cwd=os.path.abspath(os.path.dirname(__file__) + "/.."),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(2) # Wait for ignition

    print(f"[LAUNCHER] Opening path: {URL}")
    webbrowser.open(URL)
    print("[SUCCESS] Portal opened. Gye Nyame.")

if __name__ == "__main__":
    launch()
