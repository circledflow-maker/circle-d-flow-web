# Intro37 · Visuelles Regieblatt: Prolog bis Sanctuary-Erwachen
Datum: 2026-11-07 · Projekt: Circle D Flow / Flowee / Sanctuary
Vorgesehener Bearbeiter: Antigravity (`CDF-INTRO37-ART`, formale Rollenzuordnung nach Teamorganisation v1.0 mit 21 Rollen: noch nicht zugeordnet)
Gelesene Perspektive: `.cursor/agents/cdf-game-direction.md` (keine Rechteerweiterung)
Koordination: Codex (Ebene 2) · Bedienbarkeitsprüfung separat: Cursor (`CDF-INTRO36-QA`) · Finale Kreativentscheidung: Hope (CEO)

## 1. Prüfart, erreichbare Quellen und Versionsstand
- **Prüfart:** **Reine Quellprüfung (Source Inspection)**. In dieser Antigravity-Sitzung ist kein aktiver Browser-/WebGL-Kanal verbunden. Es werden daher ausdrücklich **keine eigenen Browser-Renders, Screenshots, Frameraten oder Gerätetests** behauptet. Wo Codex' dokumentierter Browserlauf aus `Intro41` erwähnt wird, geschieht dies ausschließlich als fremder Vorbericht.
- **Erreichbare Quelle:** Aktiver lokaler Arbeitsbaum `E:/circle-d-flow-web` lesend geprüft (`D:` nicht synchronisiert oder als Ersatz verwendet).
- **Koordinations- und Quellstände:**
  - Koordinationsstand laut lokalem Aufgabenpaket (`source_commit` / `base_commit`): `f11188257c5a48dc7bd4daaa6119d570c94770c2` (`codex/repo-koordination-2026-10-28`, Stand nach `Intro43`).
  - Historischer Auftrags-Snapshot (`Intro35`, Draft-PR 18): `264a7c725fd4acca69e58ffdfa36601e9d3c29c8`.
  - Neuere Produkt-Snapshots in Draft-PR 18: `76d1f8308c19a0e0f367a79bf368446bd815e22b` (`Intro39`) und `16a813f19ca980ec815c893741d2ef15808c2059` (`Intro41`).
  - Lokaler Git-HEAD auf `E:`: `88442401ab74d642a108b4e3811e8f9d308d5a86` mit uncommittetem lokalem `Intro41`/`Intro43`-Arbeitsstand.
- **Geprüfte Produktdateien (nur gelesen, 0 Änderungen):** `pages/login.html`, `pages/luvo.html`, `pages/artist_sanctuary.html`, `js/cdf_intro_story.js`, `js/cdf_account_story.js`, `js/cdf_scene_dialogue.js`, `js/flowee_fairy.js`, `js/luvo_universe.js`, `js/luvo_scene.js`, `js/sanctuary_arrival.js`, `js/sanctuary_characters.js`, `js/sanctuary_scene.js`, `js/sanctuary_environment.js`, `css/luvo_scene.css`, `css/cdf_intro_story.css`, `css/cdf_scene_dialogue.css`.

## 2. Querschnitt zu Hopes Feedback (Intro35 vs. Intro39/Intro41)
- **Szenensichtbarkeit, weniger Seiten-Scroll, sichtbare Buttons und optionale Swipes:**
  - *Beobachtung im Code (`Intro39`/`Intro41`, getrennt vom älteren `Intro35`-Stand):* Auf kleinen Viewports (`max-width: 700px` oder `max-height: 500px`) sperrt `css/cdf_scene_dialogue.css` den Seiten-Scroll (`body.cdf-dialogue { height: 100dvh; overflow: hidden }`) und teilt `.journey-shell` in ein oberes Szenenfenster (`minmax(100px, 32%)`) und ein unteres Dialogfeld (`minmax(0, 1fr)`, mit `align-items: stretch` aus `Intro41`). `js/cdf_scene_dialogue.js` legt `#luvo-scene` exakt in das obere `.world-window`; nur `.dialog-copy` scrollt intern, während `.step-actions` (`min-height: 44px`) unten sichtbar stehen bleiben. Ein Button (`data-scene-peek`, „Szene ansehen“) vergrößert das Szenenfenster optional auf `70%`. Horizontale Touch-/Pen-Swipes (`dx >= 64px`, `|dx| >= |dy| * 1.6`, `<= 800ms`, 24px Rand-Schutz) blättern nur zwischen sicheren Story-Beats und lösen an `return_path` sowie `threshold` bewusst keinen Formular-Submit oder Raumwechsel aus.
  - *Offene Lücke im Querschnitt:* Im **LUVO-Einstieg** ist Hopes Vorgabe im Code umgesetzt; beim **Erwachen im Sanctuary** (`#sanctuary-awakening` in `css/cdf_intro_story.css`) liegt jedoch weiterhin ein zentriertes Modal mit abgedunkeltem `backdrop-filter: blur(3px)` mitten über der 3D-Szene.
