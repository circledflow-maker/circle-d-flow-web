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
Hope übermittelt Screenshots eines gemeldeten Ergebnisses/Commits87dda99129cc612ecae0bcbddcd16d55871c23db. GitHub-Abruf dieses Commits:404; Objekt im aktiven lokalen Repo nicht vorhanden. Kein Zugriff auf die zwei vollständigen Ergebnisdateien behauptet. Die sichtbaren Vorschläge sind zur Kenntnis genommen, noch nicht als überprüfte Recherche oder Produkttext übernommen. Der Link zur Cloud-Aufgabe ist angefragt. Ein beliebiger Branch-Push könnte neue Provider-Previews auslösen; deshalb keine Aufforderung zum ungeprüften Push.

## Teststand
Fünf neue deterministische Prüfungen für Aufgabenpakete, Pfadgrenzen, Swipe-Erkennung und sichere Flowee-Farbparameter. Reale Agenten-Annahme, dauerhafte automatische Verteilung, native Smartphone-Swipes und Cloud-Dateiübertragung bleiben gesondert nachzuweisen.
