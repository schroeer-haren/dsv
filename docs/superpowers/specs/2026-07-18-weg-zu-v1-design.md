# Weg zu v1.0 — Design

Umsetzungsplan für `@schroeer-haren/dsv` von der jetzigen Attrappe bis zur
stabilen 1.0.

Die technische Architektur steht in [`docs/architecture.md`](../../architecture.md)
und wird hier vorausgesetzt, nicht wiederholt. Dieses Dokument legt fest, in
welcher Reihenfolge sie entsteht und wie geprüft wird, dass sie stimmt.

## Ziel

v1.0 kann:

- alle vier Listenarten **lesen und schreiben**, in DSV7 und DSV8
- typisierte Records mit Schema-Validierung und Diagnostics
- byte-genauen Round-Trip
- einen **lesenden** High-Level-Objektgraph mit aufgelösten Referenzen

Nicht in v1.0: High-Level-Schreibpfad, DSV7↔DSV8-Konvertierung,
Dateinamen-Helfer, `.DSV8z` (ZIP), Meldegeldberechnung, DSV6.

Ausgeschlossen ist der High-Level-Schreibpfad nicht aus Zeitgründen, sondern
weil Schreiben über die Record-Ebene bereits vollständig möglich ist; ein
zweites Mutationsmodell verdoppelte den Wartungsaufwand ohne neuen Nutzen.

## Vorgehen: hybrid

Fundament horizontal, danach Listenart für Listenart vertikal.

Die domänenfreie Basis (`diagnostics`, `source`, `lexer`, `values`) ist
listenunabhängig und entsteht einmal für alle. Danach durchläuft jede Listenart
die volle Kette Schema → Typen → Parser → Writer → Round-Trip.

Begründung: Nach der ersten Listenart hat die Architektur einmal alle Schichten
durchlaufen. Fehlt den Records etwas zur Projizierbarkeit oder sind die
generierten Typen unhandlich, ist ein Schema zu ändern statt vier.

_Verworfen: streng horizontal_ (alle Schemata, dann alle Parser, dann alle
Writer). Bündelt gleichartige Arbeit, aber ein Konstruktionsfehler in der
Schema-Repräsentation zeigt sich erst, wenn 80 Elementdefinitionen darauf
aufbauen.

_Verworfen: streng vertikal_ (sofort eine Listenart komplett, ohne gemeinsames
Fundament). Schnell sichtbar, aber Lexer und Werttypen entstehen im Windschatten
einer Listenart und müssen später herausgelöst werden.

## Meilensteine

|        | Inhalt                                                                                                                                                                 | Release |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **M0** | Typ-Spike: `ABSCHNITT` in beiden Varianten mit `since: 8` durch die volle Kette; erzeugte `.d.ts` und Hover-Typ prüfen; Codegen-Entscheidung bestätigen oder verwerfen | —       |
| **M1** | Fundament: `diagnostics`, `source`, `lexer`, `values` + generischer Record-Parser und Writer; byte-genauer Round-Trip über alle 108 Fixtures                           | 0.1.0   |
| **M2** | Wettkampfdefinitionsliste vollständig: Schema, generierte Typen, Validierung, Writer, **plus High-Level-Projektion** — der vertikale Durchstich                        | 0.2.0   |
| **M3** | Wettkampfergebnisliste — größte Listenart, meiste Realdaten                                                                                                            | 0.3.0   |
| **M4** | Vereinsmelde- und Vereinsergebnisliste — ohne Realdaten, mit synthetischen Fixtures und Ruby-Cross-Check                                                               | 0.4.0   |
| **M5** | DSV8 durchgängig: `LASTSCHRIFT`, neue Enums, geänderte `MELDEGELDPAUSCHALE`-Semantik, Pflichtfeld `Kontoinhaber`                                                       | 0.5.0   |
| **M6** | Release-Kandidat: API-Freeze-Review, `publint` + `@arethetypeswrong/cli`, Robustheitsdurchgang, Benchmark, Dokumentation                                               | 0.9.0   |
| **M7** | Freigabe                                                                                                                                                               | 1.0.0   |

Zwei Festlegungen, die nicht aus der Tabelle hervorgehen:

- Die Schemata tragen die `since: 8`-Markierungen **ab M2**, nicht erst ab M5.
  Sonst müssten vier fertige Schemata nachträglich aufgebohrt werden. M5 ist
  kein Nachrüsten, sondern der Durchgang, der DSV8 end-to-end verifiziert.
- **M1 ist bereits nutzbar**: Ein generischer Record-Parser liest alle vier
  Listenarten, weil die Zeilensyntax einheitlich ist — ohne Typen und
  Validierung.

Die Platzhalter-Exporte `parseLine`, `formatLine` und `DSV_FORMATS` entfallen
mit M1. In `0.x` ist das folgenlos; dauerhaft wären sie tote Fläche in der
öffentlichen API.

## Testvorgehen

**Strikt testgetrieben**: erst der fehlschlagende Test, dann die
Implementierung. Bei einem Parser besonders wirksam, weil jedes Verhalten an
einem konkreten Eingabe-/Ausgabepaar festgemacht wird.

