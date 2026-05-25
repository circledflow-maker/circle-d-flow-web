import os
import json
import datetime
import urllib.request

# --- CONFIG ---
LIGHTROOM_API_KEY = "7da503aa321b4eaa9ba904eda6a4e3b5"
WORKSPACE = "d:/circle-d-flow-web"
RAW_UPLOADS_DIR = os.path.join(WORKSPACE, "raw_uploads")
PROCESSED_DIR = os.path.join(WORKSPACE, "assets", "images", "Portrait")
PORTFOLIO_DATA_FILE = os.path.join(WORKSPACE, "js", "data", "portfolio_data.js")

class LightroomVisionPipeline:
    """
    Automated pipeline that uses the Adobe Lightroom API to auto-tone artist pictures,
    then categorizes them as Studio or Outdoor shots and pushes them to the portfolio system.
    """
    
    def __init__(self):
        os.makedirs(RAW_UPLOADS_DIR, exist_ok=True)
        os.makedirs(PROCESSED_DIR, exist_ok=True)
        self.today = datetime.datetime.now().strftime("%Y%m%d")

    def simulate_lightroom_auto_tone(self, image_path):
        """Simulates sending a request to Adobe Lightroom REST API"""
        print(f"[LIGHTROOM API] Initiating connection with API Key: {LIGHTROOM_API_KEY[:8]}********")
        print(f"[LIGHTROOM API] Applying Auto-Tone & Color Correction to: {os.path.basename(image_path)}")
        
        # Simulate processing time
        processed_filename = f"edited_{os.path.basename(image_path)}"
        processed_path = os.path.join(PROCESSED_DIR, processed_filename)
        
        # Mock file movement/processing
        with open(processed_path, "w") as f:
            f.write("MOCK EDITED IMAGE DATA BY LIGHTROOM API")
            
        print(f"[LIGHTROOM API] Edit successful -> Saved to {processed_path}")
        return processed_path

    def analyze_and_categorize(self, filename):
        """Mock AI Categorizer to determine if the photo is 'Studio' or 'Outdoor'"""
        lower_name = filename.lower()
        if "studio" in lower_name or "indoor" in lower_name or "portrait" in lower_name:
            category_key = "Artist Studio Portraits"
            chakra = "Core / Will (Gold)"
        else:
            category_key = "Outdoor & Lifestyle"
            chakra = "The Tribe (Jade)"
            
        return category_key, chakra

    def update_portfolio_manifest(self, filepath, category_key, chakra):
        """Appends the newly processed image to portfolio_data.js"""
        # Read the file
        try:
            with open(PORTFOLIO_DATA_FILE, "r") as f:
                content = f.read()
            
            # Very primitive injection for demonstration purposes
            new_object = f'''
        {{
            "id": "lr_{self.today}_{os.path.basename(filepath)}",
            "name": "{os.path.basename(filepath)}",
            "chakra": "{chakra}",
            "score": 8,
            "size_mb": 4.5,
            "is_archived": false,
            "professional_name": "Professional Edit - [Lightroom Auto-Tone]"
        }}'''

            # If category doesn't exist, we add it to the top. If it does, we just print an alert.
            if category_key not in content:
                print(f"[PORTFOLIO] Creating new category: {category_key} in manifest.")
                injection = f'window.PortfolioData = {{\n    "{category_key}": [{new_object}\n    ],'
                new_content = content.replace("window.PortfolioData = {", injection)
            else:
                print(f"[PORTFOLIO] Category {category_key} exists. Injecting asset...")
                # Find category array start and inject (Mock logic)
                injection = f'"{category_key}": [\n{new_object},'
                new_content = content.replace(f'"{category_key}": [', injection)

            with open(PORTFOLIO_DATA_FILE, "w") as f:
                f.write(new_content)
                
            print(f"[PORTFOLIO] Successfully synchronized '{os.path.basename(filepath)}' to the 3D Archive.")
            
        except Exception as e:
            print(f"[ERROR] Failed to update portfolio manifest: {e}")

    def run_pipeline(self):
        print(f"\n--- Starting Lightroom Vision Pipeline ---")
        
        # Check raw uploads folder
        raw_files = [f for f in os.listdir(RAW_UPLOADS_DIR) if f.endswith(('.jpg', '.png', '.jpeg'))]
        if not raw_files:
            print(f"[PIPELINE] No raw images found in {RAW_UPLOADS_DIR}. Simulating a test file...")
            test_file = os.path.join(RAW_UPLOADS_DIR, "studio_shoot_test.jpg")
            with open(test_file, "w") as f:
                f.write("MOCK RAW")
            raw_files = ["studio_shoot_test.jpg"]

        for filename in raw_files:
            raw_path = os.path.join(RAW_UPLOADS_DIR, filename)
            
            # Step 1: Lightroom Edit
            edited_path = self.simulate_lightroom_auto_tone(raw_path)
            
            # Step 2: Categorization
            category, chakra = self.analyze_and_categorize(edited_path)
            print(f"[PIPELINE] Image tagged as: {category} | Element: {chakra}")
            
            # Step 3: Publish
            self.update_portfolio_manifest(edited_path, category, chakra)
            
            # Optional cleanup
            os.remove(raw_path)
            
        print("--- Pipeline Execution Complete ---\n")

if __name__ == "__main__":
    agent = LightroomVisionPipeline()
    agent.run_pipeline()
