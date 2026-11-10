# Intro42 · Außentest vorbereitet, Vercel-Bereitstellung offen
Datum: 2026-11-07 · Projekt: CDF / Flowee / Sanctuary · Codex.
Auftrag: Hope möchte außerhalb des Heim-WLANs testen und den Einbezug von Antigravity/Daiku geklärt haben.

## Konkreter Testkandidat
Isolierte statische Designvorschau aus der aktiven E:-Quelle erstellt. UI-Referenz: Intro41-Quellcommit16a813f19ca980ec815c893741d2ef15808c2059; weitere benötigte öffentliche E:-Abhängigkeiten gezielt gewählt, keine pauschale Git-/D:-Synchronisierung.41 ausgewählte Dateien,298247 Bytes vor manifest.json. Keine privaten Dateien, API-Funktionen, SDK-Datei, Backendkonfiguration oder reale Auth-Handler im Auslieferungssatz. Konto-/Googleaktionen werden zusätzlich durch einen ausdrücklichen Preview-Guard blockiert; Zwischenformularschritte bleiben für Gestaltungstests verfügbar. CSP connect-src none und form-action none. Noindex/Noarchive. Nicht enthaltene Appziele führen zu einer ehrlichen Vorschau-Infoseite.

Builder scripts/build-intro-design-preview.py und Fixture scripts/fixtures/intro-preview-guard.js machen die Vorbereitung nachvollziehbar. Ergebnis im privaten Team/previews/intro42-20261107; dieser Ordner und Consent-/Betriebsdaten werden nicht committed.28 JS-Dateien im Kandidaten bestanden Syntaxprüfung; alle lokalen Script-/Stylesheetverweise auflösbar. Drei gezielte Guardtests prüfen Zwischen-/Endformular, Login/Google und ehrliche Zielbegrenzung. Das ist kein neuer Browser-/Mobil- oder Backendnachweis.

## Tatsächliche Anbietergrenze
Vercel-MCP-Verbindung listet das bestehende Team. Projektlookup sowohl per Namen als auch mit lokal hinterlegter ID:404 Project not found. Getrennter Projektanlageversuch cdf-intro-design-preview:403 You don't have permission to create the project. Kein Projekt/Deployment als erstellt behauptet.
CLI-Fallback geprüft: vercel nicht im PATH; npx --no-install vercel --version findet kein vorhandenes Paket und bricht ab. Keine CLI-Neuinstallation, neue Anmeldung, Planänderung oder Zugangsdatenlesung.
Keine Vermutung, dass Hobby generell den konkreten Versuch verhindert oder erneutes Login sicher hilft. Vor erneutem Versuch tatsächlichen Team-/Projektzugriff prüfen. Ein Consentlink kann vorhandene Team-Appberechtigungen zur Prüfung anbieten, er erteilt selbst keinen Zugriff. Keine unbekannten URLs als Testlink ausgeben. Produktionskonfiguration, Produktivdomain, PR-Preview-Sperren und App bleiben unverändert.

## Zusammenarbeit
Antigravity ist für die begrenzte visuelle Regieprüfung vorgesehen, Daiku für Story-/Kulturkontext. Briefe/Dateipakete vorhanden; lokales Ergebnis-outbox beim Check leer. Daikus per Screenshot gemeldete Originaldateien nicht angekommen. Keine unabhängigen Ergebnisse oder gestarteten Agenten erfunden. Cursor behält Mobil-/Tastaturprüfung; Codex Integration und sichere Preview-Vorbereitung.

## Nächster Schritt
Hope prüft den tatsächlichen Vercel-Teamzugriff über den bereitgestellten Consentweg; falls Berechtigung danach vorhanden, exakt diesen isolierten Dateisatz ausschließlich als Vorschau bereitstellen. Anschließend READY, HTTPS, Intro-/Sanctuary-Assets und Privat-/API-Grenzen prüfen und erst dann funktionierenden Außentestlink melden. Kein Produktionsdeploy oder Merge nötig.

Technische Referenzen: [Vercel Deployment API](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment), [statische Projektkonfiguration](https://vercel.com/docs/project-configuration/vercel-json). Quellparameter/Workflow nach offiziellen Seiten geprüft. Supabase-Changelogabruf liefert Unsupported content-type; es wird keine Supabase-API geändert oder Backendabnahme daraus behauptet.
