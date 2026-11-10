# Portabler Repo-Arbeitsablauf

Stand: 2026-11-01 · Codex · Circle D Flow · CEO: Hope

1. AGENTS.md, STATUS.md und offene handoffs/ am aktuellen Commit lesen. Commit, Branch und vorhandene fremde Änderungen festhalten.
2. Ein Ziel, einen Bearbeiter, begrenzte Änderung, tatsächliche Einwände und Abnahme bestimmen. Normale Repo-Koordination benötigt keinen Rollen-Agenten oder lokalen Prompt-Router.
3. Verbindliche Rollenreferenz: „Circle D Flow Teamorganisation Version 1.0“, 21 Rollen. Die vollständige bestätigte Liste ist hier noch nicht verfügbar. Keine 24er-Registry aus lokalem Bestand als genehmigt veröffentlichen. Unbekannte Zuordnung: „noch nicht zugeordnet“.
4. Rollenarbeit erst delegieren, wenn der passende bestätigte Brief gelesen wurde. Fehlt er, bei normaler Koordination bleiben oder die konkret fehlende Rollengrundlage benennen. Kein künstliches Meeting und kein fiktiver Agentenstart.
5. E:/circle-d-flow-web ist die zuletzt geprüfte aktive Web-/Auth-Quelle. Ein GitHub-Checkout reicht für Review und Repo-Koordination. Produktänderungen benötigen den Abgleich mit der aktiven Quelle; kein automatisches Überschreiben in eine der beiden Richtungen.
6. Nur ausgewählte bereinigte Dateien committen. Team/, private Übergaben, Kontodaten und Zugangsdaten ausschließen. Ignore schützt keine bereits versionierten Dateien oder alte Git-Historie.
7. Ergebnisse nach Evidenz unterscheiden: vorgeschlagen, lokal implementiert, tatsächlich getestet, CEO-freigegeben, Build READY, deployed, live verifiziert. Testzahl allein belegt keine Geräte-, RLS- oder Live-Abnahme.
8. STATUS.md ergänzen; fremde Einträge erhalten. Übergaben mit Annahme, konkretem Ergebnis und Beleg führen; erst nach erfüllter Abnahme nach handoffs/done/ verschieben.
9. Commit: [Agentname] Projekt: kurze Beschreibung. Vor Push/Merge Remote erneut prüfen; kein Force-Push.

## Veröffentlichung und Grenzen

Vercel und Netlify haben bereits automatisch Previews erstellt. Der Koordinationsbranch hat deshalb eine branchgebundene Vercel-Deploy-Sperre und einen begrenzten Netlify-Ignore-Befehl. Diese Konfiguration ist keine Bestätigung ihrer Wirkung beim Anbieter. Ein Skip-Exitcode 0 gilt bei Netlify ausdrücklich als Build überspringen. Andere Branches/Produktionskontexte werden vom neuen Ignore-Script nicht blockiert.

Vercel-Uploads schließen interne Koordinations-/Privatdateien aus. Netlify erhält 404-Regeln für diese internen URL-Pfade. Private Daten dürfen unabhängig davon nie committed werden. Direkte Uploads und abweichende Anbieter-Konfigurationen gesondert prüfen.

Vor einem Merge nach main müssen der neuere tatsächliche Produktstand, bestehende Produktions-Workflows und Veröffentlichungsfreigaben abgeglichen sein. Dieser Dokumentations-PR ersetzt keine sichere Produktrelease-Basis.

## Offene Zugangsdatenprüfung

credentials.json und adobe_token.json waren schon vor PR #17 versioniert. Dieser Korrekturstand entfernt sie aus seinem vorgeschlagenen aktuellen Dateibaum, ohne lokale Originale oder Anbieterzugänge zu ändern. Ihre Inhalte/Gültigkeit wurden nicht ausgelesen. Historie und frühere Deployments bleiben davon unberührt. Falls echte Geheimnisse enthalten waren: zuständiger Kontoinhaber muss Sperrung/Rotation und anschließend eine abgestimmte Historienbereinigung durchführen. Zuständigkeit: noch nicht zugeordnet. Keine automatische Rotation oder Rechteänderung.


## Pilot-Arbeitsgrundlage · 2026-11-06

Aktueller Einstieg: [Community-Pilot](community-pilot/README.md). Bereinigte Aufgaben stehen in community-pilot/tasks.json; pro Aufgabe/Dateibereich ein schreibender Bearbeiter. Parallele Projekte über konkrete Abhängigkeiten verbinden, App-Arbeit bei gemeinsamer Zeit priorisieren. Unbekannte Besetzungen heißen „noch nicht zugeordnet“.
Diese Grundlage erweitert keine Veröffentlichungs-/Zugriffsrechte. Slack-Vorbereitung bleibt lesend, private Betriebsdaten bleiben lokal. Historische Statusabschnitte nicht als aktuellen Produktionsstand übernehmen. Vor Änderungen aktive E:-Quelle und tatsächlichen Release erneut prüfen.
