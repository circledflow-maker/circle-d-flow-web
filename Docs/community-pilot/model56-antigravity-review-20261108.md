# Model56 · Visuelle & technische Quellprüfung des kostenlosen Vergleichsmodells Model55
Datum: 2026-11-08 · Projekt: Circle D Flow / Modellpipeline und Community-Pilot
Bearbeiter: Antigravity (`CDF-MODEL56-SELECT`, bestehende Game-Direction-Perspektive geladen; formale Rollenzuordnung nach Teamorganisation v1.0 mit 21 Rollen: noch nicht zugeordnet)
Koordination: Codex (Ebene 2) · Unabhängige Gast-/Bedienprüfung separat: Cursor (`CDF-CORE57-QA`) · Business-/Quellenprüfung separat: Daiku (`CDF-DAIKU44`) · Finale kreative Entscheidung: Hope (CEO)

## 1. Geprüfte Quellen, Versionsstand und Werkzeug-Grenzen
- **Aktive lokale Quelle:** `E:/circle-d-flow-web` lesend geprüft (`D:` unberührt; **0 Produktdateien geändert**, **0 neue Downloads, Renderjobs oder kostenpflichtige Aufrufe**).
- **Versions- und Commit-Referenzen:**
  - `source_commit` / `base_commit` laut aktueller Inbox (`Team/collaboration/inbox/Antigravity/current.json`): `3c1b82a4cd00d022a4367c2609383f72bec593eb` (Koordinationsstand `Decision59`; in `STATUS.md` inzwischen fortgeschrieben bis `27dc92541147695c2afc9fc168dddae769ffe042` / `Remote60`).
  - Geprüfte Modell- und Szenenreferenz: `592de00258f012565bf1b9aed4e1f3ae722d36bf` (`Model55`) sowie `4e9e2ee786656c32ea6df3f5223afddbd7252e78` (`Intro54`).
  - Vollständig gelesene Grundlagen: `AGENTS.md`, `STATUS.md`, `.cursor/agents/cdf-game-direction.md`, `handoffs/2026-11-08_model56_codex-an-antigravity.md`, `Docs/community-pilot/model55-20261108.md`, `Docs/community-pilot/model-selection-20261108.md`, `Docs/community-pilot/delivery-plan-20261108.md`, `Docs/community-pilot/decision59-20261108.md`, `Docs/community-pilot/intro54-20261108.md`, `scripts/blender/create-cdf-coastal55.py`, `tests/model55-gltf-import.cjs`, `js/luvo_scene.js` sowie der lokale Prüfbeleg von `Model55`.
- **Ehrliche Abgrenzung der Prüfart (`Quellprüfung` vs. `Laufzeittest`):**
  - In dieser Antigravity-Sitzung ist **kein aktiver Browser-/WebGL-Kanal** verbunden; es wurde auch **kein neuer Blender-Renderjob** gestartet.
  - Alle Bewertungen zu Geometrie, Materialslots, Licht-Setup und Interaktionsstruktur beruhen auf der **Quell-, Skript- und Importmanifest-Prüfung (`PASS`)**.
  - Der **echte Weblichtvergleich bei `390×844` und `1280×800` sowie jede Smartphone-/GPU-/Framerate-Abnahme sind ausdrücklich `NOT_RUN`**. Weder der lokale Blender-Cycles-CPU-Render (`render.png`) noch der Node-`GLTFLoader`-Importtest (`tests/model55-gltf-import.cjs`) gelten als Handy- oder GPU-`PASS`.

---

## 2. Prüfung der vier Auswahl-Gates für `Model55`

### Gate A — Provenienz, Rechte und Kosten (`PASS`)
- **Tatsächlicher Beleg (`scripts/blender/create-cdf-coastal55.py`, `model55-20261108.md`):**
  - `Model55` (`CDF_COASTAL55_ORIGINAL`, Studie `Original coastal house, tree and lantern55`, Palette `mint`) wird vollständig prozedural in Python (`bpy`) unter **Blender 5.2.3 LTS** (portabel, offizieller SHA-256-Nachweis `723f08a4...`) aus eigenen Grundkörpern, Bezier-Kurven und Booleschen Schnitten erzeugt.
  - `original_geometry: true`, `external_assets: []`, `external_uris: []`, `extensionsUsed: []`, `extensionsRequired: []`, `0 €` Lizenz-/Abo-/API-Kosten.
  - Keine geschützten Franchise-Bauten oder -Figuren kopiert; keine unbestätigte Kultur- oder Gottheitszuordnung vorgenommen. Die in `model55-20261108.md` genannten CC0-Optionen (Poly Haven / Kenney) sind sauber als nicht heruntergeladene Vergleichsreferenzen getrennt.

