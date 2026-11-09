# Pass77 · privater Reisebuch-Datenvertrag (Vorschlag, nicht aktiviert)
Datum:2026-11-09 · Projekt:Circle D Flow · Owner:Codex; Entscheidung Hope
Ziel:persönliche Erinnerung an Sanctuary-Besuche, Begegnungen und Spielfortschritt, ohne Erlebnisse oder Teilnahme zu erfinden.

## Nächste technische Phase
Bestehenden privaten Eigentümervertrag und reale SQL-/API-Basis prüfen. Danach eine additive Migration mit privatem ownergebundenem Lese-/Schreib-/Löschweg und Tests vorbereiten. Keine gehostete Anwendung oder neue RLS-/XP-Aktivierung aus diesem Dokument.
Ereignismodell als Vorschlag: id, owner_id (ausschließlich verifizierte Sitzung), kind, occurred_at, source, subject_reference, private_note, created_at. Serverzeit created_at nicht als vergangener Erlebniszeitpunkt ausgeben; unbekanntes occurred_at bleibt unbekannt. Bei Selbsteintrag klar „selbst eingetragen“.
Drei Quellen getrennt:
1. Digital erkundetes Portal: nur eigene digitale Interaktion, keine physische Anwesenheit. Kein Import globaler alter Gerätelisten als Eigentümerbeleg.
2. Sanctuary-Besuch: getrennt definierter Bestätigungsweg; Details/Beleg noch nicht zugeordnet. Keine GPS-/QR-/Kontaktdaten automatisch sammeln.
3. Begegnung: ausdrückliche eigene Eintragung oder vorhandene bestätigte In-App-Begegnung mit tatsächlich geliefertem Zeitpunkt. Eine In-App-Bestätigung ist kein Nachweis eines physischen Treffens. Fremde Kontaktdaten nicht aus Social-Links ableiten; privater Text nur freiwillig, korrigier-/löschbar. Sichtbarkeit des Gegenübers nicht erweitern.
Fortschritt: aktueller EXP-Stand bleibt Momentaufnahme. Verlauf nur aus echten bestehenden Ereignissen, nie aus Differenzschätzung oder kosmetischen Zeichen ableiten. Bekannter bestätigter Symbolfund besitzt tatsächliches earnedAt.
Tagebuch standardmäßig privat; bleibt vollständig aus Begegnungsbild und öffentlichen Profil-/QR-Ansichten ausgeschlossen. Neue Datentypen nicht automatisch zur bestehenden Freigabe-Positivliste hinzufügen.
Geräteübergreifende Synchronisierung erst mit serverseitigem ownergebundenem Speicher. Offline-Entwurf nur mit klarer Speichergrenze; keine stillen personenbezogenen Aufzeichnungen im globalen localStorage.
Abnahme: zwei Konten strikt getrennt, Antworten nach Kontowechsel verworfen, nur eigener Zugriff, fremde IDs/Owner/Zeiten nicht als bestätigt übernehmen, fehlgeschlagene Schreibvorgänge nie als gespeichert, Wiederholung idempotent, Löschung wirksam, Datum/Zeitzone lesbar, Notizen nicht im Export, keine zusätzliche XP/Rolle durch Tagebucheintrag.
Status:vorbereiteter Vertrag; dauerhaftes Tagebuch weiterhin offen. Erst vollständigen Profil-/Kartenkernweg CDF-P01 abgleichen.
