# World48 · Drei eigene Weltsilhouetten auf vorhandener Three.js-Pipeline
Datum: 2026-11-08 · Projekt: Circle D Flow / eigene Welten und Community-Pilot
Vorgesehener Bearbeiter: Antigravity (`CDF-WORLD48-ART`, visuelle Regie; formale Rollenzuordnung nach Teamorganisation v1.0 mit 21 Rollen: noch nicht zugeordnet)
Vollständig gelesene Perspektive: `.cursor/agents/cdf-game-direction.md` (keine Rechteerweiterung)
Koordination: Codex (Ebene 2) · Kulturelle Weltkarten-Recherche separat: Daiku (`CDF-MYTH48`) · Unabhängige Mobil-/Tastaturprüfung separat: Cursor (`CDF-INTRO36-QA`) · Finale Kreativentscheidung: Hope (CEO)

## 1. Erreichbare Quelle, Commit und Prüfart
- **Aktive Quelle:** `E:/circle-d-flow-web` lesend geprüft (`D:` nicht synchronisiert oder als Ersatz verwendet; 0 Produktdateien geändert).
- **Koordinations- und Produktreferenz:**
  - Koordinationsstand laut lokalem Aufgabenpaket (`source_commit` / `base_commit`): `ca0b547af62965f7a05dbcd3f5ba779e83acc24c` (`codex/repo-koordination-2026-10-28`).
  - Geprüfter Produktstand (`Intro47`, Draft-PR 18): `45daef68373352ebc0eecf63272b2d432293f099` (keine vollständige Releasebasis).
  - Gelesene Grundlagen: `AGENTS.md`, `STATUS.md` (bis `Intro47/World48`), `Docs/repository-workflow.md`, `Docs/community-pilot/tasks.json`, `Docs/community-pilot/intro47-20261108.md`, `Docs/community-pilot/world48-mythology-context-20261108.md`, `js/luvo_scene.js`, `js/luvo_universe.js`, `js/sanctuary_characters.js` sowie `Team/collaboration/inbox/Antigravity/current.json`.
  - *Hinweis zu `Intro37`:* Der frühere `Intro37`-Regiebericht ist durch Codex in `Intro45` bereits übernommen und wird hier nicht erneut exportiert.
- **Prüfart:** **Reine Quellprüfung (Source Inspection)**. In dieser Antigravity-Sitzung ist kein aktiver Browser-/WebGL-Kanal verbunden. Alle visuellen Laufzeit-, GPU-, Smartphone- und Viewport-Prüfungen bleiben daher ausdrücklich **`NOT_RUN`** (keine eigenen Screenshots, Frameraten oder Gerätetests behauptet).

---

## 2. Querschnittsbefund zur Archipel-Lesbarkeit in `Intro47` (`js/luvo_universe.js`)
- **Tatsächlich beobachteter Codezustand (`Ist`, Commit `45daef68373352ebc0eecf63272b2d432293f099`):**
  - `js/luvo_universe.js` (Zeilen 29–43) erzeugt pro Weltinsel einen sechskantigen Felssockel (`stone`, `CylinderGeometry(size, size*.22, size*1.6, 6)`), eine grüne Deckplatte (`leaf`, `CylinderGeometry(size*1.03, size, .14, 24)`), einen aufrechten `portal`-Ring (`TorusGeometry(size*.56, .035, 6, 40)` bei `y = size * 0.8, z = 0`) und verteilt darüber im Zyklus `i % 5` fünf eigene Formstudien: `arcade` (`case 0`), `terraces` (`case 1`), `spire` (`case 2`), `grove` (`case 3`) und `sail` (`case 4`).
  - In `js/luvo_scene.js` (Zeile 27) und `js/luvo_universe.js` (Zeilen 71–72) ist die mobile Kamera (`width < 700`) in `Intro47` bereits näher herangerückt (`z = Math.max(11, spec.cam[2] * 0.68)`, `look = [0, 2.8, 0]`, `world.position.y = 1.9`, `world.scale = 0.9`).
  - **Verbleibende visuelle Ursache für ähnliche Fernwirkung (`Ist`):** Auf jeder Insel steht der vertikale `portal`-Torus (`y = size * 0.8`, `z = 0`) exakt in derselben `XY`-Ebene wie die Formstudie (`z = 0`). Dadurch schneidet oder überdeckt der identische Kreisring aus 12–30 Einheiten Distanz genau die obere Kontur der Aufbauten, während die Aufbauten selbst fast alle streng achsensymmetrisch um `x = 0, z = 0` sitzen.

