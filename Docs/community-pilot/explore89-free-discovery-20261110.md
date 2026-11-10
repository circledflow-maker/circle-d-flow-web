# Explore89 · Freie Erkundung, Nähe-Hinweise und EXP
2026-11-10 · Produktregel des CEO, ergänzt City87 / Traditions88.
Zustand: Ablauf und Abnahme festgehalten; echte EXP-Vergabe und neue Missionsblasen noch nicht produktiv implementiert.

## Grundregel
Der Navigator kann Sanctuary und Räume von Anfang an selbst erkunden. Flowee bietet einen freiwilligen geführten Weg. Keine Rollenwahl, Profilangabe oder Tutorial-Bestätigung sperrt die freie Bewegung; private/organisatorische Aktionen behalten ihre tatsächlichen Zugangsregeln.

## Nähe im Spielraum
Beim Annähern an einen relevanten Interaktionspunkt erscheint eine beschriftete Blase: Missionssymbol und Titel oder Flowee-Symbol mit „Erklären lassen“. Bei mehreren Optionen zuerst der nächste relevante Punkt; weitere Angebote über „Weitere Möglichkeiten“. Symbol plus Text, nicht Farbe allein. Öffnen nur durch bewusste Auswahl; keine automatisch aufspringenden Dialoge oder angehaltene Bewegung beim bloßen Vorbeigehen.
Näherung wird aus der virtuellen Spielfigur berechnet, nicht aus GPS. Eintritts- und Austrittsradius unterscheiden sich gegen Flackern; pro Punkt abblendbare Hinweise, keine Dialog-Wiederholung bei jedem Schritt. Radius ist je Szene zu skalieren, nicht ohne Maßstab als reale Meter auszugeben.
Bei verlassenem Bereich Blase ausblenden. Bereits gestartete Mission bleibt im Reisebuch auffindbar. Unterbrechung, Raumwechsel und spätere Wiederaufnahme sind erlaubt. Manuelle Interaktions-/Missionsliste bietet dieselben Möglichkeiten bei fehlender 3D-Darstellung oder eingeschränkter Bedienung.

## Zwei gleichberechtigte EXP-Wege
- Mission: eine definierte Handlung oder ein Beitrag erfüllt die Missionsanforderung; gegebenenfalls Bestätigung durch zuständige Person.
- Flowee-Tutorial: eine definierte Lernaufgabe wird nachvollziehbar abgeschlossen. Bloßes Anzeigen einer Sprechblase oder Abspielen eines Timers reicht nicht.
Beide Arten sind EXP-berechtigt. Die Entscheidung für EXP ist bestätigt; konkrete Missionswerte sind noch festzulegen. Der bisherige Kernrundgang-Vorschlag von 25 EXP bleibt eine nicht aktivierte Höhe, keine bereits ausgestellte Gutschrift.
Dasselbe Lernziel darf selbständig oder mit Flowee gelöst werden: dieselbe kanonische Ziel-ID, gleicher Basiswert, einmaliger Anspruch. Eine tatsächlich andere Mission und ein separates Tutorial-Lernziel dürfen jeweils EXP ergeben. Keine doppelte Belohnung desselben Ziels, keine EXP für Umherlaufen, Annäherung, Hinweisöffnen oder Wiederholung. Optionale Hilfe mindert den Basiswert nicht.
Server prüft Identität und erfülltes Ziel; eindeutiger Schlüssel (member_id, objective_reward_key), EXP-Erhöhung und Beleg atomar. Client sendet keine verbindliche Punktzahl. Doppelte Requests, zwei Geräte, anderer Lösungsweg oder Tutorial-Neustart erzeugen keine zweite Gutschrift. Kein addXP aus Browserposition oder sessionStorage.
EXP bleibt vom Euro-/FLOW-Tresor getrennt; keine automatische Credits-Vergabe aus diesen Lernaufgaben.

## Zustand im Reisebuch und bei Flowee
entdeckt → angeboten → angenommen → in Arbeit → abgeschlossen → EXP bestätigt.
Angeboten/entdeckt darf lokal angezeigt werden; „abgeschlossen“ braucht den vorgesehenen Abschlussbeleg, „EXP bestätigt“ den serverseitigen Reward-Beleg. Fehlende Verbindung: Bestätigung ausstehend anzeigen, keinen Erfolg erfinden. Tutorial-Erklärungen bleiben wiederholbar; jeder Eintrag zeigt Ziel, nächsten Schritt und bestätigte Vergabe, soweit vorhanden.
Quellen-Lore bleibt optional; keine Punkte für Glaubensangaben, Religion, Ortungsfreigabe oder spirituelle Selbstauskunft.

## Erster konkreter Ausbau und Abnahme
Owner Codex; erster Raum Bantaba, ohne Stages/Cinema/Academy auf Bantaba umzuleiten. Ein Missionspunkt und ein Flowee-Lernpunkt mit identischem Hinweis-Controller; anschließend gleiche Struktur für andere Räume.
Abnahme: direkt frei losgehen; Nähe-Blase erscheint ohne Auto-Dialog; Randbewegung flackert nicht; ablehnen und wieder aufrufen; manuelle Alternative; Journal-Eintrag wiederfinden; gleicher Abschluss selbständig/geführt nur einmal belohnt; zwei verschiedene bestätigte Ziele separat; Offline-/Fehlerzustand ehrlich; keine Geld- oder Rollenänderung.
Vor echter Vergabe vorhandene serverseitige Abschluss- und Reward-Schnittstellen prüfen. Diese Dokumentation aktiviert keine EXP und ist kein Live-Release.