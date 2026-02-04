import os
import shutil
from PIL import Image

def optimize_image(filepath, max_width=1920, quality=70):
    """
    Optimizes an image by resizing and compressing it.
    Backs up the original file with a .bak extension.
    """
    if not os.path.exists(filepath):
        print(f"Skipping: {filepath} (Not Found)")
        return

    try:
        original_size = os.path.getsize(filepath)
        print(f"Processing: {filepath} ({original_size / 1024 / 1024:.2f} MB)")

        # Backup original using shutil to preserve exact bytes and avoid format errors
        backup_path = filepath + ".bak"
        if not os.path.exists(backup_path):
            shutil.copy2(filepath, backup_path)
            print(f"  Backup created: {backup_path}")

        # Open the image
        with Image.open(filepath) as img:

            # Resize if needed
            width, height = img.size
            if width > max_width:
                new_height = int((max_width / width) * height)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                print(f"  Resized from {width}x{height} to {max_width}x{new_height}")

            # Save optimized version
            # If PNG with transparency, keep as PNG but optimize
            if filepath.lower().endswith('.png'):
                # Check for transparency
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                     img.save(filepath, optimize=True)
                else:
                    # If no transparency, can convert to JPG? 
                    # For safety, keep PNG but optimize
                    img.save(filepath, optimize=True)
            else:
                # JPEG
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img.save(filepath, quality=quality, optimize=True)

            new_size = os.path.getsize(filepath)
            reduction = (original_size - new_size) / original_size * 100
            print(f"  Done: {new_size / 1024 / 1024:.2f} MB ({reduction:.1f}% reduction)")

    except Exception as e:
        print(f"  Error processing {filepath}: {e}")

if __name__ == "__main__":
    # Define targets
    base_dir = os.getcwd()
    targets = [
        (os.path.join(base_dir, "Hope Portrait.JPG"), 1920),
        (os.path.join(base_dir, "AfricanQueenKitchen", "KitKat kitchen.png"), 1200),
        (os.path.join(base_dir, "cameraz50II.jpg"), 1200),
        (os.path.join(base_dir, "Assets", "images", "logo.png"), 500), # Logo specific check
    ]

    print("--- Starting Image Optimization Agent ---")
    for path, width in targets:
        optimize_image(path, max_width=width)
    print("--- Agent Finished ---")
