# Prüfbare Änderungen und offene Freigaben
Stand: 2026-11-06 · Codex · Hope bleibt finale Entscheidung.

## Jetzt prüfbar
[PR17: Koordination, Pilot-Grundlage und Browserberichte](https://github.com/circledflow-maker/circle-d-flow-web/pull/17/files).
Enthält sichere Repo-Regeln, getrennte Projektaufgaben, Pilotmodell, Medienbriefing, mobile Prüfroutine und den lokalen Sprachfix als Patch. Ziel: inhaltliche Review. Kein automatischer Merge-/Produktionsauftrag daraus.
[Browser-Nachprüfung](login-browser-verification-20261106.md) und [lokaler Sprachfix](patches/login-language30.patch).
Der Fix ist lokal umgesetzt und im Browser geprüft; noch nicht produktiv.

## Produktrelease noch nicht entscheidungsreif
[PR18: älterer atmosphere27-Releasevorschlag](https://github.com/circledflow-maker/circle-d-flow-web/pull/18).
Bleibt Draft und ist NICHT der aktuelle Gesamtstand aus Flowee28, lokalem Room/shop29 und Sprachfix. Nicht als fertigen aktuellen Kandidaten freigeben.
Vor einer konkreten Veröffentlichungsfrage: vollständige aktuelle Produktionsbasis, ausgewählte lokale Änderungen, Hashmanifest, Routen-/Datenschutzgrenzen und Browserabnahme zu einem eindeutig identifizierten Kandidaten zusammenführen. Erst diesen Kandidaten Hope mit Link/Version vorlegen.
Auch ein Merge von PR17 nach main muss vorher gegen Produktions-Deploy-Trigger und den abweichenden Produktstand geprüft werden; der alte main-Produktstand darf dadurch nicht versehentlich die aktuelle Produktion ersetzen.

## Medien und Pilot
[Medienbriefing](media-brief.md): Entwurf prüfbar. Rechte, Einwilligungen/Credits und konkrete Kanalfassung noch offen; kein veröffentlichungsreifer Freigabegegenstand.
[Pilot-Geschäftsmodell](business-model.md) und [Abnahme](acceptance.md): kostenloser Pilot mit5–8 Personen ist als Richtung bereits festgelegt; dafür keine wiederholte Konzeptfreigabe verlangen. Einladungen/Termine erst mit bestätigtem Inhalt und tatsächlichem autorisierten Bearbeiter vorbereiten.
[Aufgabenregister](tasks.json): konkrete Zustände und noch nicht zugeordnete Bearbeiter. Aufgaben-/Rollenlabels bestätigen keine Zuständigkeit oder neue Rolle.

## Slack
Die lesende Vorbereitung ist beauftragt. Aktive Brücke, App-/Scope-Erweiterung oder dauerhafter Dienst sind nicht durch diese Dokumentation freigegeben. Vor der Aktivierung einen konkreten, geprüften Verbindungs-/Berechtigungsumfang mit Stop-/Budgetregeln vorlegen. Keine Zugangsdaten ins Repo.

## Ablauf
Vorbereitungsarbeit läuft innerhalb des bestehenden Auftrags weiter. Nur echte offene CEO-Entscheidungen mit fertigem Gegenstand, Beleg und klar benannter Aktion vorlegen. Keine pauschale Freigabe für sämtliche späteren Schritte erbitten.


## LUVO32 · konkreter neuer Quellstand
[PR18 Quellcommit 3ff01d4](https://github.com/circledflow-maker/circle-d-flow-web/commit/3ff01d4003801d77910a25cae0176dafd7720d13) sichert den lokalen3D-LUVO-Eingang, Anime-Übergänge, Sprachfix und Tests. [Bericht](luvo-3d32-20261106.md). Inhalt/Design sind prüfbar, noch keine fertige Deployment-Freigabe:14 Login-Abhängigkeiten und vollständige Produktionsbasis müssen im Kandidaten zusammengeführt werden. Der frühere Hinweis „PR18 nur atmosphere27“ ist damit als Quellbeschreibung überholt; der ältere Releasehelfer bleibt unverändert und unvollständig für LUVO32.
