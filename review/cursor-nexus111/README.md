# Nexus111 · eine SoulNexus-Oberfläche

14.11.2026 · Cursor. Isolierter Kandidat. Keine Änderung an aktiven Produktdateien.

Für Codex: dieser Ordner hieß lokal `Team/collaboration/review/cursor-nexus111/` und war durch `/Team/` in `.gitignore` nicht auf GitHub. Prüfbarer Pfad auf dem Branch `cursor/nexus111-soulpass-5a69`: `review/cursor-nexus111/`. Startseite: `review/cursor-nexus111/index.html`.

## Fehlende Quellen
Diese Dateien waren hier nicht lesbar:

- `E:/circle-d-flow-web/handoffs/2026-11-14_nexus111_codex-an-cursor.md`
- `E:/circle-d-flow-web/Docs/community-pilot/nexus111-unified-book-contract-20261114.md`
- Antigravitys `CDFCover111`

Der Kandidat folgt der schriftlichen Aufgabe. Die Freigabe wiederholt die Pass74-Positivliste aus Draft-PR18 `fbbb5e3`: Name, Level, Interessen, gesammelte Zeichen, Instagram, TikTok, Discord. E-Mail, Tagebuch, Guthaben und Einstellungen bleiben außen. Es gibt keinen zweiten Pass und keine Nah-/Ganzbuch-Modi.

## Start
Im Ordner:

```
python3 -m http.server 8765 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8765/index.html`.

## Ablauf
Geschlossener Einband, ein Knopf „Einband öffnen“. Danach bleibt die Buchoberfläche offen. Register wechseln nur den Papierinhalt. Oben bleibt die dunkle Karte, darunter das warme Papier. Unten: Lesen, Begegnung, Tagebuch.

Lesen öffnet die größere Ansicht desselben Kapitels. Zurück stellt Kapitel, Fokus und Scrollposition wieder her. Begegnung und Tagebuch schließen ebenfalls zurück auf dieselbe Oberfläche.

Ohne `window.CDFCover111.mount` bleibt der lokale Einband nur die Öffnungsstelle. Liegt der Adapter vor dem Start auf `window.CDFCover111`, bindet `js/nexus111-cover.js` ihn mit `{once:true,onOpen}`. Ein zweites Öffnen ruft `onOpen` nicht erneut auf.

`js/nexus111-integrate.js` ruft vorhandenes `CDFPrivateJournal.mount` und erkennt `CdfAccount.mountSecurity`. In dieser Demo sind beide nicht geladen, deshalb speichert nichts und meldet das auch so. Der Kalender bleibt leer. Demodaten zeigen nur einen Namen und drei als Demo gekennzeichnete Zeichen, keinen Fortschritt und keine Termine.

## Prüfung
`node --test tests/nexus111.test.cjs`: 7 bestanden, 0 Fehler.

Headless Chrome 156 auf localhost, 14.11.2026. Kein Finger, kein Gerät.

| Prüfung | Ergebnis |
| --- | --- |
| 360×640 geschlossen | Einband und ein Öffnen, kein horizontales Überlaufen, keine 44px-Unterschreitung sichtbarer Knöpfe |
| 360×640 nach Öffnen | Karte mit unbekanntem Namen, Register Pass/Chronik/Sammlung, Cover zu |
| Register, Wischen im Text | Chronik bleibt Chronik |
| Wischen auf der Oberfläche | Chronik wird Sammlung |
| Lesen und Zurück | größere Ansicht, danach Sammlung, Fokus auf Lesen, Öffnungen bleiben 1 |
| Pfeil hoch | Konto bleibt am Ende; von Sammlung nach Chronik |
| Begegnung | Felder nur Name und Zeichen; der Satz nennt E-Mail als ausgeschlossen |
| Konto | „Nichts gespeichert.“ |
| 390×844 Demodaten und größere Schrift | drei Demozeichen, kein Fortschritt, kein Überlauf |
| 844×390 und 1280×800 | kein Überlauf |

Bilder: `evidence/`. Die leere Sammlung ist kürzer als ihr Scrollbereich, deshalb klemmt die sichtbare Position auf 0. Der Modelltest hält 128px Kapitel, Fokus und Scroll fest.

NOT_RUN: physisches Handy, Softwaretastatur, echtes Fingerwischen, Betriebssystem-Schrift, reduzierte Bewegung, Gyro, Sanctuary-Überlagerung. `CDFCover111`, die Übergabe und der Buchvertrag waren nicht im Checkout. Es wurde keine aktive Produktdatei geändert.
