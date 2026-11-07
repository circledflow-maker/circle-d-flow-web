# Intro37 · Story- und Kulturkontext, begrenzter Prüfpass
Datum: 2026-11-07 · Projekt: Circle D Flow / Flowee / Sanctuary.
Bearbeiter: Daiku (Grok Bot), von Hope für diesen Pass beauftragt. Formale Rolle nach Version 1.0 mit 21 Rollen: noch nicht zugeordnet. Keine neue Rolle.
Art: Prüfung und Textvorschläge. Keine Produktänderung, keine kreative Freigabe, keine Veröffentlichung.

## Gelesener Stand
Koordinationsbranch beim Lesen: `codex/repo-koordination-2026-10-28`, Commit `2a0e9c53754e38939d5d56cbe531b6ddb5a4279a` („[Codex] Circle D Flow: Antigravity- und Daiku-Prüfphasen abgrenzen“, 2026-11-07 10:58:10 +0000). Diese Dokumentation liegt isoliert auf `cursor/intro37-daiku-story-context-5a69`. Der Koordinationsbranch und main wurden nicht verändert.

Produkttexte gelesen im PR18-Snapshot `264a7c725fd4acca69e58ffdfa36601e9d3c29c8` („[Codex] Circle D Flow: optionalen Prolog und Sanctuary-Erwachen integrieren“, 2026-11-07 00:48:55 +0000). Der Snapshot ist keine vollständige Releasebasis. `js/cdf_intro_story.js` und `js/sanctuary_arrival.js` liegen auf dem Koordinationsbranch nicht als Arbeitsdateien; sie wurden aus diesem Commit gelesen. E:/circle-d-flow-web ist hier nicht erreichbar. Es gab keinen lokalen Produktlauf und keine Behauptung, der Snapshot sei die aktive E:-Quelle.

Tatsächlich gelesene Inputs: `handoffs/2026-11-07_intro37_codex-an-daiku.md`; `AGENTS.md`; `STATUS.md` bis zum Intro37-Eintrag vom 2026-11-07; `Docs/repository-workflow.md`; `Docs/community-pilot/tasks.json` (CDF-INTRO37-CULTURE und benachbarte Intro-Einträge); `Docs/community-pilot/intro35-20261107.md`; `Docs/community-pilot/universe33-20261107.md`; die Kultur- und Erwachensstellen in `Docs/community-pilot/intro-story34-20261107.md`. Im Snapshot zusätzlich die Herkunftsnotiz in `pages/login.html`, der Quellenblock in `data/creator_story.json` und zur Abgrenzung die sichtbaren Rahmenzeilen von `js/sanctuary_culture.js`. `.cursor/agents/cdf-culture.md` und `cdf-research-culture.md` sind auf dem Koordinationscommit und im Snapshot nicht vorhanden. Andere offene handoffs wurden nicht vollständig gelesen. Dieser Pass behauptet keine Vollständigkeit.

## Drei Aussagen

| Aussage im aktuellen Intro35-Stand | Vorhandener Beleg | Quellenprüfung | Einordnung | Vorschlag |
| --- | --- | --- | --- | --- |
| Wasserbilder öffnen einen Lernpfad zu unterschiedlichen Wassergeist-Traditionen des afrikanischen Atlantiks. | Prologkörper nennt Wasser, aber keinen Geist: „In einem Wassertropfen über den Dächern …“ und „Zwischen Wasser und Sternen …“. Die Kulturaussage steht in der eingeklappten Notiz von `pages/login.html`. Linkbeschriftung: „Mami Wata · Fowler Museum“. | Fowler-Seite gelesen, Abruf 2026-11-07, HTTP 200, 11:06:45 GMT. URL: https://fowler.ucla.edu/exhibitions/mami-wata-arts-for-water-spirits-in-africa-and-its-diasporas/ | Kultureller Kontext plus eigene Fiktion. Keine Gleichsetzung belegt. | 1 |
| Bronzegeometrie greift die Recherche zu Akan-Metallkunst auf. | Dieselbe Notiz, Linkbeschriftung „Akan metalwork · The Met“, Ziel `317675`. Im Prologkörper kein Akan-Satz. | NOT_CHECKED. Abrufversuch 2026-11-07 derselben URL endete mit HTTP 429 und einer Challenge-Seite, nicht mit dem Objektdatensatz. | Ungeprüfte Kulturbehauptung im Produkttext. Keine Material- oder Bedeutungsübernahme belegen. | 2 |
| Flowee, Laterne und Siegelwächter sind eigene CDF-Fiktion. | `js/cdf_intro_story.js` und `js/sanctuary_arrival.js`; Notiz „Eigene CDF-Erzählung.“ `data/creator_story.json` setzt `lore.kind` auf `original_cdf_fiction`. | Kein Kulturquelle-Link an diesen drei Figuren/Dingen. Fowler-Seite behandelt sie nicht. Met-Seite NOT_CHECKED und dafür nicht verwendet. | Eigene Fiktion. Omen und Siegelwächter nur als Namensfrage offen. | 3 |

