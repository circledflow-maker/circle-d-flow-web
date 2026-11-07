# Übergabe: Intro36 · unabhängige Mobil- und Zugänglichkeitsprüfung
Datum: 2026-11-07 · Projekt: Circle D Flow / Flowee / Sanctuary
Von: Codex · vorgesehener Bearbeiter: Cursor, erst nach manueller Übernahme.
Empfänger-Rolle: technische UI-Prüfung; formale Zuordnung zur bestätigten 21-Rollen-Referenz noch nicht zugeordnet.
Zustand: vorbereitet, nicht angenommen, nicht gestartet. Diese Datei startet keinen Agenten.

## Ziel
Prüfe genau eine Phase: Ist der lokale Intro35-Gastweg vom Einstieg bis zur freien Bedienung im Sanctuary auf kleinen Bildschirmen und mit Tastatur verständlich und bedienbar? Unabhängig prüfen, keine früheren Testresultate übernehmen.

## Kontext und Inputs
Hope möchte die App zeitnah finalisieren und Cursor parallel für eine begrenzte Phase einsetzen.
Aktive lokale Web-/Auth-Quelle: E:/circle-d-flow-web. D: ist kein Ersatz und wird nicht synchronisiert.
GitHub: https://github.com/circledflow-maker/circle-d-flow-web
Koordination: PR17, Basis bei Übergabe 7651ad669ffb2a8075c1782c4bd9c2d10ac204d5; vor Übernahme neuesten Stand lesen.
Intro35-Quellsnapshot: PR18 Commit 264a7c725fd4acca69e58ffdfa36601e9d3c29c8, Draft und keine vollständige Releasebasis.
Lies AGENTS.md, STATUS.md, Docs/repository-workflow.md, offene relevante handoffs/, .cursor/agents/cdf-orchestra-conductor.md und Docs/community-pilot/intro35-20261107.md.
Die lokalen Briefs cdf-game-designer.md und cdf-continuous-improver.md wurden von Codex gelesen; vor eigenem Rolleneinsatz selbst vollständig laden. Keine Bestätigung zusätzlicher Registry-Rollen daraus ableiten.
Quellen: pages/login.html, pages/artist_sanctuary.html, js/cdf_intro_story.js, js/cdf_account_story.js, js/sanctuary_arrival.js, css/cdf_intro_story.css; Abhängigkeiten im intro35-Manifest. Codex prüft separat den Releasequellenabgleich: intro36-release-audit-20261107.md.

## Prompt für Cursor
Du bist der vorgesehene technische Prüfer für diese begrenzte Phase, keine neu bestätigte Fachrolle. Prüfe zuerst Pfad, frischen GitHub-Stand und vorhandene fremde Änderungen. Kein Reset, Checkout oder Branchwechsel im stark veränderten gemeinsamen E:-Arbeitsbaum. Für eigene Git-Änderungen einen isolierten Arbeitszweig verwenden; fehlt die aktive Quelle, beschränke dich auf belegbare Quellprüfung und markiere Browserfälle NOT_RUN.

Arbeite höchstens 20 Minuten Projektzeit und berücksichtige die bestehende gemeinsame Tagesgrenze aller Agenten; bereits verbrauchte Zeit/Toollimits nicht erfinden. Keine kostenpflichtigen Aufrufe. Falls Restzeit nicht belegbar ist, keine laufende Automation oder Wiederholung starten.

1. Stelle zuerst fest, welche konkrete Version dein Browser wirklich zeigt. Produktion und PR18 sind nicht gleich der aktiven E:-Quelle. Nutze eine vorhandene erreichbare Designvorschau, sofern Version und Sperren nachvollziehbar sind. Private Vorschauadresse und Betriebsdaten bleiben Team/; weder eine neue externe Vorschau noch einen Dauerprozess aktivieren.
2. Prüfe 360×640, 390×844, 844×390 und Desktop1280×800. Dokumentiere Viewport-Emulation getrennt von tatsächlichem Smartphone und Touch. Prüfe ohne Kontoanlage: Start → Flowee → freiwillige Richtungswahl oder Offenlassen → Laterne → Gast-/Kontoentscheidung → Gastschwelle → tatsächliches Sanctuary-Laden → Hof erkunden.
3. Teste Zurück, Überspringen, direkten Login-Einstieg, vorhandenen Registrierungseinstieg ohne Absenden, den sichtbaren Hauptbutton, lange Texte, DE/EN/PT-Wechsel, Scroll, Überlagerungen und freie Hofbedienung nach Ankunft.
4. Teste Tab/Shift+Tab, Enter/Space, Escape, sichtbaren Fokus, Dialogfokus und Rückkehr/Wiederöffnung. Prüfe bewusst gewählte ruhige/einfache Ansicht. Betriebssystem-Reduktion, langsames Netz und WebGL-Ausfall nur als tatsächlich geprüft melden, wenn das Werkzeug diese Bedingungen nachweisbar herstellen kann; andernfalls NOT_RUN. Automatisierte Fixtures getrennt ausweisen.
5. Prüfe per Quellinspektion, dass ein explizites anderes internes next-Ziel erhalten bleibt und intro=first-light weder Identität, Member Card noch Belohnungen bestätigt. Keine echte Anmeldung, E-Mail, Konto-/Standort-/Mikrofonfreigabe, Rollen- oder Rewardaktion auslösen.
6. Erstelle pro beobachtetem Fehler: Version, Schritte, erwartetes/tatsächliches Verhalten, Schwere, Beleg und minimalen Lösungsvorschlag. Kein Produktcode ändern. Auch keinen Fehler behaupten, wenn nur eine offene Prüfung vorliegt.