- **Einheitliche Flowee-Silhouette und spätere Farbvarianten:**
  - *Beobachtung im Code (`Intro39`/`Intro41`):* `js/flowee_fairy.js` (`CDFFloweeFairy`) definiert für DOM-SVG (`pages/login.html`, Raum-Tutorials) und Three.js-Canvas-Sprite (`js/luvo_scene.js`, `js/sanctuary_characters.js`) dieselbe 4-Flügel-Silhouette mit Doppellichtkern, drei goldenen Staubpunkten (`#f1d293`) und kleinem Sternfunken oben rechts. Standardfarbe ist `#12efc9`; ein validierter Hex-Farbparameter (`/^#[0-9a-f]{6}$/i`) ist technisch vorbereitet, die inhaltliche **Guidance-Zuordnung späterer Farbvarianten ist noch nicht bestätigt / noch nicht zugeordnet**.

---

## 3. Regieblatt für die drei Momente

### Moment 1 — Lichtspur und erster Weltenblick (`city_light` → `many_worlds`)
- **Tatsächlich beobachteter Zustand und Version:**
  - *Quellstand `Intro41` (`js/cdf_intro_story.js`, `js/luvo_universe.js`, `js/luvo_scene.js`):* Schritt 0 (`city_light`) aktiviert die Stufe `horizon` (`cam: [2.6, 5.2, 17]`, `look: [0, 2.2, -1]`, warmer Abendnebel `0x40302b`, Meerziel `0x486c70`). Sichtbare Geometrien laut Code sind 8 Lissabon-inspirierte Küstenhäuser (`ivory`/`terracotta` mit `copper`-Dächern bei `z = -3.2`), Meerfläche (`y = -5.1`) mit 5 Wellenringen, zentraler Goldbaum mit LUVO-Torusring, 7 Trittsteine (`z = 1.4 .. 8.0`), Mond (`[-12, 17, -33]`) und 14 ferne Archipel-Inseln (`z = -12 .. -30`). Schritt 2 (`many_worlds`) startet in `story` (`cam: [-2, 6, 19]`) ohne aktive Vordergrund-Themengruppe und schaltet erst nach Antwortwahl in `shelter`, `roots`, `horizon` oder `tides`.
  - *Beobachtete Schwächen im Code:* (1) Die im Erzähltext benannte „Lichtspur“ besteht auf den 7 Steinen aus statisch wechselndem `gold`/`stone`-Material ohne gerichteten Helligkeitsverlauf zum Ring. (2) Mobil (`width < 700`) überschreibt `luvo_universe.js` alle Stufenkameras fast gleichförmig (`[cam[0]*0.15, 4.8, cam[2]+2]`, `look: [0, 3.3, 0]`), während `luvo_scene.js` die gesamte `world`-Gruppe auf `y = 3.2` anhebt (`scale = 0.72`). Dadurch rücken Küstendächer, Baumkrone und ferne Archipel-Inseln vertikal in dasselbe schmale Band des 32%-Mobilfensters.
- **Gewünschte Bildwirkung:**
  - Ruhiger, sofort lesbarer Tiefenaufbau von der warmen Küstenkante im Mittelgrund über eine sanft leuchtende Steinspur bis zum weiten 14-Inseln-Archipel am Horizont – auch im flachen oberen 32%-Fenster auf dem Smartphone ohne Überlagerung von Baumkrone und Dächern.
