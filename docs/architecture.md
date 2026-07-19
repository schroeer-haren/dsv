# Architektur

Wie `@schroeer-haren/dsv` aufgebaut ist — **Ist-Stand zu 1.0**, nicht Entwurf.

Jede Aussage in diesem Dokument ist gegen `src/` geprüft. Wo der Code etwas
nicht tut, steht es hier nicht, auch wenn es einmal geplant war; was einmal
geplant war und verworfen wurde, steht in
[`history/`](history/README.md). Diese Trennung ist kein Formalismus: In
diesem Projekt hat ein Architekturdokument, das eine Datenstruktur versprach,
die der Code nur als Platzhalter auslieferte, genau dazu geführt, dass die
Platzhalter niemandem auffielen — siehe „Diagnostics" weiter unten.

Zeilenangaben `dsv8.md:NNN` beziehen sich auf die Markdown-Fassung der
Spezifikation in `spec/` (gitignored, siehe CLAUDE.md).

## Zielsetzung

Vollständige Formatabdeckung: **alle vier Listenarten, lesen und schreiben,
DSV7 und DSV8.** Es gibt keinen priorisierten Treiber-Anwendungsfall —
Anzeigen, Melden und Konvertieren sind gleichrangig.

Das prägt den Rest: Weil kein Anwendungsfall priorisiert ist, kann keiner die
Architektur retten, wenn sie für einen anderen falsch ist. Rund 20 Elemente ×
4 Listenarten × 2 Versionen, jeweils lesen, schreiben und validieren, ergeben
von Hand einige hundert Codepfade. Der Schema-Ansatz ist deshalb die Bedingung
dafür, dass der volle Umfang überhaupt erreichbar ist.

## Ausgangslage aus der Spezifikation

1. **Zeilenorientiert, kein Escaping.** Ein Element pro Zeile, Attribute mit
   `;` terminiert (auch das letzte). Der Datentyp ZK verbietet Semikolon und
   Zeilenumbruch im Wert — es gibt nichts zu escapen und nichts zu quoten.
2. **Zwei Zeilenformen.** `ELEMENT:attr1;attr2;…;` **und** attributlose
   Elemente ohne Doppelpunkt. Betroffen ist genau `DATEIENDE`
   (dsv8.md:1427–1435). Ein Lexer, der stumpf am ersten `:` trennt, zerbricht
   daran; ein Serializer ohne `bare`-Kennzeichen schreibt `DATEIENDE:` und
   bricht den Round-Trip. `ElementDef.bare` und `DsvRecord.bare` bilden das ab.
3. **Kein impliziter Kontext-Zustand.** Es gibt kein „gilt bis zum nächsten
   Element"-Konstrukt; alle Bezüge laufen über explizite ID-Attribute in jeder
   Zeile. Ein zustandsloser Zeilen-Parser genügt.
4. **Referenzschlüssel sind je (Listenart, Element) verschieden und nicht
   durchweg eindeutig.** In der Vereinsmeldeliste referenzieren `STARTPN`,
   `STARTST` und `STAFFELPERSON` den Wettkampf nur über die Wettkampfnummer,
   ohne Wettkampfart (dsv8.md:2366, 2484, 2518), während `WETTKAMPF` über
   (Nr, Art) identifiziert ist. In den Ergebnislisten führt `PNZWISCHENZEIT`
   keine `WertungsID`, `PNERGEBNIS` gibt aber pro Wertung eine eigene Zeile aus
   (dsv8.md:5019) — die Beziehung ist 1:n.
5. **Element-Identität ist listenabhängig.** `ABSCHNITT` hat 6 Attribute in der
   Wettkampfdefinitionsliste und 4 sonst; `WETTKAMPF` 11 gegenüber 10 in der
   Vereinsmeldeliste (dsv8.md:1476 vs. 2600); `VEREIN` 5 gegenüber 4;
   `STAFFELPERSON` 4 in der Vereinsmeldeliste gegenüber 12 in den
   Ergebnislisten. Auch Kardinalitäten variieren: `VEREIN` ist Vorkommen 1 in
   der Vereinsergebnisliste (dsv8.md:3303), aber 1..N in der
   Wettkampfergebnisliste (dsv8.md:4954).
6. **Die beiden Ergebnislisten sind strukturell verschieden.** Die
   Vereinsergebnisliste ist normalisiert (`VEREIN` → `PERSON` →
   `PERSONENERGEBNIS`) bei genau einem Verein. Die Wettkampfergebnisliste hat
   **kein `PERSON`-Element**; `PNERGEBNIS` ist ein denormalisierter Flachsatz
   mit Name, DSV-ID, Verein und Endzeit in derselben Zeile (dsv8.md:5890).
7. **DSV7 → DSV8 ist rein additiv.** Keine Entfernung, keine Feldverschiebung.
   Deshalb trägt die Versionsabhängigkeit im Schema als schlichtes
   `since: 8` an Elementen, Feldern und einzelnen Aufzählungswerten.
8. **Führende und abschließende Leerzeichen in Attributen sind zulässig**
   (dsv8.md:233) und werden in den Spec-Beispielen aktiv genutzt. Sie sind
   **kein** Fehler und werden nicht „repariert".
9. **Die Spec-Beispiele enthalten Tippfehler** (`WERTUNG:1;V,2;…`,
   `KARIABSCHNITT:2;1;:`). Sie sind keine Formatdefinition — im Unterschied zu
   Punkt 8, wo die Spec die Abweichung ausdrücklich erlaubt.