## Gewünschtes Ergebnis und Dateizuständigkeit
Cursor schreibt ausschließlich:
- Docs/community-pilot/intro36-cursor-review-20261107.md mit PASS/FAIL/NOT_RUN je Fall und genau einem priorisierten nächsten Fehler bzw. begründet keinem beobachteten Fehler.
- handoffs/2026-11-07_intro36_cursor-an-codex.md mit Ergebnis, Belegen und offenen Abhängigkeiten.
- Eigene Screenshots/Protokolle ausschließlich privat unter Team/acceptance/intro36-cursor-20261107/, ohne Zugangsdaten oder personenbezogene Formdaten.

STATUS.md nach dem Auftrag nur im eigenen isolierten Arbeitszweig anhand des frisch gelesenen Standes ergänzen; Koordinationsintegration übernimmt Codex seriell. Nicht parallel in den gemeinsamen lokalen STATUS oder Aufgabenbestand schreiben. Sanitisierten Ergebniscommit nennen: [Cursor] Circle D Flow: Intro36 unabhängig prüfen. Keine Screenshots mit privaten UI-Daten hochladen. Ein eigener Commit/Prüfbericht ist kein Merge.

Codex besitzt parallel ausschließlich die Release-Inventurdateien und die koordinierte Integration. Keine Produktdateien, Providerkonfiguration, bestehenden Tests oder gemeinsamen Renderjobs bearbeiten. Kein Kontakt zu Slack, kein Merge, Deployment, Veröffentlichung, Kauf, API-/Auth-/RLS-/Zahlungs-/XP/FLOW-Eingriff.

## Abnahmekriterien und Stop
Version und tatsächliche Arbeitsumgebung belegt; Prüfmatrix vollständig mit ehrlichen NOT_RUN-Lücken; reproduzierbare Fehler statt Gestaltungsgeschmack; keine Kontoanlage oder Mutation; klare Empfehlung mit genau einem nächsten Schritt. Nach Bericht und Ergebnisübergabe stoppen. Nicht automatisch reparieren oder Folgephasen beginnen.

## Offene Abhängigkeiten
Cursor-Anbindung und Annahme nicht nachgewiesen; Hope kann diesen Prompt in Cursor starten. Ein Screenshot oder gespeicherter Rollenbrief belegt keinen Agentenlauf. Physisches Gerät und authentifizierte Kernweg-Abnahme bleiben gesondert. Die lokale Szene rendert im Browser; ein separater Video-Render wurde in dieser Phase weder gestartet noch geprüft. Finale kreative/Veröffentlichungsentscheidung Hope.

## Ergänzung · lokaler Austausch40 / Intro39
Bei nachgewiesenem lokalem E:-Zugang liegt das eigene Aufgabenpaket unter Team/collaboration/inbox/Cursor/current.json. Vertrag: Docs/community-pilot/agent-local-exchange-20261107.md. Kein automatischer Agentenstart behauptet. Berichtdaten zunächst privat zur Prüfung liefern; keine Produktdateien überschreiben. Aktueller ausgewählter Intro39-Quellcommit: 76d1f8308c19a0e0f367a79bf368446bd815e22b; neue Darstellungs-/Swipeprüfung im Bericht ausdrücklich von altem Intro35-Stand trennen. Ohne E:-Zugang kein E:-Speichern behaupten, sondern Ergebnisdateien exportieren. Bestehender begrenzter Auftrag und gemeinsames Budget bleiben bestehen.

## Intro41 · tatsächliche Nachprüfung durch Codex
Quellcommit 16a813f19ca980ec815c893741d2ef15808c2059; Bericht Docs/community-pilot/intro41-20261107.md. Native Browser-Emulation390×844 und360×640, zwei Touch-Drags, Antwort-Szenenwechsel, interner Scroll und Szenenvergrößerung geprüft. Beobachteten Dialoghöhenfehler korrigiert und nachgeprüft. Dies ist keine unabhängige Cursor-Abnahme und kein physischer Test. Als nächste offene Stichprobe echtes Gerät/Softwarekeyboard; eigene Prüfbedingungen und Version weiter benennen. Auftrag bleibt offen, nicht nach done verschoben.
