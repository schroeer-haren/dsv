# Weg zu v1.0 — Design

Umsetzungsplan für `@schroeer-haren/dsv` von der jetzigen Attrappe bis zur
stabilen 1.0.

Die technische Architektur steht in [`docs/architecture.md`](../../architecture.md)
und wird hier vorausgesetzt, nicht wiederholt. Dieses Dokument legt fest, in
welcher Reihenfolge sie entsteht und wie geprüft wird, dass sie stimmt.

Aufwandsschätzungen enthält dieses Dokument bewusst nicht — sie entstehen mit
dem Umsetzungsplan, wenn die Aufgaben geschnitten sind.

## Ziel

v1.0 kann:

- alle vier Listenarten **lesen und schreiben**, in DSV7 und DSV8
- typisierte Records mit Schema-Validierung und Diagnostics
- byte-genauen Round-Trip
- einen **lesenden** High-Level-Objektgraph mit aufgelösten Referenzen

Nicht in v1.0:

- **High-Level-Schreibpfad** — Schreiben ist über die Record-Ebene bereits
  vollständig möglich; ein zweites Mutationsmodell verdoppelte den
  Wartungsaufwand ohne neuen Nutzen.
- **DSV7↔DSV8-Konvertierung** und **Dateinamen-Helfer** — beide sind laut
  `architecture.md` gewollt und günstig zu bauen, setzen aber vollständige
  Schemata beider Formatversionen voraus. Sie kommen nach 1.0, weil sie den
  Weg dorthin nicht verkürzen und die API-Oberfläche vergrößern, die mit 1.0
  eingefroren wird.
- **`.DSV8z` (ZIP)** — bräuchte eine Dependency; gehört hinter einen
  Node-Subpath.
- **Meldegeldberechnung** — Fachlogik, kein Parsen.
- **DSV6 als unterstützte Formatversion** — siehe Abnahmekriterien: DSV6-Dateien
  müssen ab M2 sauber mit `fatal`-Diagnostic abgelehnt werden, nicht verarbeitet.

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

### M0 — Typ-Spike (kein Release)

`ABSCHNITT` in beiden Varianten (6 und 4 Attribute) mit einem `since: 8`-Feld
durch die volle Kette; `dist/` bauen; erzeugte `.d.ts` und Hover-Typ ansehen.

**Abbruchkriterium.** Codegen gilt als bestätigt, wenn der Hover-Typ den Namen
`Abschnitt` zeigt und die `.d.ts` das Schema-Literal **nicht** enthält. Trifft
eines davon nicht zu, greift der Rückfallpfad: **Typen von Hand**, abgesichert
durch einen `.d.ts`-Snapshot-Test plus einen Test, der Schema und Typ
gegeneinander prüft, als Drift-Wächter. M2 verlängert sich dann entsprechend.
Ein dritter Weg wird nicht verfolgt — reine Typinferenz ist in
`architecture.md` mit Begründung verworfen.

Abgeschlossen ist M0 mit der dokumentierten Entscheidung, nicht mit einem
Release.

### M1 — Fundament (0.1.0)

`diagnostics`, `source`, `lexer`, `values`, dazu ein **schema-freier**
Record-Parser und Writer.

Der Writer spielt in M1 ausschließlich den pro Feld mitgeführten Rohtext
zurück. Default-Auffüllung, kanonische Formatierung und Attributzahl-Prüfung
sind Schema-Verhalten und beginnen mit M2.

Weil der Parser schema- und versionsfrei arbeitet, gilt der Round-Trip hier für
**alle 108 Fixtures**, einschließlich der fünf DSV6-Dateien — die Zeilensyntax
ist über alle Formatversionen identisch.

M1 ist bereits nutzbar: ein generischer Record-Parser liest alle vier
Listenarten, nur eben ohne Typen und Validierung.

Mit M1 entfallen die Platzhalter-Exporte `parseLine`, `formatLine` und
`DSV_FORMATS`. In `0.x` ist das folgenlos; dauerhaft wären sie tote Fläche in
der öffentlichen API.

### M2 — Wettkampfdefinitionsliste (0.2.0)

Schema, generierte Typen, Validierung, Writer, **plus High-Level-Projektion**.
Der vertikale Durchstich.

Die Schemata tragen die `since: 8`-Markierungen **ab hier**, nicht erst ab M5 —
sonst müssten vier fertige Schemata nachträglich aufgebohrt werden.

Ab M2 werden DSV6-Dateien beim typisierten Lesen mit `fatal`-Diagnostic
abgelehnt.

### M3 — Wettkampfergebnisliste (0.3.0)

