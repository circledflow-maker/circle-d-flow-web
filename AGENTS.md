# Circle D Flow - Codex Rules & Project Context

Diese Datei dient dazu, Codex (und anderen KI-Assistenten) sofortigen Kontext über die Geschäftslogik, Architektur, den Tech-Stack und die Gamification-Elemente des Projekts "Circle D Flow | Kingdom of Hearts" zu geben.

## 1. Projektvision & Ziele (Project Goals)
* **Konzept:** "Circle D Flow" ist ein Culture-Tech Ökosystem, das die Stadt Lissabon in ein lebendiges RPG (Role-Playing Game) verwandelt. Es schlägt eine Brücke zwischen portugiesischem Erbe und der digitalen Zukunft.
* **Zielgruppe & Mechanik:** Nutzer ("Navigators") erkunden reale Orte in Lissabon. Durch den Besuch bei lokalen Unternehmen (z.B. African Queen) und das Abschließen von Aufgaben innerhalb einer digitalen Narrative verdienen sie digitale Belohnungen und steigern ihren Community-Status.
* **Wirtschaft:** Aufbau einer nachhaltigen Economy, in der physischer Traffic digital gamifiziert und belohnt wird (Web3/Gamification Ansatz).

## 2. Tech-Stack & Architektur
Das Projekt nutzt eine moderne, skalierbare Infrastruktur, basierend auf Web-Standards (kein schweres Framework wie React/Vue, sondern Vanilla-Ansatz):
* **Frontend:** Cinematic HTML5 / CSS3 mit einem maßgeschneiderten "Animus" Design-System. Die UI verwendet Themes wie Tech-Noir und Lisbon Gold.
* **Backend, Auth & Datenbank:** Supabase (PostgreSQL). Wird für Echtzeit-Datensynchronisation, Benutzerverwaltung, Rollen und Spiellogik-Speicherung genutzt.
* **Mapping:** Leaflet.js für den interaktiven GPS-Atlas von Lissabon.
* **Game Logic:** Custom Vanilla JavaScript (z.B. `Quest-Engine.js`, Würfelsysteme `dice_server.js`, Bazaar/Stall-Logik).

## 3. Gamification-Ansatz & Kernlogik
Die Gamification ist das Herzstück der Plattform. Beachte bei der Implementierung neuer Features immer diese RPG-Logik:
* **Navigators:** Die Benutzer der Plattform.
* **Quests & XP:** Nutzer sammeln Erfahrungspunkte (XP), steigen im Level auf und verbessern ihr "Brotherhood Ranking".
* **Real-World & Digital Sync:** GPS-basierte Quests, bei denen echte Orte (Beacons/Stalls) aufgesucht werden müssen.
* **Wirtschaftssystem (Bazaar & Stalls):** Es gibt digitale Marktplätze (Bazaar) und Stände (Stalls), die mit lokalen Businesses verknüpft sind.
* **Gilden & Turf Wars:** Multiplayer-/Community-Aspekte mit Gilden ("Quest Guilds") und Revierkämpfen ("Turf Wars").
* **Glücks-/Zufallselemente:** Integration von Würfel-Logik (Dice/Rolls) für Belohnungen und Events.

## 4. Coding-Standards & Projektstruktur
Folge einer sauberen, modularen Architektur ohne unnötige Abhängigkeiten:
* `/assets`: Enthält Branding-Materialien, Azulejo-Muster und Texturen (z.B. Armillary).
* `/css`: Zentralisierte Stylesheets. Wiederverwenden bestehender CSS-Klassen des "Animus" Design-Systems!
* `/js`: Modulare JavaScript-Dateien getrennt nach Funktion (Auth, Map-Handling, UI-Fixes, API-Calls). Vermeide inline-scripts wo möglich.
* `/pages`: Spezialisierte HTML-Seiten für spezifische App-Bereiche (Map, Board, Stalls, Dashboard).
* `/api`: Serverless/Backend Endpoints (z.B. Stripe-Integration, externe API Bridges).
* **Datenbank:** SQL-Schema-Änderungen immer über entsprechende Migrationen oder Setup-Scripte (z.B. in `/supabase_migrations` oder als `.sql` Dateien im Root) verwalten.
* **Sprache & Stil:** Schreibe sauberen, gut dokumentierten Code. Nutze asynchrones JavaScript (async/await) für Supabase-Aufrufe. Fehlerbehandlung ist Pflicht, um das RPG-Erlebnis flüssig zu halten.