- **Höchstens eine kleine Verbesserung mit vorhandenen Assets (Vorschlag):**
  - Auf den vorhandenen 7 Trittsteinen in `js/luvo_scene.js` während `city_light` eine sanft zum Portalring ansteigende `emissiveIntensity`-Staffelung setzen und mobil `world.position.y` leicht absenken (Richtwert `1.8–2.2` passend zu `targetLook.y`), damit Wasser/Steg unten, Baum mittig und Archipel oben sauber getrennt lesbar werden.
- **Ruhige Alternative:**
  - Bestehender Schalter `#luvo-scene-toggle` („Ruhige Ansicht“) sowie `prefers-reduced-motion: reduce` geben den WebGL-Kontext sauber frei (`release()`), blenden `.luvo-cut`-Lichtstreifen aus und zeigen den warmen stufenspezifischen CSS-Radialverlauf (`[data-luvo-stage=horizon] #luvo-scene`) bei voller Text- und Button-Bedienbarkeit.

---

### Moment 2 — Flowee und Laternenhandlung (`flowee_lantern` → `first_step`)
- **Tatsächlich beobachteter Zustand und Version:**
  - *Quellstand `Intro41` (`js/cdf_intro_story.js`, `js/cdf_account_story.js`, `js/luvo_scene.js`, `js/flowee_fairy.js`):* Schritt 1 (`flowee_lantern`) nutzt `welcome` (`cam: [3.8, 4.2, 15]`, dunkler Kosmos `0x071322`), Schritt 3 (`first_step`) nutzt `roots` (`cam: [-3.5, 3.6, 14]`, 6 Kupfer-/Blattbäume und mintfarbener Wurzelring). Flowee schwebt als einheitliche `CDFFloweeFairy`-Sprite-Silhouette bei `[2, 4.2, 1.3]`.
  - *Beobachtete Schwächen im Code:* Der Dialog beschreibt ausdrücklich zwei Lichter und eine konkrete Objekt-Reaktion (*„Flowee hält eine Laterne daneben“*, *„Die Laterne wartet auf einer niedrigen Mauer. Berühre sie oder nutze den Button. Ihr Licht macht eine Linie im Stein sichtbar.“*). Im 3D-Szenencode existiert jedoch **weder eine Laternen-Geometrie noch ein zweiter kleiner Reisenden-Funke noch eine aufleuchtende Steinlinie**; Klick auf „Laterne berühren“ (`[data-lantern-touch]`) oder „Zur Laterne“ triggert lediglich `CDFLuvoScene.pulse()` (650 ms diagonaler 2D-CSS-Lichtstreifen `.luvo-cut`) und schaltet im selben Aufruf sofort weiter zu `return_path` (`tides`).
- **Gewünschte Bildwirkung:**
  - Spürbare, aber druckfreie Ursache-Wirkung im Raum: Neben der mintfarbenen Flowee steht eine warme kleine Laterne auf niedriger Steinmauer; das Berühren per Button lässt die Steinlinie auf dem Steg warm aufleuchten und nimmt dieses Licht sichtbar mit in den folgenden Rückweg-Schritt (`return_path`), statt nur einen kurzen 2D-Schnittblitz zu zeigen.
- **Höchstens eine kleine Verbesserung mit vorhandenen Assets (Vorschlag):**
  - Eine leichtgewichtige prozedurale Laternen-Gruppe aus bereits vorhandenen Primitiven/Materialien (`stone`-Mauerquader + `gold`-Oktaeder analog `sanctuary_environment.js`) neben den Steg setzen und ab `first_step` bis `return_path` die vorhandenen Pfadsteine warm-golden emittieren lassen – ohne Wartezwang, Timer oder Geschicklichkeitstest.
- **Ruhige Alternative:**
  - Der großflächige Button „Laterne berühren“ (`min-height: 48px` mobil / `84px` Desktop) und der reguläre Weiter-Button bleiben gleichwertig per Klick/Tastatur bedienbar; bei `prefers-reduced-motion` oder aktiver „Ruhiger Ansicht“ entfällt der `.luvo-cut`-Blitz vollständig, und der Fortschritt erfolgt ruhig über den klaren Statuswechsel.