### Gate B — Eigene Silhouette, Materialwirkung und Geometrie-Disziplin (`PASS` in Quellprüfung)
- **Tatsächlicher Beleg (`scripts/blender/create-cdf-coastal55.py`, Zeilen 189–385; `tests/model55-gltf-import.cjs`):**
  - **Künstlerischer Fortschritt gegenüber den bisherigen Box-/Kegel-Primitiven:**
    1. **Asymmetrische Drei-Elemente-Komposition:** Auf der abgerundeten Küstenterrasse (`Radius 4.65`, 13 organisch verformte Randsteine) steht das Kalksteinhaus bewusst links (`HX = -1.05`), der geschwungene mehrschichtige Baum rechts (`x = +1.20 .. +3.20`, Höhe bis `4.15`) und die Laterne frei lesbar vorne rechts am Steinpfad (`LX = 1.28, LY = -1.88`). Dadurch überschneiden sich Hausgiebel, Baumkrone und Laterne in der 3/4-Ansicht nicht.
    2. **Echte Bautiefe statt aufgeklebter Flächen:** Nach der im Code dokumentierten Normalen-Korrektur der Booleschen Cutter (Zeilen 157–160) besitzt die Fassade echte vertiefte Rundbogen-Laibungen für Tür (`Arched doorway`, Tiefe `0.7`), Obergeschossfenster und Seitenfenster mit warmem Emissionskern (`CDF warm window glow`, Emission `(1, 0.48, 0.12)`).
    3. **Weiche Außenkontur:** Das Dach folgt einer kontinuierlichen Kurvenfunktion (`roof_height(x) = 4.70 - 1.25*t^0.7 + 0.16*t^6`) mit aufgebogenen Traufen, Stehfalzen (`CDF roof seam`), Messingkanten (`CDF aged brass`), geschlossenem Giebel-Loft und abgerundetem Kamin.
  - **Laufzeit-Batching für Three.js r128:**
    - Während `cdf-coastal55.blend` 123 editierbare Einzelteile bewahrt, bündelt der GLB-Export (`export.glb`, `591.176 Bytes`, SHA-256 `7e65f4fd...`) alles in **nur 2 Laufzeit-Meshes**: `CDF_StaticDiorama` (15 Material-Primitives) und `CDF_Lantern_Interactive` (4 Material-Primitives) = **19 Material-Primitives insgesamt**, **16 `MeshStandardMaterial`s**, **20.470 Dreiecke**.
    - **Wichtige Einordnung des Geometriebudgets:** Rund `6.320` Dreiecke entfallen auf die Ico-Sphären (Blattkronen, Steine, Pflanzen), während rund `14.150` Dreiecke aus den zahlreichen `tube()`-Kurven (Stehfalze, Traufen, Steinrahmen, Äste, Wurzeln, Laternenstreben) und den 3-Segment-Bevels/Booleans stammen. Als **einzelnes Vordergrund-/Hero-Diorama** (Referenzwert `< 25.000` Dreiecke / `< 20` Primitives) ist das Modell gut proportioniert; für eine 14-fache Wiederholung im Hintergrund-Archipel wäre es ohne Vereinfachung zu schwer. Das bestätigt die Grenze: **ein Vergleichsasset, keine sofortige Weltserie**.

