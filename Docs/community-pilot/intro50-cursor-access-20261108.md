
# Intro50 · Cursors Zugriffsgrenze und portabler Prüfsatz
Datum:2026-11-08 · Codex · CDF / technische Abnahme.

## Stand
Hope übermittelt Cursors NOT_RUN-Rückmeldung. Laut Text fehlen E:-Quelle/Rollenbriefe; öffentliche Vorschau zeigt ältere Login-Seite und liefert Intro49-Skripte nicht. Das ist kein beobachteter Produktfehler/PASS. Zwei Dateien und Commit300832cbe33959455b5b82577015b0374e7f09fc sind gemeldet, Originale aber nicht eingegangen. GitHub-Abfrage422 „No commit found“, lokales Git-Objekt ebenfalls nicht vorhanden. Keine Originalübernahme oder unabhängige Prüfung der gemeldeten Vorschau behauptet. Cursor soll2 Markdown-Exporte liefern, keinen ungeprüften Push auslösen.

## Konkreter anderer Prüfweg
Eingefrorener Testkoffer Docs/community-pilot/fixtures/intro49-review-kit.zip, SHA-256 5a68f2edeb86e3085431f5fafdde92b984fa96d786c0c256fe4ed146f15962ab, 280777 Bytes.44 explizite öffentliche UI-/Bibliotheks-/Lizenzdateien und4 Wurzel-Prüfhilfen. UI49 unverändert, weitere ausgewählte öffentliche E:-Abhängigkeiten eingefroren; keine vollständige Produktionsbasis. Geprüfte aktuelle Intro49-Skripte enthalten, Marker im Preview-Guard. Three.js/OrbitControls r128 liegen lokal mit MIT-Notice bei. Offizielle Controls/License aus mrdoob/three.js am Tag r128 abgerufen; vorhandene Three-r128-Kopie unverändert benutzt.
Backend-SDK, Runtime-/Supabase-Konfiguration und auth-handler ausgeschlossen. Statische Preview-Guards sperren Kontotransaktionen; CSP connect-src none/form-action none. Keine privaten Kopplungstoken, Konto-/Team-/env-/API-Dateien oder echten Anmeldedaten im ZIP. Gezielte Auswahl, kein rekursiver Export des Arbeitsbaums.
Der Prüfsatz ist in neuem temporärem Ordner ausführbar: node verify-kit.cjs; danach node serve-preview.cjs für Browser. Server bindet ausschließlich127.0.0.1:3219, akzeptiert GET/HEAD, liefert nur manifestierte Dateien und endet nach15 Minuten. Keine Plattformfreigabe/Produktion/Abos nötig.

## Tatsächlich geprüft
ZIP neu entpackt, alle44 manifestierten Dateien vollständig per HTTP erreichbar. Login/Sanctuary200; API/env/Team/Manifest404; POST405; Konto-SDK aus HTML entfernt. Manifesthashes beim Serverstart geprüft, lokale3D-Dateien enthalten.3 bestehende Preview-Guardtests bestanden. Server nach Smokecheck beendet.
Neue Browser-/GPU-/Mobile-/Gerätebildprüfung NOT_RUN. Verifikationsablauf benutzt: Einstieg → eingefrorene Dateiversion → Server/Assets/Schutz → Browser (noch offen), keine echte Backend-/Kartenabnahme.

## Veröffentlichungsfreigabe und nächste Arbeit
Automatische Prüfung lehnte den ersten ZIP-Upload wegen fehlender ausdrücklicher Freigabe des vollständigen öffentlichen Payloads ab; kein Upload durch diesen Versuch. Danach erteilt Hope ausdrücklich Zustimmung. Exakt der oben gehashte Prüfsatz wird gezielt im öffentlichen Koordinationsbranch gespeichert, keine Veröffentlichung der App oder Produktion. Vorbereitung und Nachweis bleiben getrennt von Cursors tatsächlicher Ausführung.
Aktueller Cursor-Brief enthält diesen portablen Weg und ersetzt dort die vorherige E:-/LAN-Voraussetzung sowie das generelle Serververbot durch genau den begrenzten Loopback-Test. Kein neuer Agent oder automatischer Folgelauf gestartet. Vor weiterer Gestaltung zuerst eine echte unabhängige Bildabnahme oder klar belegte fehlende Browserfähigkeit.
