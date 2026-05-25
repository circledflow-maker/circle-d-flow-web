import os
import random
import datetime

# --- CONFIGURATION (YGGDRASIL MATRIX) ---
WORKSPACE = "d:/circle-d-flow-web"

FOLDERS = {
    "INBOX": os.path.join(WORKSPACE, "00_INBOX_RAW_ENERGY"),
    "PROCESSING": os.path.join(WORKSPACE, "01_AGENT_PROCESSING"),
    "ARCHIVE": os.path.join(WORKSPACE, "02_THE_ARCHIVE_PORTFOLIO"),
    "VAULT": os.path.join(WORKSPACE, "03_THE_VAULT_CLIENTS")
}

ARCHIVE_CATEGORIES = [
    "01_Sacred_Captures",
    "02_Raw_Energy",
    "03_Soundwaves",
    "04_The_Atelier",
    "05_The_Tribe"
]

# --- PROMPT 3: THE ARCHIVE POET (MASTER NAMER) ---
POET_SYSTEM_PROMPT = """
Du bist 'The Archive Poet', der Chef-Archivar von Circle D Flow.
Aufgabe: Rohe Dateinamen (z.B. DSC0207.MOV) analysieren und basierend auf Ordnernamen (Ort/Kontext) und 
visueller KI-Analyse einen poetischen, aber klaren Titel vergeben.

Regeln:
1. Analyse: Lies den Ordnernamen als Theme. (z.B. Lissabon_Graffiti_März).
2. Synthese: Nutze 2-5 englische/deutsche Wörter, getrennt durch '|'.
3. Typ-Regel:
   - Fotos: Statische/Tiefe Titel (z.B. 'Moment of Clarity | Alfama Root')
   - Videos: Dynamische Titel (z.B. 'Moving Frequencies')
   - Shorts: Energiegeladene Titel (z.B. 'Quick Pulse: Lisbon')
4. Keine Massennamen: Niemals 'Graffiti 1', 'Graffiti 2'. Variiere die Formulierungen.
"""

# --- PROMPT 4: WEEKLY FLOW ROTATION & DEDUPLICATION ---
GHOST_TAGGER_PROMPT = """
Aufgabe: Filtere den ARCHIVE Ordner für das wöchentliche Frontend-Update (Weekly Flow).
Regeln:
- Deduplikation: Wenn in einem 'Burst-Shot' (zynısche Zeitstempel) 10 ähnliche Bilder (gleiches Motiv) liegen,
  behalte NUR DAS EINE mit der besten Schärfe/Komposition. Lösche oder ignoriere Dubletten (.NEF/.CR2 werden ignoriert).
- Weekly Limit: Wähle maximal 12 Fotos und 3 Videos pro Kategorie.
- Zeitgeist: Berücksichtige Saisonalität (Winter = mehr Atelier, Sommer = mehr Street).
"""

class YggdrasilPipeline:
    def __init__(self):
        print("\n[INIT] Tree of Life (Yggdrasil Directory Network) Spawning...")
        # Create base folders
        for key, path in FOLDERS.items():
            os.makedirs(path, exist_ok=True)
            
        # Create categories in Archive
        for cat in ARCHIVE_CATEGORIES:
            os.makedirs(os.path.join(FOLDERS["ARCHIVE"], cat), exist_ok=True)
            
        print("[SUCCESS] Directory Roots Stabilized.\n")

    def ghost_tag_and_deduplicate(self, queue):
        """Simulates AI analyzing a burst shot queue and deduplicating."""
        print("[AGENT] Ghost-Tagger Initiated...")
        print("[AGENT] Scanning for Burst-Shots and evaluating contrast/focus...")
        
        # Mock logic: deduplicate
        filtered = []
        seen_basenames = set()
        for f in queue:
            # Ignore RAW formats
            if f.lower().endswith(('.nef', '.cr2', '.arw')): continue
            
            basename = f.split(".")[0]
            # Strip numeric suffixes (like DSC_001, DSC_002) for a rough mock deduplication
            motif_group = basename.split("_")[0] if "_" in basename else basename 
            if motif_group not in seen_basenames:
                filtered.append(f)
                seen_basenames.add(motif_group)
                
        print(f"[AGENT] Deduplication Complete. {len(queue)} raw files reduced to {len(filtered)} Master Nodes.")
        return filtered

    def archive_poet_naming(self, category_name, file_list):
        """Simulates LLM titling sequence"""
        print(f"[POET] Naming Batch for {category_name}...")
        titles = []
        for file in file_list:
            if "mp4" in file.lower() or "mov" in file.lower():
                titles.append(f"Moving Frequency | {category_name.split('_')[-1]} Session")
            else:
                titles.append(f"Silent Resonance | {category_name.split('_')[-1]} Chronicle")
        return titles

    def generate_weekly_flow(self):
        """Builds the JSON array or Supabase payload for the current week"""
        print(f"\n--- [WEEKLY FLOW] Commencing Genesis ({datetime.datetime.now().strftime('%Y-%m-%d')}) ---")
        
        # Step 0: Scan INBOX
        inbox_files = os.listdir(FOLDERS["INBOX"])
        if not inbox_files:
            print("[INFO] Inbox is empty. Nothing to process.")
            return

        print(f"[PROCESS] Found {len(inbox_files)} files in Inbox. Analyzing traces...")
        
        # Step 1: Dedup and Filter
        refined_files = self.ghost_tag_and_deduplicate(inbox_files)
        
        # Step 2: Categorization & Archiving
        # In a real run, AI would categorize. Here we use basic mapping for the test.
        for filename in refined_files:
            ext = os.path.splitext(filename)[1].lower()
            is_video = ext in ['.mp4', '.mov']
            
            # Target Category (Simple logic for test)
            target_cat = "02_Raw_Energy" if is_video else "01_Sacred_Captures"
            target_path = os.path.join(FOLDERS["ARCHIVE"], target_cat, filename)
            
            # Move from Inbox to Archive
            src_path = os.path.join(FOLDERS["INBOX"], filename)
            os.rename(src_path, target_path)
            print(f"[ARCHIVE] Moved: {filename} -> {target_cat}")

        # Step 3: Synthesis (The Alchemist)
        print("\n[ALCHEMIST] Commencing Synthesis of Aftermovies & Shorts...")
        ready_dir = os.path.join(WORKSPACE, "Pipeline_Ready_to_Publish")
        os.makedirs(ready_dir, exist_ok=True)
        
        # Simulated "Render"
        aftermovie_name = f"Aftermovie_16x9_{datetime.datetime.now().strftime('%Y-%m-%d')}_Unpublished.mp4"
        short_name = f"Short_9x16_{datetime.datetime.now().strftime('%Y-%m-%d')}_Unpublished.mp4"
        
        with open(os.path.join(ready_dir, aftermovie_name), 'w') as f: f.write("MOCK VIDEO DATA")
        with open(os.path.join(ready_dir, short_name), 'w') as f: f.write("MOCK SHORT DATA")
        
        print(f"[SUCCESS] Alchemist Synthesis Complete: {aftermovie_name}")
        print(f"[SUCCESS] Pipeline Resting. Next flow update scheduled for Monday 00:00.")

if __name__ == "__main__":
    yggdrasil = YggdrasilPipeline()
    yggdrasil.generate_weekly_flow()