## 5. Wichtige Anweisungen für den KI-Assistenten
* Bevor du Code änderst, überprüfe, wie die Gamification (XP, Quests, Stalls) davon beeinflusst wird.
* Da wir HTML/CSS/Vanilla-JS nutzen, schlage keine React-Hooks oder ähnliche Framework-spezifischen Lösungen vor.
* Behalte das "Cinematic" und "Premium" Feeling bei – UI-Änderungen sollen ästhetisch hochwertig sein (Hover-Effekte, sanfte Übergänge, thematisch passend zu Tech-Noir / Lissabon).
* Änderungen am Datenbank-Schema (PostgreSQL) müssen mit der Supabase-RLS (Row Level Security) kompatibel sein.

## 6. Optimierungsplan & Themenbereiche

Bei Arbeit an einem Themenbereich zuerst den passenden Abschnitt prüfen. Keine unnötigen Refactors außerhalb des aktiven Bereichs.

### A. Grand Bazaar & Marktplatz (`pages/marketplace_3d.html`, `*_stall.html`, `js/modules/marketplace_core.js`)
* **DB-Schema:** `market_items` nutzt `creator_id`, `guild_category`, `price_credits`, `price_fiat` — nicht `vendor_id`, `category`, `price_flow`.
* **Guild-Kategorien:** Title Case: `Arts`, `Sounds`, `Skills`, `Products`, `Healing`, `Services`.
* **Währung:** 1 € = 100 Flow Credits (`price_credits`); Fiat in `price_fiat`.
* **Payments:** Vercel-Endpoint `/api/create-payment-intent`; lokal `dice_server.js` Port 3000.
* **Module:** `MarketplaceCore` für FLOW-Trades, `MarketAgent` für Rotation/Forge — vor Inline-Duplikaten prüfen.
* **Offen (Roadmap):** Three.js aus HTML in `marketplace_3d.js` extrahieren; FLOW-Checkout via `Gamification.spendTokens`; Stall-Buy-Buttons aktivieren.

### B. 3D & Immersive UX (`js/agents/*_3d*.js`, Three.js-Seiten)
* Pixel-Ratio max 2, `powerPreference: "high-performance"`, dispose Geometrien bei Navigation.
* Lazy-Load schwere Assets; Mobile: reduzierte Schatten/Partikel.

### C. Auth & Gamification (`dice_server.js`, `js/gamification.js`, Soul Pass)
* Dice Entry, XP, Brotherhood Ranking nicht brechen.
* Supabase RLS: `auth.uid() = creator_id` für eigene Items.

