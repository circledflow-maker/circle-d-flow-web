import instaloader
import os
import shutil

L = instaloader.Instaloader()

profiles = [
    "ruiduartenobre",
    "og__flow__official",
    "_edoardostatuto_",
    "tiagosilva_music",
    "filipesax_"
]

output_dir = r"D:\circle-d-flow-web\01_AGENT_PROCESSING\reference_faces"

for username in profiles:
    try:
        print(f"Fetching profile for {username}...")
        L.download_profile(username, profile_pic_only=True)
        
        # Instaloader creates a folder named after the username.
        # Find the .jpg file in that folder and move it to reference_faces
        for f in os.listdir(username):
            if f.endswith('.jpg'):
                src = os.path.join(username, f)
                dst = os.path.join(output_dir, f"{username}.jpg")
                shutil.copy(src, dst)
                print(f"Saved {dst}")
                break
                
        # cleanup the downloaded folder
        shutil.rmtree(username)
    except Exception as e:
        print(f"Failed to fetch {username}: {e}")
