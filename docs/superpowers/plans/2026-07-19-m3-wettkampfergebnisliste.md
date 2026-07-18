# M3: Wettkampfergebnisliste typisiert — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Die Wettkampfergebnisliste vollständig typisiert lesen, validieren, schreiben und projizieren (Release 0.3.0).

**Architecture:** Dieselbe Schicht wie M2 — Schema-Tabelle, Validierung, typisiertes Lesen, Writer, Objektgraph. Die Bausteine stehen alle; M3 füllt sie für eine zweite Listenart und zeigt damit, ob die Architektur trägt.

**Vorgänger:** [`2026-07-18-m2-wettkampfdefinitionsliste.md`](2026-07-18-m2-wettkampfdefinitionsliste.md)

---

## Ausgangslage

Der Bestand ist hier deutlich besser als in M2: **72 echte Wettkampfergebnislisten in DSV7**, dazu 3 in DSV6. Über alle 72 hat jedes Element eine völlig konstante Feldanzahl, und sie stimmt in jedem Punkt mit der Spec-Extraktion und mit der unabhängigen Ruby-Implementierung überein.

**Befund, der M3 vereinfacht: DSV7 und DSV8 sind für diese Listenart strukturell identisch.** Kein Attribut kommt hinzu, keine Feldzahl ändert sich. Die Versionsarbeit beschränkt sich auf Wertebereiche — anders als in M2, wo `BANKVERBINDUNG` ein Feld dazubekam und `LASTSCHRIFT` ein ganzes Element war.

Neu gegenüber **DSV6** sind die drei Nationalitätsfelder in `PNERGEBNIS` und `STAFFELPERSON` — die DSV6-Dateien im Bestand haben dort 16 statt 19 bzw. 9 statt 12 Felder. Das bestätigt die DSV6-Ablehnung als richtig.

## Was diese Listenart anders macht

|                   | Wettkampfdefinitionsliste | Wettkampfergebnisliste                      |
| ----------------- | ------------------------- | ------------------------------------------- |
| `ABSCHNITT`       | 6 Attribute               | **4**                                       |
| `VEREIN`          | einmal                    | **1 bis N**                                 |
| `WETTKAMPF`-Art   | `V Z F E`                 | zusätzlich **`A` `N`**                      |
| Personen          | kein Personenelement      | `PNERGEBNIS` als denormalisierter Flachsatz |
| Geschlecht Person | —                         | `M W D` — **kein `X`**                      |

`PNERGEBNIS` trägt Name, DSV-ID, Verein, Jahrgang und Endzeit in derselben Zeile. **Für jede definierte Wertung gibt es einen eigenen Satz** (dsv8.md:5019) — im Spec-Beispiel erscheinen dieselben Schwimmer zweimal mit identischer Endzeit und unterschiedlicher WertungsID.

## Elementtabelle

18 Elemente in Dateireihenfolge. Feldanzahl dreifach bestätigt.

| #   | Element          | Vorkommen | Felder | Vorkommen real |
| --- | ---------------- | --------- | ------ | -------------- |
| 1   | `FORMAT`         | 1         | 2      | 72             |
| 2   | `ERZEUGER`       | 1         | 3      | 72             |
| 3   | `VERANSTALTUNG`  | 1         | 4      | 72             |
| 4   | `VERANSTALTER`   | 1         | 1      | 72             |
| 5   | `AUSRICHTER`     | 1         | 9      | 72             |
| 6   | `ABSCHNITT`      | 1–N       | 4      | 197            |
| 7   | `KAMPFGERICHT`   | 0–N       | 4      | 5710           |
| 8   | `WETTKAMPF`      | 1–N       | 11     | 2876           |
| 9   | `WERTUNG`        | 1–N       | 8      | 24747          |
| 10  | `VEREIN`         | 1–N       | 4      | 1532           |
| 11  | `PNERGEBNIS`     | 0–N       | 19     | 95756          |
| 12  | `PNZWISCHENZEIT` | 0–N       | 5      | 71617          |
| 13  | `PNREAKTION`     | 0–N       | 5      | 18098          |
| 14  | `STERGEBNIS`     | 0–N       | 13     | 1688           |
| 15  | `STAFFELPERSON`  | 0–N       | 12     | 6712           |
| 16  | `STZWISCHENZEIT` | 0–N       | 6      | 5984           |
| 17  | `STABLOESE`      | 0–N       | 6      | **0**          |
| 18  | `DATEIENDE`      | 1         | 0      | 72             |

## Entscheidungen, die dieser Plan trifft

**`SPR` wird toleriert.** Die Enum-Liste der Kampfrichterpositionen kennt `SP` für Sprecher\*in (dsv8.md:4611–4655), aber das Spec-Beispiel selbst schreibt `SPR` (dsv8.md:5852), und eine echte Datei tut es auch. Nach der in M2 etablierten Regel: `tolerated: true` — beim Lesen Warnung, beim Schreiben unzulässig.

