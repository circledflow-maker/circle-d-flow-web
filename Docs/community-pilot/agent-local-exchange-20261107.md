# Gemeinsame lokale Aufgaben- und Ergebnisablage
Stand: 2026-11-07 · Codex · CDF / Flowee / Sanctuary. Hope bleibt CEO.

GitHub führt bereinigte Aufgaben, Übergaben und Freigaben. E:/circle-d-flow-web ist die aktive lokale Quelle; D: und Cloud-Checkouts nicht pauschal synchronisieren. Das lokale Team/collaboration/ bleibt ignoriert und von Website-Export ausgeschlossen.

## Was jetzt ausführbar ist
Einmaliger Dateiabgleich: node scripts/cdf-agent-exchange.cjs prepare
Erstellt aus dem zuvor frisch von GitHub übernommenen Aufgabenregister genau ein Postfach für Cursor, Antigravity und Daiku. Private Postfächer: Team/collaboration/inbox/<Agent>/current.json. Jedes Paket nennt Task-ID, Ausgangscommit, Brief und genau zwei zugelassene Ergebnisdateien. Die Ausgabe bezeichnet die Agenten ausdrücklich nicht als gestartet.

Ergebnisannahme: node scripts/cdf-agent-exchange.cjs receive Daiku (analog Cursor oder Antigravity).
Liest ausschließlich Team/collaboration/outbox/<Agent>.json. Schema: agent, task, base_commit (40-stelliger Commit), files mit genau den zwei vorgegebenen path/content-Einträgen. Die Dateien gehen in einen neuen privaten review/-Ordner. Keine bestehenden Produktdateien, kein STATUS und keine bestehenden Ergebnisse werden überschrieben. Zustand bleibt received_unreviewed.

Codex prüft Herkunft, Inhalt und Quellstand, bereinigt private Daten und überträgt nur die ausgewählten Bericht-/Übergabedateien über den geschützten Koordinationsbranch. Erst ein tatsächlicher Commit und exaktes Zurücklesen belegen die Repo-Übergabe. Private Zwischenstände nicht automatisch veröffentlichen.

## Grenzen
Kein Agentenstart, Messagingdienst, Watcher, Scheduler, Git-Push, Merge, kostenpflichtiger Modellaufruf oder Deployment im Script. Das Vorbereiten eines Postfachs ist automatische Dateizuweisung, keine automatische Agentenausführung. Ein IDE-Fenster beweist keine ausführbare Verbindung; unbekannte Verbindungen bleiben unbekannt. Keine konkurrierende Automation hinzufügen.

Lokale IDE-Agenten können dieses Postfach bei ihren ausdrücklich gestarteten Aufgaben lesen und Ergebnisse darin ablegen. Vor echtem automatischem Start oder Polling eine vorhandene verifizierte Anbindung und die bestehende gemeinsame Zeit-/Kostenbegrenzung verwenden. Ein Cloud-Agent kann E: ohne tatsächlichen lokalen Zugang nicht lesen; er muss die beiden Berichtdateien exportieren oder über einen nachweisbaren erlaubten Weg liefern. Ein nicht gepushter Cloud-Commit ist kein gemeinsamer Stand.

Ein Schreibender pro Produktbereich: Codex bearbeitet Intro39/Mobilansicht; Cursor prüft unabhängig Bedienung; Antigravity prüft Inszenierung; Daiku Story-/Kulturkontext. Diese Zuordnung sind bestehende begrenzte Aufgaben, keine neuen bestätigten Fachrollen. Alle drei externen Prüfaufträge bleiben ohne Produktdiff.

## Konkreter Daiku-Stand
Intro37-Dateiexporte sind inzwischen tatsächlich empfangen und geprüft (Intro43, f11188257c5a48dc7bd4daaa6119d570c94770c2). Der damalige Cloud-Commit wurde nicht unabhängig bytegleich verifiziert. Keine neue Mobilprüfung daraus ableiten. Der alte Auftrag bleibt received_reviewed; kreative Restfragen offen.
Neuer separater Auftrag CDF-DAIKU44: handoffs/2026-11-07_pilot-pipeline_codex-an-daiku.md. prepare verteilt jetzt diesen Brief für Daiku; kein automatischer Start. Ausschließlich die beiden im neuen Brief genannten Dateien werden angenommen. Alte Originale bleiben im privaten Empfangsarchiv und im Repo erhalten.

## Teststand
Fünf neue deterministische Prüfungen für Aufgabenpakete, Pfadgrenzen, Swipe-Erkennung und sichere Flowee-Farbparameter. Reale Agenten-Annahme, dauerhafte automatische Verteilung, native Smartphone-Swipes und Cloud-Dateiübertragung bleiben gesondert nachzuweisen.

## Ergebnisabgleich und Recherche44
Vorhandenen täglichen Koordinationslauf ergänzen, keine konkurrierende Automation erstellen. Konkrete Zeit-/Kalenderplanung und gemeinsame Zeitnachweise bleiben privat in Team/collaboration/cadence/. Ein wöchentlicher Abgleich erzeugt höchstens einen begrenzten nächsten Auftrag, wenn Belege, Bedarf und gemeinsames Restbudget vorliegen. Ein Kalenderplan startet keinen externen Agenten.
Daiku bereitet Quellen/Entscheidungen vor; Codex koordiniert/integriert, Cursor prüft Bedienung und Antigravity Inszenierung gemäß ihren bestehenden Briefen. Formale unbestätigte Rollen bleiben noch nicht zugeordnet. Recherche ist bedarfsgesteuert, keine permanente Suche; höchstens2 öffentliche Primärquellen pro begrenztem Pass. Keine Social-/Partneransprache oder Veröffentlichung durch diese Planung.

## Orchestra57 · Aktualisierung2026-11-08
DieserNachtrag ersetzt diefestehistorischeZuordnung. VerbindlicheAufträge/Outputs stehen jetzt in data/agent_exchange_assignments.json, validiert vorprepare undreceive. AktuellCursor=CDF-CORE57-QA,Antigravity=CDF-MODEL56-SELECT,Daiku=CDF-DAIKU44.
Jeweils genau einBericht unterDocs/community-pilot und eineÜbergabe unterhandoffs, ausschließlichMarkdown; keineProdukt-/Privat-/absoluten/Traversalpfade. UnbekannteAgenten und doppelteTasks/Outputs werdenabgelehnt.
prepare schreibt privateInboxen/Queue, started bleibt[]. BestehendeOutboxes werden nichtüberschrieben. receive prüft aktuelleKonfiguration undTask, erfasstexakteBasis undmarkiertstaleErgebnisse; ausschließlichprivateQuarantäne, keineVeröffentlichung/Produktintegration.
ÖffentlicheFollow-up-Briefs nennen denRückgabepfad, keineprivatenNutzerdaten. PrivatePaketbasis ist source_commit desaktuellenInboxpakets. Auftragsannahme/Lauf bleibtseparater tatsächlicherBeleg; keineIDE startet durchDatei.
Details undPrüfgrenzen:orchestra57-20261108.md.