---

## 3. Drei ausgewählte eigene Weltsilhouetten (mit vorhandener Pipeline)

Um im schmalen oberen Szenenfenster (`32%` mobil) sofort unterscheidbare Umrisse zu schaffen, werden aus den fünf vorhandenen Studien die drei gegensätzlichsten Grundformen ausgewählt und geschärft: **1. `arcade` (offener Rahmen + Seitenbaum)**, **2. `terraces` (breiter horizontaler Stufenbau)** und **3. `grove` (organisch-vertikaler Hochhain mit Schwellendach)**.

### Silhouette A — `arcade`: Offene Küsten-Arkade mit Quellstufe und Seitenkrone
- **Tatsächlich beobachteter Codezustand (`Ist` in `js/luvo_universe.js`, `case 0`, Zeile 37):**
  - Zwei symmetrische `ivory`-Pfosten (`CylinderGeometry(.1, .14, .75, 6)` bei `x = ±0.45, y = 0.45, z = 0`) tragen einen `copper`-Halbbogen (`TorusGeometry(.45, .09, 6, 20, Math.PI)` bei `y = 0.82`). Da der `portal`-Torus (`y = size * 0.8`) in derselben Ebene liegt, fallen Arkadenbogen und Portalring optisch fast zusammen; eine begleitende Baum- oder Quellform fehlt auf der Insel.
- **Vorschlag (mit vorhandenen Three-r128-Primitiven & Materialien):**
  - **Klare Silhouette:** Asymmetrisches **Säulentor-und-Baum-Profil** – links/mittig die offene helle Arkade mit klarem negativem Luftraum darunter, rechts (`x = +0.58`) eine einzelne überragende Baumkrone, die den Bogen seitlich rahmt.
  - **Pflanzen-/Architekturrhythmus:** Gebaute Geometrie (2–3 schlanke Pfosten + Bogensturz + vorgelagerte flache Trittstufe bei `z = +0.28`) im bewussten Kontrapunkt zu **einer** asymmetrisch gesetzten `leaf`-Krone (`IcosahedronGeometry(.38, 1)` bei `x = +0.58, y = 0.96, z = -0.12`).
  - **Material & Farbe:** Helle Säulen in `ivory` (`0xe6d7b6`), Bogensturz und Stufe in warmem `sand` (`0xc7aa78`) / `copper` (`0xb77c50`), schimmernde Quell-/Wasserplatte am Fuß in `mint` (`0x96eed2`) auf `deep` (`0x163b50`), Seitenkrone in `leaf` (`0x327767`).
  - **Räumlicher Blickfang:** Der helle, offene Durchblick unter dem `ivory`/`copper`-Bogen über einer kleinen leuchtenden `mint`-Quellplatte am vorderen Inselrand (`z = +0.22`).
  - **Vorläufiger Kulturbezug (nur Vorschlag, noch nicht bestätigt):** Korrespondiert als eigene CDF-Formidee mit dem in `world48-mythology-context-20261108.md` belegten griechischen Heiligtums-Prinzip (Zusammenspiel von offenem Säulenraum, Einfriedung, einzelner Baumgruppe und Quelle in der Küstenlandschaft laut Met-Quelle) – ausdrücklich ohne Tempelkopie, heilige Zeichen oder Gottheiten-Zuordnung; später mit Daikus belegter Karte (`CDF-MYTH48`) abzugleichen.
  - **Ruhige mobile Alternative:** Auf kleinen Viewports (`< 700px`) bleibt die Silhouette über nur 4–5 Meshes (2 Pfosten, 1 Bogen, 1 Quellstufe, 1 Seitenkrone) ohne feine Zusatzornamente lesbar; bei `prefers-reduced-motion: reduce` oder „Ruhiger Ansicht“ wird WebGL vollständig freigegeben (`release()`) und die statische CSS-Stufenansicht genutzt.
