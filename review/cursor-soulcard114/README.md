# SoulCard114 · Begegnung in derselben SoulNexus

14.11.2026 · Cursor. Isolierter Kandidat. Keine aktive Produktdatei geändert, kein Deployment ausgelöst.

Die Auftragsdatei `E:/circle-d-flow-web/handoffs/2026-11-14_soulcard114_codex-an-cursor.md` war hier nicht lesbar. Der Kandidat folgt der schriftlichen Aufgabe. Der Einband-Controller aus Pull Request 19 wird nicht wiederverwendet. Es gibt eine eigene einmalige Öffnung und danach die Kapitel.

## Start
Im Ordner `review/cursor-soulcard114/`:

```
python3 -m http.server 8765 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8765/index.html`.

## Ablauf
Einband öffnen, einmal. Register wechseln Pass, Chronik, Sammlung, Kalender und Konto. Begegnung öffnet die zweiseitige Karte. Nichts ist angehakt. Flowee kann den Entwurf füllen, die Vorschau bleibt leer, bis Felder gewählt sind. Tagebuch hat eine private Notiz und einen Community-Entwurf. Veröffentlichen ist gesperrt. „Für eine Jam vormerken“ erzeugt nur einen Teilnahmeentwurf.

`node --test tests/soulcard114.test.cjs`: 6 bestanden, 0 Fehler.

Headless Chrome mit reduzierter Bewegung, 14.11.2026: 360×640 geschlossen, 390×844 Begegnung mit größerer Schrift, 844×390 und 1280×800 ohne seitlichen Überlauf. Einmal öffnen bleibt bei einem zweiten Klick bei einer Öffnung. Register und Wischen im Text wechseln das Kapitel nicht. Die Karte zeigt „Rolle: Gast“ erst nach dem Haken, die Rückseite folgt der Wendetaste. Private Notiz: „Keine Journalverbindung. Nichts gespeichert.“ Veröffentlichen bleibt gesperrt. Kein Nah-/Ganzbuch-Schalter. Physisches Handy ist NOT_RUN.