Ergänzend, wie in `docs/architecture.md` festgelegt: Property-Tests mit
`fast-check` über schemagenerierte Records, Round-Trip über alle Fixtures,
Typ-Tests mit `expectTypeOf`, `.d.ts`-Snapshot.

## Test-Review-Zyklus

Läuft am Ende jedes Meilensteins, vor dem Release.

Der Anlass: Ein grüner Test beweist nur, dass Implementierung und Test dieselbe
Annahme teilen. Wird eine Attributposition aus der Spec falsch gelesen, entsteht
ein falscher Test und eine dazu passende Implementierung — beides grün, beides
falsch.

### Stufen

1. **Spec-Konformität.** Reviewer erhalten Tests und Spezifikation, **nicht die
   Implementierung**. Stimmen Attributpositionen, Pflichtfelder, Enum-Werte,
   Kardinalitäten? Der Ausschluss der Implementierung ist der Kern: Wer den Code
   sieht, liest den Test als dessen Bestätigung.
2. **Realdaten-Abdeckung.** Sind die Eigenheiten der 108 echten Dateien geprüft
   — Kommentare am Zeilenende, Leerzeichen nach dem Doppelpunkt, CRLF und LF,
   Groß-/Kleinschreibung der Listart, Anführungszeichen in Werten?
3. **Lückensuche.** Umgekehrte Fragestellung: Welche _kaputte_ Implementierung
   bestünde die Tests trotzdem? Das findet tautologische Tests zuverlässiger als
   das Durchlesen vorhandener.
4. **Falsch-positiv-Filter.** Jeder Fund geht an mehrere unabhängige Prüfer mit
   dem Auftrag, ihn zu **widerlegen**, mit Beleg aus Spec oder Fixture. Nur was
   die Mehrheit nicht widerlegen kann, zählt. Ohne diesen Schritt entstehen
   plausibel klingende Beanstandungen, die bei Nachprüfung zerfallen und mehr
   Zeit kosten, als sie sparen.

### Abbruchbedingung

Geschleift wird, bis keine **kritischen** und keine **wichtigen** Funde mehr
übrig sind.

| Schweregrad | Bedeutung                                                                               | blockiert          |
| ----------- | --------------------------------------------------------------------------------------- | ------------------ |
| kritisch    | Test widerspricht der Spec, oder Verhalten ist ungeprüft, das echte Dateien auslösen    | ja                 |
| wichtig     | Randfall der Spec ungeprüft, oder ein Test ließe eine fehlerhafte Implementierung durch | ja                 |
| kosmetisch  | Benennung, Struktur, Redundanz                                                          | nein, wird notiert |

Reichen drei Runden nicht, wird an den Menschen eskaliert statt weiter
geschliffen — dann stimmt meist etwas an der Sache selbst nicht, nicht an den
Tests.

_Verworfen: Mutationstests (Stryker)._ Automatisierte Stufe 3, aber bei 108
Fixtures mit sehr langen Laufzeiten, und findet vor allem mechanische Lücken.
Die inhaltliche Frage „steht das so in der Spec?" beantwortet es nicht. Falls
gewünscht, wäre M6 der Zeitpunkt.

## Risiken

| Risiko                                                                                                                     | Gegenmittel                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Zwei Listenarten ohne Realdaten** (M4). Kein echtes Gegenbeispiel kann widersprechen — die riskanteste Stelle des Plans. | Abgleich gegen `vml_schema.rb`/`vrl_schema.rb` des Ruby-Parsers als unabhängige zweite Lesart; bei der Vereinsmeldeliste bereits vollständig deckungsgleich. Echte Meldedatei einspielen, falls beschaffbar. |
| **DSV8 ohne jede Realdatei** (M5).                                                                                         | DSV8 ist rein additiv: keine Feldverschiebung, keine Entfernung, nichts umgedeutet außer `MELDEGELDPAUSCHALE`. Ab Herbst 2026 gegenprüfen.                                                                   |
| **Codegen-Entscheidung falsch.**                                                                                           | M0 prüft sie an einer echten `.d.ts`, bevor 80 Elementdefinitionen darauf aufbauen.                                                                                                                          |
| **Byte-genauer Round-Trip nicht erreichbar.**                                                                              | Abnahmebedingung von M1: alle 108 Fixtures müssen `parse → write` byte-identisch überstehen. Steht es in M1 nicht, steht es später gar nicht.                                                                |

Nicht eingeplant: **Performance**. Die größte Fixture hat rund 14.000 Zeilen,
für einen zeilenweisen Parser unkritisch. Benchmark in M6, aber vorher wird
nichts darauf hin gebaut.

## Definition of Done je Meilenstein

1. `npm run check` grün (Lint, Typecheck, Tests)
2. Round-Trip über alle Fixtures byte-identisch
3. Test-Review-Zyklus ohne kritische und wichtige Funde durchlaufen
4. CHANGELOG-Eintrag und GitHub-Release mit Tag `vX.Y.Z`, das den
   Release-Workflow auslöst
