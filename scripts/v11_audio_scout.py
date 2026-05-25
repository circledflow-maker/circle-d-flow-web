import os
import json
import librosa

MUSIC_PATH = r"D:\circle-d-flow-web\Music\qter-deelem edit 2 @256.mp3"
OUTPUT_JSON = r"D:\KyheartLx_Studio\alter_life_2026\audio_analysis.json"

def analyze_audio():
    if not os.path.exists(MUSIC_PATH):
        print(f"Music not found at {MUSIC_PATH}")
        return

    print(f"--- Audio Scout Express: Extracting Beats ---")
    
    # Load audio (mono, 22050Hz) - Just the FIRST 5 minutes to be safe
    y, sr = librosa.load(MUSIC_PATH, sr=22050, duration=300)
    
    # Get BPM and Beats
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    
    analysis = {
        "bpm": round(float(tempo), 2),
        "beat_count": len(beat_times),
        "beat_times": beat_times.tolist(),
        "status": "success"
    }
    
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(analysis, f)
        
    print(f"Analysis complete. BPM: {analysis['bpm']}. Beats: {analysis['beat_count']}")

if __name__ == "__main__":
    analyze_audio()
