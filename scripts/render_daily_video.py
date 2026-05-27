import os
import subprocess
import glob
from pathlib import Path

def generate_davinci_edl(folder_path, clips, output_edl):
    """Generates a basic Edit Decision List (EDL) for DaVinci Resolve."""
    edl_content = "TITLE: Daily Content\nFCM: NON-DROP FRAME\n\n"
    
    current_frame = 0
    for idx, clip in enumerate(clips, 1):
        # We assume each clip is roughly 5 seconds for the EDL placeholder
        # In a real scenario, ffprobe would be used to get the exact duration
        edl_content += f"{idx:03d}  AX       V     C        00:00:00:00 00:00:05:00 00:00:{current_frame:02d}:00 00:00:{current_frame+5:02d}:00\n"
        edl_content += f"* FROM CLIP NAME: {os.path.basename(clip)}\n\n"
        current_frame += 5
        
    with open(output_edl, 'w', encoding='utf-8') as f:
        f.write(edl_content)
    print(f"[DaVinci] EDL generated at {output_edl}")

def render_folder(folder_path, output_name="final_youtube.mp4", is_vertical=False):
    """Uses ffmpeg to render clips and images in a folder into an MP4."""
    clips = glob.glob(os.path.join(folder_path, '*.mp4')) + \
            glob.glob(os.path.join(folder_path, '*.mov')) + \
            glob.glob(os.path.join(folder_path, '*.jpg')) + \
            glob.glob(os.path.join(folder_path, '*.png'))
            
    if not clips:
        print(f"No media found in {folder_path}")
        return

    # Generate DaVinci Resolve EDL so the user can edit manually
    edl_path = os.path.join(folder_path, 'davinci_timeline.edl')
    generate_davinci_edl(folder_path, clips, edl_path)

    # Generate ffmpeg concat list
    list_path = os.path.join(folder_path, 'concat_list.txt')
    with open(list_path, 'w', encoding='utf-8') as f:
        for clip in clips:
            # Escape paths for ffmpeg
            escaped_path = clip.replace('\\', '/')
            if clip.lower().endswith(('.jpg', '.png')):
                f.write(f"file '{escaped_path}'\n")
                f.write("duration 5\n") # Show images for 5 seconds
            else:
                f.write(f"file '{escaped_path}'\n")

    output_file = os.path.join(folder_path, output_name)
    
    scale_filter = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"
    if is_vertical:
        scale_filter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"

    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", 
        "-i", list_path,
        "-vf", f"fps=30,{scale_filter}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        output_file
    ]

    print(f"🎬 Rendering {output_file}...")
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"✅ Successfully rendered: {output_file}")
    except FileNotFoundError:
        print("❌ Error: ffmpeg is not installed or not in PATH.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error rendering {output_file}: {e}")

def main():
    print("🎥 Starting Circle D Flow Video Render Pipeline...")
    
    # Check common daily folders
    base_dirs = ["D:\\circle-d-flow-web\\Pipeline_Ready_to_Publish", "D:\\circle-d-flow-web\\01_AGENT_PROCESSING"]
    
    for base_dir in base_dirs:
        if not os.path.exists(base_dir):
            continue
            
        for day_folder in glob.glob(os.path.join(base_dir, 'Day_*')):
            if os.path.isdir(day_folder):
                print(f"\nProcessing {day_folder}...")
                # Render YouTube 16:9
                render_folder(day_folder, output_name="final_youtube.mp4", is_vertical=False)
                # Render Instagram 9:16
                render_folder(day_folder, output_name="final_instagram.mp4", is_vertical=True)

if __name__ == "__main__":
    main()
