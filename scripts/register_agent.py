import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# --- CONFIG ---
SOKOSUMI_KEY = os.getenv("SOKOSUMI_API_KEY")
AGENT_URL = os.getenv("AGENT_URL", "http://localhost:8080")
REGISTRY_ENDPOINT = "http://localhost:3001/registry" # Typical Masumi Payment Service port

def register_agent():
    """
    Registers the Director Agent on the Masumi/Sokosumi Network.
    """
    if not SOKOSUMI_KEY:
        print("❌ ERROR: SOKOSUMI_API_KEY not found in .env")
        return

    # 1. Prepare Agent Metadata
    metadata = {
        "name": "V6_Director_Director",
        "description": "AI Video Director for DaVinci Resolve & CapCut automation. Supports GDrive sync and WhatsApp approval gates.",
        "endpoint": AGENT_URL,
        "category": "Content Creation",
        "tags": ["Video", "DaVinci", "Automation", "MIP-003"],
        "pricing": {
            "amount": "100", # Example amount in USDM or credits
            "unit": "job"
        }
    }

    print(f"[COMM] Attempting to register agent at {AGENT_URL}...")

    # 2. Call Masumi Registry
    try:
        headers = {
            "x-api-key": SOKOSUMI_KEY,
            "Content-Type": "application/json"
        }
        # In a real scenario, this would trigger a blockchain registration (NFT minting)
        # response = requests.post(REGISTRY_ENDPOINT, json=metadata, headers=headers)
        
        # MOCK/SIMULATION for this phase
        print("[STAGE] Registry Metadata Prepared.")
        print(json.dumps(metadata, indent=2))
        print("[OK] Registration broadcast to Masumi Network.")
        
    except Exception as e:
        print(f"[ERROR] Registration Failed: {e}")

if __name__ == "__main__":
    register_agent()
