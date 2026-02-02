import os
import shutil
import re

# Config
SOURCE_DIR = os.getcwd()
DIST_DIR = os.path.join(SOURCE_DIR, 'dist')
VIDEO_FILENAME = 'DJ in flow.MOV'
DIST_VIDEO_FILENAME = 'dj_in_flow.mov'

# Clean dist
if os.path.exists(DIST_DIR):
    shutil.rmtree(DIST_DIR)
os.makedirs(DIST_DIR)

# 1. Copy Files
files_to_copy = [
    'Hope Portrait.JPG', 'DSC_1811-ANIMATION.gif', 'cameraz50II.jpg',
    'sun_wolf.png', 'moon_wolf.png', 'yggdrasil.png', 'manifest.json', 'sw.js'
]
dirs_to_copy = ['Assets', 'AfricanQueenKitchen']

# Copy root HTML, CSS, JS
for f in os.listdir(SOURCE_DIR):
    if f.endswith(('.html', '.css', '.js', '.json')):
        shutil.copy2(os.path.join(SOURCE_DIR, f), DIST_DIR)

# Copy specific files
for f in files_to_copy:
    src = os.path.join(SOURCE_DIR, f)
    if os.path.exists(src):
        shutil.copy2(src, DIST_DIR)
    else:
        print(f"Warning: {f} not found.")

# Copy Directories
for d in dirs_to_copy:
    src = os.path.join(SOURCE_DIR, d)
    dst = os.path.join(DIST_DIR, d)
    if os.path.exists(src):
        shutil.copytree(src, dst)

# Copy and Rename Video
video_src = os.path.join(SOURCE_DIR, VIDEO_FILENAME)
if os.path.exists(video_src):
    shutil.copy2(video_src, os.path.join(DIST_DIR, DIST_VIDEO_FILENAME))
else:
    print(f"Warning: {VIDEO_FILENAME} not found.")

# 2. Patch index.html
index_path = os.path.join(DIST_DIR, 'index.html')
with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Video Path (Regex to catch the absolute path we added)
# Pattern: src="file:///.../DJ%20in%20flow.MOV"
content = re.sub(r'src="file://.*?DJ(%20| )in(%20| )flow\.MOV"', f'src="{DIST_VIDEO_FILENAME}"', content)

# Also ensure just "DJ in flow.MOV" is replaced if it exists as relative
content = content.replace('src="DJ in flow.MOV"', f'src="{DIST_VIDEO_FILENAME}"')
content = content.replace('src="DJ%20in%20flow.MOV"', f'src="{DIST_VIDEO_FILENAME}"')

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Build complete. 'dist' folder is ready.")
