# M4: Vereinsmelde- und Vereinsergebnisliste — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Die beiden verbleibenden Listenarten typisiert lesen, validieren, schreiben und projizieren (Release 0.4.0).

**Vorgänger:** [`2026-07-19-m3-wettkampfergebnisliste.md`](2026-07-19-m3-wettkampfergebnisliste.md)

---

## Der Unterschied zu allem bisherigen: keine Realdaten

Für diese beiden Listenarten gibt es **keine einzige echte Datei**. Beide gehen
direkt an den Ausrichter und werden nie veröffentlicht. Alles, was in M2 und M3
die Schema-Tabelle gegen die Wirklichkeit geprüft hat — konstante Feldanzahlen
über Dutzende Dateien, Validierung gegen zehntausende Zeilen — fällt hier weg.

### Der Gegencheck ist schwächer als bisher angenommen

In der Architektur steht, der Abgleich gegen `bigcurl/dsv7-parser` sei die
unabhängige zweite Lesart der Spezifikation. **Das trifft so nicht zu.** Das
Repository enthält eine eigene Markdown-Fassung der Spec, und die Schemata sind
daraus eins zu eins transkribiert — Attributreihenfolge, Pflichtflags und
Kardinalitäten stimmen durchweg überein. Es ist eine Transkription genau einer
Interpretation, keine zweite Meinung. Wo jene Fassung irrt, erbt der Code den
Fehler.

**Konsequenz für M4:** Übereinstimmung zwischen unserem Schema und dem
Ruby-Schema beweist nichts. Aussagekraft haben nur die Stellen, an denen die
beiden Quellen **auseinanderfallen** — dort ist mindestens eine falsch, und das
ist ein Anlass zum Nachsehen im Original. Der Cross-Check bleibt also im Plan,
aber als Widerspruchsdetektor, nicht als Bestätigung.

Was die Quelle zusätzlich wert ist: die empirischen Notizen ihres Autors. Er
akzeptiert `STAFFELERGEBNIS` und `STERGEBNIS` als Synonyme, „wie sie in freier
Wildbahn auftauchen" — er hat also Dateien gesehen, die vom Spec-Namen
abweichen. Solche Beobachtungen stehen in keiner Spezifikation.

## Widersprüche in der Spezifikation, die dieser Plan entscheidet

**1. `LASTSCHRIFT` ist in der Vereinsmeldeliste kein Element.** Das
Änderungsverzeichnis (dsv8.md:118) kündigt „Element LASTSCHRIFT in
Vereinsmeldeliste" an. Kapitel 5.2 kennt aber kein solches Element — nur ein
**Attribut** `Lastschrift` am Ende von `VEREIN` (dsv8.md:1863), und die
Beispielzeile bestätigt das mit fünf Feldern. Der Änderungsverzeichnis-Eintrag
ist vermutlich aus der Zeile für die Wettkampfdefinitionsliste kopiert, wo das
Element tatsächlich existiert. **Wir folgen Kapitel 5.2 und dem Beispiel.**

**2. Die Wettkampfart der Vereinsmeldeliste ist unvollständig dokumentiert.**
Die Wertetabelle (dsv8.md:1729) nennt nur `V` und `E`. Die Beispielzeile
derselben Spec verwendet aber `F` (dsv8.md:2608), und das Feld
`Qualifikationswettkampfart` desselben Elements kennt `V/Z/F/E`. Die Aufzählung
ist damit nachweislich unvollständig. **Wir nehmen `V/Z/F/E` auf und
dokumentieren die Abweichung von der Wertetabelle.**

**3. Der Elementname der Staffelergebnisse unterscheidet sich je Listenart.**
In der Vereinsergebnisliste heisst er `STAFFELERGEBNIS` (dsv8.md:3944), in der
Wettkampfergebnisliste `STERGEBNIS`. Innerhalb der Vereinsergebnisliste
verweist `STABLOESE` allerdings auf „STERGEBNIS" (dsv8.md:4175) — ein
Copy-Paste-Rest. Gemeint ist `STAFFEL`. **Wir folgen den Elementnamen der
jeweiligen Kapitel** und tolerieren `STERGEBNIS` in der Vereinsergebnisliste
nicht auf Vorrat, solange kein Beleg vorliegt.