- **Prüfstatus Browser/Gerät:** `NOT_RUN` (reine Quellprüfung).

---

### Silhouette B — `terraces`: Versetzt aufsteigende Erd- und Gartenterrassen (Hofgalerie)
- **Tatsächlich beobachteter Codezustand (`Ist` in `js/luvo_universe.js`, `case 1`, Zeile 38):**
  - Drei konzentrisch übereinanderliegende Sechseck-Zylinder (`CylinderGeometry(.7 - j*.16, .73 - j*.16, .18, 6)` für `j = 0..2` bei `y = 0.16, 0.36, 0.56`), wechselnd in `copper` und `ivory`. Durch die geringe Gesamthöhe (`0.54`) und die exakte Zentrierung (`x = 0, z = 0`) wirken die drei Scheiben aus dem erhöhten Kamerawinkel fast wie ein flacher Deckel ohne erkennbare Treppenachse oder Hofstruktur.
- **Vorschlag (mit vorhandenen Three-r128-Primitiven & Materialien):**
  - **Klare Silhouette:** Breit gelagerte, **nach hinten gestaffelte Stufen- und Hofsilhouette** (`z = +0.14 → -0.04 → -0.22` bei größerer Stufenhöhe `0.24`), gekrönt von einem flachen, breit auskragenden Galerie-Dachbalken (`BoxGeometry(.76, .1, .38)`) statt einer Kegelspitze.
  - **Pflanzen-/Architekturrhythmus:** Horizontale Schichtung aus drei Erdstufen, rhythmisiert durch zwei niedrige seitliche Pflanzpolster (`leaf`-Icosahedra bei `x = ±0.52, y = 0.38`) und eine klare vertikale Mitteltreppe (`BoxGeometry(.22, .52, .56)`), die alle Stufen vorn verbindet.
  - **Material & Farbe:** Kräftige Erd- und Lehmtöne (`terracotta` `0x9d5d43` und `copper` `0xb77c50`) für die Stufenkörper, helle `sand`-Mitteltreppe (`0xc7aa78`) als Kontrastband, dunkle Galerie-Rückwand (`dark` `0x0f2c34`) mit warmem `gold`-Lichtkern (`0xe9c777`) unter dem oberen Dachüberstand.
  - **Räumlicher Blickfang:** Die helle `sand`-Freitreppe an der Vorderflanke, die den Blick vom unteren Felssockel direkt zum warm leuchtenden `gold`-Punkt unter der obersten Hofgalerie lenkt.
  - **Vorläufiger Kulturbezug (nur Vorschlag, noch nicht bestätigt):** Eignet sich als eigene CDF-Formstudie entweder für den in `world48-mythology-context-20261108.md` getrennt aufgeführten **Edo–Benin-inspirierten Hof-/Galerie-Pfad** (horizontale Galerien, Holz-/Erd-Proportionen und bepflanzte Höfe ohne Übernahme königlicher oder ritueller Reliefs) oder – nach gesonderter Quellenwahl – für gestufte Garten-/Wasserterrassen im hinduistischen Pfad.
  - **Ruhige mobile Alternative:** Die breite horizontale Stufenform mit heller Mittelachse benötigt keinerlei Animation oder feine Textur, um sich auf `360×640` / `390×844` klar von Bogen (`arcade`) und Hochhain (`grove`) abzuheben; bei reduzierter Bewegung stehen Insel- und Wellenbewegung still.
- **Prüfstatus Browser/Gerät:** `NOT_RUN` (reine Quellprüfung).

---

