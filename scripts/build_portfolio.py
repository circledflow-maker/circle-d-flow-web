import os
import shutil
import json
import random

BASE_DIR = r"D:\circle-d-flow-web"
PORTFOLIO_DIR = os.path.join(BASE_DIR, "Assets", "Portfolio")

CATEGORIES = {
    "Realm": [r"D:\Irene Birthday"],
    "Nature": [r"D:\tag mit rui"],
    "Event": [r"D:\Indian festival"],
    "Artist": [r"D:\D Circle on tour"]
}

MAX_IMAGES_PER_CATEGORY = 20

portfolio_data = {}

if not os.path.exists(PORTFOLIO_DIR):
    os.makedirs(PORTFOLIO_DIR)

for category, source_folders in CATEGORIES.items():
    category_dir = os.path.join(PORTFOLIO_DIR, category)
    if os.path.exists(category_dir):
        shutil.rmtree(category_dir)
    os.makedirs(category_dir)
        
    portfolio_data[category] = []
    
    # Gather all jpgs
    all_jpgs = []
    for folder in source_folders:
        if os.path.exists(folder):
            for root, dirs, files in os.walk(folder):
                for file in files:
                    if file.lower().endswith(('.jpg', '.jpeg')):
                        all_jpgs.append(os.path.join(root, file))
    
    # Select random sample
    selected_jpgs = random.sample(all_jpgs, min(len(all_jpgs), MAX_IMAGES_PER_CATEGORY))
    
    # Copy and add to data
    for i, src_path in enumerate(selected_jpgs):
        filename = f"{category.lower()}_{i+1}.jpg"
        dest_path = os.path.join(category_dir, filename)
        
        # Copy file
        try:
            shutil.copy2(src_path, dest_path)
            
            # Add to data
            portfolio_data[category].append({
                "id": f"{category.lower()}_{i+1}",
                "name": filename,
                "professional_name": f"{category} Collection",
                "url": f"../Assets/Portfolio/{category}/{filename}",
                "tags": [category.lower(), "portfolio"]
            })
        except Exception as e:
            print(f"Error copying {src_path}: {e}")

# Write to portfolio_data.js
js_path = os.path.join(BASE_DIR, "js", "data", "portfolio_data.js")
js_content = "window.PortfolioData = " + json.dumps(portfolio_data, indent=4) + ";"

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Successfully generated portfolio data with {sum(len(v) for v in portfolio_data.values())} total images.")