**4. Drei Elemente haben keine Beispielzeile:** `HANDICAP` (7 Attribute),
`PNREAKTION` (5) und `STABLOESE` (6) in der Vereinsergebnisliste. Ihre
Attributzahl beruht allein auf der rekonstruierten Spaltenzuordnung und ist
nicht gegenprüfbar. Das gehört als Unsicherheit in den Code, nicht
stillschweigend als gesichert.

**5. `SB10` fehlt** in der Aufzählung der Brust-Startklassen (dsv8.md:2339),
während `S10` und `SM10` bei den anderen beiden Startklassen vorhanden sind.
Nach der in M2 getroffenen Regel: akzeptieren, mit `info`-Diagnostic.

## Elementübersicht

**Vereinsmeldeliste** (17 Elemente): `FORMAT` 2, `ERZEUGER` 3, `VERANSTALTUNG`
4, `ABSCHNITT` 4, `WETTKAMPF` 10, `VEREIN` 4/**5 ab DSV8**, `ANSPRECHPARTNER`
8, `KARIMELDUNG` 3/**4 ab DSV8**, `KARIABSCHNITT` 3, `TRAINER` 2/**3 ab DSV8**,
`PNMELDUNG` 10, `HANDICAP` 7, `STARTPN` 3, `STMELDUNG` 6, `STARTST` 3,
`STAFFELPERSON` **4**, `DATEIENDE` 0.

**Vereinsergebnisliste** (20 Elemente): `FORMAT` 2, `ERZEUGER` 3,
`VERANSTALTUNG` 4, `VERANSTALTER` 1, `AUSRICHTER` 9, `ABSCHNITT` 4,
`KAMPFGERICHT` 4, `WETTKAMPF` 11, `WERTUNG` 8, `VEREIN` **1×** 4, `PERSON` 9,
`PERSONENERGEBNIS` 9, `PNZWISCHENZEIT` 5, `PNREAKTION` 5, `STAFFEL` 5,
`STAFFELPERSON` **12**, `STAFFELERGEBNIS` 10, `STZWISCHENZEIT` 6, `STABLOESE`
6, `DATEIENDE` 0.

`STAFFELPERSON` hat in den beiden Listenarten **4 bzw. 12 Attribute** mit
völlig verschiedener Bedeutung. Gleicher Name, zwei grundverschiedene Elemente
— die häufigste Verwechslungsgefahr dieses Meilensteins.

## Abnahmekriterien

Weil die Realdaten fehlen, treten zwei Ersatzkriterien an ihre Stelle:

1. **Abdeckung**: Jedes Schemafeld beider Listenarten kommt in mindestens einer
   synthetischen Fixture mit gesetztem **und** mit leerem Wert vor.
2. **Widerspruchsprüfung**: Jede Abweichung zwischen unserem Schema und dem
   Ruby-Schema ist einzeln im Original nachgeschlagen und mit Zeilenangabe
   aufgelöst — nicht bloss zur Kenntnis genommen. Übereinstimmung zählt
   ausdrücklich **nicht** als Bestätigung.

## Aufgaben

1. Elementdefinitionen Vereinsmeldeliste
2. Elementdefinitionen Vereinsergebnisliste
3. Synthetische Fixtures beider Listenarten samt Abdeckungsnachweis
4. Typisiertes Lesen und Schreiben — beide nutzen die vorhandenen
   listenartunabhängigen Bausteine
5. Objektgraph der Vereinsergebnisliste (normalisiert, mit `PERSON`-Element —
   anders als die Wettkampfergebnisliste)
6. Objektgraph der Vereinsmeldeliste
7. Widerspruchsprüfung gegen den Ruby-Parser, Ergebnis dokumentiert
8. Test-Review-Zyklus mit Mutationsdurchlauf
9. Release 0.4.0