---

### Moment 3 — Schwelle und Erwachen im Sanctuary (`threshold` → `artist_sanctuary.html?intro=first-light`)
- **Tatsächlich beobachteter Zustand und Version:**
  - *Quellstand `Intro41` (`js/cdf_intro_story.js`, `js/sanctuary_arrival.js`, `js/sanctuary_scene.js`, `js/sanctuary_environment.js`, `css/cdf_intro_story.css`):* Schritt 5 (`threshold`) führt per echtem Link (`<a class="primary story-arrival" href="/sanctuary?intro=first-light">`) ohne künstlichen Ladebalken ins Sanctuary. Dort öffnet `sanctuary_arrival.js` das native `<dialog id="sanctuary-awakening">`, wartet ehrlich auf das Event `sanctuary:ready` (mit 12-Sekunden-Fallback auf `scene-simple`, ohne eine bewusste `simple`-Wahl nachträglich zu überschreiben) und bereinigt `?intro=first-light` beim Schließen per `history.replaceState`.
  - *Beobachtete Schwächen im Code:*
    1. **Verdeckung der Erwachens-Szene:** Im Gegensatz zum neuen mobilen LUVO-Split-Layout (`Intro39`/`Intro41`) ist `#sanctuary-awakening` (`css/cdf_intro_story.css`) weiterhin ein **zentriertes Vollbild-Modal** (`width: min(560px, calc(100% - 28px))`, fast opaker Hintergrund `#132c35f5 -> #071721f5`) mit `::backdrop { background: #041019b8; backdrop-filter: blur(3px) }`. Da `sanctuary_scene.js` den verhüllten Reisenden (mit mintfarbener Mantelnaht) und Flowee exakt in der Bildschirmmitte (`target = (0, 1.1, 12)`, `camera = (0, 8..9, 29..31)`) rahmt, verdeckt und verwischt der Dialog genau jene Figur, Steinplatten und Hofarchitektur, die der Text in Schritt 1–3 beschreibt.
    2. **Statische Totale über alle drei Ankunfts-Beats:** Alle drei Schritte (`Unter Blättern` → `Willkommen im Sanctuary` → `Dein nächster kleiner Schritt`) wechseln nur Text, während die Kamera unverändert in der weiten Start-Totale bleibt; die im Text erwähnten Siegelringe liegen bei `(0, 0.08, 1)` elf Einheiten vor dem Spawn `(0, 12)`, und die vorhandenen Hoflaternen stehen weit entfernt bei `(±10, -17)` bzw. `(±11, 21)` statt neben einer nahen Bank.
- **Gewünschte Bildwirkung:**
  - Durchgehende gestalterische Linie vom LUVO-Prolog bis zur Ankunft: Der warme Lehm-/Holz-/Messing-Innenhof des Sanctuary, die mintfarbene Mantelnaht des Reisenden und die einheitliche Flowee-Silhouette liegen beim Lesen im oberen Sichtfeld **unverschwommen und frei sichtbar**, während ein kompaktes unteres Dialog-Sheet ruhig durch die drei kurzen Erwachens-Momente führt.
- **Höchstens eine kleine Verbesserung mit vorhandenen Assets (Vorschlag):**
  - `#sanctuary-awakening` in `css/cdf_intro_story.css` als unteres, kompaktes Szenen-Sheet ohne `backdrop-filter: blur` verankern (oberes Sichtfeld 50–62 % frei, mobil `max-height: 46dvh` mit internem Textscroll und festen 44px-Buttons) und in `sanctuary_arrival.js` / `sanctuary_scene.js` pro Schritt sanft zwischen drei bereits vorhandenen Hof-Blickpunkten blenden (1: Nahfokus Reisender & Flowee bei `(0, 1.3, 12)` → 2: weiter Hofblick Richtung Bantaba `(0, 2.2, 2)` → 3: Blick auf die vorhandenen Siegelringe am Boden `(0, 0.4, 1)`).