Schema, generierte Typen, Validierung, Writer, High-Level-Projektion — derselbe
Lieferumfang wie M2, für die größte Listenart mit den meisten Realdaten.

Hier fällt außerdem eine offene Entscheidung aus `architecture.md`: ob eine
synthetische `Schwimmer`-Aggregation aus n `PNERGEBNIS`-Zeilen angeboten wird.
Die Wettkampfergebnisliste hat kein `PERSON`-Element; eine solche Aggregation
kann widersprüchliche Duplikate enthalten. Die Entscheidung wird in M3
getroffen und im Architekturdokument festgehalten.

### M4 — Vereinsmelde- und Vereinsergebnisliste (0.4.0)

Derselbe Lieferumfang, für beide Listenarten. Ohne Realdaten, deshalb mit
synthetischen Fixtures und Abgleich gegen `vml_schema.rb` und `vrl_schema.rb`
des Ruby-Parsers.

### M5 — DSV8 durchgängig (0.5.0)

`LASTSCHRIFT`, neue Enums (`KB`/`KR`, zwei Meldegeldtypen, `D` in weiteren
Geschlechts-Enums), geänderte `MELDEGELDPAUSCHALE`-Semantik, Pflichtfeld
`Kontoinhaber` beim Schreiben.

Kein Nachrüsten, sondern der Durchgang, der DSV8 end-to-end verifiziert.

### M6 — Release-Kandidat (0.9.0)

- **API-Freeze-Review**: jede öffentlich exportierte Funktion und jeder Typ
  einmal bewusst bestätigt; alles Übrige wird interne Fläche.
- **`publint` + `@arethetypeswrong/cli`** im `check`-Skript — binär prüfbar.
- **Robustheitsdurchgang**: je ein Test für abgeschnittene Zeile, falsche
  Feldanzahl, leere Datei, BOM, gemischte Zeilenenden, sehr lange Zeile.
  Kriterium: kein Wurf außer bei Severity `fatal`.
- **Benchmark**: synthetische 50-MB-Datei. Kriterium ist ausschließlich, dass
  der Wert dokumentiert wird — kein Schwellwert, weil es keinen Vergleichswert
  gibt.
- **Dokumentation**: README mit Beispielen je Listenart.

### M7 — Freigabe (1.0.0)

## Testvorgehen

**Strikt testgetrieben**: erst der fehlschlagende Test, dann die
Implementierung. Bei einem Parser besonders wirksam, weil jedes Verhalten an
einem konkreten Eingabe-/Ausgabepaar festgemacht wird.

Ergänzend, wie in `architecture.md` festgelegt: Property-Tests mit `fast-check`
über schemagenerierte Records, Round-Trip über die Fixtures, Typ-Tests mit
`expectTypeOf`, `.d.ts`-Snapshot.

## Test-Review-Zyklus

Läuft am Ende jedes Meilensteins, vor dem Release.

Der Anlass: Ein grüner Test beweist nur, dass Implementierung und Test dieselbe
Annahme teilen. Wird eine Attributposition aus der Spec falsch gelesen, entsteht
ein falscher Test und eine dazu passende Implementierung — beides grün, beides
falsch.

### Wer prüft

Stufen 1 bis 3 laufen als **je ein Subagent** mit Zugriff ausschließlich auf
`test/`, `spec/*.md` und `docs/architecture.md` — **nicht** auf `src/`. Stufe 4
läuft als drei unabhängige Subagenten je Fund.

### Stufen

1. **Spec-Konformität.** Stimmen Attributpositionen, Pflichtfelder, Enum-Werte,
   Kardinalitäten mit der Spezifikation überein? Der Ausschluss der
   Implementierung ist der Kern: Wer den Code sieht, liest den Test als dessen
   Bestätigung.
2. **Realdaten-Abdeckung.** Sind die Eigenheiten der echten Dateien geprüft —
   Kommentare am Zeilenende, Leerzeichen nach dem Doppelpunkt, CRLF und LF,
   Groß-/Kleinschreibung der Listart, Anführungszeichen in Werten?
3. **Lückensuche.** Umgekehrte Fragestellung: Welche _kaputte_ Implementierung
   bestünde die Tests trotzdem? Das findet tautologische Tests zuverlässiger als
   das Durchlesen vorhandener.
4. **Falsch-positiv-Filter.** Jeder Fund geht an drei unabhängige Prüfer mit dem
   Auftrag, ihn zu **widerlegen**, mit Beleg aus Spec oder Fixture. Ein Fund
   gilt als bestätigt, wenn ihn **mindestens zwei von drei** nicht widerlegen
   können. Ohne diesen Schritt entstehen plausibel klingende Beanstandungen, die
   bei Nachprüfung zerfallen und mehr Zeit kosten, als sie sparen.