### Silhouette C — `grove`: Gestaffelter Hochhain mit geschwungenem Schwellenfirst
- **Tatsächlich beobachteter Codezustand (`Ist` in `js/luvo_universe.js`, `case 3`, Zeile 40):**
  - Drei Stämme (`CylinderGeometry(.045, .09, .6, 5)`, `copper`) und drei `leaf`-Icosahedron-Kronen (`IcosahedronGeometry(.35, 1)`, `scale(.9, 1.25, .8)`) stehen auf einer geraden Linie bei `x = -0.42, 0, +0.42` und `z = 0`. Vor dem ebenfalls grünen Inseldeckel (`top` in `leaf`) verschmelzen die drei gleichartigen Kronen in einer Ebene zu einer flachen grünen Hecke.
- **Vorschlag (mit vorhandenen Three-r128-Primitiven & Materialien):**
  - **Klare Silhouette:** **Asymmetrisches Dreiecks-Kronendach mit vorderem Schwellenfirst** – ein hoher Leitbaum hinten-links (`y = 1.22, z = -0.22, scale(1.05, 1.45, 0.95)`), zwei gestufte Begleitkronen rechts/tief (`y = 0.88` und `0.72`, `z = +0.08` und `-0.18`), davor am vorderen Inselrand (`z = +0.34`) ein einzelnes niedriges Schwellendach mit leicht überstehendem `terracotta`/`copper`-Firstbalken.
  - **Pflanzen-/Architekturrhythmus:** 75 % organische, höhen- und tiefengestaffelte Baumkronen im Wechsel mit 25 % klarer Holz-/Firstgeometrie am Eingangspunkt der Insel.
  - **Material & Farbe:** Stämme und Pfosten in `copper` (`0xb77c50`), äußere Kronen in sattem `leaf` (`0x327767`), eine innere Lichtkrone in hellem `mint` (`0x96eed2`, sanfte Emissive `0x267c68`), vorderer Dachfirst in warmem `terracotta` (`0x9d5d43`) mit schmaler `gold`-Schwelle (`0xe9c777`).
  - **Räumlicher Blickfang:** Der warme `terracotta`/`gold`-Schwellenfirst vor dem tiefgrün-mintfarbenen Kronendach, der die grüne Masse klar gliedert und den Eingang in den Hain markiert.
  - **Vorläufiger Kulturbezug (nur Vorschlag, noch nicht bestätigt):** Korrespondiert als eigene CDF-Formstudie mit dem in `world48-mythology-context-20261108.md` skizzierten **Wald- und Übergangspfad (z. B. Shinto-Teilpfad laut Kokugakuin-Quelle: Verbindung von Wald, gegliederten Dachsilhouetten und offenen Übergängen)** – strikt als eigene CDF-Fantasieform ohne Nachbau geschützter Schreine, ohne religiöse Symbole und vorbehaltlich konkreter Epochen-/Erzählwahl.
  - **Ruhige mobile Alternative:** Verwendet dieselben 3 Stamm- und 3 Kronen-Geometrien wie der Ist-Stand (nur versetzt skaliert/positioniert) plus einen kompakten Firstbalken; keine zusätzlichen Partikel oder Alpha-Transparenzen; volle Unterstützung für „Ruhige Ansicht“ und `prefers-reduced-motion: reduce`.
- **Prüfstatus Browser/Gerät:** `NOT_RUN` (reine Quellprüfung).

---

## 4. Genau eine visuelle Priorität für die nächste Umsetzung

> **Priorität 1 (einzige empfohlene nächste Umsetzung in `js/luvo_universe.js` nach Hopes Freigabe):**
> **Portalring flach als Sockel-/Umlaufring neigen (`portal.rotation.x ≈ 1.25`, `y ≈ size * 0.35`) und die drei Silhouetten `arcade`, `terraces` und `grove` in Höhe und Tiefe (`z`-Staffelung + asymmetrischer Akzent) freistellen.**