### Gate C — Erkennbare Laterne, Flowee und freie Hauptaktion (`PASS` in Strukturprüfung)
- **Tatsächlicher Beleg (`scripts/blender/create-cdf-coastal55.py`, Zeilen 300–313, 354; `js/luvo_scene.js`, Zeilen 17–19, 30–36):**
  - **Sichtbare und einzeln ansteuerbare 3D-Laterne:** Weil sämtliche `Lantern*`-Bauteile (Steinsockel, Messingfuß, warmer Leuchtkern, 4 geschwungene Messingstreben, 4 Glaseinsätze, geneigte Kappe, Tragering) im eigenen Export-Mesh **`CDF_Lantern_Interactive`** gebündelt sind, kann `js/luvo_scene.js` die Laterne direkt per Namen (`getObjectByName('CDF_Lantern_Interactive')`) für den Statuswechsel `waiting` → `lit` (`return_path` / `threshold`) ansteuern.
  - **Freiraum für Flowee und Hauptaktion (`Intro54`):** In `Intro54` (`4e9e2ee786656c32ea6df3f5223afddbd7252e78`) hält `js/luvo_scene.js` genau eine `CDFFloweeFairy`-Spritefigur mit `52px` Abstand zur schließbaren Sprechblase an linken/rechten oberen Szenenpositionen frei, während der SVG-Laternenbutton (`Intro47`) und die Antworten im unteren Overlay liegen. Die asymmetrische Senke zwischen Haus (`x = -1.05`) und Baum (`x = +2.10`) über der vorderen Terrasse (`LX = 1.28`) lässt die Bildmitte und den oberen Himmel für Flowee und ihre Blase frei.

### Gate D — Echter Weblichtvergleich bei `390×844` und `1280×800` (`NOT_RUN` — kritischer Quellbefund)
- **Prüfstatus:** **`NOT_RUN`** (kein Browser-/WebGL-Laufzeitkanal in dieser Sitzung).
- **Konkreter technischer Befund aus dem Codevergleich zwischen Blender-Studio und `js/luvo_scene.js`:**
  1. **Fehlende Studiolichter im GLB:** `create-cdf-coastal55.py` (Zeilen 425–432, 384) beleuchtet `render.png` mit drei starken Area-Lights (`1250 W`, `800 W`, `1700 W`), einem lokalen `PointLight` in der Laterne (`18 W` bei `(LX, LY, LZ+0.30)`) und `AgX`-View-Transform, exportiert aber mit `export_lights=False`. In `js/luvo_scene.js` (Zeilen 43–45) existieren dagegen nur `HemisphereLight(0xdff6e8, 0x09212c, 1)` und ein `DirectionalLight(0xffd7a1, 1.4)` vor dunklem Nebel (`0x07171d`).
  2. **Dunkle Basiswerte ohne Grund-Emissive:** Alle bisherigen prozeduralen LUVO-Materialien in `js/luvo_scene.js` (Zeile 46) nutzen `emissiveIntensity: 0.45`, damit sie vor dem Nachthimmel leuchten. `Model55` exportiert für Dach (`0.065, 0.22, 0.24`), Holz (`0.045, 0.12, 0.13`), Erde (`0.105, 0.15, 0.13`) und Rinde (`0.19, 0.105, 0.055`) dunkle PBR-Farben mit hoher `roughness (0.72–0.97)` und `emission = 0`.
  3. **Transparenz-Sortierung am Laternenglas (`BLEND`):** `CDF lantern pale glass` (`alpha = 0.24`) umschließt in `CDF_Lantern_Interactive` den `Lantern warm light core` (`CDF warm window glow`). In Three.js r128 kann ein glTF-`BLEND`-Material mit Standard-`depthWrite: true` den inneren Emissionskern je nach Kamerawinkel dämpfen, sofern beim Laden nicht `depthWrite = false` auf dem transparenten Materialslot gesetzt wird.

---

## 3. Höchstens eine priorisierte Empfehlung

> **Priorisierte Empfehlung (einziger nächster Schritt für `Model55`, Status: `JETZT` nach `CDF-P01`/`Intro54`-Sichtcheck):**
> **Isolierter Weblicht- und Lesbarkeitstest des vorhandenen `Model55` (`export.glb`) unter den echten Licht-/Nebelbedingungen von `js/luvo_scene.js` bei `390×844` und `1280×800` – inklusive gezieltem Material-Hook für `CDF_Lantern_Interactive` (`depthWrite: false` für das Laternenglas + Kopplung des `CDF warm window glow`-Slots an `dataset.lanternState`).**