### Abbruchbedingung

Geschleift wird, bis keine **kritischen** und keine **wichtigen** Funde mehr
übrig sind.

| Schweregrad | Bedeutung                                                                               | blockiert          |
| ----------- | --------------------------------------------------------------------------------------- | ------------------ |
| kritisch    | Test widerspricht der Spec, oder Verhalten ist ungeprüft, das Testdateien auslösen      | ja                 |
| wichtig     | Randfall der Spec ungeprüft, oder ein Test ließe eine fehlerhafte Implementierung durch | ja                 |
| kosmetisch  | Benennung, Struktur, Redundanz                                                          | nein, wird notiert |

Reichen drei Runden nicht, wird an den Menschen eskaliert statt weiter
geschliffen — dann stimmt meist etwas an der Sache selbst nicht, nicht an den
Tests.

_Verworfen: Mutationstests (Stryker)._ Automatisierte Stufe 3, aber bei über
hundert Fixtures mit sehr langen Laufzeiten, und findet vor allem mechanische
Lücken. Die inhaltliche Frage „steht das so in der Spec?" beantwortet es nicht.
Falls gewünscht, wäre M6 der Zeitpunkt.

## Abnahmekriterien

### Je Meilenstein (M1–M6)

1. `npm run check` grün (Lint, Typecheck, Tests)
2. Round-Trip-Kriterium des Meilensteins erfüllt (siehe unten)
3. Test-Review-Zyklus ohne kritische und wichtige Funde durchlaufen
4. CHANGELOG-Eintrag und GitHub-Release mit Tag `vX.Y.Z`, das den
   Release-Workflow auslöst

M0 ist mit der dokumentierten Codegen-Entscheidung abgeschlossen; die Punkte 2
und 4 gelten dort nicht.

### Round-Trip je Meilenstein

| Meilenstein | Kriterium                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| M1          | `parse → write` byte-identisch über **alle 108 Fixtures** inkl. der 5 DSV6-Dateien (schema-freier Parser, versionsunabhängig) |
| M2, M3      | byte-identisch über alle Fixtures **der jeweiligen Listenart in DSV7**; DSV6 wird mit `fatal` abgelehnt                       |
| M4, M5      | byte-identisch über die **synthetischen** Fixtures, zusätzlich Abdeckungsnachweis (siehe unten)                               |

### Ersatzkriterium für M4 und M5

Für diese Meilensteine gibt es keine Realdaten, deshalb greifen dort zwei
Kriterien, die entscheidbar sind:

1. **Abdeckung**: Jedes Schemafeld jeder betroffenen Listenart kommt in
   mindestens einer synthetischen Fixture mit gesetztem **und** mit leerem Wert
   vor.
2. **Cross-Check**: Keine Abweichung gegenüber `vml_schema.rb` /
   `vrl_schema.rb` in Attributzahl, Attributreihenfolge, Pflichtfeldern oder
   Kardinalität — es sei denn, die Abweichung ist mit einer Zeilenangabe aus
   der Spec belegt aufgelöst und im Architekturdokument vermerkt.

Für M4/M5 ersetzen diese beiden Punkte die zweite Hälfte des kritischen
Schweregrads („Verhalten ungeprüft, das echte Dateien auslösen"), die dort
mangels Realdaten ins Leere liefe.

## Risiken

| Risiko                                                                                                           | Gegenmittel                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zwei Listenarten ohne Realdaten** (M4). Kein echtes Gegenbeispiel kann widersprechen — die riskanteste Stelle. | Ersatzkriterium oben: Abdeckungsnachweis plus Cross-Check gegen den Ruby-Parser. Echte Meldedatei einspielen, falls beschaffbar.              |
| **DSV8 ohne jede Realdatei** (M5).                                                                               | DSV8 ist rein additiv: keine Feldverschiebung, keine Entfernung, nichts umgedeutet außer `MELDEGELDPAUSCHALE`. Ab Herbst 2026 gegenprüfen.    |
| **Codegen-Entscheidung falsch.**                                                                                 | M0 prüft sie an einer echten `.d.ts` mit objektivem Abbruchkriterium, bevor 80 Elementdefinitionen darauf aufbauen; Rückfallpfad ist benannt. |
| **Byte-genauer Round-Trip nicht erreichbar.**                                                                    | Abnahmebedingung von M1. Steht es dort nicht, steht es später gar nicht — die Records müssen den Rohtext von Anfang an mitführen.             |

Nicht eingeplant: **Performance**. Die größte Fixture hat rund 14.000 Zeilen,
für einen zeilenweisen Parser unkritisch. Benchmark in M6, aber vorher wird
nichts darauf hin gebaut.
