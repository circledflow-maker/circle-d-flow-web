import os
import subprocess
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

FFMPEG_BIN = os.getenv("FFMPEG_PATH", "ffmpeg")

class MediaOptimizer:
    """
    Agent responsible for web-performance and loudness.
    Resizes images to 800px WebP and normalizes audio.
    """
    
    def optimize_image(self, input_path, output_path):
        """WebP conversion and 800px resize"""
        print(f"[OPTIMIZER] Optimizing image: {input_path}...")
        with Image.open(input_path) as img:
            img.thumbnail((800, 800))
            img.save(output_path, "WEBP", quality=80)
        return output_path

    def normalize_loudness(self, input_path, output_path):
        """Ensure professional -16 LUFS loudness"""
        print(f"[OPTIMIZER] Normalizing audio loudness: {input_path}...")
        cmd = [
            FFMPEG_BIN, "-y", "-i", input_path,
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            output_path
        ]
        subprocess.run(cmd, check=True)
        return output_path

if __name__ == "__main__":
    print("--- Media Optimizer v9.3.1 ---")
    optimizer = MediaOptimizer()
    # Placeholder for test run
    print("Optimizer Ready for Volume I.")
