# Flow81 · Flowee-Raumrundgang, Angebote und Medienpilot
Datum:2026-11-10 · Circle D Flow · Codex · Entscheidung Hope
Status:Erster freiwilliger regelgeleiteter Rundgang als Entwurf implementiert; keine generative KI-Anbindung, keine neuen Konten/Stores/Uploads/Rechte aktiviert.

## Nutzerweg
Flowee begleitet die Nutzer beim Erkunden vorhandener Räume. Nach der freiwilligen Orientierung öffnet „Mit Flowee die Räume erkunden“ einen wiederholbaren4-Schritte-Rundgang; vorhandene Interessen werden nur im Speicher als Vorschlag übernommen. Kein neues Profiling.
1. Einen ersten Weg wählen:Marktstand/Services, Küche, Musik, Foto/Video, Sport/Bewegung oder Unterstützung.
2. Einen passenden Zweck wählen:z.B.Produkte/Dienstleistungen/vorhandener Shop, DJ/Livemusik/Gesang, Video/Musikvideo/Fotografie, Basketball/Padel.
3. Einen kleinen Entwurf beschreiben. Shoplink und Europreis freiwillig; Mediendatei derzeit ausschließlich auf diesem Gerät auf Größe prüfen. Weder Übertragung noch Shopanlage.
4. Vorschlag sehen, Angaben ändern/verwerfen oder Rundgang wiederholen. Im vorhandenen Sanctuary kann die bestehende arrive-Funktion nach bewusster Auswahl zu Bühne/Küche/Cinema/Gemeinschaftsplatz führen. In der eigenständigen Vorschau fehlt die3D-Szene; kein Erfolg vorgetäuscht.
Dieselbe originale Flowee-Silhouette. Die aktive Raumhilfe kennt nur gewählten Raum, eigene freiwillige Eingaben und tatsächlich belegte Funktionen. Ein generatives Modell ist noch nicht angeschlossen; keine kostenpflichtigen Modellaufrufe.

## Räume und private Verwaltung als Ausbaustufen
- Marktstand:private Angebotsentwürfe für Produkte/Services, optional vorhandener HTTPS-Shoplink statt Produktimport. Ein eigener Stand wird erst nach bewusster Bestätigung, Kontoprüfung und tatsächlich vorhandener Berechtigung eröffnet.
- Küche:eigenes Küchenprofil/Angebotsentwürfe, tatsächliche Karte/Bestell-/Kontaktwege getrennt bestätigen. Keine erfundene Speisekarte oder Verfügbarkeit.
- Stages:DJ/Livemusik/Gesang und Kooperationssuche; musikalisches Interesse erzeugt keine Buchung oder Auftrittszusage.
- Cinema/Atelier:Werke zuerst privat in eigener Mediathek; Veröffentlichung im gemeinsamen Cinema erst nach eigener Inhaltsauswahl, überprüften Rechten/Einwilligung/Credits und konkreter Freigabe. „Automatisch“ soll später die private Zuordnung zu einem eigenen Projekt bedeuten, keine automatische öffentliche Vorführung.
- Sport/Bewegung:Basketball, Padel, Tanz als Profil-/Aktivitätsweg. Ein eigener Sport-Raum/Assistent und tatsächlich verfügbare Angebote sind noch nicht eingerichtet; aktuell Gemeinschaftsplatz als Ausgangspunkt, keine erfundene Aktivität.
- Unterstützung/Wissen:eigene Fähigkeiten und konkrete Kooperationswünsche, keine automatische Kontaktaufnahme.
Eigene Verwaltung als Ziel:Projekte, Produkte, Services, Links, Preise und Medien bearbeiten, Sichtbarkeit wählen, pausieren und löschen. Einmal hochgeladene Datei über Referenzen wiederverwenden statt Shop/Cinema/Tagebuch jeweils zu duplizieren. CDF/KYH/Flowee/Kundenkontexte bleiben getrennt.
Tagebuch/SoulNexus später nur mit ausdrücklichem Speicherschritt verbinden. Rundgang darf jederzeit neu geöffnet werden; keine erneute Belohnung/XP und keine private Notiz im öffentlichen Angebot.