Punkt 5 ist der Kern: Der Schlüssel einer Elementdefinition ist
`(Listenart, Elementname)`, nicht der Elementname allein.

## Was echte Dateien anders machen

Der committete, anonymisierte Bestand in `test/fixtures/real/` umfasst **142
Dateien**: 75 Wettkampfergebnislisten, 34 Vereinsmeldelisten, 33
Wettkampfdefinitionslisten; 137× DSV7, 5× DSV6, **0× DSV8**. Erzeuger sind
EasyWk, WebClub, SPLASH Meet Manager, cps-schwimm und Schwimmsoftware.

Jeder der folgenden Punkte ist ein Parser-Fehler in spe:

1. **`FORMAT:` steht selten in Zeile 1.** Davor stehen ein oder mehrere
   Erzeuger-Kommentare (`(* erzeugt mit EasyWk … *)`). Die Spec-Regel „FORMAT
   muss erstes Element sein" meint das erste **Element** — Kommentarzeilen
   zählen nicht mit. Eine Prüfung auf Zeile 1 scheitert an fast jeder echten
   Datei.
2. **Leerzeichen nach dem Doppelpunkt sind die Mehrheit**
   (`FORMAT: Wettkampfergebnisliste;7;`). EasyWk und WebClub setzen es
   ausnahmslos, SPLASH, cps-schwimm und Schwimmsoftware ausnahmslos nicht — es
   ist eine Eigenschaft des Erzeugers, nicht der Datei.
3. **Groß-/Kleinschreibung der Listenart variiert**
   (`FORMAT:WETTKAMPFERGEBNISLISTE`). Der Vergleich ist deshalb durchweg
   case-insensitiv; `DsvDocument.listenart` führt bewusst den **Rohwert**.
4. **Zeilenenden gemischt**, überwiegend CRLF, vereinzelt LF. Beides muss
   gehen, und beides muss beim Zurückschreiben erhalten bleiben — deshalb führt
   jedes Item sein `eol` einzeln mit, nicht das Dokument global.
5. **Encoding durchgängig UTF-8** — kein einziges CP1252 im Bestand. Die
   Warnung bei U+FFFD bleibt trotzdem sinnvoll, ist aber kein Hauptfall.
6. **Das Schluss-Semikolon fehlt regelmäßig.** EasyWk lässt es in rund 40 %
   der Zeilen weg, WebClub nie. `DsvRecord.terminated` hält den Unterschied
   fest; gemeldet wird er als Warnung (73 Zeilen in 3 Dateien).

### Anführungszeichen sind Daten, kein Quoting

Mehrere Dateien enthalten `"` in Werten:

```
VERANSTALTUNG: Potsdamer Pokalmeeting "Alter Fritz 2026";Potsdam;50;AUTOMATISCH;
VERANSTALTUNG:"Letzte Chance";Dresden;50;HANDZEIT;
```

Das sind Eigennamen mit Anführungszeichen, keine Quoting-Syntax. Der Wettkampf
heißt „Letzte Chance". **Es wird nie dequotet.** ZK erlaubt alle Zeichen außer
`;` und CRLF (dsv8.md:251); `"` ist ein gewöhnliches Zeichen. Ein Dequoting
würde im ersten Fall nichts finden und im zweiten den Namen beschädigen.

### Zwei Lücken im Testbestand, die benannt gehören

**Für die Vereinsergebnisliste gibt es keine einzige echte Datei.** Sie geht
direkt an den Ausrichter und wird nie veröffentlicht; das ist strukturell, nicht
Suchpech. Diese Listenart ruht damit **allein auf der Spezifikation** und auf
synthetischen Fixtures. Sie ist genauso vollständig implementiert wie die
anderen drei, aber sie ist die einzige, bei der kein echter Erzeuger je
widersprochen hat. Wer sie produktiv einsetzt, sollte das wissen.

**DSV8 existiert in freier Wildbahn noch nicht.** Der gesamte echte Bestand ist
DSV7 oder DSV6. Die DSV8-Unterstützung ist deshalb gegen das zeilenweise
erhobene Delta beider Spezifikationen und gegen synthetische Fixtures
abgesichert, nicht gegen Realdaten.

