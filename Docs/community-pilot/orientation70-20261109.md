# Orientation70 · freiwillige Interessen und erklärbare Wege
2026-11-09 · Codex · CDF / Community-App · Produktcommit 7ad9aea554815c702f7da31c0f7054c230112832

## Tatsächlich eingebaut
Flowee bietet am dritten Erwachensschritt „Mit Flowee meinen Weg finden“ an. Die Orientierung ist außerdem im Sanctuary-Infomenü und im vorhandenen Flowee-Dialog erreichbar. Kein Pflichtformular: Schließen, Escape und „Ohne Angaben erkunden“ bleiben möglich.

1. Bis zu drei Bereiche: Musik, visuelle Kunst/Gestaltung, Video/Film, eigene Kreation, Unterstützung/Fürsorge, Wissen/Erfahrung, Tanz, Sport, Handel und Kochen/Essen. Generische Symbole sind Orientierungshilfen, keine kulturellen Siegel oder verdienten Abzeichen.
2. Freiwilliger Teilnahmewunsch für heute: entdecken/lernen, beitragen/teilen oder zusammenarbeiten.
3. Separater, standardmäßig nicht gewählter Rollenwunsch „später Beta Initiator werden“. Hope präzisierte dies als spätere bestätigte Community-Rolle; die aktuelle Auswahl ist weder Bewerbung noch Bestätigung.
4. Bis zu drei vorhandene Hoforte mit lesbarer Begründung. „Im Hof zeigen“ nutzt das bestehende arrive und zeigt den Ort tatsächlich; ein vorhandener Link öffnet den jeweiligen Bereich erst auf bewusste Aktion.

Vollbild bei Antworten, scrollbarer Inhalt, feste Weiter-/Zurück-/Ausstiegsaktionen; danach wieder die eigentliche Welt. Bestehende lokale Outfit-Schrift. Mobile Zweispaltenauswahl auch360px, damit nicht zehn Einträge untereinander stehen. Auf640px Höhe bleibt etwas interner Scrollbedarf; keine unsichtbare Pflichtauswahl.

## Welche Zuordnung schon arbeitet
| Interessen | Primärer vorhandener Ort |
|---|---|
| Musik, Tanz | Bühne |
| Video/Film | Offenes Kino |
| Visuelle Gestaltung, eigene Ideen | Atelier |
| Kochen/Essen | Küche |
| Unterstützung, Wissen | Gildenplatz |
| Sport, Handel | Gildenplatz als Gemeinschaftseinstieg; eigener geprüfter Angebotsweg fehlt |

Statische, begründbare Gewichtung, keine externe KI und kein versteckter Profilscore. Zusammenarbeitswunsch kann den Gildenplatz ergänzen; starke Interessentreffer bleiben zuerst. Leere Angaben ergeben keine erfundenen persönlichen Treffer. Nur tatsächlich vorhandene Layout-Zonen werden vorgeschlagen. Beta-Rollenwunsch verändert keine Rangfolge.
Diese Stufe ist Ortsorientierung, noch kein Personen-, Event-, Stellen- oder Verkaufs-Matching. Die Zielverweise beweisen keine aktuelle Veranstaltungsverfügbarkeit, Geschäftsaktivität oder vollständig geprüften Unterseiten.

## Daten und Rollen
Auswahl lebt ausschließlich im Arbeitsspeicher der geöffneten Seite. Kein localStorage/sessionStorage, Profil-/DB-Write, Formularversand, Personenabruf oder neuer API-Aufruf durch dieses Modul. Verwerfen, Überspringen, Neuladen, Seitenwechsel und Auth-Ereignisse leeren die Antworten. Reines Schließen/Wiederöffnen derselben Seite erhält die bewusste Auswahl nur im Speicher.
Keine Interessen in öffentlichen Repo-/Statusdateien oder Analytics. Prüfbeispiele sind synthetische UI-Auswahlen. Kein öffentlich sichtbares Profil, Rollen-/Berechtigungswechsel oder XP/FLOW.
„Beta Initiator“ bleibt Rollenwunsch/Vorschlag für spätere Definition, Anfrage und Bestätigung. Aufgaben, Kriterien, vergebende Stelle und Rücknahme müssen konkret beschlossen werden; zuständige formale Rolle noch nicht zugeordnet. Verbindliche Teamrollenreferenz bleibt21.

