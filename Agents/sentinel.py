import os
import re

class SentinelAgent:
    def __init__(self, root_dir):
        self.root_dir = root_dir
        self.issues = []
        self.required_agents = [
            "visual_integrity.js",
            "bridge_pusher.js",
            "device_sync.js",
            "stress_test.js"
        ]

    def log(self, type, message):
        prefix = "[X]" if type == "ERROR" else "[!]"
        print(f"{prefix} [{type}] {message}")
        self.issues.append(f"[{type}] {message}")

    def check_file_agents(self, filepath):
        """Checks if a file includes the required agent scripts."""
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        filename = os.path.basename(filepath)
        for agent in self.required_agents:
            if agent not in content:
                self.log("ERROR", f"{filename} is missing Agent: {agent}")

    def check_links(self, filepath):
        """Checks for broken local links."""
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        links = re.findall(r'(?:href|src)=["\']([^"\']+)["\']', content)
        for link in links:
            if link.startswith(('http', '//', '#', 'mailto:', 'tel:', 'javascript:', 'data:')):
                continue
            
            # Ignore template literals
            if "${" in link:
                continue
            
            # Construct absolute path to target
            if link.startswith('/'):
                target = os.path.join(self.root_dir, link.lstrip('/'))
            else:
                target = os.path.join(os.path.dirname(filepath), link)
            
            # Clean query strings/hashes
            target = target.split('?')[0].split('#')[0]
            
            if not os.path.exists(target):
                self.log("ERROR", f"Broken Link in {os.path.basename(filepath)}: {link}")

    def scan(self):
        print(f"[SENTINEL] Scanning: {self.root_dir}...")
        
        # 1. Scan Index.html
        index_path = os.path.join(self.root_dir, "Index.html")
        if os.path.exists(index_path):
            self.check_file_agents(index_path)
            self.check_links(index_path)
        
        # 2. Scan Pages
        pages_dir = os.path.join(self.root_dir, "pages")
        if os.path.exists(pages_dir):
            for file in os.listdir(pages_dir):
                if file.endswith(".html"):
                    path = os.path.join(pages_dir, file)
                    self.check_file_agents(path)
                    self.check_links(path)

        if not self.issues:
            print("\n[OK] SYSTEM INTEGRITY VERIFIED. All Agents Active. All Links Clear.")
        else:
            print(f"\n[FAIL] {len(self.issues)} ISSUES DETECTED.")

if __name__ == "__main__":
    pwd = os.getcwd()
    # Assume we run from project root, or try to find it
    if "Agents" in pwd:
        root = os.path.dirname(pwd)
    else:
        root = pwd 
        
    sentinel = SentinelAgent(root)
    sentinel.scan()