> **Zum Vergleich mit fremden Implementierungen.** Für die Vereinsergebnisliste
> wurde der Element-Katalog gegen
> [bigcurl/dsv7-parser](https://github.com/bigcurl/dsv7-parser) (Ruby)
> abgeglichen. Dieser Abgleich ist **kein Beleg für Richtigkeit** und wurde
> früher fälschlich als „unabhängige zweite Lesart der Spezifikation"
> geführt. Jenes Projekt transkribiert dieselbe Spec, aus der auch dieses
> Schema stammt; Übereinstimmung zeigt allenfalls, dass beide dieselbe Tabelle
> gleich abgeschrieben haben. Einen gemeinsamen Lesefehler deckt sie
> grundsätzlich nicht auf. Die Aussagekraft haben allein Realdaten — und für
> die Vereinsergebnisliste gibt es keine.

## Leitentscheidung: schema-getrieben, Typen generiert

Eine **deklarative Schema-Tabelle als einzige Quelle der Wahrheit.** Parser,
Validierung und Writer lesen sie zur Laufzeit; die öffentlichen TypeScript-Typen
entstehen daraus per Skript als eingecheckte `src/schema/generated.ts`, mit
`npm run generate:check` (`git diff --exit-code`) in CI als Drift-Wächter.

```ts
const ABSCHNITT_WKDEF = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', { required: true, doc: '…', specRef: 'dsv8.md:…' }),
  field('relativeAngabe', 'JN', { default: 'N', doc: '…', specRef: 'dsv8.md:…' }),
]);
```

Die Bausteine stehen in `src/schema/types.ts`: `ElementDef`, `FieldDef`,
`EnumValue`, `NumberRange`. Bemerkenswert an `FieldDef` sind vier Felder, die
über „Feld → Typ" hinausgehen:

- **`since: 8`** — auch an `ElementDef` und an einzelnen `EnumValue`s. Die
  Versionsabhängigkeit ist damit Daten, kein Code, und kein Generic `V extends
7 | 8` muss durch die Schichten propagieren.
- **`default`** — der Unterlassungswert der Spezifikation. Er wird **allein in
  den Objektgraphen** unter `src/document/` eingesetzt, nicht in
  `TypedRecord.values`: Die Records sind die Grundlage des Schreibens, und ein
  dort eingesetzter Wert stünde anschließend ausgeschrieben in der Datei.
- **`tolerated`** an `EnumValue` — ein Wert, den die Spec für diese Listenart
  nicht vorsieht, der real aber vorkommt. Beim Lesen `warning`, beim Schreiben
  gesperrt.
- **`specGap`** an `EnumValue` — ein Wert, den die Spec offensichtlich
  auslässt, statt ihn auszuschließen. Beim Lesen `info`, beim Schreiben
  **erlaubt**. Genau darin unterscheidet er sich von `tolerated`.

_Verworfen: reine Typinferenz über `as const` + Mapped Types._ Technisch
machbar, scheitert aber daran, dass **JSDoc pro Feld mit Mapped Types
strukturell unmöglich** ist — ein aus einem Mapped Type entstandener Key kann
keinen Doc-Kommentar tragen. Genau das ist hier der Hauptertrag: Jedes
generierte Feld trägt seine Bedeutung und seine Fundstelle
(`@see dsv8.md:361`) beim Tippen sichtbar.

Was die generierten Typen **sind**: Sie beschreiben die **Rohfelder** einer
Zeile. Felder mit fester Werteliste sind String-Literal-Unions
(`qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E'`), alle übrigen sind
`string`. Sie beschreiben ausdrücklich **keine** dekodierten Werte; dafür gibt
es den Objektgraphen. Unterscheiden sich die Feldlisten zweier Formatversionen
nicht, wird die DSV8-Fassung als Alias statt als Kopie ausgegeben — sonst
entstünden bei rund 80 Elementdefinitionen 160 überwiegend identische
Interfaces.

## Schichten

Zwei Achsen, die nicht verwechselt werden dürfen.

**Datenfluss beim Lesen:**

```
Text → source → lexer → parse (+ schema, values, validate) → document
```

**Tatsächliche Modul-Abhängigkeiten** (Pfeil = „importiert aus"), ausgemessen
über die relativen Imports in `src/`:

```
diagnostics   → (nichts)
source        → (nichts)
lexer         → (nichts)
schema        → (nichts)
values        → diagnostics, write
validate      → diagnostics, values, schema, document
parse         → diagnostics, lexer, source, schema, validate, document
document      → diagnostics, schema, values, source, parse
write         → diagnostics, schema, parse, validate, document
```

Drei Dinge daran sind erklärungsbedürftig und wurden früher falsch
beschrieben:

- **`write` hängt an `parse` und `validate`, nicht nur an `schema`.** Das ist
  Absicht, kein Versehen: `writeTypedList` liest seine eigene Ausgabe mit
  `parseTypedList` zurück und weist sie zurück, wenn dabei ein unzulässiger
  Befund entsteht. Der Writer prüft sich selbst gegen den Parser — deshalb kann
  er ihn nicht meiden.
- **`values` hängt an `write`.** Der einzige Grund ist `DsvWriteError` aus
  `src/write/write-error.ts`, den `requireEncodable` wirft. Die Fehlerklasse
  liegt bei `write`, weil sie dorthin gehört; die Kante ist der Preis dafür.
- **`lexer` hängt nicht an `source`.** Beide sind Blattmodule. `source`
  zerlegt Text in Zeilen (BOM, Zeilenenden), `lexer` zerlegt **eine** Zeile in
  Element, Felder und Kommentar. `parse` fügt sie zusammen. Damit ist jede der
  beiden Zerlegungen für sich testbar.

Ein Zyklus auf Ordnerebene besteht (`parse ↔ document`, `validate → document →
parse → validate`), aber **alle Kanten in Gegenrichtung sind reine
`import type`** und verschwinden beim Übersetzen. `document/types.ts` hält die
schema-freien Datentypen, die alle drei brauchen; die Werte fließen nur in eine
Richtung.

Diese Kanten sind **nicht durch ESLint erzwungen.** Eine frühere Fassung dieses
Dokuments behauptete eine `no-restricted-imports`-Regel; `eslint.config.js`
enthält keine. Wer die Schichtung ändert, muss sie selbst nachhalten.

## Referenzauflösung

Die Auflösung Referenz → Ziel steht **nicht** als Tabelle im Schema, sondern
ausgeschrieben je Listenart in `src/document/<listenart>.ts`. Eine frühere
Fassung dieses Dokuments kündigte die Tabelle an; gebaut wurde sie nie.

Das ist vertretbar, weil die Schlüssel je (Listenart, Element) so verschieden
sind (Befund 4), dass eine Tabelle die Fallunterscheidungen nur verschoben
hätte: Die Vereinsmeldeliste sucht Wettkämpfe über die Nummer allein, die
Ergebnislisten über (Nr, Art), die Staffeln über ein Tripel. Es bleibt aber
handgeschriebener Code, der pro Listenart wiederholt wird — die offensichtliche
Stelle für Abweichungen zwischen den vier Projektionen, und der Grund, warum
die Projektionstests je Listenart eigenständig sind.

Einheitlich ist dagegen das **Verhalten**: Ein Verweis ins Leere ergibt
`dangling-reference`, ein mehrdeutiger Treffer `ambiguous-reference`; beide sind
Warnungen, und im mehrdeutigen Fall gewinnt der erste Treffer. Ein Absturz ist
keine Option — die Daten sollen auch dann ansehbar bleiben.

## Zwei API-Ebenen

**Schema-frei — verlustfrei.** Records wie in der Datei, inklusive Kommentaren,
Leerzeilen, unbekannten Elementen, Originalreihenfolge und Rohtext pro Zeile.

```ts
const { document } = parseDsv(text);
writeDsv(document) === text; // byte-identisch
```

**Typisiert — benannte Felder, Validierung, Objektgraph.** Ein eigenes
Zielmodell **pro Listenart**: Wegen Befund 6 gibt es keine gemeinsame Projektion
mit vier Einstiegspunkten. Deshalb trägt jeder Typ des Objektgraphen das Präfix
seiner Listenart (`Definition…`, `Ergebnis…`, `Meldung…`, `Vereinsergebnis…`).
Das ist keine Kollisionsvermeidung, sondern eine Aussage: `ABSCHNITT` führt in
der Definitionsliste sechs Felder und in den Ergebnislisten vier.

Die Wettkampfergebnisliste hat kein `PERSON`-Element; `ErgebnisPerson` wird
dort aus den Ergebniszeilen **aggregiert** und sammelt alle Starts einer Person.
Diese Entität steht so in keiner Datei — sie ist eine Ableitung, und das ist
dokumentiert, statt sie als Dateiinhalt auszugeben.

**Der Objektgraph ist read-only.** Es gibt keinen High-Level-Schreibpfad; die
`write…`-Funktionen nehmen typisierte Records. Ein zweites Mutationsmodell auf
dem Graphen wäre die eigentliche Verdopplung des Wartungsaufwands, und der
Nutzen gegenüber „Records bauen und `write…` aufrufen" ist gering.

Umsetzung: **Plain Objects, eager aufgelöst, keine Klassen.** Klassen scheiden
aus, weil bei ESM+CJS-Dual-Publish zwei Modulinstanzen existieren und
`instanceof` über die Grenze fehlschlägt; außerdem sind Prototyp-Methoden nicht
tree-shakebar. Lazy Getter scheiden aus, weil sie Fehler zeitlich
unvorhersehbar machen. **Rückverweise werden weggelassen** und durch Index-Maps
ersetzt — sonst wirft `JSON.stringify` auf Zyklen. Immutability über `readonly`
auf Typebene, **kein** `Object.freeze` (kostet Laufzeit, erschwert Debugging und
blockiert „parsen, korrigieren, schreiben"); `Object.freeze` kommt in `src/`
nirgends vor.

## Fehlerbehandlung: Diagnostics

Echte DSV-Dateien kommen aus einem Dutzend Programmen und sind regelmäßig leicht
defekt: **28 der 142 echten Dateien (19,7 %) enthalten einen `error`**, ganz
überwiegend ein fehlendes `KAMPFGERICHT.vereinDesKampfrichters`. Wer beim ersten
Fehler wirft, ist für den Hauptanwendungsfall unbrauchbar.

```ts
interface ParseResult<T> {
  readonly document: T; // immer vorhanden, ggf. partiell
  readonly diagnostics: readonly Diagnostic[];
  readonly ok: boolean; // keine Diagnostic mit severity 'error' ODER 'fatal'
}
```

_Verworfen: `Result<T, E>` / discriminated union._ Der Kern-Anwendungsfall ist
„defekte Datei, trotzdem Ergebnis" — der `Err`-Zweig müsste ein Dokument
mittragen, was die Union wertlos macht. TypeScript, ESLint, PostCSS und Babel
liefern alle „Ergebnis + Diagnostics".

_Verworfen: `strict: true` als Option._ Ein Boolean, der zwischen „liefert" und
„wirft" umschaltet, ist eine Boolean-Trap — der Rückgabetyp wäre eine Lüge.
Stattdessen zwei Funktionen: `parseDsv()` und `parseDsvOrThrow()`.

Die vier Schweregrade und was sie steuern:

| Severity  | Bedeutung                                     | `ok`    |
| --------- | --------------------------------------------- | ------- |
| `fatal`   | Die Eingabe ist keine verwertbare DSV-Datei.  | `false` |
| `error`   | Die Datei verletzt das Schema.                | `false` |
| `warning` | Auffällig, in echten Dateien aber verbreitet. | `true`  |
| `info`    | Hinweis, meist eine Lücke der Spezifikation.  | `true`  |

Gemessen über die 137 echten DSV7-Dateien: 53 `error`
(`missing-required-field`) und 217 `warning` (`invalid-value` 74,
`unterminated-field-list` 73, `conditional-field-required` 58,
`invalid-enum-value` 12). Kein `fatal` außer bei den fünf DSV6-Dateien.

`Diagnostic.code` ist eine String-Literal-Union — greppbar, dokumentierbar,
lokalisierbar — mit strukturiertem `data`-Feld. Der Wortlaut von `message`
gehört ausdrücklich **nicht** zur zugesicherten Oberfläche; Konsumenten werten
`code` und `data` aus, und die Tests prüfen ebenfalls diese beiden.

### Warum `Diagnostic` nur eine Zeile führt

`Diagnostic.line` ist 1-basiert und die **einzige** Ortsangabe. Eine Spalte oder
eine Span wird bewusst nicht geführt.

Das ist die Lehre aus einem konkreten Fehler. Bis 0.9.0 trug die Struktur
`start`/`end` vom Typ `Position` — mit einer `column`, die an **jeder** der 15
Erzeugerstellen konstant `1` war, und einem `end`, das immer `start` glich. Eine
öffentliche Zusage, die nie eingelöst wurde und die ein Konsument nicht als
Platzhalter erkennen konnte: `d.end.column` kompilierte und lieferte Unsinn.
Dieses Architekturdokument hat die Struktur beschrieben, als wäre sie echt, und
damit ihre Entdeckung um Monate verzögert.

Vor dem Einfrieren mit 1.0 war zu wählen zwischen echter Spaltenrechnung —
Feldoffsets durch Lexer, Parser, Validierung und Projektion fädeln, für eine
Genauigkeit, die keine Regel braucht — und einer ehrlichen Struktur. Entschieden
für die ehrliche Struktur, aus zwei Gründen: DSV ist zeilenorientiert, jedes
Element belegt genau eine Zeile, und Befunde wie `cardinality-violation` oder
`dangling-reference` haben gar kein Feld, an dem eine Spalte hinge. Eine Span
später zu **ergänzen** ist additiv und bricht nichts.

Ein Modul zur Offset-Rechnung gab es nie. Frühere Fassungen dieses Dokuments
erwähnten eines; `src/` enthält keines, und `src/source/source-text.ts` führt
ausschließlich Zeilennummern.

## Round-Trip: byte-identisch über die schema-freie Ebene

Byte-Identität nach Dekodierung ist **nicht** erreichbar: erlaubte Leerzeichen,
weglassbare Unterlassungswerte und uneinheitliche Groß-/Kleinschreibung gehen
beim Dekodieren verloren. Deshalb:

- **Jedes Item führt seine Originalzeile** (`raw`) und sein `eol` mit.
  `writeDsv` auf ein unverändert geparstes Dokument ist damit byte-identisch,
  inklusive Zeilenenden, BOM-Zustand, Leerzeichen und Kommentaren.
- **Für geänderte oder neu erzeugte Felder gilt semantische Äquivalenz**:
  `parse(write(parse(x)))` ≡ `parse(x)`. Beim Schreiben wird kanonisch
  formatiert.

Ein Unterschied, der leicht übersehen wird: Die typisierten
`write…`-Funktionen nehmen **Records**, nicht ein Dokument. Kommentarzeilen und
Leerzeilen leben in `DsvDocument.items` und haben in `TypedList.records` kein
Gegenstück — sie fallen also weg. Eine echte Datei mit Erzeuger-Kommentar
kommt über `write…(liste.records)` **nicht** byte-identisch heraus, über
`writeDsv(liste.document)` schon. Das ist kein Fehler, sondern die Folge davon,
dass die typisierte Ebene über Elemente spricht und nicht über Zeilen.

## Trailing-Semikolon und Attributzahl

Da jedes Attribut terminiert wird, liefert `split(';')` bei korrekter
Terminierung N+1 Teile mit leerem letztem. Der Lexer verwirft **genau ein**
abschließendes Leerfeld und hält in `terminated` fest, ob es da war.
Abweichungen von der Soll-Attributzahl sind `warning`, kein Abbruch — zu wenige
Felder werden mit Defaults aufgefüllt, zu viele für den Round-Trip behalten.

## Werttypen

Der Skalartyp-Vorrat steht in `src/schema/types.ts`:
`ZK | Zahl | Zeichen | Zeit | Datum | Uhrzeit | Betrag | JGAK`. Drei davon haben
einen eigenen Codec unter `src/values/`, exportiert als Teil der öffentlichen
Oberfläche:

| Typ       | Repräsentation im Objektgraphen       | Codec                             |
| --------- | ------------------------------------- | --------------------------------- |
| `Zeit`    | Hundertstelsekunden als `number`      | `decodeZeit` / `encodeZeit`       |
| `Uhrzeit` | Minuten seit Mitternacht als `number` | `decodeUhrzeit` / `encodeUhrzeit` |
| `Datum`   | `{ day, month, year }`                | `decodeDatum` / `encodeDatum`     |

Sie sind öffentlich, weil die Formatierungsregel erfahrungsgemäß knapp daneben
nachgebaut wird — führende Nullen, Komma als Dezimaltrennzeichen, volle
`HH:MM:SS,hh`-Form auch unter einer Stunde.

**Zeit** als Hundertstel-Integer: Gleitkomma scheidet wegen der
Zwischenzeiten-Addition aus, Strings verhindern Rechnen. Der Höchstwert
`99:59:59,99` ist `35999999`. `00:00:00,00` ist der spezifizierte
Unterlassungswert für „keine Zeit" und wird beim Round-Trip beibehalten;
`isZeroZeit(hundredths)` fragt ihn ab, statt still auf `null` abzubilden.

**Vorzeichen gehört nicht in die Zeit.** `PNREAKTION` und `STABLOESE` haben ein
eigenes Attribut `Art` (`+`/`-`, Unterlassungswert `+`); der Typ `Zeit` ist
vorzeichenlos. Zöge man das Vorzeichen ins Zeit-Objekt, ginge der Unterschied
zwischen „`+` explizit geschrieben" und „`+` weggelassen" verloren.

**Die Encoder prüfen ihre Eingabe und werfen `DsvWriteError`** statt unlesbare
Werte zu liefern. Gültig sind `0`–`35999999` für `encodeZeit`, `0`–`1439` für
`encodeUhrzeit` und ein wirklich existierender Kalendertag für `encodeDatum`.
Die Asymmetrie zu den Decodern ist gewollt: Ein Decoder liest **fremde**
Eingabe, wo Ungültiges zum Ergebnis gehört; ein Encoder bekommt den **eigenen**
Wert des Aufrufers, und ist der ungültig, liegt ein Programmfehler vor.

**`Zahl`** ist „positiver Integer, 32 Bit" (dsv8.md:265) und wird gegen
`4294967295` geprüft — die vorzeichenlose Schranke, weil „ohne Vorzeichen" in
der Spec steht. Führende Nullen bleiben zulässig; 5738 Felder echter Dateien
haben sie.

**`JGAK`** ist **kein** eigener Codec und **keine getaggte Union.** Frühere
Fassungen dieses Dokuments beschrieben eine fünfvariantige Union
(`jahrgang`/`altersklasse`/`mastersEinzel`/`mastersStaffel`/`offen`); gebaut
wurde sie nie. Tatsächlich wird `JGAK` in `src/validate/validate-values.ts`
gegen ein einziges Muster geprüft — `/^(?:\d{1,4}|[ABCDEJ]|\d{2,3}\+)$/` — und
im Objektgraphen als **Zeichenkette** geführt (`person.jahrgang === '2008'`).
Der Grund, warum die Union nicht entstand, ist derselbe, aus dem sie
attraktiv wirkte: Ihre Deutung ist kontextabhängig — dieselbe Zeichenkette `20`
heißt bei Einzelwettkämpfen Masters-Altersklasse, und das `Typ`-Feld (`JG`/`AK`)
des umgebenden Elements entscheidet mit (dsv8.md:2446). Ein feld-lokaler Codec
kann das nicht, und einen kontextabhängigen Haken hat der Schema-Mechanismus
nicht. Die Deutung bleibt damit beim Aufrufer, der das `Typ`-Feld ohnehin
danebenliegen hat. Eine Union später zu ergänzen wäre ein Breaking Change am
Objektgraphen — deshalb steht sie hier als bewusst offene Frage und nicht als
Zusage.

## Encoding, BOM, Zeilenenden

Die Spec verlangt UTF-8 ohne BOM (dsv8.md:140).

- Der Kern nimmt und liefert `string`, kein `Buffer`. Wer eine Datei einliest,
  dekodiert sie selbst.
- Ein vorhandenes BOM wird im `source`-Layer entfernt, als
  `DsvDocument.hasBom` vermerkt und als `unexpected-bom` **gemeldet**. Es wird
  beim Schreiben nur dann wieder ausgegeben, wenn `hasBom` gesetzt war. Eine
  Option, eines zu erzeugen, gibt es bewusst nicht — die Bibliothek soll nicht
  anbieten, was die Spec untersagt.
- Zeilenenden werden **pro Item** mitgeführt. Ohne das ist der Round-Trip auf
  realen Dateien sofort rot.
- Bei U+FFFD im Input wird `unknown-encoding-replacement-character` gemeldet —
  sonst parst die Bibliothek stillschweigend Müll.

## Beim Lesen tolerant, beim Schreiben strikt

Jede Toleranz erzeugt eine Diagnostic, damit sie sichtbar bleibt statt still zu
wirken. Beim Schreiben gilt das Gegenteil: `writeTypedList` liest seine eigene
Ausgabe zurück und wirft `DsvWriteError`, wenn dabei ein unzulässiger Befund
entsteht.

Welche Befunde in eigener Ausgabe vorkommen dürfen, hängt am **Diagnostic-Code**,
nicht an der Schwere. Das ist der Kern einer behobenen Fehlerklasse: Die
Abschlussprüfung filterte früher auf `error`/`fatal`, die Lese-Milde ist aber
durchweg als `warning` ausgedrückt — **jede Lese-Milde wurde damit automatisch
zur Schreib-Erlaubnis.** Ein Writer, dem man die Records verkehrt herum gab,
lieferte klaglos eine Datei mit `DATEIENDE` in Zeile 1 aus.

Die Zuordnung ist **vollständig**: Ein neuer Code lässt sich nicht einführen,
ohne zu entscheiden, wie er in eigener Ausgabe zu behandeln ist; eine
Vorbelegung gibt es nicht. Sie kennt drei Stufen:

- **erlaubt** — `invalid-value` und `conditional-field-required` auf Warnstufe,
  weil echte, vom DSV ausgelieferte Dateien sie verletzen und sich sonst eine
  eingelesene echte Datei nicht wieder ausschreiben ließe.
- **vorbestehender Mangel** (`preexisting-defect`) — allein
  `missing-required-field`. Ein fehlender Wert lässt die Datei lesbar; er
  entsteht in der erzeugenden Software, nicht beim Aufrufer.
- **vorbestehender Mangel, sofern toleriert**
  (`preexisting-defect-when-tolerated`) — allein `invalid-enum-value`, und nur
  bei `data.tolerated === true`. Der Zusatz ist der Punkt: Durchgereicht wird
  nur ein Wert, den die Bibliothek selbst in ihrer Toleranzliste führt, den die
  Datei also mitgebracht hat. Ein Wert, den der Aufrufer erfindet, steht in
  keiner Toleranzliste und bleibt auf beiden Wegen verwehrt.
- **verweigert** — alles Übrige, insbesondere `unexpected-field-count`,
  `element-order-violation` und `unknown-element`, sowie alles auf
  `fatal`-Stufe. Es würde die Lesbarkeit zerstören.

Die beiden mittleren Stufen verweigert der Vorgabeweg weiterhin; die eigens
benannten `write…PreservingDefects`-Funktionen reichen sie durch und geben sie
in `WriteResult.preservedDefects` zurück.

Die dritte Stufe ist eine Antwort auf den häufigsten Anwendungsfall überhaupt:
ein Protokoll einlesen, einen Eintrag ändern, speichern. Ohne sie scheiterte er
an knapp jeder fünften echten Datei — an einem Mangel, den der Aufrufer weder
verursacht noch angefasst hat. Dass der Weg einen eigenen Namen trägt und einen
anderen Rückgabetyp hat, statt einer Option am Vorgabeweg, ist Absicht: Eine
Nachlässigkeit soll man wollen müssen und danach sehen.

## Validierungsregeln jenseits der Attributtypen

Umgesetzt in `src/validate/`:

- `FORMAT` muss erstes, `DATEIENDE` letztes **Element** sein (dsv8.md:331) —
  Kommentarzeilen davor sind zulässig
- referenzierende Elemente müssen nach den referenzierten stehen
- Kardinalitäten pro (Listenart, Element), als `min`/`max` an der
  Listen-Schema-Tabelle
- `BANKVERBINDUNG` und `LASTSCHRIFT` schließen einander aus (dsv8.md:828)
- bei gesetztem „Grund der Nichtwertung" muss `Platz` = 0 sein
- Vergleiche von Listenart und Enum-Werten case-insensitiv

### Die Qualifikationsregel gilt in der Vereinsmeldeliste nicht

Die Spec verlangt bei Zwischenläufen und Finals die Nummer des qualifizierenden
Wettkampfes (dsv8.md:1793). In den 34 echten Vereinsmeldelisten schlug diese
Regel bei **allen 170 Wettkämpfen mit Art `F` an, ausnahmslos** — und in keiner
Datei gibt es unter der Nummer eines Finales einen Vor- oder Zwischenlauf, auf
den überhaupt verwiesen werden könnte.

Eine Quote von 100 % über 34 unabhängig erzeugte Dateien spricht gegen einen
Mangel der Dateien und für eine zu weit gefasste Regel: Eine Vereinsmeldung
entsteht **vor** der Veranstaltung, also bevor sich jemand qualifizieren konnte.
`F` bezeichnet in einer Meldedatei einen direkt ausgeschriebenen Endlauf. Die
Spec-Regel beschreibt den Ergebnisfall, nicht den Meldefall.

Umgesetzt nicht als Ausnahme im Regelrumpf, sondern durch Bindung an die
Listenarten, für die sie gilt (`LISTENARTEN_MIT_QUALIFIKATION` in
`src/validate/validate-document.ts`), über den Parameter `onlyIn` von
`targetsWithFields`. Die Regel selbst bleibt frei von Sonderfällen.

Die Gegenprobe: In der Vereinsmeldeliste sind alle weiteren Regeln des
Ergebnisfalls bereits **strukturell** folgenlos, weil das Schema die nötigen
Felder gar nicht führt. Die Qualifikationsregel war die einzige, die
durchschlug — weil `qualifikationswettkampfnr` das einzige Feld des
Ergebnisfalls ist, das die Meldeliste mitführt.

### `WERTUNG` der Vereinsergebnisliste nimmt `A` und `N` auf

Die Spec führt für dieses eine Feld nur vier Wettkampfarten (dsv8.md:3197),
obwohl `WETTKAMPF` und `PERSONENERGEBNIS` derselben Listenart alle sechs führen
und `wertungsId` in jedem Ergebnis Pflichtfeld ist. Ergebnisse eines Aus- oder
Nachschwimmens könnten damit keine gültige Wertung haben.

Entschieden: Die Wertungs-ID muss zum eigenen Wettkampf gehören, und die enge
Wertetabelle ist unvollständig. Drei nachgeprüfte Gründe: Jede `WERTUNG` nennt
selbst einen Wettkampf — wäre der Bezug beliebig, wäre das Feld bedeutungslos.
Die Spec verlangt bei `PERSONENERGEBNIS` „für jede definierte Wertung" die
Platzierung (dsv8.md:3459), was nur wettkampfbezogen sinnvoll ist. Und **alle
97 330 Ergebnisse der 72 echten Wettkampfergebnislisten** zeigen auf eine
Wertung ihres eigenen Wettkampfs, ohne einen einzigen Verstoß.

Umgesetzt als `specGap`-Wert: beim Lesen `info`, beim Schreiben erlaubt.

## Plattform und Paketierung

Der Kern ist strikt Node-frei (kein `Buffer`, kein `node:*`) und läuft in
Browser, Deno, Workers und Edge. Ausgeliefert wird über `tsup` als ESM + CJS +
`.d.ts`, geprüft mit `publint` und `@arethetypeswrong/cli` im `check`-Skript.

**Es gibt genau einen Einstiegspunkt.** `package.json` exportiert `"."` und
`"./package.json"`, sonst nichts. Frühere Fassungen dieses Dokuments kündigten
eine injizierbare Registry (`createDsvParser([…])`) und Subpath-Exports
(`@schroeer-haren/dsv/node`) als Tree-Shaking-Maßnahme an; beides existiert
nicht. `parseDsv` dispatcht auch nicht über eine Registry — es liest `FORMAT`
und arbeitet schema-frei weiter; die typisierten `parse…`-Funktionen sind
einzeln importierbar, und `sideEffects: false` ist gesetzt. Wer eine einzelne
Listenart importiert, zieht über die generierten Typen dennoch die
`.d.ts` aller vier mit — Typen kosten zur Laufzeit nichts, aber die
Bundle-Wirkung ist damit geringer als angekündigt.

## Nicht enthalten

Bewusste Auslassungen, jede mit ihrem Grund:

- **`.DSV8z` (ZIP)** — bräuchte eine Dependency. Die Bibliothek verarbeitet
  Text, keine Archive.
- **Streaming.** Selbst große Ergebnislisten sind einstellige MB. Der Weg
  dorthin bleibt offen: `collectItems` nimmt bereits ein
  `Iterable<SourceLine>` entgegen, und die Records sind azyklisch. Der
  Speicherbedarf liegt beim rund 10- bis 14-fachen der Eingabe, siehe
  [`benchmark.md`](benchmark.md).
- **Meldegeldberechnung** — Fachlogik, kein Parsen. `MELDEGELD` wird gelesen,
  geschrieben und validiert, aber nicht summiert.
- **DSV6** — veraltet, wird mit `unsupported-format-version` (`fatal`)
  abgelehnt. `parseDsv` zerlegt die Datei trotzdem in Zeilen, damit man
  hineinsehen kann.
- **DSV7↔DSV8-Konvertierung** — gewollt und wegen der rein additiven Änderungen
  günstig zu bauen, aber nach 1.0: Sie vergrößert die einzufrierende
  Oberfläche, ohne den Weg zu 1.0 zu verkürzen.
- **Dateinamen-Helfer.** Die Spec definiert `JJJJ-MM-TT-Ort-Zusatz.DSV8` samt
  Kürzung, Umlaut-Transliteration und Kollisionsnummerierung
  (dsv8.md:140–189) — eine ableitbare, testbare Funktion, die sonst niemand
  anbietet. Sie ist **nicht implementiert**; frühere Fassungen dieses Dokuments
  führten sie widersprüchlich zugleich als Alleinstellungsmerkmal und als
  Auslassung. Für 1.0 gilt: nicht enthalten.
- **High-Level-Schreibpfad** — siehe „Zwei API-Ebenen".

## Testkonzept

Die Spec-Beispiele taugen **nicht** als Fixture-Quelle: Sie enthalten
Tippfehler (Befund 9) und stehen in CI nicht zur Verfügung.

- **Round-Trip über alle 142 Realdateien**: `parseDsv → writeDsv`
  byte-identisch. Der schärfste verfügbare Test, weil er Lexer und Serializer
  gleichzeitig prüft.
- **Property-Tests (`fast-check`)**: Records zufällig aus dem Schema erzeugen,
  encode → decode → vergleichen. Deckt Felder ab, die in keiner Beispieldatei
  vorkommen.
- **Synthetische Fixtures** (`test/fixtures/synth/`, 30 Dateien) decken alle
  Schemafelder ab, inklusive der DSV8-Zusätze, für die es keine Realdaten gibt.
- **Oberflächen-Snapshot**: `docs/public-api-surface.md` wird generiert und mit
  `npm run api-surface:check` in CI gegen den Quellstand geprüft — ein
  umbenanntes Feld eines exportierten Typs fällt damit auf, auch wenn kein
  Exportname sich ändert.
- **`publint` + `@arethetypeswrong/cli`** im `check`-Skript: bei ESM+CJS mit
  `dts: true` die häufigste Fehlerquelle, und sie trifft sonst erst die Nutzer.

### Testdaten und Datenschutz

Echte Dateien enthalten personenbezogene Daten — Klarname, Jahrgang,
Geschlecht, DSV-ID und Verein, bei Nachwuchswettkämpfen also Daten von Kindern.
In einem öffentlichen Repository wären sie dauerhaft abrufbar und über die
Git-History auch nach einem Löschen noch vorhanden. Deshalb drei getrennte
Bestände:

| Zweck                      | Ort                    | Git       | Inhalt                            |
| -------------------------- | ---------------------- | --------- | --------------------------------- |
| Entwicklung gegen Realität | `spec/samples/`        | ignoriert | Originaldateien, unverändert      |
| CI und Repository          | `test/fixtures/real/`  | committet | dieselben Dateien, anonymisiert   |
| Schema-Abdeckung           | `test/fixtures/synth/` | committet | synthetisch, deckt alle Felder ab |

Die Anonymisierung (`scripts/anonymize.ts`) ersetzt Namen und randomisiert
DSV-IDs, lässt aber **Struktur, Zeiten, Feldanzahl, Whitespace und Zeilenenden
byte-genau unangetastet** — der Testwert steckt in den Formateigenheiten, nicht
in den Klarnamen.

## API-Stabilität

Mit 1.0 ist die in [`public-api.md`](public-api.md) geführte Oberfläche
eingefroren. **Kein öffentlicher Vertrag** sind die Schema-Interna, alles unter
`src/` was nicht über den Paket-Root exportiert wird, und der Wortlaut von
`Diagnostic.message`.