| Kriterium | Konkrete Einordnung |
|---|---|
| **Beleg** | `scripts/blender/create-cdf-coastal55.py` (Zeilen 63–75, 300–385, 425–450), `tests/model55-gltf-import.cjs` (`PASS` für 19 Primitives / 20.470 Tris / Dispose) und `js/luvo_scene.js` (Zeilen 17–19, 43–46) belegen die Lücke zwischen dem 4-Licht-Cycles-Studiorender (`AgX`) und der 2-Licht-Three-r128-Nachtszene ohne Punktlicht. |
| **Erwarteter Nutzen** | Gibt **Hope (CEO)** eine unverfälschte Seite-an-Seite-Entscheidungsgrundlage im echten App-Licht (Desktop & Smartphone-Hochformat), ob der weiche Blender-Stil (`Model55`) die Hauptinsel und die Laternenhandlung aufwertet – ohne vorzeitige Arbeit an einer ganzen Weltserie oder an der zweiten Farbvariante (`copper`). |
| **Aufwand & Unsicherheit** | **Aufwand:** Gering (~30–45 Min. isolierter Loader-/Licht-Check durch Codex mit bereits vorhandenem `GLTFLoader-r128.js` und lokalem `export.glb`; 0 neue Blender-Renders, 0 Downloads). **Unsicherheit:** Mittel, ob die dunklen nicht-emissiven Dach-/Erd-/Rindenmaterialien im LUVO-Nachtnebel ohne leichte Hemisphären-/Emissive-Anhebung zu dunkel wirken. |
| **Kleiner Abnahmetest & Stopkriterium** | **Test:** `export.glb` in isolierter Webszene mit `luvo_scene.js`-Beleuchtung bei `390×844` und `1280×800` laden; prüfen: (1) Fassadenbögen, Dachkante und Baumkrone heben sich klar vom Hintergrund `#061014` ab, (2) `CDF_Lantern_Interactive` leuchtet trotz `BLEND`-Glas (`depthWrite: false`) klar und reagiert auf `lit`, (3) Flowee (`52px` Freiraum), Sprechblase und untere Hauptaktion bleiben frei, (4) „Ruhige Ansicht“ / `release()` gibt alle 19 Primitives sauber frei. **Stopkriterium:** Kein Umbau weiterer Inseln, kein CC0-Pack-Download und kein neuer Renderjob vor Hopes Stilentscheidung und der vorrangigen `CDF-P01`/`Intro54`-Geräteabnahme. |

---

## 4. Übersicht der Prüfergebnisse (`PASS` / `FAIL` / `NOT_RUN`)
| Prüfpunkt | Ergebnis | Beleg / Grenze |
|---|---|---|
| **Provenienz, Lizenz & Kostenfreiheit (`Model55`)** | `PASS` (Quellprüfung) | 100 % eigenes `bpy`-Skript (`create-cdf-coastal55.py`), Blender 5.2.3 LTS portabel, 0 externe Assets/URIs, 0 € Kosten, keine Franchise-/Gottheitszuordnung. |
| **Eigene Silhouette & Three-r128-Importfähigkeit** | `PASS` (Quell-/Importprüfung) | Asymmetrisches Haus/Baum/Laternen-Diorama; `591.176 Bytes`, `20.470` Dreiecke, `2` Meshes (`CDF_StaticDiorama`, `CDF_Lantern_Interactive`), `19` Primitives, `16` Standardmaterialien, `dispose()` geprüft. |
| **Sichtbare Laterne / Flowee / freie Hauptaktion (Struktur)** | `PASS` (Quellprüfung) | `CDF_Lantern_Interactive` separat benannt; kompatibel mit der `Intro54`-Flowee-Platzierung (`52px` Blasenabstand) und dem unteren Antwort-Overlay. |
| **Echter Weblichtvergleich bei `390×844` und `1280×800`** | `NOT_RUN` | Kein aktiver Browser-/WebGL-Kanal in dieser Sitzung; Licht-/Materialunterschied zwischen Cycles-Studio und `luvo_scene.js` als Prüfpunkt für den empfohlenen Abnahmetest dokumentiert. |
| **Physisches Smartphone & GPU-Laufzeit/Framerate** | `NOT_RUN` | Cycles-PNG und Node-`GLTFLoader`-Test sind kein Geräte- oder FPS-Beleg. |


## Coordinator-Prüfung · 2026-11-08
Als Quellenreview übernommen; keine Browser-/Sichtfreigabe. Model55 ist noch nicht in LUVO integriert. Der lokale GLTFLoader-r128.js setzt BLEND bereits auf depthWrite=false; kein zusätzlicher Fix aus dieser Annahme. Kosten-/Geometrieangaben ersetzen keine Geräteleistung. Vergleich unter echtem Weblicht bleibt offen. Übernahme: Codex, Intake61.