**Begründung:**
1. **Größter Lesbarkeitsgewinn auf dem Smartphone:** Solange der vertikale `portal`-Torus (`y = size * 0.8, z = 0`) auf jeder Insel direkt vor/in der Silhouette steht, sehen alle fernen Inseln im 32%-Mobilfenster zuerst wie identische Ringe aus. Sobald der Ring als geneigter Umlaufring die Inselbasis fasst, steht die obere Außenkontur (Bogen + Seitenbaum vs. flache Stufenterrasse vs. hoher Dreieckshain) frei gegen den dunklen Kosmos-Hintergrund.
2. **Kein Mehrverbrauch / gleiche Pipeline:** Die Änderung nutzt ausschließlich die bereits in `js/luvo_universe.js` vorhandenen Three-r128-Geometrien und Materialien (`ivory`, `copper`, `terracotta`, `sand`, `leaf`, `mint`, `gold`) ohne neue Texturen, Modelle oder Renderjobs.

---

## 5. Vormerkung für die eigenständige nächste Phase: Sanctuary-Figuren (keine Änderung in diesem Auftrag)
- **Abgrenzung:** Gemäß Auftrag wurden weder `js/sanctuary_characters.js` noch andere Produktdateien verändert.
- **Quellbefund für die spätere Figurenphase (`js/sanctuary_characters.js`, Zeilen 3–23):**
  - **Reisender (`navigator-soul`):** Aktuell als durchgehender `LatheGeometry`-Mantelkegel (`Radius 0.92` unten bis `0.26` oben) mit weit abgespreizten Zylinder-Armen (`side * 0.96`), Kugelkapuze (`hood`), `navigator-soul-spark` (`#a4ead6`) und zwei flachen Rückenzipfeln (`tails`) gebaut. Aus der erhöhten Sanctuary-Hofkamera wirkt der breite untere Kegel mit starren Seitenarmen noch sehr glockenförmig.
  - **Vormerkung für die separate Figurenphase:** (1) Eigenständige, aus der Hofkamera klar lesbare Reisenden-Proportionen durch Trennung in schmaleren unteren Mantelsaum, abgesetzte Schulter-/Kragenpartie mit `seam`-Kontur und ruhigere, leicht gesenkte Armhaltung; (2) unveränderte Beibehaltung der einheitlichen 4-Flügel-`CDFFloweeFairy`-Silhouette (`js/flowee_fairy.js`) als gemeinsamer Begleiter in LUVO und Sanctuary.

---

## 6. Zusammenfassung Prüfstatus (`Ist` / `Vorschlag` / `NOT_RUN`)
| Bereich | Status | Beleg / Grenze |
|---|---|---|
| Quellprüfung `Intro47` (`js/luvo_universe.js`, `js/luvo_scene.js`, `js/sanctuary_characters.js`) | `PASS` (Quellprüfung) | Commit `45daef68373352ebc0eecf63272b2d432293f099` auf `E:/circle-d-flow-web` gelesen; 0 Produktdiffs. |
| Drei eigene Silhouettenentwürfe (`arcade`, `terraces`, `grove`) + 1 Priorität | `VORSCHLAG` | Dokumentiert für bestehende Three-r128-Pipeline; kulturelle Zuordnung bleibt vorläufig bis zum Abgleich mit Daikus Weltkarte (`CDF-MYTH48`) und Hopes Entscheidung. |
| Visuelle Browser-/GPU-Prüfung (`390×844`, `360×640`, `844×390`, `1280×800`) | `NOT_RUN` | Kein aktiver Browser in dieser Antigravity-Sitzung; echte Handy-/Browserabnahme bei Hope und Cursor. |

## Codex-Eingangsprüfung · 2026-11-08
Tatsächliches Paket empfangen und als Quellprüfung eingeordnet. Begrenzte Konturänderung in Intro49 durch Codex umgesetzt; keine kulturelle Endzuordnung/Delphi-Auswahl. Geometrieprüfung misst+24 Meshes/+960 Dreiecke, daher keine unveränderten Kosten/Performance behaupten. Browser-/Geräteabnahme bleibt separat offen.
