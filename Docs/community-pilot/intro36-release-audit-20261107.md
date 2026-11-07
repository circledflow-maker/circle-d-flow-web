# Intro36 · Releasequellenabgleich
Datum: 2026-11-07 · Projekt: CDF / Community-App · Bearbeiter: Codex.
Ergebnis: PR18 ist weiterhin kein vollständiger Auslieferungskandidat.

## Beleg und Methode
Frisch gelesener PR18-Head: 264a7c725fd4acca69e58ffdfa36601e9d3c29c8; Draft, ungemergt. Vollständiger GitHub-Dateibaum mit 2986 Einträgen, nicht abgeschnitten. Die37 direkten JS/CSS-Abhängigkeiten aus intro35-dependencies.json auf E: existieren und stimmen unverändert mit den dortigen SHA-256-Werten überein.
Dateibaumabgleich über Git-Blob-Hashes:13 bytegleich,4 ausschließlich CRLF/LF-Abweichung,4 inhaltlich abweichend,16 im PR18-Baum fehlend. Ein Hashvergleich ist keine semantische Auth-/Sicherheitsprüfung. Keine fehlende Datei automatisch kopiert; keine Inhalte von Konfiguration/Zugangsdaten veröffentlicht.

## Fehlende direkte Dateien
- css/cdf_login.css
- js/vendor/supabase-2.108.2.js
- js/cdf_identity.js
- js/flowee_fairy.js
- js/cdf_account_motion.js
- css/sanctuary_courtyard.css
- js/sanctuary_movement.js
- js/ewe_cultural_library.js
- js/sanctuary_environment.js
- js/data/lisbon_regions.js
- js/lisbon_geography.js
- js/lisbon_context.js
- js/sanctuary_shell.js
- js/sanctuary_next_step.js
- css/flowee_room_tutorial.css
- js/flowee_room_tutorial.js

## Inhaltlich getrennt zu prüfen
- js/agents/supabase_client.js
- js/auth-handler.js
- js/room_transition.js
- js/sanctuary_scene.js

Diese vier Dateien erfordern einen semantischen Abgleich mit den gewählten Releaseversionen; sie wurden hier nicht als kompatibel freigegeben. Insbesondere Client/Auth nicht ungeprüft aus der alten Basis übernehmen.

## Nur Zeilenenden
- js/cdf_runtime_config.js
- js/cdf_account_journey.js
- js/luvo_scene.js
- js/sanctuary_arrival.js
CRLF→LF ergibt jeweils denselben Git-Blob. Diese vier Fälle sind kein Beleg eines Funktionsunterschieds.

## Begrenzung und nächste Phase
37 direkte Dateien sind keine transitive Vollinventur. Der Ladeübergang referenziert zusätzlich Assets/room_loading/courtyard-door.svg; lokal vorhanden, im PR18-Baum fehlend. Externe Three.js-Ladewege, weitere dynamische Assets, API-Endpunkte und Zielseiten separat prüfen. Keine neuen Browser-, Geräte-, Live-Auth- oder RLS-Tests in dieser Inventur ausgeführt; die32 Intro35-Tests sind historische Belege aus der vorherigen Phase.

Parallel vorbereitet: handoffs/2026-11-07_intro36_codex-an-cursor.md. Cursor erhält eine unabhängige reine Gast-/Mobilprüfung, keine Produktänderungen. Nicht gestartet, kein angenommener Auftrag behauptet. Formale Rollenbesetzung noch nicht zugeordnet.

Nächster Codex-Schritt: die vier inhaltlich unterschiedlichen Dateien und die16 fehlenden direkten Dateien nacheinander gegen den gewählten Kandidaten abgleichen; anschließend transitive Ressourcen/Routen erfassen. Erst danach isolierten vollständigen Kandidaten bauen. Nicht in den stark veränderten E:-Arbeitsbaum mergen oder D: synchronisieren. Kein Merge, Deployment, neuer Renderjob, Slack-Dienst oder bezahlter Aufruf in dieser Phase.