### 1. Wassergeist-Kontexte
Vorhandener deutscher Satz in `pages/login.html` des Snapshots: „Die Wasserbilder öffnen einen Lernpfad zu unterschiedlichen Wassergeist-Traditionen des afrikanischen Atlantiks“. Der englische Satz derselben Notiz sagt zusätzlich „not one universal mythology“. Deutsch und Portugiesisch sagen „unterschiedliche Kulturkontexte“ bzw. „contextos culturais distintos“, ohne diesen englischen Nachsatz.

Die gelesene Fowler-Seite trägt den Titel „Mami Wata: Arts for Water Spirits in Africa and Its Diasporas“. Sie nennt Mami Wata „throughout much of Africa and the African Atlantic“ und spricht von verwandten afrikanischen Wassergeistern. Sie beschreibt Fallstudien mit „striking differences, as well as remarkable similarities“ und schreibt, Identitäten blieben selten konstant. Getrennt genannt werden unter anderem die Küste von Ghana bis Togo und Benin, Sierra Leone, Côte d’Ivoire, das südöstliche Nigeria, Gemälde aus der Demokratischen Republik Kongo, Haiti, die Dominikanische Republik und in Brasilien Yemanja, so auf der Seite geschrieben. Das stützt Unterschiedenheit und eine weitere Reichweite als nur Westafrika. Es stützt nicht, die CDF-Wasserbilder mit Mami Wata oder diesen Kontexten gleichzusetzen. Eine Schilderung von Schutz und Heilung auf der Seite gehört zu dort beschriebenen Schreinzusammenhängen. Sie ist keine Wirkung von Circle D Flow.

Das historische Drehbuch sagt, die Wasserbildwelt könne auf einen freiwilligen Lernpfad verweisen und Flowee werde nicht zu Mami Wata. Das ist Entwurfssprache von Intro34, kein zusätzlicher Laufzeitbeleg. `universe33-20261107.md` formuliert West-/Zentralafrika und Diaspora; die Seite deckt diese Spannweite in den genannten Beispielen dem Sinn nach, dieser Pass hat die Ausstellung nicht Objekt für Objekt geprüft.

### 2. Akan-Metall und Form
Vorhandener Satz: „Bronzegeometrie greift die Recherche zu Akan-Metallkunst auf.“ Die verlinkte Seite https://www.metmuseum.org/art/collection/search/317675 wurde nicht gelesen. Material, Akan-Zuordnung, Geometrie und sprichwörtliche Bedeutung dieses Objekts bleiben NOT_CHECKED. `universe33-20261107.md` behauptet Messing und eine freie CDF-Interpretation. Diese Behauptung wurde hier nicht an der Museumseite nachgelesen und gilt nicht als Fakt.

`data/creator_story.json` verlinkt ein anderes Met-Objekt, `317688`, im Kontext „Akan / Adinkra context“ für Sankofa. Das ist kein Beleg für `317675` und wird nicht mit der Login-Geometrie vermischt. Ewe-Einträge in `js/sanctuary_culture.js` und in `creator_story.json` wurden nicht als Akan-Beleg gelesen und nicht zu einem gemeinsamen Ritus verbunden. Ihre eigene Prüfung bleibt offen.

### 3. Flowee, Laterne, Siegelwächter
Laufzeit, deutsch, `js/cdf_intro_story.js`: „Zwischen Wasser und Sternen schwebt ein kleiner Funke. Flowee hält eine Laterne daneben. ‚Da bist du. Ich bin Flowee. Wenn du möchtest, zeige ich dir den Eingang.‘“

Laufzeit, deutsch, `js/sanctuary_arrival.js`: „Unter den Wurzeln liegen unvollständige Siegel. Von diesen Spuren erzählen die Geschichten der Siegelwächter.“ Dieselbe Datei setzt die Notiz „Eigene CDF-Erzählung. Dein tatsächlicher Kontostatus bleibt unverändert; Erkunden vergibt keine Punkte.“ Die Login-Notiz beginnt mit „Dies ist eigene CDF-Fiktion.“