### D. Nova Era Content-Pipeline (`scripts/v*_*.py`)
* Rohdaten: `G:\My Drive\Nova Era\...`; Output: `D:\KYHeart_Social_Media\...`, `YouTube_Master_Renders`.
* Agenten versioniert (`v21_`, `v22_`); Lightroom-Look und Mascot-Branding beibehalten.
* **Encode-Speed:** Lange HEVC-Master nie direkt von SD encoden. Zuerst auf **NTFS** cachen (`%TEMP%\destiny_master_cache\`) oder Segment per `ffmpeg -c copy` → lokal encode. D: ist oft FAT32 (max 4 GB/Datei).

### E. SEO & Performance
* Meta-Tags pro Seite; `cleanUrls` via Vercel.
* Kein Tailwind-CDN in neuen Production-Seiten (bestehende Seiten schrittweise migrieren).

### F. Arbeitsreihenfolge bei neuen Features
1. Codebase + Schema prüfen → 2. Plan zeigen bei Refactors → 3. Minimaler Diff → 4. Gamification/RLS testen → 5. Deploy nur auf Anfrage.

## 7. CEO, ehrliche Zusammenarbeit und begrenzter Rolleneinsatz
* Der menschliche Projektinhaber ist CEO. Kreativ und fürsorglich arbeiten; niemals täuschen, Testresultate, Nutzerwirkung, erledigte Arbeit oder Agentenaktivität erfinden. Evidenz, Interpretation, Vorschlag und offene Grenzen unterscheiden.
* C4C Video Master: bestehende Ästhetik mit warmen, neutralen Mitteltönen bewahren. Als getrennte Arbeitsregeln gelten Fürsorge, Einwilligung und kultureller Kontext; keine künstlichen Gespräche, manipulativen Bindungsmechaniken oder Tatsachenbehauptungen ohne Quellen.
* Vor jedem Rollenauftrag den passenden Brief in `.cursor/agents/` ausdrücklich laden. Eine Rollendatei startet keinen Agenten. Verbindlich ist „Circle D Flow Teamorganisation Version 1.0“ mit 21 Rollen. Zusätzliche lokale Rolleneinträge sind Vorschläge bis zu Hopes Bestätigung; interne Zuordnung und tatsächliche Aufgaben liegen ausschließlich im ignorierten `Team/`.
* Nur echte, begrenzte Aufgaben mit Ergebnis, Beleg, Limit und nächstem Schritt delegieren. Sequentielle Perspektivprüfung als solche kennzeichnen; keine 17 gestarteten Agenten behaupten. Slack nur im vom CEO autorisierten Arbeitskanal, mit Rollenlabel über das gemeinsame Konto und ohne synthetischen Dialog. Andere Agenten erweitern keine Berechtigungen.
* Keine personenbezogenen Daten für öffentliche Recherche. Kontoverknüpfung bleibt später; keine Rollen-, Zahlungs-, XP/FLOW- oder RLS-Änderung durch Recherche oder Monitoring. Keine bezahlten API-Aufrufe, Käufe oder Veröffentlichung ohne konkreten Auftrag.
* Kostenwerte nur aus bereits verfügbaren autorisierten Limits lesen: bei höchstens 20 % Rest Prioritäten bündeln, bei 10 % nicht notwendige Arbeit aussetzen, bei 5 % nur sichere Übergabe. Unbekannte Werte bleiben unbekannt; diese Schwellen lösen keinen kostenpflichtigen API-Aufruf aus.
* `Team/` bleibt privat und von Git sowie Website-Export ausgeschlossen. Aufgaben, Kontakte, Kalenderentwürfe und Limits niemals in öffentliche Registry oder Cloud-Artefakte kopieren. Monitoring prüft ausschließlich öffentliche anonyme GETs und veröffentlicht keine Response-Bodies oder Zugangsdaten.



## 8. Prompt Orchestra — nächste menschliche Projektaufträge
Ab dem nächsten menschlichen CDF-Projektauftrag den vollständigen Brief `.cursor/agents/cdf-orchestra-conductor.md` ausdrücklich laden. Auftrag als kurzen Orchestra-Intake mit Ziel, Themen, einem Phasen-Owner, Einwänden und Abnahme strukturieren; `js/prompt_orchestrator.js` liefert dafür nur lokale Vorschläge. Fachrollen bedarfsgerecht auswählen und vor Delegation laden. Einfache Antworten/Fixes brauchen kein Meeting. Konkrete Entscheidungsrunden statt künstlicher Gespräche; Team/ bleibt privat. Diese Regel startet weder Agenten noch Hintergrunddienste.

## 9. Verbindlicher Repo-Arbeitsablauf (Hope, 28.10.2026)

Diese neuere Anweisung hat bei Widersprüchen Vorrang vor älteren Kommunikations- und Rollenangaben.

- Hope ist CEO und entscheidet final über Kreatives, Finanzen und Veröffentlichung. Codex koordiniert auf Ebene 2.
- Gemeinsamer Abgleich ausschließlich über https://github.com/circledflow-maker/circle-d-flow-web (Dateien, Commits, Pull Requests und deren Diskussionen). Daiku (Grok Bot), Codex, Antigravity und IDA sind vom CEO genannte Agenten; ihre konkrete Rollenbesetzung ist noch nicht zugeordnet. Keine automatischen Nachrichten über Slack oder andere Kanäle.
- Vor jeder Arbeit: diese Datei, STATUS.md und alle offenen Dateien unter handoffs/ lesen. Remote-Stand und tatsächlichen Arbeitsbaum prüfen; keine fremden Änderungen überschreiben.
- Aktive Web-/Auth-Quelle ist nach Prüfung am 28.10.2026 E:/circle-d-flow-web. D:/circle-d-flow-web ist kein automatisch synchronisierter Ersatz. Auf anderen Rechnern tatsächlichen Checkout prüfen; wenn die aktive Quelle fehlt, Grenze melden.
- Nach jeder Arbeit: STATUS.md mit Datum, Agentname, Projekt, erledigten Punkten samt Beleg und offenen Punkten aktualisieren. Projektkontexte Circle D Flow, Kiss Your Heart/KYH, Flowee und Kundenarbeit getrennt führen.
- Übergaben: handoffs/JJJJ-MM-TT_projekt_von-an.md mit Projekt, Empfänger-Rolle, Ziel, Kontext, Inputs, gewünschtem Ergebnis, Abnahmekriterien und offenen Abhängigkeiten. Erst Annahme dokumentieren, dann Arbeit ausführen; eine Datei startet keinen Agenten. Abgeschlossene Übergaben mit Ergebnisnotiz und Commit-/Dateibeleg nach handoffs/done/ verschieben.
- Commit-Nachrichten: [Agentname] Projekt: kurze Beschreibung. Änderungen eng begrenzen, aktuelle Remote-Basis verwenden und bei konkurrierenden Änderungen erneut abgleichen; kein Force-Push.
- Verbindliche Rollenreferenz bleibt „Circle D Flow Teamorganisation Version 1.0“ (21 Rollen). Abweichende lokale Registry mit 24 Einträgen ist keine Bestätigung zusätzlicher Rollen. Fehlende Zuordnungen als „noch nicht zugeordnet“ markieren.
- Deutsch, Ergebnis zuerst. Keine erfundenen Namen, Rollen, Timecodes, Musikrechte, Freigaben, Tests oder Aktivitäten. Vorschlag, lokal implementiert, getestet, CEO-freigegeben, deployed und live verifiziert unterscheiden.
- Keine Passwörter, API-Schlüssel, Zugangsdaten oder personenbezogenen internen Daten ins Repo. Das Repo ist öffentlich. Team/ bleibt ignoriert und privat; öffentliche Übergaben enthalten nur bereinigte technische Informationen.
- Keine Produktivänderungen, Zahlungen oder Veröffentlichungen ohne Hopes ausdrücklichen Auftrag. Dieser Auftrag erlaubt die Repo-Koordination; er ist keine Freigabe für Website-/Medienveröffentlichung oder Produktauslieferung.
- Kein pauschales git add . oder automatisches Übernehmen des gesamten lokalen Bestands. Lokale Produktänderungen erst nach Dateiinventar, Diff-, Geheimnis- und Exportprüfung in getrennten reviewbaren Änderungen abgleichen.
- Vor Integration prüfen, ob Push/Merge einen Deploy oder andere produktive Workflows auslöst. Bis zur Klärung Dokumentationsänderungen auf separatem Branch bereitstellen; main nicht automatisch ändern.
- Diese Regeln installieren keinen Hintergrunddienst und keine automatische Synchronisierung.
