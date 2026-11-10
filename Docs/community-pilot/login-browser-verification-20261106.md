# Browser-Nachprüfung des Sprachfixes
Stand: 2026-11-06 · Codex · Fortsetzung CDF-P01.

## Ergebnis
Der lokale Ein-Zeilen-Fix in js/cdf_login.js ist jetzt auch im tatsächlichen Browser geprüft. Die öffentliche Produktion wurde nicht verändert.
Fall1: gemeinsame Sprache DE, älterer Legacy-Wert EN → Login zeigt DE und deutsche Begrüßung.
Fall2: gemeinsame Sprache PT, älterer Legacy-Wert EN → Login zeigt PT und portugiesische Begrüßung.
Beide Fälle wurden über sichtbare Fixture-Buttons vorbereitet und durch Navigation zur unveränderten lokalen Login-Seite geprüft. Keine Anmeldung, Kontenerstellung oder Eingabe persönlicher Daten.

## Laufzeit und Grenzen
Eine kurzlebige Node-Vorschau lieferte ausschließlich pages/login.html und deren explizit referenzierte JS-/CSS-Dateien auf einer dynamischen Loopback-Adresse. Keine .env-Datei, privaten Unterlagen oder Backend-Daten geladen. Externe Verbindungen und Formularversand per CSP gesperrt; andere HTTP-Methoden nicht erlaubt.
Es wurde der tatsächliche aktuelle lokale Login-Code inklusive Sprachfix ausgeliefert. Der Fixture-Teil bereitete ausschließlich widersprüchliche Sprachpräferenzen vor; er ersetzte keine Login-Implementierung.
390×844 mit DE: kein horizontales Überlaufen. PT zusätzlich bei360×640,844×390 und1280×800 ohne horizontales Überlaufen. Keine Fehler in den bis dahin aufgezeichneten Browser-Error-Logs. Das beweist keine vollständige Authentifizierung oder Produktionsintegration.
Mobilansicht ist Browseremulation. Screenshot lokal privat vorhanden. Temporäre Viewport-Overrides zurückgesetzt, Tab geschlossen, eigener Vorschauprozess anhand seiner Kommandozeile geprüft und beendet.
Die zuvor dokumentierten sieben Initialisierungsfälle und sieben vorhandenen Tests wurden nach unverändertem Code nicht unnötig wiederholt.

## Abnahmestand
Erledigt: lokale Browser-Nachprüfung des Sprachfixes.
Offen: Veröffentlichung des Fixes aus geprüfter vollständiger Releasebasis; tatsächliches Smartphone; aktivierte reduzierte Bewegung; langsames Netz; erzwungener WebGL-Ausfall; authentifizierte Live-Journey.
Der verbundene Browser stellt für diesen Lauf nur Viewport- und Sichtbarkeitssteuerung bereit; Netzwerk-/Bewegungs-/WebGL-Testbedingungen wurden nicht künstlich als ausgeführt behauptet. Keine Betriebssystem-Einstellungen dafür geändert.
CDF-P01 bleibt Teilabnahme. Die bestehende Übergabe bleibt offen. Nächste unabhängig mögliche technische Arbeit: Ursache des Veranstaltungsliste-Ausfallhinweises im bestehenden öffentlichen Read-only-Pfad eingrenzen und aktuelle Releasebasis abgleichen; keine Termine erfinden oder Backend-Konfiguration ändern.
Reviewbarer Fix: [Ein-Zeilen-Patch](patches/login-language30.patch).
Entscheidungsübersicht: [Änderungen und Freigaben](review-and-approvals.md).
