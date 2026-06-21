import os
import subprocess
import argparse
import sys

def compress_video(input_path, output_path):
    print(f"\n🎥 Compressing: {os.path.basename(input_path)}")
    cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-vf', 'scale=-2:1080', # Scale to 1080p, preserve aspect ratio
        '-vcodec', 'libx264',
        '-crf', '23',
        '-preset', 'fast',
        '-acodec', 'aac',
        output_path
    ]
    
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    out_log = []
    for line in process.stdout:
        out_log.append(line)
        if "time=" in line:
            print(line.strip(), end='\r')
    process.wait()
    if process.returncode == 0:
        print(f"\n✅ Finished: {os.path.basename(output_path)}")
    else:
        print(f"\n❌ Error compressing {os.path.basename(input_path)}")
        print("".join(out_log[-20:])) # Print last 20 lines of ffmpeg output

def main():
    parser = argparse.ArgumentParser(description="Local Video Compressor (1080p)")
    parser.add_argument("--dir", type=str, required=True, help="Directory containing videos to compress")
    parser.add_argument("--outdir", type=str, required=False, help="Directory to save compressed videos")
    args = parser.parse_args()

    target_dir = args.dir
    if not os.path.exists(target_dir):
        print(f"Error: Directory '{target_dir}' does not exist.")
        sys.exit(1)

    if args.outdir:
        compressed_dir = args.outdir
    else:
        compressed_dir = os.path.join(target_dir, "Compressed_1080p")
        
    os.makedirs(compressed_dir, exist_ok=True)

    video_extensions = ('.mp4', '.mov', '.mkv', '.avi')
    found_videos = []

    for root, dirs, files in os.walk(target_dir):
        # Skip the compressed directory itself
        if "Compressed_1080p" in root:
            continue
        for file in files:
            if file.lower().endswith(video_extensions):
                found_videos.append(os.path.join(root, file))

    if not found_videos:
        print(f"No video files found in {target_dir}")
        return

    print(f"Found {len(found_videos)} video files. Starting compression...")

    for input_file in found_videos:
        filename = os.path.basename(input_file)
        output_file = os.path.join(compressed_dir, f"compressed_{filename}")
        
        if os.path.exists(output_file):
            print(f"⏩ Skipping {filename}, already compressed.")
        else:
            compress_video(input_file, output_file)

if __name__ == "__main__":
    # Allow windows console to handle utf-8 safely
    sys.stdout.reconfigure(encoding='utf-8')
    main()
