import os
import shutil

# --- CONFIGURATION ---
BASE_PATH = r"D:\alterlife Content\Selected_Original_Cuts"
TARGET_DIR = os.path.join(BASE_PATH, "aftermovie")

# Mapping based on visual reference (20 items)
STORYBOARD = [
    # Graphics
    (r"01_Branding_Graphics\GX010169.MP4", "01_Logo_Black.mp4"),
    (r"01_Branding_Graphics\GX010170.MP4", "02_Logo_BlueGlow.mp4"),
    
    # Social 1
    (r"02_Social_Atmosphere\GX010171.MP4", "03_Guy_Smiling_Social.mp4"),
    (r"02_Social_Atmosphere\GX010172.MP4", "04_Group_Social.mp4"),
    
    # Performance 1
    (r"03_DJ_Performance\A_0001C407H260321_1207293A_CANON.MP4", "05_Performer_Talking.mp4"),
    (r"03_DJ_Performance\A_0001C408H260321_1209103A_CANON.MP4", "06_Stage_Wide.mp4"),
    (r"03_DJ_Performance\A_0001C409H260321_1212309V_CANON.MP4", "07_Stage_Angle.mp4"),
    
    # Social 2
    (r"02_Social_Atmosphere\GX010173.MP4", "08_Group_Back.mp4"),
    (r"02_Social_Atmosphere\GX010174.MP4", "09_RedShirt_Guy.mp4"),
    
    # Atmosphere / Tech
    (r"03_DJ_Performance\A_0001C410H260321_1216069V_CANON.MP4", "10_Vibe_Feet.mp4"),
    (r"03_DJ_Performance\A_0001C411H260321_1216175E_CANON.MP4", "11_Phone_Filming.mp4"),
    (r"03_DJ_Performance\A_0001C412H260321_121848QH_CANON.MP4", "12_Guy_Talking_2.mp4"),
    (r"03_DJ_Performance\A_0001C413H260321_121900QX_CANON.MP4", "13_Booth_BW.mp4"),
    (r"03_DJ_Performance\A_0001C415H260321_123021XP_CANON.MP4", "14_Deck_CU.mp4"),
    
    # Performance 2
    (r"03_DJ_Performance\DSC_0147.MOV", "15_LolaRex_DJ_Performance.mov"),
    (r"03_DJ_Performance\DSC_0149.MOV", "16_Equipment_Close.mov"),
    (r"03_DJ_Performance\DSC_0150.MOV", "17_Equipment_Angle.mov"),
    
    # Social 3
    (r"02_Social_Atmosphere\GX010180.MP4", "18_Girl_Smiling_Social.mp4"),
    
    # Final Performer
    (r"03_DJ_Performance\A_0001C416H260321_123500LX_CANON.MP4", "19_Performer_Speech.mp4"),
    
    # Outro
    (r"01_Branding_Graphics\A_0001C624A260321_184528QO_CANON.MP4", "20_Outro_SeeYouSoon.mp4")
]

def build_aftermovie():
    print(f"Building storyboard folder: {TARGET_DIR}")
    os.makedirs(TARGET_DIR, exist_ok=True)
    
    for relative_src, dest_name in STORYBOARD:
        src_path = os.path.join(BASE_PATH, relative_src)
        dest_path = os.path.join(TARGET_DIR, dest_name)
        
        if os.path.exists(src_path):
            print(f"Sequencing: {dest_name}")
            shutil.copy2(src_path, dest_path)
        else:
            print(f"!!! Error: Could not find source {src_path}")

if __name__ == "__main__":
    build_aftermovie()
    print("\n[SUCCESS] Aftermovie storyboard sequence constructed.")
