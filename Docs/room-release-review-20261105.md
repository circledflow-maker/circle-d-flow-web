# Raumrelease atmosphere27 — Abgleich vom 05.11.2026

Agent: Codex · Projekt: Circle D Flow · Entscheidung: Hope

## Belegter Stand

- PR #17 bei Prüfstart: 0590161. Netlify-Commitstatus: success / Deploy Preview canceled. GitHub Inspector: success. Vercel-Branchliste zeigte nur den alten Build zu 56fdd95 vom 28.10.; keinen neuen Build zum korrigierten Stand. Das stützt die beabsichtigte Preview-Sperre, beweist aber keine Bereinigung alter Deployments.
- Aktive Quelle E:/circle-d-flow-web gelesen. Gegen die 26 öffentlichen Text-/Asset-Dateien im bisherigen PR-#18-Diff: 17 bytegleich, 9 inhaltlich geändert. Änderungen26/27 betreffen Raum-Recovery, Modal-Eingaben, Bildausschnitt und originale Restaurant-/Marktatmosphäre. Ein zusätzliches erforderliches Modul js/creator_room_atmosphere.js wurde erkannt und aufgenommen.
- Neue öffentliche Release-Basis: Commit 4d7c0f2ac29fbc03043e45dbe6dd6f88f76e6db8. 28 bestehende Manifest-Dateien gegen ihre Git-Blob-Hashes verifiziert, zusätzliches Atmosphärenmodul aufgenommen. Das feste Release-Manifest enthält jetzt29 Dateien. Öffentliche Textänderungen wurden ausdrücklich auf LF normalisiert; die Hashes beziehen sich auf die tatsächlich gespeicherten Release-Bytes.
- Frischer Lauf am05.11.: 41 relevante automatisierte Fälle bestanden,0 fehlgeschlagen. Umfasst Navigation/Bestätigungsdialoge, Timeout/Abbruch, lokalen Speicher, Kollisionen und tatsächliche Three-Geometrie mit ersetztem GPU-Renderer. Temporärer Test-Parser außerhalb der Produktabhängigkeiten. Das ist keine neue GPU-, physische Smartphone-, authentifizierte Live- oder RLS-Abnahme.
- Notwendige Git-/Export-Schutzregeln auch in PR #18 aufgenommen. Die beiden vorbereitenden Branches werden beim Git-Preview übersprungen; andere Branch-/Produktionskontexte nicht. credentials.json und adobe_token.json fehlen im vorgeschlagenen aktuellen Dateibaum. Originale auf E: nicht verändert; Historie/Gültigkeit/Rotation bleiben offen.

## Releasegrenze

GitHub-main ist weiterhin kein vollständig abgeglichener Ersatz für den tatsächlichen Produktstand. Der neue Buildhelfer scripts/releases/room-atmosphere27.cjs muss auf die vollständige origin19-Produktionsquelle angewendet werden. Er lädt ausschließlich die29 festgelegten öffentlichen Dateien aus dem bezeichneten Commit und prüft SHA256 vor dem Schreiben. Weder der unvollständige Git-Branch als Ganzes noch ein älterer Preview werden als aktuelle Produktion freigegeben.

Keine neue Veröffentlichung, Promotion, Zahlung, Kontenerstellung, Rollen-, Datenbank-, RLS- oder XP/FLOW-Regeländerung durch diesen Abgleich. Letzte gelesene Produktionsbasis: dpl_AmqQ8YRQZiBrGyBDmtsBCxpfivLq (origin19). Bestehender polish25-Preview dpl_2Ja1kMkJqtXrtfPVV6NCKDtE54xc ist ein älterer Kandidat.

## Nächste Abnahme

1. Neuer geschützter Build auf der vollständigen Produktionsbasis;29 Dateihashes, öffentliche Eintrittsrouten und private404/geschützte API-Grenzen prüfen.
2. Frische Browser-/GPU-Prüfung, anschließend physisches Gerät und autorisierte Konten/RLS getrennt behandeln.
3. Erst den konkret geprüften Release-Kandidaten gemäß Hopes Freigabe veröffentlichen. Alte Zugangsdaten-/Historienprüfung separat abschließen.
