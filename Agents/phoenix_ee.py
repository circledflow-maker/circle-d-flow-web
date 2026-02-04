
import os
import subprocess
import time

class PhoenixEE:
    def __init__(self):
        self.name = "PHOENIX-EE"
        self.version = "1.0.0"
        
    def log(self, message, status="INFO"):
        color = ""
        if status == "INFO": color = "\033[94m" # Blue
        elif status == "SUCCESS": color = "\033[92m" # Green
        elif status == "ERROR": color = "\033[91m" # Red
        elif status == "SYSTEM": color = "\033[95m" # Purple (Phoenix)
        
        reset = "\033[0m"
        print(f"{color}[{self.name}] {message}{reset}")

    def run_agent(self, script_path, agent_name):
        self.log(f"Initializing {agent_name}...", "SYSTEM")
        try:
            result = subprocess.run(['python', script_path], capture_output=True, text=True)
            print(result.stdout)
            if result.returncode == 0:
                self.log(f"{agent_name} Report: STABLE", "SUCCESS")
            else:
                self.log(f"{agent_name} Report: CRITICAL", "ERROR")
        except Exception as e:
            self.log(f"Failed to run {agent_name}: {e}", "ERROR")

    def full_system_scan(self):
        print("\n" + "="*50)
        print(f"     [PHOENIX] {self.name} SYSTEM SCAN v{self.version}")
        print("="*50 + "\n")
        
        # 1. Network Integrity & Logic
        self.run_agent(os.path.join('Agents', 'check_network.py'), "Network Agent")
        
        # 2. SEO (The Herald)
        self.run_agent(os.path.join('Agents', 'seo_audit.py'), "The Herald (SEO)")

        # 3. Performance (Big Brother)
        self.run_agent(os.path.join('Agents', 'performance_audit.py'), "Big Brother (Performance)")
        
        # 4. Mobile (The Sentinel)
        self.run_agent(os.path.join('Agents', 'mobile_audit.py'), "The Sentinel (Mobile)")

        # 5. Client Logic Verification
        print("-" * 40)
        self.log("Verifying client-side Agents...", "SYSTEM")
        agents = ['visual_integrity.js', 'device_sync.js', 'stress_test.js']
        missing = []
        for agent in agents:
            if not os.path.exists(os.path.join('js', 'agents', agent)):
                missing.append(agent)
        
        if not missing:
             self.log("All Client Agents Installed [OK]", "SUCCESS")
        else:
             self.log(f"Missing Client Agents: {missing}", "ERROR")

        print("\n" + "="*50)
        self.log("SCAN COMPLETE. YIN-YANG BALANCE: CALCULATING...", "SYSTEM")
        print("="*50 + "\n")

if __name__ == "__main__":
    app = PhoenixEE()
    app.full_system_scan()