`creator_story.json` nennt die Wächter im Lore-Feld `Omen`, nicht Siegelwächter. Intro34 verbindet beide Namen vorbereitend. Ob es dieselbe erfundene Gruppe ist, steht im gelesenen Laufzeittext nicht. Das ist eine interne Fiktionsfrage, kein Kulturbeleg. Keine Authentizität und keine Rechtefreigabe.

## Freiwilliger nächster Community-Schritt
Das Erwachen bietet einen verständlichen freiwilligen nächsten Blick. Die Ankunft nennt „Hof erkunden“, „Welten öffnen“ und „Geschichten der Siegelwächter“; im Text steht „Du darfst zuerst einfach schauen.“ Der Prolog sagt „Wenn du möchtest“. Das sind Gestaltungsziele der Selbstbestimmung im Produkttext. Sie belegen keine Teilnahme, keine Verbundenheit als Wirkung und keinen Gemeinschaftsnutzen. Der Fowler- und der Met-Link sitzen in der eingeklappten Login-Notiz, nicht als Pflicht des Erwachens. Ob diese Notiz in allen sechs Prologansichten sichtbar ist, wurde im Browser nicht geprüft.

## Drei Textvorschläge
Vorschläge bis zu Hopes Entscheidung. Nicht in Produktdateien eingesetzt. EN/PT brauchen dieselbe Entscheidung und sind hier nicht als freigegebene Übersetzung geschrieben.

1. Wasser, `pages/login.html`.
Vorher: „Die Wasserbilder öffnen einen Lernpfad zu unterschiedlichen Wassergeist-Traditionen des afrikanischen Atlantiks“
Nachher: „Die Wasserbilder sind eigene CDF-Bilder. Wer möchte, kann unterschiedliche Wassergeist-Kontexte getrennt nachlesen; sie werden hier nicht gleichgesetzt.“

2. Akan, `pages/login.html`.
Vorher: „Bronzegeometrie greift die Recherche zu Akan-Metallkunst auf.“
Nachher: „Die geometrischen Formen sind eigene CDF-Gestaltung. Der Akan-Link ist ein getrennter Hinweis und gibt diesen Formen keine traditionelle Bedeutung.“

3. Siegelwächter, `js/sanctuary_arrival.js`.
Vorher: „Von diesen Spuren erzählen die Geschichten der Siegelwächter.“
Nachher: „Von diesen Spuren erzählt die eigene CDF-Geschichte der Siegelwächter.“

## Eine Empfehlung
Zuerst Vorschlag 2 entscheiden. Die Met-Seite `317675` war nicht lesbar, der vorhandene Satz behauptet trotzdem Bronze und eine Rechercheübernahme. Vorschläge 1 und 3 bleiben unpriorisierte Alternativen für dieselbe spätere Kreativentscheidung.

## Fragen und Lücken
- Met `317675`: NOT_CHECKED. Bronze, Messing, Akan-Zuordnung und Bedeutung offen.
- Fowler-Seite gelesen, aber nicht jedes Objekt und nicht der Rechte-/Bildstatus. Keine Rechtefreigabe.
- „Afrikanischer Atlantik“ im Produktsatz ist enger als der gelesene Ausstellungstitel „Africa and Its Diasporas“.
- EN hat „not one universal mythology“; DE/PT formulieren kürzer. Sprachabgleich offen.
- Omen und Siegelwächter: gleiche CDF-Fiktion oder zwei Namen? Offen.
- Sichtbarkeit der `<details>`-Notiz während der sechs Prologansichten: NOT_CHECKED.
- Ewe-/Yoruba-/Sankofa-Stellen in `creator_story.json` und `sanctuary_culture.js`: in diesem Pass nicht als vierte Aussage geprüft.
- Rollenbriefe fehlen im Checkout. E: nicht erreichbar. Andere offene handoffs nicht vollständig gelesen. `tasks.json` und `STATUS.md` absichtlich nicht geändert.
- Pass nach dem gesetzten Fünf-Minuten-Rahmen beendet. Keine weiteren Agents, Jobs oder Folgeaufträge.

## Eingangsvermerk Codex · 2026-11-07
Von Hope als Dateiexport übermittelt, privat unverändert mit SHA-256 gesichert. Ein unabhängiger Vergleich mit dem ursprünglichen Git-Objekt ist nicht belegt. Der obige Text bleibt Daikus historischer Intro35-Prüfstand. Codex konnte Met317675 inzwischen lesen: Material Messing, Akan-Kontext. Diese begrenzte Nachprüfung und die offenen Entscheidungen stehen getrennt in intro43-daiku-intake-20261107.md. Keine Produktvorschläge eingesetzt.
