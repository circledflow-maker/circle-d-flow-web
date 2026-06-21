import os
import sys
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env")
    sys.exit(1)

# Initialize the newer genai client
client = genai.Client(api_key=GEMINI_API_KEY)

def upload_and_analyze(video_path):
    print(f"[Studio Agent] Uploading {video_path} to Gemini...")
    try:
        # Upload the file
        video_file = client.files.upload(file=video_path)
        print(f"[Studio Agent] Upload complete: {video_file.name}")
        
        # Wait for processing
        print("[Studio Agent] Waiting for video processing on Google's servers...")
        while True:
            file_info = client.files.get(name=video_file.name)
            if file_info.state == "ACTIVE":
                print("[Studio Agent] Video is ready for analysis!")
                break
            elif file_info.state == "FAILED":
                print("[Studio Agent] ERROR: Video processing failed.")
                return
            print(".", end="", flush=True)
            time.sleep(5)
            
        print("\n[Studio Agent] Analyzing video content...")
        
        prompt = """
        You are the Circle D Flow Studio Agent, a highly creative director and social media expert.
        Watch this video and provide:
        1. A cinematic summary of the mood and energy.
        2. 3 engaging social media captions (Instagram/TikTok style).
        3. A list of 10 highly relevant SEO hashtags.
        4. Any specific artistic critique or suggestions for the portfolio.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[video_file, prompt]
        )
        
        import sys
        sys.stdout.reconfigure(encoding='utf-8')
        
        print("\n" + "="*50)
        print(" STUDIO AGENT ANALYSIS REPORT")
        print("="*50)
        
        # Save the report next to the video FIRST
        report_path = video_path + "_analysis.txt"
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"[Studio Agent] Report saved to {report_path}")
        
        print(response.text)
        print("="*50)
        
    except Exception as e:
        print(f"[Studio Agent] ERROR during analysis: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python agent_studio_gemini.py <path_to_video>")
        sys.exit(1)
        
    target_video = sys.argv[1]
    if not os.path.exists(target_video):
        print(f"File not found: {target_video}")
        sys.exit(1)
        
    upload_and_analyze(target_video)
