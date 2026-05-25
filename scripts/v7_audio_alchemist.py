import os
import subprocess
import datetime
from dotenv import load_dotenv

load_dotenv()

FFMPEG_BIN = os.getenv("FFMPEG_PATH", "ffmpeg")

class AudioAlchemist:
    """
    Agent responsible for equalization, normalization, and balance.
    Syncs interviews with music using sidechain principles.
    """
    
    def __init__(self):
        self.ffmpeg_path = FFMPEG_BIN

    def denoise_wind(self, input_path, output_path):
        """AI-powered wind and noise reduction (afftdn)"""
        print(f"[ALCHEMIST] Reducing wind noise for {input_path}...")
        # Using afftdn for spectral noise reduction (good for wind)
        cmd = [
            self.ffmpeg_path, "-y", "-i", input_path,
            "-af", "afftdn=nf=-40:tn=1",
            output_path
        ]
        subprocess.run(cmd, check=True)
        return output_path

    def rename_professional(self, original_name, chakra, location="Unknown"):
        """Suggests a professional name for the portfolio"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d")
        clean_name = f"{chakra}_{location}_{timestamp}".replace(" ", "_")
        return f"{clean_name}.mp4"

    def mix_music_voice(self, music_path, voice_path, output_path):
        """
        Sidechain-like effect: Dips music volume when voice is present.
        Uses the 'sidechaincompress' filter approach or simple ducking.
        """
        print(f"[ALCHEMIST] Mixing Music ({music_path}) and Voice ({voice_path})...")
        # Logic: 
        # 1. Music on Stream 0, Voice on Stream 1
        # 2. Apply sidechaincompress to Stream 0 using Stream 1 as signal
        cmd = [
            FFMPEG_BIN, "-y",
            "-i", music_path,
            "-i", voice_path,
            "-filter_complex",
            "[0:a][1:a]sidechaincompress=threshold=0.1:ratio=4:release=500[mix]",
            "-map", "[mix]",
            "-c:a", "libmp3lame", "-b:a", "192k",
            output_path
        ]
        subprocess.run(cmd, check=True)
        return output_path

    def optimize_vocals(self, input_path, output_path):
        """Enhance clarity: Low-cut + Compression + High-boost"""
        print(f"[ALCHEMIST] Optimizing vocal clarity for {input_path}...")
        cmd = [
            FFMPEG_BIN, "-y", "-i", input_path,
            "-af", "highpass=f=100, lowpass=f=15000, compand=0.3|0.8:6:-90/-60/-50/-15/-10/-7|1|2/0:0.1",
            output_path
        ]
        subprocess.run(cmd, check=True)
        return output_path

if __name__ == "__main__":
    # Test placeholder for local verification
    print("--- Audio Alchemist v7.2 ---")
    alchemist = AudioAlchemist()
    print("Ready to process Jam Sessions.")