**`STAFFELERGEBNIS` wird nicht unterstützt.** Die Ruby-Implementierung akzeptiert diesen Namen zusätzlich zu `STERGEBNIS`, „wie er in freier Wildbahn vorkommt". In unseren 72 Dateien kommt er **kein einziges Mal** vor — 1574 mal `STERGEBNIS`, nie `STAFFELERGEBNIS`. Nicht auf Vorrat bauen; falls er später auftaucht, ist es ein Einzeiler im Schema.

**`Altersklasse` wird als optionale Zahl geführt**, obwohl die Spec dafür keine Beschreibung liefert und Typ wie Pflichtangabe nur aus der Spaltenreihenfolge rekonstruiert sind. In allen Realdaten ist das Feld leer. Das gehört als Unsicherheit in den Doc-Kommentar, nicht stillschweigend als gesichert behandelt.

**`STABLOESE` hat keinerlei empirische Deckung.** Null Vorkommen in 75 Dateien. Wie `NACHWEIS` und `PFLICHTZEIT` in M2 braucht es synthetische Fixtures — und den ausdrücklichen Vermerk, dass hier nur die Spec spricht.

## Wo es keinen Gegencheck gibt

Die Ruby-Implementierung, die sonst als zweite Lesart dient, hat an zwei Stellen selbst Lücken:

- **Kampfrichterpositionen prüft sie gar nicht** — alle drei Textfelder von `KAMPFGERICHT` sind dort ungeprüfte Zeichenketten
- **Den Grund der Nichtwertung** hat ihr Autor als Enum vorbereitet, aber nie an das Feld gebunden

An diesen beiden Stellen stützt sich M3 allein auf die Spec. Das ist kein Grund, es nicht zu tun — aber ein Grund, es nicht als doppelt geprüft auszugeben.

---

# Aufgaben

### Task 1: Elementdefinitionen, Teil 1 — Kopf und Struktur

`FORMAT`, `ERZEUGER`, `VERANSTALTUNG`, `VERANSTALTER`, `AUSRICHTER`, `ABSCHNITT`, `KAMPFGERICHT`, `WETTKAMPF`, `WERTUNG`, `VEREIN`.

Neu `src/schema/wettkampfergebnisliste.ts`. Die Kopfelemente sind mit denen der Wettkampfdefinitionsliste identisch — **nicht wiederverwenden, sondern eigenständig definieren**, weil `ABSCHNITT` 4 statt 6 Felder hat und die Wettkampfart hier zwei Werte mehr kennt. Wo Wertelisten wirklich identisch sind (Technik, Bahnlänge, Zeitmessung), dürfen sie geteilt werden — dann aber aus einem gemeinsamen Modul, nicht per Import aus der anderen Listenart.

### Task 2: Elementdefinitionen, Teil 2 — Ergebnisse

`PNERGEBNIS`, `PNZWISCHENZEIT`, `PNREAKTION`, `STERGEBNIS`, `STAFFELPERSON`, `STZWISCHENZEIT`, `STABLOESE`, `DATEIENDE`, plus das Listenschema.

### Task 3: Validierung der Querregeln

- Bei gesetztem „Grund der Nichtwertung" muss `Platz` gleich `0` sein (dsv8.md:5093 für `PNERGEBNIS`, 5476 für `STERGEBNIS`)
- `KB`/`KR` nur bei Technik `S` — wie in M2
- Für jede definierte Wertung ein `PNERGEBNIS`-Satz je Schwimmer (dsv8.md:5019) — **erst an Realdaten messen**, bevor die Regel scharf geschaltet wird
- Prüfen, ob die bestehende Validierung listenartunabhängig funktioniert oder angepasst werden muss

### Task 4: Typisiertes Lesen

`parseWettkampfergebnisliste(text)`. Abnahmekriterium: alle 72 echten DSV7-Dateien ohne `fatal`. Die Zahl der Dateien mit Fehlern und die Art der Fehler exakt festhalten.

### Task 5: Synthetische Fixtures

Für `STABLOESE` und alle Felder ohne empirische Deckung. Abdeckungsnachweis wie in M2.

### Task 6: Schreiben

`writeWettkampfergebnisliste`. Streng validierend, tolerierte Werte unzulässig.

### Task 7: Objektgraph

**Eigenes Zielmodell, keine Kopie aus M2.** Die Struktur ist grundlegend anders: Es gibt keine Personen-Entität in der Datei, sondern denormalisierte Ergebniszeilen. Die Auflösung läuft über die Veranstaltungs-ID des Schwimmers bzw. der Staffel.

Offene Entscheidung, die hier getroffen und dokumentiert wird: **ob eine synthetische `Schwimmer`-Aggregation angeboten wird.** Dieselbe Person erscheint in mehreren `PNERGEBNIS`-Zeilen, potenziell mit widersprüchlichen Angaben. Erst an Realdaten messen, wie oft Widersprüche auftreten, dann entscheiden.

### Task 8: Generierte Typen und Review-Zyklus

Codegen auf die zweite Listenart erweitern. Danach Test-Review-Zyklus mit Mutationsdurchlauf wie in M2 — dort fand er sieben Lücken, die kein anderes Verfahren zeigte.

### Task 9: Release 0.3.0