## Preise und FLOW
Bestehende Repo-Regel:1€=100FLOW Credits. Im Entwurf exakt mit ganzzahligen Euro-Cents rechnen:12,50€→1250Credits;0,01€→1Credit. Das ist die bestehende Preisrelation, kein zugesicherter Geldumtausch, kein Guthaben, keine Zahlung oder Auszahlung. XP, Level und Sammelsymbole bleiben getrennt. Serverpreis, Bestand, Berechtigung und wirkliche Transaktion später weiterhin autoritativ prüfen. Bestehende Zahlungs-/FLOW-Logik nicht verändert.

## Tatsächlicher Speicherstand aus Quellprüfung
lib/cdf-api/member-storage.js:250000000Byte pro Datei=250dezimalMB (rund238,42MiB); aktive flow_supporter-Mitgliedschaft bis5GB, flow_crew bis20GB. Für registrierte kostenlose Mitglieder0Uploadbytes; Uploadrechte derzeit bezahlt. Das sind Codegrenzen, keine Prüfung gehosteter Konfiguration, freier Drive-Kapazität oder tatsächlicher Funktionsfähigkeit.
Auch der konfigurierte Speicherreserve-Gate muss vor Freischaltung geprüft werden. Keinen Überblicks-GET als rein lesend annehmen:vorhandener overview-Zweig kann Ordner-/Eventmedien-Synchronisierung auslösen, hier nicht aufgerufen.

## Vorgeschlagenes kostenloses Pilotbudget, noch nicht freigeschaltet
| Größe | Grenze dezimal |
|---|---:|
| Ein Videoclip |20MB|
| Ein Bild |5MB|
| Eine Audiodatei |10MB|
| Gesamter privater Speicher pro Person |50MB|
|5–8Pilotpersonen zusammen |250–400MB|

Rechenbeispiel:30Sekunden bei5Mbit/s Video+128kbit/s Audio ergeben (5.128×1000000×30)/8=19230000Byte=19,23MB; mit beispielhaft2%Containerzuschlag19,6146MB. Tatsächlicher Codec/Container/Bitrate ist zu messen, kein pauschaler30Sekunden-PASS. Hohe Smartphone-Bitraten können die Grenze früher erreichen. Dateigröße wird geprüft, nicht automatisch transkodiert.
Bei8vollständig genutzten50MB-Konten sind400MBOriginalspeicher nötig.5vollständige Abrufe dieser Gesamtmenge ergeben2GBNutzdatenverkehr; Vorschaubilder/Transcodes/Backups/Protokollkosten nicht darin enthalten. Bestehender Uploadkanal verwendet1MiB-Blöcke; Base64 erhöht die Upload-Nutzlast zusätzlich ungefähr um ein Drittel.
Speicher-/Trafficverfügbarkeit und echte Kosten sind unbekannt. Keine kostenpflichtige Erweiterung bestellt. Dieses Budget muss serverseitig mit Eigentümerprüfung/Reservierung und Dateiprüfung durchgesetzt werden; die lokale Dateiauswahl macht noch keinen kostenlosen Upload möglich.

