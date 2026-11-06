# Gast- und mobile Browserprüfung · 2026-11-06
Bearbeiter: Codex · CDF-P01 · Teilabnahme, keine Pilotfreigabe.

## Tatsächlicher Lauf
Öffentliche Produktion https://circle-d-flow-web.vercel.app im verbundenen In-App-Browser. Neuer Tab ohne eingegebene Kontodaten; keine Registrierung, kein Versand und kein Kauf. Sprach-/Intro-Präferenzen wurden über die UI geändert. Keine produktiven Rewards oder Rollen geändert.
Browserzugriff funktioniert in diesem Lauf wieder. Mobile Viewports sind Browseremulation, kein physisches Smartphone; Renderbeobachtung ist keine GPU-Leistungszertifizierung. Temporäre Viewport-Overrides zum Schluss zurückgesetzt.

## Beobachtungen
- Startseite: 360×640,390×844,844×390 und1280×800 geprüft; kein horizontales Dokumentüberlaufen. Richtungswahl „Meet people“ aktualisiert die drei Vorschläge. Deutsche Sprache funktioniert auf Startseite und Weltenliste.
- Tastatur: Tab von „Menschen treffen“ erreicht „Etwas gestalten“, sichtbarer solid-Fokus. Keine vollständige Tastatur-Abnahme aller Komponenten behauptet.
- Mobile Weltenliste: 390×844, lesbare zwei Spalten und Portal-Buttons; kein horizontales Überlaufen. Die Bezeichnung „Noch nicht betreten“ beschreibt lokalen Erkundungsstand, keine Teilnahme.
- Member-Card-Einstieg: vom Navigator erreichbar, kostenfreier Start sichtbar; optionales Flowee-Intro über „Intro überspringen“ geschlossen.
- Kostenloser Start öffnet /pages/login?entry=wako&mode=register&next=%2Fmember-card. Flowee-Einführung überspringbar, erstes Namensfeld sichtbar und ohne horizontales Überlaufen. Keine Namen/E-Mail/Passwörter eingegeben.
- „Erst entdecken“ führt zu /orbit. Gastdialog über Escape geschlossen. 3D-Ansicht rendert sichtbar; direkte2D-Verknüpfung öffnet den Welten-Navigator.
- Veranstaltungsliste zeigt statt Terminen einen ehrlichen Ausfallhinweis mit Verweis auf Mitglieder-Events. Eine konkrete aktuelle Aktivität/RSVP ist damit noch nicht abgenommen; Ausfallursache nicht untersucht.
- Mobile Orbit-Unterkante: Hinweis-/Quellentexte wirken im Screenshot gedrängt; gesonderte visuelle Nachprüfung offen, kein pauschaler Layout-Fix vorgenommen.

## Belegter Sprachfehler und lokaler Minimalfix
Nach deutscher Startseite/Member Card zeigt die Login-Seite zunächst EN. Manueller Sprachwechsel auf DE funktioniert.
Lokale Ursache: cdf_login.js liest bei Initialisierung nur den älteren cqr_lang-Schlüssel. Andere CDF-Bereiche verwenden cdf_lang.
Minimaländerung: erste gültige gemeinsame Sprache aus cdf_lang lesen, danach gültigen Legacy-Wert cqr_lang; bestehenden expliziten Query-Parameter und EN-Standard erhalten. Beim Rendern weiterhin beide Schlüssel schreiben.
Genau eine lokale Codezeile geändert, Original privat gesichert. Reviewbarer Patch: patches/login-language30.patch. Keine Änderung an Authentifizierung, Identität, Schema, RLS, XP/FLOW oder Zahlungen.
Prüfung: node --check js/cdf_login.js erfolgreich; sieben Fälle auf tatsächlichem Initialisierungscode bestanden (gemeinsames DE/PT, veraltetes Legacy, ungültiger gemeinsamer Wert, Query-Wahl, leerer/gesperrter Storage). Zusätzlich sieben vorhandene Tests aus cdf-identity und community-journey bestanden,0 Fehler.
Der lokale Fix ist noch nicht im Browser auf einer lokalen Laufzeit abgenommen und NICHT deployed. Die Produktionsbeobachtung belegt den Fehler, nicht dessen Behebung. Der Patch wird in PR17 dokumentiert, kein vollständiger neuer Login-Quellstand in dessen ältere Produktbasis eingefügt.

## Offene Abnahme und nächster Schritt
Physisches Smartphone, aktivierte reduzierte Bewegung, langsames Netz und erzwungener WebGL-Ausfall NICHT AUSGEFÜHRT. Keine authentifizierte Live- oder vollständige Fokus-/Touch-Abnahme.
CDF-P01 bleibt teilweise geprüft/offen; Übergabe nicht nach done verschieben.
Nächste technische Aufgabe: lokalen Sprachfix im Browser gegen aktuellen vollständigen Quellstand prüfen; anschließend verbleibende Gastfälle schließen. Reale Eventverfügbarkeit getrennt prüfen, bevor eine Aktivität Teil des Pilots wird.

## Wiederkehrender mobiler Prüfpunkt
Nach relevanten Änderungen an Navigation, Dialogen, Auth-Einstieg, Layout oder 3D-Steuerung sowie vor Release erneut mobile Stichprobe durchführen: mindestens360×640 und390×844, bei betroffener Orientierung844×390, plus Desktop1280×800.
Auf sichtbare Hauptaktion, Text-/Dialogüberlagerung, Scroll-/Fokusverhalten und Rückweg achten. Versionsstand und Ergebnis dokumentieren; physische Geräte gesondert ausweisen. Ohne relevante UI-Änderung keine identischen Testläufe ohne Anlass wiederholen. Kein Hintergrunddienst oder neue Automation aus dieser Regel.