## Prüfung
16 Node-Fälle (12 vorhandene Story-/Ankunftsfälle,4 neue Zuordnungs-/Grenzfälle) plus3 vorhandene HTML-Strukturprüfungen bestanden. Neue Fälle prüfen bekannte Interessen/Limit, tatsächliche Layoutziele und Begründung, leere/fehlende Orte sowie keine Matchingbevorzugung durch Beta-Wunsch.
Fünf Produkt-/Testdateien nach Commit exakt zurückgelesen und mit unabhängig berechneten lokalen Text-Blobhashes abgeglichen.

Echter Browser:
-390×844 frisch über Erwachen geöffnet, neue Aktion→Interessen→Absicht→Rollenwunsch→Ergebnis.
-Vierte Interessenauswahl nach drei gewählten Bereichen wird mit sichtbarem Hinweis abgewiesen.
-Synthetisch Musik/Video/Kochen und Zusammenarbeiten/Beta-Wunsch gewählt; Ergebnis Kino/Küche/Bühne mit Gründen gesehen. Bühne gezielt gewählt: echte Hofansicht und nearby-Karte zeigen Bantaba Bühne.
-Über Flowee-Hilfe erneut geöffnet: Auswahl bleibt nur im Seitenspeicher. Verwerfen setzt alle Interessen zurück; „Ohne Angaben erkunden“ schließt und lässt den Hof erreichbar.
-360×640 Auswahl gesichtet; nach beobachtetem unnötigem einspaltigem Scrollen auf Zweispaltenlayout korrigiert und neu geladen/geprüft.
-1280×800 nach Größenwechsel: Formular/Navigation gesichtet.390×844 abschließend frisch geladen, leere Auswahl als Testansicht bereitgestellt.
Error-Logs leer, temporäre Größen zurückgesetzt. Körperliches Touchgerät, kompletter Tastatur-/Screenreader-/Authwechsel-/EN-/PT-/GPU-Fehlerlauf NOT_RUN. DE/EN/PT-Texte im Quelltext vorhanden; keine behauptete Sprachabnahme. Ersatzhinweis bei einfacher Ansicht im Code, nicht neu im Browser getestet. Kleine Fokuskorrektur beim Verwerfen nach Browserprüfung ergänzt; vier Zuordnungstests danach erneut bestanden, kein neuer Fokus-PASS behauptet.

## Logische nächste Phasen
A. Hope prüft den realen Weg: Interessen→Begründung→Ort→Zurück. Vor weiterer Mythologie-/Weltserie einen echten nützlichen Einstieg abnehmen.
B. Accountgebundene Präferenzen erst mit sichtbarer Entscheidung über Speichern, Sichtbarkeit, Ändern/Löschen und eindeutiger vorhandener Identität konzipieren. Aktuell keine neue Migration/RLS-/API-Änderung. Rollenwunsch bleibt von Interesse und Kontorechten getrennt.
C. Echte Menschen/Angebote erst aus freiwillig freigegebenen, aktuellen Daten zuordnen: Interesse, gewünschter Beitrag, Suchwunsch und tatsächliche Verfügbarkeit. Gründe sichtbar; Anfrage/Annahme getrennt, keine automatischen Kontakte oder Wirkungsversprechen.
D. Beta-Initiator-Ablauf erst nach Hopes Definition konkret entwickeln. Kein Abzeichen oder bestätigter Status durch bloße Selbstauswahl.
Keine neue externe Agentenausführung, kein bezahlter Dienst, Merge oder manuelles Deployment. PR18 weiter Draft; vollständige Releasebasis und übrige Ziele bleiben separat offen.
