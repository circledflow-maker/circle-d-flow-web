import os
import moviepy as mp

# Setup paths
SOURCE_DIR = r"G:\My Drive\Nova Era\KissYourHeart World\Story board lisbon\HempyRoots\Jam 23jan"
OUTPUT_DIR = r"D:\KYHeart_Social_Media\Instagram"
# Just put it in the base folder for now
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "Circle_D_Jam_Reel_With_Intro.mp4")

TARGET_W, TARGET_H = 1080, 1920

def crop_vertical(clip):
    """Crop a horizontal video to 9:16 vertical."""
    w, h = clip.size
    target_aspect = TARGET_W / TARGET_H
    clip_aspect = w / h
    
    if clip_aspect > target_aspect:
        # Video is wider than 9:16 (e.g. 16:9), crop sides
        new_w = int(h * target_aspect)
        x_center = w / 2
        clip = clip.cropped(x1=x_center - new_w/2, y1=0, x2=x_center + new_w/2, y2=h)
    else:
        # Video is taller, crop top/bottom
        new_h = int(w / target_aspect)
        y_center = h / 2
        clip = clip.cropped(x1=0, y1=y_center - new_h/2, x2=w, y2=y_center + new_h/2)
        
    return clip.resized((TARGET_W, TARGET_H))

def main():
    print("Starting Agent 2: Jam Reel Generator with custom GDrive Intro...")
    
    print("Loading source videos...")
    intro_path = os.path.join(SOURCE_DIR, "youtubeintro.mp4")
    vid1_path = os.path.join(SOURCE_DIR, "Rui in flow.mp4")
    vid2_path = os.path.join(SOURCE_DIR, "Non stop.mp4")
    
    try:
        # 1. The custom Intro from Google Drive
        intro_clip = mp.VideoFileClip(intro_path)
        # Ensure it's cropped to vertical just in case
        intro_clip = crop_vertical(intro_clip)
        
        # 2. The Jam Session Content
        clip1 = mp.VideoFileClip(vid1_path).subclipped(5, 12)  # Take 7 seconds
        clip1 = crop_vertical(clip1)
        clip1 = clip1.with_effects([mp.vfx.CrossFadeIn(1.0)])
        
        clip2 = mp.VideoFileClip(vid2_path).subclipped(10, 18) # Take 8 seconds
        clip2 = crop_vertical(clip2)
        clip2 = clip2.with_effects([mp.vfx.CrossFadeIn(1.0)])
    except Exception as e:
        print(f"Error loading videos: {e}")
        return

    # Normalize audio (boost volume for social media impact)
    print("Mastering audio...")
    clip1 = clip1.with_effects([mp.afx.MultiplyVolume(1.5)])
    clip2 = clip2.with_effects([mp.afx.MultiplyVolume(1.5)])
    
    # 3. Concatenate all pieces
    print("Concatenating the Reel...")
    final_reel = mp.concatenate_videoclips([intro_clip, clip1, clip2], padding=-1.0, method="compose")
    
    # 4. Render
    print("Rendering final Instagram Reel (Vertical HD)...")
    final_reel.write_videofile(
        OUTPUT_FILE,
        fps=30,
        codec="libx264",
        audio_codec="aac",
        preset="fast"
    )
    
    final_reel.close()
    clip1.close()
    clip2.close()
    intro_clip.close()
    
    print(f"\nSUCCESS: Circle D Jam Reel generated at: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
