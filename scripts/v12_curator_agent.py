import os
import datetime

# --- CONFIGURATION ---
WORKSPACE = "d:/circle-d-flow-web"
RAW_UPLOADS_DIR = os.path.join(WORKSPACE, "raw_uploads")

# --- PROMPT 1: CURATOR AGENT ---
CURATOR_SYSTEM_PROMPT = """
Du bist der 'Circle D Flow Curator', ein hochintelligenter Bild- und Video-Analyst. 
Deine Aufgabe ist es, eingehende Medien aus Lightroom und Google Drive zu scannen und basierend auf visuellen Merkmalen, 
Metadaten und Ordnerstrukturen in exakte Portfolio-Kategorien einzuordnen.

Regeln für die Kategorisierung:

- 'Sacred Captures' (High-End-Porträts für Bookings): Suche nach Bildern mit professioneller Ausleuchtung, klarem Fokus auf ein Gesicht/Person, hoher Schärfentiefe, Studioumgebung oder sauberem Bokeh. Diese müssen kommerziell nutzbar und hochauflösend wirken.
- 'Raw Energy' (Straßenfotos/Graffiti): Suche nach urbanen Umgebungen, Graffitis an Wänden, rauer Beleuchtung, spontanen Momenten, Skatern, Architektur und der Atmosphäre von Lissabons Straßen.
- 'The Atelier' (Physische Kunstwerke): Identifiziere Nahaufnahmen von Gemälden, Leinwandstrukturen, handgemachtem Schmuck, Töpferwaren/Ton oder Epoxidharz-Kunst (wie Aschenbecher). Achte auf Makro-Details und Handwerkskunst.
- 'Soundwaves' (DJ Sets & Musik): Suche nach DJ-Equipment (CDJs, Mischpulte), Künstlern mit Kopfhörern, Club- oder Festival-Atmosphäre, tanzenden Menschenmengen.
- 'The Tribe' (Community & Jam Sessions): Suche nach Gruppen von Menschen, die musizieren (Instrumente), Live-Painting machen oder in Gärten (wie dem Secret Garden LX) interagieren.

Aktion: Wenn du das Medium analysiert hast, weise ihm den entsprechenden Tag zu und schiebe es in die passende Datenbank-Kategorie für das Frontend-Portfolio. Fehlen wichtige Daten, setze den Status auf 'Needs Review'.
"""

class CuratorAgent:
    def __init__(self):
        print("[INIT] Circle D Flow Curator Agent Online")
        self.categories = ["Sacred Captures", "Raw Energy", "The Atelier", "Soundwaves", "The Tribe"]

    def analyze_asset(self, filepath):
        """
        Simulates parsing the asset through the LLM with the CURATOR_SYSTEM_PROMPT.
        In production, this interfaces directly with OpenAI Vision/Gemini.
        """
        print(f"\n[AI-VISION] Applying Curator System Prompt to: {os.path.basename(filepath)}")
        print("[AI-VISION] Analyzing lighting, bokeh, urban structures, crowd patterns...")
        
        # Simulated tagging logic for prototype pipeline
        filename_lower = filepath.lower()
        if "studio" in filename_lower or "portrait" in filename_lower:
            tag = "Sacred Captures"
        elif "street" in filename_lower or "graffiti" in filename_lower:
            tag = "Raw Energy"
        elif "resin" in filename_lower or "clay" in filename_lower or "art" in filename_lower:
            tag = "The Atelier"
        elif "dj" in filename_lower or "set" in filename_lower:
            tag = "Soundwaves"
        elif "jam" in filename_lower or "circle" in filename_lower:
            tag = "The Tribe"
        else:
            tag = "Needs Review"
            
        print(f"[CURATOR] Assignment Complete -> Tag: [{tag}]")
        return tag

    def process_queue(self):
        print(f"--- Triggering Ingestion Sequence ---")
        if not os.path.exists(RAW_UPLOADS_DIR):
            os.makedirs(RAW_UPLOADS_DIR)
            print(f"Directory {RAW_UPLOADS_DIR} created. Waiting for media.")
            return

        files = [f for f in os.listdir(RAW_UPLOADS_DIR) if not f.startswith('.')]
        if not files:
            print("[PIPELINE] No new raw files detected. Entering passive scan mode...")
            return

        for f in files:
            full_path = os.path.join(RAW_UPLOADS_DIR, f)
            tag = self.analyze_asset(full_path)
            # Future integration: Auto push to Supabase or portfolio_data.js

if __name__ == "__main__":
    agent = CuratorAgent()
    agent.process_queue()
