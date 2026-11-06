# Übergabe: LUVO32 zur Releaseprüfung
Datum: 2026-11-06 · Projekt: CDF / LUVO, Flowee-Anmeldebegleitung.
Von: Codex. Empfänger-Rolle: technische Releaseprüfung; formale Rollen-Zuordnung noch nicht zugeordnet. Vorgesehener Bearbeiter Codex, keine andere Agentenannahme behauptet.
Ziel: neuen 3D-Eingang in einen vollständigen, reproduzierbaren Releasekandidaten integrieren.
Kontext: CEO beauftragte LUVO als3D-Eingang für Intro/Registrierung/Login sowie animierte Anime-Ladevorgänge. Lokal umgesetzt, nicht deployed.
Inputs: PR18 Quellcommit 3ff01d4003801d77910a25cae0176dafd7720d13; Docs/community-pilot/luvo-3d32-20261106.md und luvo32-dependencies.json. Fünf ausgewählte Produkt-/Testdateien gesichert,14 lokale Laufzeitabhängigkeiten mit Hash dokumentiert. Nicht alle Abhängigkeiten sind im alten Git-Baum enthalten.
Gewünschtes Ergebnis: vollständiger Kandidat aus bestätigter Produktionsbasis und ausdrücklich gewählten lokalen Änderungen, einschließlich tatsächlicher Login-Abhängigkeiten, Raumstand und Sprachfix. Keinen alten atmosphere27-Helfer als LUVO32-Auslieferung bezeichnen.
Abnahme: Hashmanifest, richtige statische URL-Auflösung, keine privaten Exportdateien; 3D/ruhige Ansicht und Login-/Register-Einstieg auf Desktop/Mobil; Auth/RLS/Rewards unverändert; GPU-/Ladefehler korrekt eingeordnet; bestehende Daten/Änderungen erhalten. Kandidat mit konkreter Version/Link für Hope erst nach Prüfung.
Offene Abhängigkeiten: vollständige Releasebasis, physisches Smartphone/echte Tastatur, authentifizierte E-Mail-/Karten-Journey, finale Veröffentlichungsentscheidung Hope.17 lokale Tests bestanden; Browserbelege und Grenzen im Bericht. Keine Deployment-Freigabe aus Testzahl oder Branch ableiten.
Zustand: offen; nicht nach done verschieben.
