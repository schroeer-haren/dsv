# Architektur

Entwurf für den Aufbau von `@schroeer-haren/dsv`. Grundlage sind die
Spezifikationen DSV7 und DSV8 (siehe CLAUDE.md, Abschnitt „Spezifikationen").
Zeilenangaben `dsv8.md:NNN` beziehen sich auf die Markdown-Fassung in `spec/`.

Fassung 2, nach fachlichem Review gegen die Spec und Design-Review.

## Ausgangslage aus der Spec

1. **Zeilenorientiert, kein Escaping.** Ein Element pro Zeile, Attribute mit `;`
   terminiert (auch das letzte). Der Datentyp ZK verbietet Semikolon und
   Zeilenumbruch im Wert – es gibt nichts zu escapen und nichts zu quoten.
2. **Zwei Zeilenformen, nicht eine.** `ELEMENT:attr1;attr2;…;` **und**
   attributlose Elemente ohne Doppelpunkt. Betroffen ist genau `DATEIENDE`
   (dsv8.md:1427–1435, Beispiele 1512, 2662, 4318, 6009). Ein Lexer, der stumpf
   am ersten `:` trennt, zerbricht daran; ein Serializer ohne `bare`-Flag
   schreibt `DATEIENDE:` und bricht den Round-Trip.
3. **Kein impliziter Kontext-Zustand.** Es gibt kein „gilt bis zum nächsten
   Element"-Konstrukt; alle Bezüge laufen über explizite ID-Attribute in jeder
   Zeile. Ein zustandsloser Zeilen-Parser genügt.
4. **Aber: Referenzschlüssel sind je (Listenart, Element) verschieden und nicht
   durchweg eindeutig.** In der Vereinsmeldeliste referenzieren `STARTPN`,
   `STARTST` und `STAFFELPERSON` den Wettkampf **nur über die Wettkampfnummer,
   ohne Wettkampfart** (dsv8.md:2366, 2484, 2518), während `WETTKAMPF` über
   (Nr, Art) identifiziert ist. In den Ergebnislisten führt `PNZWISCHENZEIT`
   keine `WertungsID`, `PNERGEBNIS` gibt aber **pro Wertung eine eigene Zeile**
   aus (dsv8.md:5019) – die Beziehung ist 1:n, nicht 1:1.
5. **Element-Identität ist listenabhängig.** `ABSCHNITT` 6 Attribute in der
   Wettkampfdefinitionsliste vs. 4 sonst; `WETTKAMPF` 11 vs. 10 in der
   Vereinsmeldeliste (dort fehlt „Zuordnung Bestenliste", verifiziert an
   dsv8.md:1476 vs. 2600); `VEREIN` 5 vs. 4; `STAFFELPERSON` 4 in der
   Vereinsmeldeliste vs. 12 in den Ergebnislisten. Auch **Kardinalitäten**
   variieren: `VEREIN` ist `Vorkommen 1` in der Vereinsergebnisliste
   (dsv8.md:3303), aber `1 bis N` in der Wettkampfergebnisliste (dsv8.md:4954).
   Und `Wettkampfart` ist zwei verschiedene Enums (Melde-Kontext `V/Z/F/E`,
   Ergebnis-Kontext zusätzlich `A/N`).
6. **Die beiden Ergebnislisten sind strukturell verschieden.** Die
   Vereinsergebnisliste ist normalisiert (`VEREIN` → `PERSON` →
   `PERSONENERGEBNIS`, dsv8.md:3301/3366/3465) bei genau einem Verein. Die
   Wettkampfergebnisliste hat **kein `PERSON`-Element**; `PNERGEBNIS` ist ein
   denormalisierter Flachsatz mit Name, DSV-ID, Verein und Endzeit in derselben
   Zeile (dsv8.md:5890).
7. **DSV7 → DSV8 ist rein additiv.** Keine Entfernung, keine Feldverschiebung.
   Nur zwei Stellen erzwingen echte Verzweigung: die geänderte Semantik von
   `MELDEGELDPAUSCHALE` (DSV7 „pro Meldung" → DSV8 „pro Verein") und die
   Pflichtfeld-Eigenschaft von `BANKVERBINDUNG.Kontoinhaber` beim Schreiben.
8. **Führende/abschließende Leerzeichen in Attributen sind zulässig**
   (dsv8.md:233) und werden in den Spec-Beispielen aktiv genutzt
   (`…;;; GER;;;`, dsv8.md:5892). Sie sind **kein** Fehler und dürfen nicht
   „repariert" werden.
9. **Die Spec-Beispiele enthalten echte Tippfehler** (`WERTUNG:1;V,2;…`,
   `STZWISCHENZEIT:2012;4;E,1;…`, `KARIABSCHNITT:2;1;:`). Sie dürfen nicht als
   Formatdefinition gelesen werden – im Unterschied zu Punkt 8.

Punkt 5 ist der Kern: der Schlüssel für eine Elementdefinition ist
`(Listenart, Elementname)`, nicht der Elementname allein.

## Leitentscheidung: schema-getrieben, Typen generiert

Es gibt ~20 Elemente × 4 Listenarten × 2 Versionen. Diese Matrix von Hand als
Parser-, Serializer- und Validierungscode auszuschreiben, ist die Stelle, an der
Implementierungen dieses Formats erfahrungsgemäß stecken bleiben – die
Go-Referenzimplementierung `konrad2002/dsvparser` hat nach zwei Jahren zwei der
vier Listenarten immer noch nicht.

Deshalb: **eine deklarative Schema-Tabelle als einzige Quelle der Wahrheit.**

```ts
const ABSCHNITT_WKDEF = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', { required: true }),
  field('abschnittsdatum', 'Datum', { required: true }),
  field('einlass', 'Uhrzeit'),
  field('kampfrichtersitzung', 'Uhrzeit'),
  field('anfangszeit', 'Uhrzeit', { required: true }),
  field('relativeAngabe', 'JN', { default: 'N' }),
]);
```

**Die Typen werden daraus generiert, nicht inferiert.** Parser, Serializer und
Validierung lesen das Schema zur Laufzeit – das ist der eigentliche Gewinn. Die
öffentlichen TypeScript-Typen entstehen dagegen per Skript als eingecheckte
`src/schema/generated.ts`, mit `git diff --exit-code` in CI als Drift-Wächter.

_Verworfen: reine Typinferenz über `as const` + Mapped Types._ Technisch machbar
(~60 Zeilen, Compile-Zeit unkritisch), scheitert aber an drei praktischen
Punkten: mit `dts: true` landet das komplette Schema-Literal in der `.d.ts`;
Hover zeigt `Prettify<Pick<…>>` statt `Abschnitt`; und **JSDoc pro Feld ist mit
Mapped Types strukturell unmöglich** – ein aus einem Mapped Type entstandener
Key kann keinen Doc-Kommentar tragen. Genau das wäre hier am wertvollsten
(„`wettkampfart` – Melde-Kontext: V/Z/F/E, siehe DSV8 §5.2").

_Verworfen: Typen von Hand._ Drift, also genau das Problem, das der
Schema-Ansatz löst.

Der eigentliche Komplexitätstreiber ist nicht die 20×4-Matrix, sondern das
Versions-Flag: sobald der Record-Typ von der Version abhängt, müsste ein Generic
`V extends 7 | 8` durch alle Schichten propagieren. Codegen umgeht das, indem es
DSV7 und DSV8 als zwei explizit benannte Interfaces emittiert.

## Schichten

Zwei getrennte Achsen, die nicht verwechselt werden dürfen.

**Datenfluss beim Lesen:**

```
Text → source → lexer → parse (+schema, values) → document → validate
```

**Modul-Abhängigkeiten (DAG, Pfeil = „hängt ab von"):**

```
diagnostics ← source ← lexer ← parse ← document ← validate
     ↑                            ↑
   values ←──── schema ───────────┴──── write
```

- `diagnostics/` – Codes, Severities, Formatter. Blattmodul, wird schon vom
  Lexer gebraucht.
- `source/` – BOM, Zeilenenden, Offset↔Zeile/Spalte. Bewusst **nicht** im Lexer,
  damit Positionsrechnung isoliert testbar ist.
- `values/` – Skalar-Codecs, je Typ ein symmetrisch getestetes decode/encode-Paar.
- `schema/` – Elementdefinitionen je (Listenart, Version), inkl. Kardinalitäten.
- `write/` hängt **nur** von `schema` + `values` ab, nicht von `parse` oder
  `validate` – es spiegelt `parse`, es folgt ihm nicht.

Die DAG-Kanten werden über ESLint `no-restricted-imports` erzwungen, sonst
entsteht schleichend der Zyklus `document → validate → document`.

`document/` liefert `{ graph, diagnostics }` und meldet Auflösungsfehler selbst;
`validate/` bleibt reine Regelauswertung über Records + Indizes und ist
unabhängig aufrufbar. Wer nur validieren will, soll keinen Objektgraph bauen
müssen.

## Referenzauflösung

Weil die Schlüssel je (Listenart, Element) verschieden und teils mehrdeutig sind
(Befund 4), gehört die Zuordnung Referenz → Zielschlüssel **als Tabelle ins
Schema**, nicht in handgeschriebenen Auflösungscode. Mehrdeutige Treffer sind
kein Absturz, sondern eine Diagnostic (`ambiguous-reference`), und die
Auflösung liefert dann alle Kandidaten.

## Zwei API-Ebenen

**Low level – verlustfrei.** Records wie in der Datei, inklusive Kommentaren,
unbekannten Elementen, Originalreihenfolge und **Rohtext pro Feld**.

```ts
const result = parseDsv(text); // ParseResult<DsvDocument>
const text2 = writeDsv(result.document);
```

**High level – bequem, in v1 read-only.** Ein eigenes Zielmodell **pro
Listenart** – wegen Befund 6 gibt es keine gemeinsame Projektion mit vier
Einstiegspunkten. Die Wettkampfergebnisliste hat keine Schwimmer-Ebene; ein
`Schwimmer` müsste dort synthetisch aus n `PNERGEBNIS`-Zeilen aggregiert werden
(mit dem Risiko widersprüchlicher Duplikate) – ob das angeboten wird, ist eine
bewusste Entscheidung, keine Selbstverständlichkeit.

Dass High Level **keinen eigenen Schreibpfad** hat, ist der Grund, warum zwei
Ebenen wenig kosten. Zwei Mutationsmodelle wären die eigentliche Verdopplung.

Umsetzung: **Plain Objects, eager aufgelöst, keine Klassen.** Klassen scheiden
aus, weil bei ESM+CJS-Dual-Publish zwei Modulinstanzen existieren und
`instanceof` über die Grenze fehlschlägt; außerdem sind Prototyp-Methoden nicht
tree-shakebar. Lazy Getter scheiden aus, weil sie Fehler zeitlich
unvorhersehbar machen. Rückverweise (`schwimmer.verein`) werden weggelassen und
durch Index-Maps ersetzt – sonst wirft `JSON.stringify` auf Zyklen.

## Fehlerbehandlung: Diagnostics, zwei Funktionen

Echte DSV-Dateien kommen aus einem Dutzend Programmen und sind regelmäßig leicht
defekt. Wer beim ersten Fehler wirft, ist für den Hauptanwendungsfall unbrauchbar.

```ts
type ParseResult<T> = {
  document: T; // immer vorhanden, ggf. partiell
  diagnostics: readonly Diagnostic[];
  ok: boolean; // keine Diagnostic mit severity 'error'
};
```

_Verworfen: `Result<T, E>` / discriminated union._ Der Kern-Use-Case ist
„defekte Datei, trotzdem Ergebnis" – der `Err`-Zweig müsste ein Dokument
mittragen, was die Union wertlos macht. TypeScript selbst, ESLint, PostCSS und
Babel liefern alle „Ergebnis + Diagnostics"; das ist hier idiomatisch.

_Verworfen: `strict: true` als Option._ Ein Boolean, der zwischen „liefert" und
„wirft" umschaltet, ist eine Boolean-Trap – der Rückgabetyp wäre eine Lüge.
Stattdessen **zwei Funktionen**: `parseDsv()` und `parseDsvOrThrow()`. Letztere
wird im README zuerst gezeigt, damit der bequeme Weg der werfende ist und nicht
der still ignorierende. Severity `fatal` (Input ist kein DSV) wirft immer.

`Diagnostic.code` ist eine String-Literal-Union (greppbar, dokumentierbar,
lokalisierbar) mit strukturiertem `data`-Feld; `message` ist englisch.
`line`/`column` sind **1-basiert**, `column` in UTF-16-Code-Units, und es wird
eine Span (`start`/`end`) geführt, nicht nur ein Punkt.

## Round-Trip: byte-identisch nur auf Lexer-Ebene

Byte-Identität nach Dekodierung ist **nicht** erreichbar: erlaubte Leerzeichen
(dsv8.md:233), weglassbare Unterlassungswerte (`Anzahl Starter` → 1,
`Art` → `+`, `Meldezeit` → `00:00:00,00`) und uneinheitliche Groß-/Kleinschreibung
von Enums und Listart (`FORMAT:Wettkampfdefinitionsliste` vs.
`FORMAT:VEREINSERGEBNISLISTE`) gehen beim Dekodieren verloren.

Festlegung:

- **Low-Level-Records führen pro Feld den Rohtext mit.** `writeDsv` auf ein
  unverändert geparstes Dokument ist damit byte-identisch, inklusive
  Zeilenenden, BOM-Zustand und Leerzeichen.
- **Für geänderte oder neu erzeugte Felder gilt semantische Äquivalenz**:
  `parse(write(parse(x)))` ≡ `parse(x)`. Beim Schreiben wird kanonisch
  formatiert.

Das ist eine Architekturentscheidung, keine Testdetail-Frage: der Rohtext muss
von Anfang an im Record-Modell stehen.

## Trailing-Semikolon und Attributzahl

Da jedes Attribut terminiert wird, liefert `split(';')` bei korrekter
Terminierung N+1 Teile mit leerem letzten. Regel: der Lexer verwirft **genau
ein** abschließendes Leerfeld. Abweichungen von der Soll-Attributzahl sind
`warning`, kein Abbruch – zu wenige Felder werden mit Defaults aufgefüllt, zu
viele als Extra behalten (Round-Trip).

## Werttypen

**Zeit** `HH:MM:SS,hh`, intern als **Hundertstel-Integer** – Gleitkomma scheidet
aus (Zwischenzeiten-Addition), Strings verhindern Rechnen. Maximalwert
`99:59:59,99` ≈ 36 Mio., passt in 32 Bit. `00:00:00,00` ist der spezifizierte
Unterlassungswert für „keine Zeit" und wird beim Round-Trip beibehalten;
`isZero()` statt stiller `null`-Abbildung.

**Vorzeichen gehört nicht in die Zeit.** `PNREAKTION` und `STABLOESE` haben ein
eigenes Attribut `Art` (`+`/`-`, Default `+`, dsv8.md:3698, 4201); der Datentyp
`Zeit` ist vorzeichenlos. Würde man das Vorzeichen ins Zeit-Objekt ziehen, ginge
der Unterschied zwischen „`+` explizit geschrieben" und „`+` weggelassen"
verloren. Ein signierter Wert wird höchstens high level als abgeleitete
Property angeboten.

**`JGAK` ist kein Skalar, sondern eine getaggte Union** (dsv8.md:285–295):

```ts
| { kind: 'jahrgang';       jahr: number }        // 1990
| { kind: 'altersklasse';   code: 'A'|…|'J' }
| { kind: 'mastersEinzel';  alter: number }       // 20, 25, 30…
| { kind: 'mastersStaffel'; mindestGesamtalter: number }  // 80+, 100+
| { kind: 'offen' }                               // 0 / 9999
```

Die Interpretation ist **kontextabhängig**: dieselbe Zeichenkette `20` heißt bei
Einzelwettkämpfen Masters-AK, und das `Typ`-Feld (`JG`/`AK`) des umgebenden
Elements entscheidet mit (dsv8.md:2446). Ein feld-lokaler Codec kann das nicht –
der Schema-Mechanismus braucht einen Haken für kontextabhängige Validierung.
Das ist die einzige Stelle, an der die Schema-Tabelle über „Feld → Typ"
hinausgehen muss.

## Encoding, BOM, Zeilenenden

Spec verlangt UTF-8 ohne BOM (dsv8.md:140). Real kursieren trotzdem
CP1252/ISO-8859-1-Dateien. Festlegungen:

- Der Kern nimmt und liefert `string`, kein `Buffer`. Ein vorhandenes BOM wird
  im `source`-Layer entfernt und als `hasBom` am Dokument vermerkt; geschrieben
  wird nie eines von selbst.
- **Zeilenenden werden am Dokument mitgeführt** (CRLF/LF, letzte Zeile mit oder
  ohne Newline). Ohne das ist der Round-Trip-Test auf realen Dateien sofort rot –
  die häufigste Ursache für falsch-positive Fehler.
- Bei U+FFFD im Input wird eine Warn-Diagnostic emittiert („Datei wurde
  vermutlich mit falschem Encoding gelesen") – sonst parst die Bibliothek
  stillschweigend Müll.

## Plattform und Immutability

Der Kern bleibt strikt Node-frei (kein `Buffer`, kein `node:*`) und läuft damit
in Browser, Deno, Workers und Edge. Alles mit Dateisystem oder ZIP kommt hinter
einen Subpath `@schroeer-haren/dsv/node`.

Immutability über `readonly` auf Typebene, **kein** `Object.freeze` – das kostet
Laufzeit, erschwert Debugging und blockiert das legitime Szenario „parsen,
korrigieren, schreiben".

**Tree-Shaking:** `sideEffects: false` allein hilft nicht. Würde `parseDsv` über
eine Registry aller vier Listenarten dispatchen, zöge jeder Import alle Schemata
in den Bundle. Deshalb eine injizierbare Registry
(`createDsvParser([wettkampfdefinitionsliste])`) als tree-shakebare Basis und
`parseDsv` als Bequemlichkeit obendrauf, plus Subpath-Exports. Die `exports`-Map
jetzt anzulegen ist billig; später ist es ein Breaking Change.

## Benennung

- Elementnamen und Listenarten in **DSV-Originalschreibweise**
- Attributschlüssel als **lowerCamelCase des DSV-Attributnamens**
  (`abschnittsnr`, `relativeAngabe`)
- Skalartypnamen sind Spec-Termini und bleiben (`Zahl`, `Uhrzeit`, `JGAK`, `JN`)
- alle Funktionen, Optionen und Typnamen **englisch**
- **ein** Verb für dasselbe: `parseWettkampfergebnisliste`, nicht `read…` – die
  Bibliothek macht kein I/O
- `listenart`, nicht `listart`

## Fehlendes Feature mit Alleinstellungswert: Dateinamen

Die Spec definiert `JJJJ-MM-TT-Ort-Zusatz.DSV8` samt Kürzung auf 8 bzw. 16
Zeichen, Umlaut-Transliteration (`ae/oe/ue/ss`), Zusatz `-Wk`/`-Me`/`-Pr` je
Listenart und Durchnummerierung bei Kollision (dsv8.md:140–189). Das ist eine
ableitbare, testbare Funktion (`buildFilename(doc)` / `parseFilename()`) plus
ein Konsistenz-Check gegen `FORMAT.Listart` und das `ABSCHNITT`-Datum – und
bietet sonst niemand an.

## Validierungsregeln jenseits der Attributtypen

- `FORMAT` muss erstes, `DATEIENDE` letztes Element sein (dsv8.md:331)
- referenzierende Elemente müssen **nach** den referenzierten stehen – beim
  Schreiben eine Sortier-Anforderung, beim Lesen eine `warning`
- Kardinalitäten pro (Listenart, Element), siehe Befund 5
- `BANKVERBINDUNG` und `LASTSCHRIFT` schließen einander aus (dsv8.md:828)
- bei gesetztem „Grund der Nichtwertung" muss `Platz` = 0 sein
- Vergleiche von Listart und Enum-Werten **case-insensitiv**

## Testkonzept

`spec/` ist gitignored – die Spec-PDFs stehen in CI **nicht** zur Verfügung, und
ihre Beispiele enthalten Tippfehler (Befund 9). Sie taugen deshalb nicht als
Fixture-Quelle.

- Eingecheckter **eigener, synthetischer Fixture-Korpus**, dazu anonymisierte
  Realdateien.
- **Property-Tests (`fast-check`)**: Records zufällig aus dem Schema erzeugen →
  encode → decode → vergleichen. Das deckt Felder ab, die in keiner
  Beispieldatei vorkommen, und findet Schema-Fehler in einer 20×4-Matrix
  zuverlässiger als jeder Beispieltest.
- **Typ-Tests** (`expectTypeOf`) plus `.d.ts`-Snapshot-Test.
- **`publint` + `@arethetypeswrong/cli`** im `check`-Skript – bei ESM+CJS mit
  `dts: true` die häufigste Fehlerquelle, und sie trifft sonst erst die Nutzer.
- Robustheits-Durchgang: abgeschnittene Zeilen, falsche Feldanzahl, leere Datei,
  BOM, gemischte Zeilenenden, sehr lange Zeilen.

## API-Stabilität

Solange `0.x`: Breaking Changes erhöhen die Minor-Version. **Kein öffentlicher
Vertrag** sind die Schema-Interna, die `values`-Codecs und alles, was nicht über
den Paket-Root oder einen dokumentierten Subpath exportiert wird – sonst wird
jede interne Umbenennung zum Breaking Change.

## Bewusst nicht in v1

- **`.DSV8z` (ZIP)** – bräuchte eine Dependency; später unter
  `@schroeer-haren/dsv/node`.
- **Streaming.** Selbst große Ergebnislisten sind einstellige MB. Aber: Records
  bleiben azyklisch und der Lexer arbeitet auf einer Zeilen-Iterator-Schnittstelle,
  damit `parseDsvStream(AsyncIterable<string>)` später additiv ist statt ein
  Rewrite. Ein Benchmark mit einer synthetischen 50-MB-Datei vor 1.0 beendet die
  Diskussion empirisch.
- **Meldegeldberechnung** – Fachlogik, kein Parsen.
- **DSV6** – veraltet.
- **High-Level-Schreibpfad** – siehe oben.

## Reihenfolge der Umsetzung

0. **Typ-Spike:** ein Element (`ABSCHNITT`, beide Varianten, mit `since: 8`)
   durch die volle Kette, `dist/` bauen, erzeugte `.d.ts` und Hover-Typ
   tatsächlich ansehen. Halber Tag, sichert die teuerste Entscheidung ab.
1. `diagnostics/`, `source/`, `lexer/`, `values/` – Basis, ohne Domänenwissen
   testbar.
2. Schema-Infrastruktur + Wettkampfdefinitionsliste. Nicht wegen der Größe
   (sie hat 19 Elemente, die Vereinsmeldeliste nur 18), sondern weil sie keine
   Ergebnis- und Referenzketten hat.
3. `write` + Round-Trip nach obiger Festlegung.
4. **Vertikaler Durchstich:** High-Level-Projektion für diese eine Listenart,
   bevor die übrigen Schemata entstehen. Fehlt den Records etwas zur
   Projizierbarkeit, ist es hier billig zu ändern und später an vier Stellen teuer.
5. Restliche Listenarten – Reihenfolge nach Verfügbarkeit echter Testdateien,
   nicht nach Spec-Reihenfolge.
6. DSV7↔DSV8-Konvertierung. Wegen der rein additiven Änderungen fast geschenkt
   und praktisch relevant, weil DSV7 nur noch bis 31.12.2026 gültig ist.

## Offene Punkte

- Dürfen Kommentare `(* … *)` **hinter** einem Element auf derselben Zeile
  stehen? Die Spec sagt es nicht (dsv8.md:191–199) – die Bibliothek braucht eine
  dokumentierte Entscheidung.
- `SB10` fehlt in der Brust-Startklassenliste (dsv8.md:2320 ff.). Vermutlich
  Spec-Lücke: strikt ablehnen oder tolerieren?
- Das offizielle Änderungsverzeichnis nennt drei neue Attribute, der Diff findet
  vier (zusätzlich `VEREIN.Lastschrift`). Beim Implementieren verifizieren.