## Businessphasen und Abnahme
1. Jetzt:begrenzter Rundgang/Preis-/Link-/Dateigrößenentwurf; kostenlos und überspringbar. Bestand:implementiert, Teilprüfungen im Bericht.
2. Zuerst Kernbasis CDF-R01/CDF-P01 fertigstellen; dann genau ein privater Projekt-/Angebotsentwurf je Testprofil mit echter Speicherung, Änderung/Löschung, Kontowechsel und bewusstem Sichtbarkeitswechsel. Noch keine öffentliche Shopautomatik.
3. Pilot-Upload nur nach bestätigtem Speicherbudget und konkreter Aktivierung. Eigentümerquote/Restbudget/Abbruch/Wiederaufnahme/Löschung und Fehlerfälle prüfen; echte Medienrechte separat. Nicht bestehende Bezahlrechte heimlich umgehen.
4. Einen freigegebenen Werk-/Cinema-Beitrag und einen überprüften Angebots-/Kontaktweg testen. Erst danach mehr Stände, Gruppen und Räume.
5. Sport mit einer bestätigten Aktivität, verantwortlicher Person und funktionierendem Kontaktweg erproben; formale neue Rollen sind Vorschläge.
Pilot EndeNovember2026 und6–10Hope-Stunden/Woche bleiben Planungsrahmen. Keine neue Kalenderbuchung oder zusätzliche Serienproduktion. Zuerst vorhandene eigene Medien für eine kleine Prüfladung verwenden.
Nutzenhypothesen:Menschen können ihre Arbeit/Angebote verständlich zeigen und passende Mitwirkung finden. Messung:selbstständig vorbereiteter Entwurf, tatsächlich freiwillig gewählter Kontakt-/Teilnahmepfad, hilfreiche Rückmeldung und Betreuungsaufwand. Reichweite, Uploadanzahl, Kooperation und Umsatz nicht gleichsetzen. Preise/Shoplinks beweisen weder Nachfrage noch Einnahme.

## Unterwegs testen
Aktueller Hosting-Zugang nicht nutzbar:verbundene Vercel-Umgebung liefert keine CDF-Projekte; bekanntes Projekt auch per belegterID404. GitHubstatus für Core79 meldet Netlify success, zugehöriger Bottext sagt jedoch ausdrücklich „Deploy Preview ... canceled“. Kein Live-PASS daraus abgeleitet; keine neue Website/Hostingkosten angelegt und kein Deployment ausgelöst.
Alternative:Docs/community-pilot/flow81-offline-preview.html herunterladen, als.html speichern und im Browser öffnen. Enthält CSS/JavaScript/Flowee vollständig, keine externen Skript-/Style-Dateien; connect-src/form-action durch CSP gesperrt. Benötigt kein Heimnetz. Rundgang und Entwürfe funktionieren lokal; echte Online-Räume/Konten/Uploads/Speicher bleiben ausgeschlossen. Externer eigener Shoplink öffnet erst nach bewusster Wahl.
Eine vollständige aktuelle Online-App-Vorschau ist weiter offen; Hope nach erreichbarem Link/korrekter bestehender Hosting-Verbindung gefragt.

## Prüfnachweise
9Tests bestanden:Preis-/Centgenauigkeit, sichere Shoplinks, Dateigrenzen/Quota-Vorschlag, mehrere Interessen, Entwurf ohne Rechte/Upload/Publikation, vorhandene Orientierungsfälle.
Browser tatsächlich per Tastatur bedient:Marktstand→Produkte→synthetischer Shoplink+12,50€→1250FLOWPreisvorschlag; Wiederholung; Sport→Basketball→klarer Planungsstatus und ehrliche Meldung ohne vorhandene3D-Szene.
Native Mausaktionen liefen in Werkzeug-Timeouts; Screenshotaufnahme nicht verfügbar. Größen390/360 angefordert, DOM lieferte375/375client/scroll; angeforderte Größen und Desktopansicht daher NICHT als bestanden gewertet. Keine visuelle Screenshot-/physische Geräte-/Softwaretastaturabnahme.
In überprüfter eigenständiger Seite:0externe script-src und0Stylesheet-Links. Keine echte Datei hochgeladen. Vollständige Sanctuary-Integration/3D-Raumwechsel, echte Uploads, gehosteter Speicher/Checkout und Offline-file:-Protokoll auf anderem Laptop bleiben unabhängig zu testen.
Antigravitys Soulpass-/Tagebuchdateien unverändert; keine neue Agentenanbindung behauptet. Keine Rollen/XP/FLOW/DB/RLS/Zahlungs-/Produktivänderung.