- **Ruhige Alternative:**
  - Die bereits sauber implementierten Direktwege „Einfache Ansicht nutzen“ (`data-arrival-simple`), „Einführung überspringen“ (`data-arrival-skip`), `Escape`-Schließen, 12s-Fallback ohne Fake-Prozentanzeige sowie eingefrorene Kameraschwenks bei `prefers-reduced-motion: reduce` bleiben vollständig erhalten.

---

## 4. Eigene CDF-Bildsprache & kulturelle Leitplanken
- **Eigenständigkeit:** Küsten-, Wasser-, Stein- und Pflanzenmotive in LUVO sowie die warme Lehm-, Holz-, Stoff- und Messing-Hofsprache im Sanctuary bilden eine eigenständige CDF-Fantasiewelt ohne Franchise-Figuren, fremde Logos, geschützte Kompositionen oder Audio-Anleihen.
- **Quellentrennung:** Dokumentierte Museums-/Lernpfade (Fowler Museum zu Mami-Wata-Kontexten, The Met Objekt 317675 zu geometrischen Akan-Messinggewichten, Ewe-Sprachquellen im Sanctuary) bleiben klar als reale Lernverweise von der erfundenen CDF-Fiktion getrennt (konsistent mit Daikus `Intro43`-Prüfung; keine neuen traditionellen Symbole oder Bedeutungen behauptet).

---

## 5. Genau eine priorisierte nächste visuelle Verbesserung

**Priorität 1 (einzige empfohlene nächste Umsetzung nach Hopes Freigabe):**
> **Szenensichtbares Erwachen im Sanctuary:** `#sanctuary-awakening` (`css/cdf_intro_story.css`, `js/sanctuary_arrival.js`, `js/sanctuary_scene.js`) vom zentrierten Blur-Modal auf ein unteres, unverschwommenes Szenen-Sheet umstellen und die drei Ankunfts-Beats sanft auf vorhandene Hof-Koordinaten (Reisender/Flowee → Hofweite → Siegelringe) ausrichten – bei unveränderter `prefers-reduced-motion`-Ruhe und sofortigem Skip/Simple-Ausstieg.

**Warum genau diese Maßnahme zuerst:**
1. Codex hat die Sichtverdeckung im LUVO-Teil mit `Intro39`/`Intro41` bereits gelöst; im unmittelbaren Zielpunkt derselben Reise (`?intro=first-light`) verdeckt und verwischt `#sanctuary-awakening` jedoch noch genau den Moment des Erwachens.
2. Die Änderung benötigt **keine neuen 3D-Modelle, Texturen, Renderjobs oder Pipeline-Wechsel**, sondern nutzt zu 100 % vorhandene Sanctuary-Geometrien, Vanilla CSS/JS und die bestehenden Sicherheits-/Fallback-Pfade.
3. Sie erfüllt Hopes Kernprinzip (*„Die Szene soll beim Antworten sichtbar bleiben; weniger Seiten-Scroll, sichtbare Buttons“*) durchgängig über den gesamten Bogen bis in den Hof.

## 6. Offene Grenzen
- Keine eigene Browser-/WebGL-Sichtprüfung in dieser Sitzung durchgeführt (reine Quellprüfung).
- Physisches Smartphone (inkl. Softwaretastatur, Safe-Area und Querformat) sowie unabhängige Tastatur-/Bedienbarkeitsabnahme durch Cursor (`CDF-INTRO36-QA`) bleiben gesondert offen.
- Formale Rollenbestätigung und Guidance-Farbzuordnung späterer Flowee-Varianten bleiben offen (`noch nicht zugeordnet`).
- Finale kreative Entscheidung über diese Priorität liegt bei **Hope (CEO)**.

## Codex-Eingang · 2026-11-08
Originalpaket tatsächlich gelesen und validiert; reine Quellprüfung. Hope wählt Dialog zuerst bei unveränderter Kamera; Umsetzung durch Codex siehe intro45-20261108.md. Kein neuer Antigravity-Lauf oder eigene Antigravity-Browserabnahme daraus abgeleitet.
