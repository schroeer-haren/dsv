# Changelog

## 1.0.0

Die erste stabile Fassung. Alle vier Listenarten werden in DSV7 und DSV8
gelesen, validiert, projiziert und geschrieben; die in
[`docs/public-api.md`](docs/public-api.md) geführte Oberfläche ist ab jetzt
eingefroren.

Dieser Zyklus stand nicht im Zeichen neuer Funktionen, sondern der Prüfung, ob
die vorhandenen halten, was sie zusagen. Er hat drei kritische Fehler und eine
Reihe von Zusagen zutage gefördert, die der Code nie eingelöst hat. Beides ist
unten vollständig aufgeführt.

### Umstieg von 0.9.0

`0.9.0` liegt auf npm. Wer von dort kommt, muss die folgenden Punkte anfassen.
Die Kurzfassung als Tabelle, die Begründungen darunter.

| Alt                                                                      | Neu                                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `Diagnostic.start` / `Diagnostic.end` (Typ `Position`)                   | `Diagnostic.line: number`, 1-basiert                                                     |
| `Position` (exportierter Typ)                                            | entfällt ersatzlos                                                                       |
| `ErgebnisPlatzierung.startnummerDisqualifiziert: string`                 | `: number` (leer/unlesbar ergibt `NaN`)                                                  |
| `VereinsergebnisStaffelPlatzierung.startnummerDisqualifiziert: string`   | `: number`                                                                               |
| `qualifikationswettkampfart: 'V'\|'Z'\|'F'\|'E'\|'A'\|'N'`               | `'V'\|'Z'\|'F'\|'E'` (Vereinsmelde- und Wettkampfdefinitionsliste)                       |
| `encodeZeit` / `encodeUhrzeit` / `encodeDatum` → `null`                  | werfen `DsvWriteError`                                                                   |
| weggelassenes Feld im Objektgraphen → `''`                               | Unterlassungswert der Spezifikation (`'N'`, `'+'`, `'00:00:00,00'`)                      |
| —                                                                        | `DsvRecord.terminated: boolean` (neues Pflichtfeld)                                      |
| —                                                                        | `DiagnosticCode` um `'unexpected-bom'` erweitert                                         |
| —                                                                        | `VereinsergebnisStaffel.besetzungen` (neu), Typ `VereinsergebnisStaffelBesetzung`        |
| `wettkampfart` `A`/`N`: `warning` + `data.tolerated`, Schreiben gesperrt | `info` + `data.specGap`, Schreiben erlaubt (Vereinsmelde- und Wettkampfdefinitionsliste) |

**Wer von 0.8 oder früher kommt**, findet die grosse Umbenennung des
Objektgraphen — Präfixe je Listenart (`Verein` → `ErgebnisVerein`),
`Schwimmer` → `ErgebnisPerson`, vereinheitlichte Index-Maps
(`meldungById` → `personById`, `staffelmeldungById` → `staffelById`,
`schwimmerById` → `personById`) und Sammlungsfelder
(`meldungen` → `personen`, `staffelmeldungen` → `staffeln`,
`kampfgericht` → `kampfrichter`) — vollständig im Abschnitt
[0.9.0](#090) aufgeführt. Sie ist in 1.0.0 nicht erneut enthalten.

### Neu: vorbestehende Mängel beim Schreiben durchreichen

Echte Dateien lassen Pflichtfelder leer — 53 Fundstellen in 28 der 142
gesammelten, meist `KAMPFGERICHT.vereinDesKampfrichters` (35×). Der typisierte
Writer verweigerte sie, womit der häufigste Anwendungsfall überhaupt scheiterte:
ein Protokoll einlesen, einen Eintrag ändern, speichern — an einem Mangel, den
der Aufrufer weder verursacht noch berührt hat.

Neu sind `writeWettkampfdefinitionslistePreservingDefects`,
`writeWettkampfergebnislistePreservingDefects`,
`writeVereinsmeldelistePreservingDefects` und
`writeVereinsergebnislistePreservingDefects` samt dem Typ `WriteResult`. Sie
geben statt einer Zeichenkette `{ text, preservedDefects }` zurück, sodass sich
das Durchgereichte nicht übersehen lässt.

Die Strenge bleibt die Vorgabe. Die Erlaubnistabelle bekommt dafür zwei weitere
Stufen statt eines zweiten Mechanismus daneben: `preexisting-defect` für
`missing-required-field` — ein fehlender Wert, der die Datei lesbar lässt — und
`preexisting-defect-when-tolerated` für `invalid-enum-value`, das nur mit
`data.tolerated === true` durchgereicht wird. Der Zusatz ist der Punkt: nur ein
Wert, den die Bibliothek selbst als real vorkommend führt, also einer, den die
Datei mitgebracht hat. Ein vom Aufrufer erfundener Wert bleibt auf beiden Wegen
verwehrt, ebenso `unexpected-field-count`, `element-order-violation`,
`unknown-element` und alles auf `fatal`-Stufe. Damit gehen alle 137 echten
DSV7-Dateien durch den typisierten Writer.

### Behoben: drei kritische Fehler

#### Quadratische Laufzeit im Lexer

Die Erkennung von Zeilenendkommentaren benutzte die Regex
`/^(.*;)(\s*\(\*.*\*\)\s*)$/`. Sie ist quadratisch: Das gierige `.*;` probiert
jede Semikolonposition durch, und an jeder mit folgendem `(*` durchsucht
`.*\*\)` den restlichen Zeilentext vergeblich. Eine wohlgeformte Datei aus
vielen `;(*` ohne je ein `*)` brauchte **für 457 KB rund 37,9 Sekunden — ohne
eine einzige Diagnose**. Das ist aus der Ferne auslösbar, wenn eine Anwendung
hochgeladene Dateien parst.

Ersetzt durch einen Einzeldurchlauf ohne Regex: Kommentarende `*)` am
Zeilenende (nur Leerraum dahinter), Beginn am letztmöglichen `(*`, vor dem nur
Leerraum und davor ein `;` steht — rückwärts über `lastIndexOf`, damit dieselbe
gierige Wahl herauskommt wie zuvor. Dieselbe Datei: **4,6 Millisekunden.**

Der Effekt wächst mit der Dateigrösse, weil die alte Erkennung quadratisch in
der Zeilenlänge war — nachgemessen vervierfacht sich ihre Laufzeit bei jeder
Verdopplung. Eine 4,7 MB grosse Datei desselben Zuschnitts hätte danach rund
**70 Minuten** gebraucht; der neue Lexer liest sie in **etwa 55 Millisekunden**.

#### Die Staffelbesetzung hing am falschen Element

In der Vereinsergebnisliste wurden `STAFFELPERSON` und `STZWISCHENZEIT` über
`STAFFELERGEBNIS` aufgelöst. Die Spezifikation verankert beide an `STAFFEL`
(dsv8.md:3814-3815 und :4117-4118), und `STAFFELERGEBNIS` hat „Vorkommen 0 - N"
(dsv8.md:3936) — es darf fehlen. Ohne Ergebniszeile verlor die Projektion
deshalb die **gesamte Besetzung** und meldete je Schwimmer eine
`dangling-reference` auf eine Beziehung, die die Spezifikation nirgends
definiert. Die Daten waren danach über keinen Weg mehr erreichbar.

#### Der Writer prüfte die Elementreihenfolge nicht

`writeTypedList` und damit alle vier `write…`-Funktionen lieferten klaglos
Dateien aus, deren Elementreihenfolge die Spezifikation verletzt. Übergab man
die Records in umgekehrter Reihenfolge, entstand ohne Fehler eine Datei mit
`DATEIENDE` in Zeile 1 und `FORMAT` in der letzten — jeder fremde Leser bricht
dort ab.

Die Ursache war strukturell: Die Abschlussprüfung filterte die Befunde der
Rücklese auf `error`/`fatal`, die Milde der Leseseite ist aber durchweg als
`warning` ausgedrückt, damit echte Dateien nicht zurückgewiesen werden. **Jede
Lese-Milde wurde damit automatisch zur Schreib-Erlaubnis.** Mit durchgerutscht
sind auch eine fehlende `DATEIENDE`-Zeile und Ersetzungszeichen (U+FFFD) in
Werten.

### Breaking: `Diagnostic` führt eine Zeile statt einer Span

`Diagnostic.start` und `Diagnostic.end` vom Typ `Position` entfallen und werden
durch `Diagnostic.line: number` ersetzt, 1-basiert. `Position` wird nicht mehr
exportiert.

Die Struktur war eine Zusage, die nie eingelöst wurde: `column` war an **jeder**
der 15 Erzeugerstellen konstant `1`, und `end` glich immer `start`. Ein
Konsument konnte das nicht als Platzhalter erkennen — `d.end.column`
kompilierte und lieferte Unsinn. Vor dem Einfrieren mit 1.0 war zu wählen
zwischen echter Spaltenrechnung, also Feldoffsets durch Lexer, Parser,
Validierung und Projektion zu fädeln für eine Genauigkeit, die keine der Regeln
braucht, und einer ehrlichen Struktur.

Entschieden für die ehrliche Struktur. DSV ist zeilenorientiert; jedes Element
belegt genau eine Zeile, und Befunde wie `cardinality-violation` oder
`dangling-reference` haben gar kein Feld, an dem eine Spalte hinge. Wer eine
Editor-Markierung braucht, hebt die ganze Zeile hervor. Eine Span später zu
**ergänzen** ist additiv und bricht nichts.

Umstellung: `d.start.line` → `d.line`. `d.start.column` und `d.end` hatten nie
einen Informationswert und entfallen ersatzlos.

### Breaking: `startnummerDisqualifiziert` ist eine Zahl

Das Feld wurde als `string` projiziert, während dasselbe Konzept `startnummer`
als `number` erscheint — beide sind in der Spezifikation `Zahl`. Wer den
disqualifizierten Schwimmer gegen die Besetzung joinen wollte, verglich
`string` gegen `number`. Betrifft `VereinsergebnisStaffelPlatzierung` und
`ErgebnisPlatzierung`.

Wie bei jedem Zahlenfeld dieser Projektionen ist der Wert `NaN`, wenn das Feld
leer oder unlesbar ist. Der naheliegende Grund für `string` — „leer von 0
unterscheiden" — trägt damit nicht: `0` ist hier ein echter Wert (allgemeiner
Disqualifikationsgrund) und bleibt von `NaN` unterscheidbar. Real füllen 41 von
1574 `STERGEBNIS`-Zeilen das Feld.

### Neuer Befund `unexpected-bom`

„Die Datei wird als Textdatei ausschliesslich im UTF-8-Zeichensatz (ohne BOM)
angelegt" (dsv8.md:140). Ein BOM am Dateianfang wurde bisher stillschweigend
entfernt. Es wird weiterhin entfernt, jetzt aber als Warnung gemeldet; keine
der 142 gesammelten echten Dateien führt eines. `DiagnosticCode` bekommt dafür
einen neuen Wert — wer die Codes erschöpfend abdeckt, muss ihn ergänzen.

Eine BOM-Option beim Schreiben gibt es bewusst nicht; `docs/public-api.md`
behauptete sie fälschlich und ist berichtigt. Die Bibliothek soll nicht
anbieten, genau das zu erzeugen, was die Spezifikation untersagt.

### Breaking: Der Typ `Zahl` prüft die 32-Bit-Schranke

„Numerischer Wert ohne Vorzeichen und Dezimalzeichen (positiver Integer,
32 Bit)" (dsv8.md:265 = dsv7.md:231) — geprüft wurde davon nur die Ziffernform.
Eine zwanzigstellige Zahl kam durch; eine Schranke gab es allein, wo ein Feld
ein ausdrückliches `range` trägt, was in der Vereinsmeldeliste auf keines der
20 `Zahl`-Felder zutrifft. Ein Empfänger, der in `int32` liest, lief über.

Die Grenze ist 2³²−1 = `4294967295`: „ohne Vorzeichen" wörtlich genommen. Die
Spezifikation lässt offen, ob sie die vorzeichenlose oder die vorzeichenbehaftete
Schranke meint; die engere zu wählen hiesse, eine Beschränkung zu erfinden, die
dort nicht steht. Praktisch macht es keinen Unterschied — der grösste
Zahlenwert in den 142 gesammelten echten Dateien ist 44.150.000, keine
überschreitet auch nur die engere Grenze. Führende Nullen bleiben zulässig;
5738 Felder echter Dateien haben sie.

### Breaking: `encodeZeit`, `encodeUhrzeit` und `encodeDatum` prüfen ihre Eingabe

Die drei Codecs sind seit 0.9.0 öffentlich, gerade damit niemand die
Formatierungsregel selbst nachbaut. Keiner prüfte seine Eingabe: `encodeZeit(-1)`
ergab `"00:00:00,-1"`, `encodeZeit(NaN)` ergab `"NaN:NaN:NaN,NaN"`,
`encodeUhrzeit(1e5)` ergab `"1666:40"`, und `encodeDatum({day:31,month:2,…})`
schrieb `"31.02.2025"` — obwohl `decodeDatum` den echten Kalender prüft und den
31.02. ausdrücklich zurückweist. Alle diese Ausgaben liest der eigene Decoder
als `null`. Damit umgingen die Roh-Encoder genau den Grundsatz, den
`writeTypedList` durchsetzt.

Sie werfen jetzt `DsvWriteError`, statt `null` zu liefern. Die Symmetrie zu den
Decodern ist nur scheinbar: Ein Decoder liest **fremde** Eingabe, wo Ungültiges
der Normalfall ist und zum Ergebnis gehört. Ein Encoder bekommt den **eigenen**
Wert des Aufrufers; ist der ungültig, liegt ein Fehler im aufrufenden Programm
vor. Ein `null`-Rückgabewert zwänge jede Aufrufstelle zu einer
Fallunterscheidung für einen Fall, der nicht eintreten sollte — und die
nächstliegende Reaktion darauf, `?? ''`, verlöre den Wert stillschweigend.

Gültig sind: für `encodeZeit` ganze Zahlen von `0` bis `35999999` (`99:59:59,99`),
für `encodeUhrzeit` ganze Zahlen von `0` bis `1439` (`23:59`), für `encodeDatum`
ein wirklich existierender Kalendertag mit Jahr von `0` bis `9999`.

`DsvWriteError` liegt jetzt in `src/write/write-error.ts` statt in
`write-typed-list.ts`; der Export aus dem Paketeinstieg ist unverändert.

### Breaking: Unterlassungswerte werden in den Objektgraphen eingesetzt

`FieldDef.default` beschrieb sich als „Unterlassungswert, der gilt, wenn das
Feld nicht angegeben ist", wurde aber nirgends angewendet — 13 Felder führten
ihn, kein einziger Codepfad ausserhalb von `src/schema` las ihn. Ein
weggelassenes Feld kam als `''` im Objektgraph an, obwohl die Spezifikation
seinen Wert festlegt: `ABSCHNITT.relativeAngabe` etwa mit „Unterlassungswert
ist N." (dsv8.md:2929), real 172× leer.

Die Beschreibung war damit schlicht unwahr. Statt das Feld zu entfernen, wird
es jetzt angewendet: Der Wert steht so in der Spezifikation, und ohne ihn muss
jeder Anwender selbst wissen, dass ein leeres `relativeAngabe` `N` bedeutet —
dieselbe Begründung, aus der die Encoder öffentlich sind.

Eingesetzt wird er **allein in den Objektgraphen** unter `src/document`, nicht
in `TypedRecord.values`. Die Records sind die Grundlage des Schreibens; ein dort
eingesetzter Unterlassungswert stünde anschliessend ausgeschrieben in der Datei,
aus einem weggelassenen Feld würde ein angegebenes, und die Byte-Identität des
Durchreichewegs wäre dahin. Der Objektgraph ist ohnehin die ausgedeutete
Sicht — er löst Bezüge auf und dekodiert Zeiten.

Betroffene Felder sind `relativeAngabe` (Unterlassungswert `N`), die
Vorzeichen von Reaktions- und Ablösezeiten (`+`) sowie zwei Zeitfelder der
Vereinsmeldeliste (`00:00:00,00`). Wer bisher auf `''` geprüft hat, muss
stattdessen auf den Unterlassungswert prüfen.

### Breaking: Fehlendes Schluss-Semikolon wird gemeldet

Endete eine Attributliste ohne `;`, entstand gar kein Befund: Der Lexer verwarf
das leere Schlusselement stillschweigend. Der Code `unterminated-field-list`
war zwar deklariert, wurde aber als einziger von zwanzig nirgends erzeugt.
Spec: „Da die Attribute aber durch eine feste Reihenfolge definiert sind, muss
auf jeden Fall das Trennzeichen(;) gesetzt werden" (dsv8.md:228-229).

Die Zeile wird weiterhin vollständig gelesen, und der Befund ist bewusst nur
eine Warnung. Nachgezählt betrifft er 73 Zeilen in 3 der 142 gesammelten echten
Dateien, durchweg `STZWISCHENZEIT`; als Fehler gemeldet wiese die Bibliothek
drei echte Dateien zurück, deren Daten einwandfrei sind. Die Toleranz ist gegen
die Realität richtig — sie war nur weder markiert noch begründet noch sichtbar.

`DsvRecord` und die Lexer-Ausgabe tragen dafür ein neues Feld `terminated`. Wer
Diagnosen zählt oder auf Leerheit prüft, sieht bei diesen Dateien einen Befund
mehr. Beim Schreiben ist der Befund unzulässig; der eigene Writer terminiert
jedes Feld.

### Breaking: Der Writer verweigert jetzt spec-widrige Elementreihenfolgen

`writeTypedList` und damit alle vier `write*`-Funktionen lieferten klaglos
Dateien aus, deren Elementreihenfolge die Spezifikation verletzt. Übergab man
die Records in umgekehrter Reihenfolge, entstand ohne Fehler eine Datei mit
`DATEIENDE` in Zeile 1 und `FORMAT` in der letzten Zeile — jeder fremde Leser
bricht dort ab. Spec: „Element muss immer das erste Element in der Datei sein,
das DATEIENDE-Element muss immer das letzte Element in der Datei sein"
(dsv8.md:336-337, dsv7.md:301-302).

Die Ursache war strukturell. Die Abschlussprüfung filterte die Befunde der
Rücklese auf `error`/`fatal`; die Milde der Leseseite ist aber durchweg als
`warning` ausgedrückt, damit echte Dateien nicht zurückgewiesen werden. Jede
Lese-Milde wurde damit automatisch zur Schreib-Erlaubnis. Neben der
Elementreihenfolge rutschten so auch eine fehlende `DATEIENDE`-Zeile und
Ersetzungszeichen (U+FFFD) in Werten durch.

Die Zuordnung hängt jetzt am Diagnostic-Code statt an der Schwere und ist über
`Record<DiagnosticCode, boolean>` vollständig: Ein neuer Code lässt sich nicht
einführen, ohne zu entscheiden, ob er in eigener Ausgabe vorkommen darf.
Vorbelegung ist unzulässig. Erlaubt bleiben allein die beiden Querregeln
`invalid-value` und `conditional-field-required` auf Warnstufe — echte, vom DSV
ausgelieferte Dateien verletzen sie, und ohne diese Ausnahme liesse sich eine
eingelesene echte Datei nicht wieder ausschreiben. Die bisherige Sperre über
das Datenfeld `tolerated` entfällt; sie wird von der Einstufung des Codes
`invalid-enum-value` mit abgedeckt.

### Breaking: Staffelbesetzung hängt in der Vereinsergebnisliste an `STAFFEL`

`STAFFELPERSON` und `STZWISCHENZEIT` wurden in der Vereinsergebnisliste über
das `STAFFELERGEBNIS` aufgelöst. Die Spezifikation verankert beide aber an
`STAFFEL`: „Eindeutige numerische Kennung für die Staffel innerhalb dieser
Veranstaltung definiert in STAFFEL" (dsv8.md:3814-3815 und :4117-4118).

Das war folgenreich, weil `STAFFELERGEBNIS` „Vorkommen 0 - N" hat
(dsv8.md:3936) und fehlen darf. Ohne Ergebniszeile verlor die Projektion die
gesamte Besetzung und meldete je Schwimmer eine `dangling-reference` auf eine
Beziehung, die die Spezifikation nirgends definiert. Erreichbar war sie danach
über keinen Weg mehr.

Neu trägt `VereinsergebnisStaffel` ein Feld `besetzungen` mit je einem
`VereinsergebnisStaffelBesetzung`-Eintrag pro Wettkampf (`wettkampfnr`,
`wettkampfart`, `personen`, `zwischenzeiten`). `VereinsergebnisStaffelStart`
behält `personen` und `zwischenzeiten`; beide Wege zeigen auf dieselben
Objekte. Die `dangling-reference` beider Elemente nennt jetzt `STAFFEL` und
führt `veranstaltungsIdStaffel` statt eines Startschlüssels. Der Befund
`incomplete-relay` greift auch ohne `STAFFELERGEBNIS` und nennt dann
`STAFFELPERSON` als Element.

Die Wettkampfergebnisliste bleibt unverändert: Ihr Kapitel kennt kein
`STAFFEL`-Element, dort ist `STERGEBNIS` der korrekte Anker (dsv8.md:5553).

`STABLOESE` bleibt ebenfalls am `STAFFELERGEBNIS`. Die Spezifikation nennt für
dieses eine Element in Kapitel 5.3 als Anker „STERGEBNIS"
(dsv8.md:4174-4175) — ein Element, das es in der Vereinsergebnisliste gar nicht
gibt. Welches Element gemeint ist, lässt sich daraus nicht ableiten; solange
die Absicht unklar ist, wird das bisherige Verhalten beibehalten.

### Breaking: `qualifikationswettkampfart` toleriert kein `A`/`N` mehr

Das Feld `qualifikationswettkampfart` widersprach sich zwischen den
Listenarten: In Vereinsmeldeliste und Wettkampfdefinitionsliste liess es
zusätzlich `A` (Ausschwimmen) und `N` (Nachschwimmen) als tolerierte Werte zu,
in Wettkampfergebnis- und Vereinsergebnisliste nicht.

Richtig ist der engere Vorrat. Alle vier Wertetabellen der Spezifikation führen
für dieses Feld übereinstimmend nur `V`, `Z`, `F` und `E` (dsv8.md:1119, 1815,
3177, 4826) — aus einem Aus- oder Nachschwimmen qualifiziert man sich nicht
weiter. Die beiden abweichenden Listenarten teilten sich für dieses Feld
versehentlich die Wertekonstante des Nachbarfeldes `wettkampfart`, wo `A` und
`N` empirisch belegt und zu Recht toleriert sind; die Tolerierung schlug damit
auf ein fremdes Feld durch. Ein Realbeleg dafür existiert nicht: In allen 5629
`WETTKAMPF`-Zeilen der gesammelten echten Dateien trägt das Feld nur `V`, `Z`,
`E` oder gar nichts.

Der generierte Typ der betroffenen Felder verengt sich damit von
`'V' | 'Z' | 'F' | 'E' | 'A' | 'N'` auf `'V' | 'Z' | 'F' | 'E'`. Dateien, die
dort `A` oder `N` führen, werden beim Lesen nicht mehr stillschweigend
angenommen.

### Breaking: `A` und `N` sind eine Lücke der Vorlage, keine geduldete Abweichung

Nicht zu verwechseln mit dem Abschnitt darüber: Dort geht es um
`qualifikationswettkampfart`, hier um das Nachbarfeld `wettkampfart`.

In der Vereinsmelde- und der Wettkampfdefinitionsliste waren `A` (Ausschwimmen)
und `N` (Nachschwimmen) als `tolerated` geführt — beim Lesen eine `warning`,
beim Schreiben gesperrt. Sie sind jetzt `specGap`: beim Lesen ein `info`, beim
Schreiben zugelassen.

Die Wertetabellen dieser beiden Listenarten lassen die zwei Werte aus, schliessen
sie aber nicht aus. Ein Verbot spricht keine der beiden Fassungen aus; sämtliche
Fundstellen von „Ausschwimmen" in beiden Spezifikationen sind Zeilen von
Wertetabellen. Die Vorlage widerspricht sich bei diesem Feld ausserdem selbst:
Dasselbe Element `WERTUNG` führt `A` und `N` in der Wettkampfergebnisliste
(dsv8.md:4913-4919) und lässt sie in der Vereinsergebnisliste weg
(dsv8.md:3231-3235), obwohl beide dieselbe Veranstaltung beschreiben. Die
Tabelle der Vereinsmeldeliste (dsv8.md:1729) führt sogar nur `V` und `E` — auch
`Z` und `F` fehlen dort und gelten unbestritten. Eine Tabelle, die einen Wert
nicht nennt, verbietet ihn also nicht.

Belegt ist beides im gesammelten Bestand: `A` in
`2026-06-28-Gera-SVHaren-Me.dsv7:25`, `N` dreifach in
`dsvportal-13062024-Wk.dsv7:31-33` — Letzteres eine Ausschreibung des
DSV-Portals selbst. Könnte eine Ausschreibung die Art `A` nicht ausdrücken,
könnte ein Ausschwimmen nie in einer Ergebnisliste erscheinen, wo die
Spezifikation es ausdrücklich vorsieht.

Der Unterschied zu `tolerated` ist bewusst: Ein geduldeter Wert ist ein Mangel
der Datei und bleibt beim Schreiben gesperrt, eine Lücke der Vorlage ist keiner.
Die Strenge gegenüber echten Mängeln ändert sich nicht — etwa
`MELDEGELD.meldegeldTyp` in abweichender Schreibweise bleibt unschreibbar. Von
den 137 echten DSV7-Dateien weist der Writer auf dem Vorgabeweg jetzt 30 statt
32 zurück; die zwei hinzugekommenen sind genau die beiden oben genannten.

Wer auf `data.tolerated === true` filtert, findet `A` und `N` dort nicht mehr —
sie tragen jetzt `data.specGap === true` und die Stufe `info` statt `warning`.
Wer sie beim Schreiben bisher abfangen musste, kann das entfallen lassen.

### Behoben: doppelter Befund bei nicht unterstützter Formatversion

Eine DSV6-Datei erzeugte über die typisierten `parse…`-Funktionen zwei
identische `unsupported-format-version`-Diagnostics: `parseDsv` meldet sie
selbst, `validateDocument` bei nicht unterstützter Version noch einmal, und
beide Listen wurden aneinandergehängt. Sie erscheint jetzt genau einmal. Wer
Diagnosen zählt, sieht für DSV6-Dateien einen Befund weniger.

### Dokumentation

`docs/` ist für 1.0 neu geordnet:

- **[`docs/README.md`](docs/README.md)** ist neu und weist aus, welches Dokument
  welche Frage beantwortet und welches generiert ist.
- **[`docs/beispiele.md`](docs/beispiele.md)** ist neu: lauffähiger Code je
  Listenart und Anwendungsfall. Jede dort gezeigte Ausgabe wurde gegen den
  gebauten Stand ausgeführt und eingetragen, statt sie zu formulieren.
- **[`docs/architecture.md`](docs/architecture.md)** ist gegen `src/` neu
  geschrieben. Mehrere Zusagen sind gestrichen, weil der Code sie nicht
  einlöst: eine `JGAK`-Union, eine Referenztabelle im Schema, eine
  injizierbare Parser-Registry samt Subpath-Exports, ESLint-erzwungene
  Schichtgrenzen und ein Modul zur Offset-Rechnung. Der Abgleich gegen einen
  fremden Ruby-Parser wird nicht mehr als unabhängige zweite Lesart der
  Spezifikation geführt — jenes Projekt transkribiert dieselbe Vorlage, ein
  gemeinsamer Lesefehler bliebe also unentdeckt.
- **`docs/superpowers/`** ist nach **[`docs/history/`](docs/history/README.md)**
  gezogen. Der Inhalt bleibt erhalten — er hält fest, was verworfen wurde und
  warum —, ist aber als Baugeschichte gekennzeichnet und kein gültiger
  Ist-Stand.

Im README berichtigt: `Diagnostic.start` in einem Beispiel (das Feld gibt es
nicht mehr), eine `MELDEGELD`-Zeile, die der Writer zu Recht zurückweist, die
Zusage, `parseDsvOrThrow` werfe nur bei `fatal`, und die Behauptung, echte
DSV-Dateien seien meist ISO-8859-1 — keine einzige der 142 gesammelten ist es.

Zu `parseDsvOrThrow` genauer: Die Funktion wirft, sobald `ok` `false` ist, also
auch bei `error`. Das Verhalten bleibt so — `ok` ist der eine Erfolgsbegriff der
Bibliothek, und ein Ausgang mit `ok === false`, bei dem die Funktion trotzdem
zurückkehrt, wäre die schlechtere Zusage. Praktisch fällt der Unterschied kaum
ins Gewicht: Die schema-freie Ebene kennt oberhalb von `warning` nur
`empty-input`, `unsupported-format-version` und `missing-format-element`, und
über alle 142 gesammelten echten Dateien wirft die Funktion an genau fünf — den
fünf DSV6-Dateien. Die 28 Dateien mit einem leeren Pflichtfeld sind ein Befund
der Schemaprüfung auf der typisierten Ebene und erreichen sie nicht. Für die
typisierten `parse…`-Funktionen gibt es weiterhin bewusst keine werfende
Variante.

## 0.9.0

Diese Version friert die öffentliche Oberfläche ein. Sie ist der
Release-Kandidat vor 1.0: Alles, was hier exportiert wird, soll unter 1.0
unverändert weiterbestehen. Deshalb sammelt 0.9.0 sämtliche Umbenennungen, die
noch anstanden — **es ist die letzte Version mit Breaking Changes vor 1.0**.
Wer von 0.5.0 kommt, hat einmal Anpassungsaufwand; die Abschnitte unten nennen
zu jedem alten Namen den neuen.

Drei Dinge sichern den Freeze ab. `docs/public-api.md` führt alle 242 Exporte
mit je einer Zeile, was sie tun, und `test/public-api.test.ts` vergleicht diese
Liste mit dem, was `src/index.ts` tatsächlich exportiert. Jede Abweichung — ein
neuer Export, ein entfernter, ein umbenannter, eine geänderte Art — lässt den
Test fehlschlagen.

Die Exportnamen allein genügen aber nicht: Die Umbenennungen unten, etwa
`meldungById` → `personById` oder `meldungen` → `personen`, ändern keinen
einzigen Exportnamen und sind trotzdem Breaking Changes. Deshalb hält die
generierte `docs/public-api-surface.md` zusätzlich die **Member** jedes
erreichbaren Typs fest — 227 Typen mit jedem Feld und dessen Typ, einschliesslich
der 148 generierten Elementtypen. Jeder benannte Typ steht dort genau einmal und
genau eine Ebene tief; Verweise stehen als Name da und werden unter ihrem
eigenen Eintrag aufgelöst, damit ein umbenanntes Feld genau eine geänderte Zeile
ergibt. Neu erzeugt wird die Datei mit `npm run api-surface`,
`npm run api-surface:check` prüft sie in `npm run check` und in der CI.

Ab 1.0 ist damit jede Änderung der Oberfläche — bis auf die Feldebene — eine
bewusste Entscheidung und keine Nebenwirkung mehr.

### Breaking: alle Objektgraph-Typen tragen ihr Listenart-Präfix

Das Präfix stand bisher nur dort, wo es sonst kollidiert wäre. Welcher Graph die
nackten Namen bekam, hing allein daran, welcher zuerst geschrieben wurde —
Implementierungsgeschichte, die in die Oberfläche durchschlug. `Verein`,
`Start`, `Staffel` oder `Wettkampf` sagten nicht, zu welcher Listenart sie
gehören.

Die Regel lautet jetzt: Jeder Objektgraph-Typ trägt das Präfix seiner
Listenart. Nur die vier Wurzeltypen `Wettkampfdefinition`,
`Wettkampfergebnis`, `Vereinsmeldung` und `Vereinsergebnis` tragen keines — sie
_sind_ die Listenart.

Wettkampfdefinitionsliste (Präfix `Definition`):

| alt                | neu                          |
| ------------------ | ---------------------------- |
| `Veranstaltung`    | `DefinitionVeranstaltung`    |
| `Abschnitt`        | `DefinitionAbschnitt`        |
| `Wettkampf`        | `DefinitionWettkampf`        |
| `Wertung`          | `DefinitionWertung`          |
| `Pflichtzeit`      | `DefinitionPflichtzeit`      |
| `ProjectionResult` | `DefinitionProjectionResult` |

Wettkampfergebnisliste (Präfix `Ergebnis`):

| alt                   | neu                           |
| --------------------- | ----------------------------- |
| `Verein`              | `ErgebnisVerein`              |
| `Start`               | `ErgebnisStart`               |
| `Staffel`             | `ErgebnisStaffel`             |
| `StaffelPerson`       | `ErgebnisStaffelPerson`       |
| `Zwischenzeit`        | `ErgebnisZwischenzeit`        |
| `StaffelZwischenzeit` | `ErgebnisStaffelZwischenzeit` |
| `Reaktion`            | `ErgebnisReaktion`            |
| `Abloese`             | `ErgebnisAbloese`             |
| `Platzierung`         | `ErgebnisPlatzierung`         |
| `Kampfrichter`        | `ErgebnisKampfrichter`        |

### Breaking: `Schwimmer` heisst `ErgebnisPerson`

Die Konvention der Oberfläche lautet: DSV-Fachbegriffe in Originalschreibweise.
`Schwimmer` war der einzige erfundene Fachbegriff — die Spezifikation nennt das
Element `PERSON`, und die beiden anderen Objektgraphen nennen ihren Typ
entsprechend `MeldungPerson` und `VereinsergebnisPerson`.

| alt                               | neu                            |
| --------------------------------- | ------------------------------ |
| `Schwimmer`                       | `ErgebnisPerson`               |
| `Wettkampfergebnis.schwimmerById` | `Wettkampfergebnis.personById` |

Die Besonderheit bleibt und steht im Doc-Kommentar: Die Wettkampfergebnisliste
hat gar kein `PERSON`-Element, die Entität wird aus den denormalisierten
`PNERGEBNIS`-Zeilen aggregiert.

### Breaking: einheitliche Namen der Index-Maps

Die Index-Maps der vier Objektgraphen folgen jetzt durchgängig der Regel
`<Entität>By<Schlüssel>`: Der Name benennt die Entität, die man findet, das
Suffix das Feld, unter dem man sie findet. Die Vereinsmeldung benannte zwei
Maps nach dem Element statt nach der Entität:

| alt                                 | neu                          |
| ----------------------------------- | ---------------------------- |
| `Vereinsmeldung.meldungById`        | `Vereinsmeldung.personById`  |
| `Vereinsmeldung.staffelmeldungById` | `Vereinsmeldung.staffelById` |

`Wettkampfergebnis.staffelByKey` behält seinen abweichenden Namen: Sein
Schlüssel ist zusammengesetzt (`${veranstaltungsId}:${wettkampfnr}:${wettkampfart}`),
weil eine Wettkampfergebnisliste die Staffeln aller Vereine führt und die
`veranstaltungsId` dort nur je Wettkampf eindeutig ist. Das Suffix `ByKey`
gegenüber `ById` hält diesen Unterschied im Namen sichtbar; die Doc-Kommentare
nennen zu jeder Map jetzt zusätzlich ihren Schlüssel.

### Breaking: einheitliche Namen der Sammlungsfelder

Dieselbe Regel wie bei den Index-Maps gilt jetzt auch für die Array-Felder:
Der Name benennt die Entität, die drinsteht, nicht das DSV-Element, aus dem sie
stammt. Bis 0.5.0 stand deshalb `meldungen` (aus `PNMELDUNG`) direkt neben
`personById` — dieselbe Sache unter zwei Namen im selben Interface.

| alt                                     | neu                                     |
| --------------------------------------- | --------------------------------------- |
| `Vereinsmeldung.meldungen`              | `Vereinsmeldung.personen`               |
| `Vereinsmeldung.staffelmeldungen`       | `Vereinsmeldung.staffeln`               |
| `ErgebnisAbschnitt.kampfgericht`        | `ErgebnisAbschnitt.kampfrichter`        |
| `VereinsergebnisAbschnitt.kampfgericht` | `VereinsergebnisAbschnitt.kampfrichter` |

`kampfgericht` war derselbe Fall: Das Element heisst `KAMPFGERICHT`, die
Entität darin ist ein Kampfrichter — die Vereinsmeldung nannte dieselbe Entität
an ihrer Wurzel längst `kampfrichter`. Alle übrigen Sammlungsfelder der vier
Graphen (`abschnitte`, `wettkaempfe`, `wertungen`, `pflichtzeiten`, `starts`,
`staffelStarts`, `personen`, `staffeln`, `vereine`, `platzierungen`,
`zwischenzeiten`, `reaktionen`, `abloesen`, `einsaetze`,
`kampfrichterEinsaetze`, `trainer`, `nationalitaeten`,
`wettkaempfeOhneAbschnitt`) tragen bereits den Namen ihrer Entität und bleiben
unverändert.

### Breaking: `parseDsv` lehnt DSV6 ab

`parseDsv` war versionsblind: Eine DSV6-Datei kam ohne jeden Hinweis durch,
während `validateDocument` sie längst mit `fatal` ablehnte. Beide Ebenen sagen
jetzt dasselbe, `parseDsvOrThrow` wirft entsprechend bei DSV6.

Anders als die typisierte Ebene bricht `parseDsv` dabei nicht ab: `fatal` heisst
hier „nicht verwendbar", nicht „nichts gelesen" — die zerlegten Zeilen bleiben
zur Diagnose erhalten. Wer DSV6-Dateien bisher stillschweigend durch `parseDsv`
geschoben hat, bekommt jetzt eine `fatal`-Diagnostic und muss `result.ok`
auswerten. `version === null` bleibt der andere Fall: Ohne lesbare
Versionsangabe wäre „nicht unterstützt" eine Behauptung über eine Zahl, die es
nicht gibt.

### Neu: die Wert-Codecs sind exportiert

Der Objektgraph liefert Datumsangaben als `Datum`, Zeiten als
Hundertstelsekunden und Uhrzeiten als Minuten seit Mitternacht. Die Umwandlung
zurück in die Schreibweise des Formats war bislang intern — wer eine Zeit
anzeigen oder ein Datum zurückschreiben wollte, musste die Regel nachbauen und
traf sie mit hoher Wahrscheinlichkeit knapp daneben: führende Nullen, Komma
statt Punkt als Dezimaltrennzeichen, die volle `HH:MM:SS,hh`-Form auch
unterhalb einer Stunde.

Exportiert sind `decodeDatum`/`encodeDatum`, `decodeZeit`/`encodeZeit` und
`decodeUhrzeit`/`encodeUhrzeit`. Dazu `isZeroZeit`: `00:00:00,00` ist der
spezifizierte Unterlassungswert für „keine Zeit" und wird bewusst nicht auf
`null` abgebildet, damit beim Zurückschreiben die Unterscheidung zwischen
„nicht angegeben" und „ausdrücklich Null" erhalten bleibt.

### Neu: die generierten Elementtypen sind exportiert

Die 148 aus der Spezifikation erzeugten Elementtypen lagen bisher ungenutzt im
Paket. Sie sind jetzt exportiert, samt Doc-Kommentaren mit der Fundstelle in der
Spezifikation. Die Namen tragen durchgehend das Suffix `V7` oder `V8` und
kollidieren deshalb nicht mit den handgeschriebenen Typen des Objektgraphen.
Der Codegen deckt jetzt alle vier Listenarten ab, nicht mehr nur die
Wettkampfdefinitionsliste — Drift gegenüber der Spezifikation fällt damit
überall auf.

`dist/index.d.ts` wächst dadurch von 50,2 KB auf 139,2 KB. Der Laufzeit-Bundle
bleibt unverändert.

### Neu: publint und attw prüfen das veröffentlichte Paket

Die `types`-Condition zeigte für beide Modulsysteme auf die ESM-Deklaration, ein
CJS-Konsument bekam also Typen, die sich als ESM ausgeben (attw `FalseESM`,
publint-Warnung). Die Typen sind jetzt je Condition getrennt, `require` zeigt
auf die `.d.cts`, die tsup ohnehin erzeugt. Beide Werkzeuge laufen in
`npm run check` und in der CI nach dem Build.

### Erprobung und Dokumentation

- **Robustheit**: Ein neuer Test hält abgeschnittene Zeilen, falsche Feldzahlen,
  leere und reine Kommentardateien, BOM, gemischte Zeilenenden,
  Mehrmegabyte-Zeilen, fehlenden Zeilenumbruch am Ende, alleinstehendes
  `DATEIENDE`, Null-Bytes, Ersetzungszeichen, reine Semikolonzeilen und
  Sonderzeichen in Elementnamen fest — je gegen alle vier typisierten Parser,
  die schema-freie Ebene, die Projektionen und den Round-Trip. Kein Eingabefall
  wirft, keiner ist langsam.
- **Benchmark**: `docs/benchmark.md` hält die Zahlen für schema-freies Parsen,
  typisiertes Parsen, Schreiben und Projektion fest — über eine synthetische
  50-MB-Liste und über realistische 14.000 Zeilen. Dokumentiert ist auch der
  rund zehnfache Speicherbedarf gegenüber der Eingabe; er folgt daraus, dass der
  Rohtext für das byte-identische Schreiben mitgeführt wird.
- **README**: neu gegliedert aus der Anwendungsperspektive statt aus der
  Entstehungsgeschichte — Schnellstart, die Wahl zwischen den beiden Ebenen, je
  ein Abschnitt mit vollständigem Beispiel pro Listenart. Dazu Diagnostics samt
  Severity-Tabelle, und die Grenzen: kein DSV6, keine ZIP-Variante, keine
  Meldegeldberechnung, keine Konvertierung zwischen den Formatversionen.

## 0.5.0

Diese Version bringt keine neue Funktion, sondern **Verlässlichkeit**: Die
Unterscheidung zwischen DSV7 und DSV8 wurde vollständig überprüft, und die
Vereinsmeldeliste hat zum ersten Mal echte Dateien gesehen. Beides hat Fehler
zutage gefördert, die Nutzerinnen und Nutzer unmittelbar betreffen — vor allem
beim Geschlechtswert `D = divers`. Die öffentliche API ist gegenüber 0.4.0
**unverändert**; `src/index.ts` ist byte-identisch.

### Behoben: vier falsche DSV8-Markierungen bei `divers`

Die Bibliothek unterscheidet, welche Werte es erst ab DSV8 gibt. Ein
zeilenweiser Abgleich der DSV7- und DSV8-Spezifikation über alle vier
Listenarten hat gezeigt, dass `D = divers` in DSV7 **inkonsistent** vorhanden
ist — und dass die Markierungen das an vier Stellen falsch abgebildet haben.

Drei Stellen waren fälschlich als DSV8-neu markiert. Dort hat die Bibliothek
**gültige DSV7-Dateien beanstandet**:

- `PNMELDUNG.geschlecht` der Vereinsmeldeliste (dsv7.md:2070)
- `PERSON.geschlecht` und `STAFFELPERSON.geschlecht` der Vereinsergebnisliste
  (dsv7.md:3260, dsv7.md:3731)
- `WETTKAMPF.geschlecht` der Wettkampfergebnisliste (dsv7.md:4636)

Wer DSV7-Dateien mit `D` an diesen Stellen liest, bekommt die Warnung jetzt
nicht mehr. Die Werte waren immer schon gültig.

Eine Stelle war **nicht** markiert, obwohl sie es hätte sein müssen:
`WERTUNG.geschlecht` der Wettkampfergebnisliste führt in DSV7 nur `M`, `W`, `X`
(dsv7.md:4775–4778), erst DSV8 ergänzt `divers` (dsv8.md:4942). Eine DSV7-Datei
mit DSV8-Inhalt wurde dort stillschweigend angenommen — die Richtung, die
tatsächlich Korrektheit kostet. Sie wird jetzt beanstandet.

Damit sich das nicht wiederholt, hält ein neuer Test das **vollständige Delta**
zwischen DSV7 und DSV8 für alle vier Listenarten fest und verlangt Gleichheit in
beide Richtungen: Weder eine überzählige noch eine fehlende Markierung bleibt
unbemerkt. Je Listenart gibt es zusätzlich eine Gegenprobe aus drei Dateien —
dieselbe Datei ohne DSV8-Inhalt (gültig als DSV7), mit DSV8-Inhalt (gültig als
DSV8) und mit DSV8-Inhalt als DSV7 deklariert (wird beanstandet). Die letzten
beiden sind zeilengleich bis auf die Versionsnummer, und ein Test prüft genau
das.

### Behoben: kein Qualifikationswettkampf in der Vereinsmeldeliste

Die Spezifikation verlangt bei Wettkampfart `Z` oder `F` die Nummer des
qualifizierenden Wettkampfes (dsv8.md:1793). Diese Regel beschreibt den
**Ergebnisfall, nicht den Meldefall**: Eine Vereinsmeldung entsteht vor der
Veranstaltung, also bevor sich überhaupt jemand qualifizieren konnte, und `F`
bezeichnet dort einen direkt ausgeschriebenen Endlauf.

Gemessen an den 34 echten Vereinsmeldelisten schlug die Regel bei **allen 170
Wettkämpfen der Art `F` an, also zu 100 %** — und in keiner Datei existiert
unter derselben Nummer ein Vor- oder Zwischenlauf, auf den verwiesen werden
könnte. Die Regel gilt für die Vereinsmeldeliste deshalb nicht mehr. Für die
übrigen drei Listenarten bleibt sie unverändert in Kraft.

Über alle 142 echten Dateien sinkt die Zahl der Diagnostics dadurch von 368 auf
198; alle 170 entfallenen Warnungen stammen aus Vereinsmeldelisten.

### Behoben: Wettkampfart `A` in der Vereinsmeldeliste

Die Wertetabelle der Vereinsmeldeliste nennt nur `V` und `E`, die Ergebnislisten
dagegen auch `A` (Ausschwimmen) und `N` (dsv8.md:3058). Eine echte Datei nutzt
`A`. Das ist eine Lücke der Vorlage, kein Mangel der Datei — beide Werte werden
jetzt wie in der Wettkampfdefinitionsliste toleriert.

### Erprobung: 34 echte Vereinsmeldelisten

Für diese Listenart gab es bis 0.4.0 **keine einzige echte Datei**; das Schema
war ausschliesslich gegen die Spezifikation gebaut. Die erste Konfrontation mit
der Wirklichkeit verlief ohne Beanstandung: kein `fatal`, kein `error`,
Feldanzahlen exakt wie im Schema, und alle 34 Dateien schreiben sich
byte-identisch zurück. Die Versionsmarkierungen haben sich dabei bestätigt — in
DSV7 hat `VEREIN` vier Felder statt fünf, `KARIMELDUNG` drei statt vier und
`TRAINER` zwei statt drei.

Mit diesen Dateien kommt ein **fünfter Erzeuger-Dialekt** hinzu: WebClub 1.76.
Er schreibt Kommentare nur in eigenen Zeilen, nie am Zeilenende, und setzt die
Trennzeichen immer vollständig — EasyWk lässt sie in etwa 40 % der Zeilen weg.
Der Bestand an echten Testdateien wächst damit auf **142**.

### Zu beachten

Die API ist unverändert, das Verhalten ändert sich an drei Stellen:

- DSV7-Dateien mit `divers` an den drei oben genannten Stellen erzeugen **keine
  Warnung mehr**. Wer Diagnostics auszählt, sieht weniger.
- DSV7-Dateien mit `divers` an `WERTUNG.geschlecht` der Wettkampfergebnisliste
  erzeugen **neu** eine Beanstandung. Das ist die einzige Verschärfung dieser
  Version; betroffen sind nur Dateien, die sich als DSV7 ausgeben und
  DSV8-Inhalt tragen.
- Vereinsmeldelisten erzeugen keine `conditional-field-required`-Warnung zum
  Qualifikationswettkampf mehr.

Alle drei Änderungen betreffen ausschliesslich Diagnostics. Gelesene Records,
Objektgraphen und geschriebene Dateien bleiben identisch.

## 0.4.0

Die beiden Vereinslisten sind jetzt typisiert — damit sind **alle vier
Listenarten** des DSV-Standards vollständig erschlossen. Wer bisher nur
Veranstalterdateien typisiert lesen konnte, bekommt nun dieselbe Ebene für die
Vereinsseite: die Meldung, die ein Verein abgibt, und das Protokoll, das er
zurückbekommt. Die schema-freie Ebene aus 0.1.0 sowie die beiden
Wettkampflisten aus 0.2.0 und 0.3.0 bleiben unverändert gültig.

### Enthalten

- `parseVereinsmeldeliste(text)`, `writeVereinsmeldeliste(records, options)` und
  `projectVereinsmeldeliste(liste)`. Alle 17 Elemente der Vereinsmeldeliste sind
  mit Feldnamen, Datentypen, Pflichtangaben, Aufzählungswerten und
  Kardinalitäten beschrieben. Der Objektgraph hängt Meldungen an ihre Person,
  Personen an ihren Trainer und Staffelbesetzungen an ihre Staffelmeldung; dazu
  Index-Maps über Wettkampf, Abschnitt, Meldung, Staffelmeldung, Kampfrichter
  und Trainer
- `parseVereinsergebnisliste(text)`, `writeVereinsergebnisliste(records, options)`
  und `projectVereinsergebnisliste(liste)`. Alle 20 Elemente der
  Vereinsergebnisliste sind beschrieben. Der Objektgraph verbindet Personen mit
  ihren Starts, Starts mit Platzierungen, Zwischenzeiten und Reaktionszeiten,
  Staffeln mit ihrer Besetzung und den Ablösezeiten
- Anders als die Wettkampfergebnisliste kennt die Vereinsergebnisliste `PERSON`
  als eigenes Element. Die Person muss deshalb nicht aus den Ergebniszeilen
  zusammengesetzt werden — sie steht in der Datei. Die Typnamen tragen darum je
  Listenart ein Präfix (`Vereinsergebnis…`, `Meldung…`): Dieselben Begriffe sind
  je Listenart anders modelliert
- Neue Regel: Bei gemischten Wettkämpfen (Geschlecht `X`) ist als Zuordnung zur
  Bestenliste `SW` anzugeben. Gemeldet als **Warnung**, nicht als Fehler — siehe
  unten
- Neue Regel: Die Wertungs-ID eines Ergebnisses muss auf eine Wertung des
  eigenen Wettkampfs zeigen. Ein Fremdbezug wird als `dangling-reference`
  gemeldet
- `SB10` wird als Startklasse für Brust jetzt akzeptiert. Der Werteliste der
  Spezifikation fehlt `SB10`, während `S10` und `SM10` bei den beiden anderen
  Startklassen stehen — eine Lücke der Vorlage, kein Verbot. Der Wert wird
  gelesen und geschrieben und erzeugt eine Diagnostic der Severity `info`

### Behoben

- Die elementübergreifenden Regeln hingen an festen Feldpositionen und an
  aufgezählten Elementnamen. In der Vereinsergebnisliste heissen dieselben
  Elemente anders (`PERSONENERGEBNIS`/`STAFFELERGEBNIS` statt
  `PNERGEBNIS`/`STERGEBNIS`) und die Felder liegen an anderer Stelle — die
  Regeln griffen dort **gar nicht**. Sie binden jetzt zur Laufzeit über
  Feldnamen an das Schema der jeweiligen Listenart. Dabei kam ein zweiter Fehler
  heraus: Die Regel zum Qualifikationswettkampf las Feldindex 9. Die
  Vereinsmeldeliste kennt kein Feld `zuordnungBestenliste`, dort steht an dieser
  Stelle die Qualifikationsart — die Regel prüfte also das falsche Feld
- `Wettkampfdefinitionsliste` und `Wettkampfergebnisliste` waren seit dem
  Zusammenlegen von Parser und Writer in 0.3.0 strukturgleich und damit
  wechselseitig zuweisbar: `projectWettkampfdefinitionsliste(ergebnisliste)`
  kam durch den Compiler. `TypedList` trägt jetzt einen Typparameter für die
  Listenart, getragen von einem optionalen Phantomfeld, das nie gesetzt wird und
  zur Laufzeit nicht existiert. Das Verhalten ändert sich dadurch nicht

### Zu beachten: die Typunterscheidung ist strenger

Die Wiederherstellung der Typunterscheidung ist **nur auf Typebene** sichtbar —
zur Laufzeit ändert sich nichts, und `src/index.ts` ist gegenüber 0.3.0 rein
additiv. Für TypeScript-Nutzer gibt es aber zwei sichtbare Effekte:

- Code, der eine Ergebnisliste an eine Definitionslisten-Funktion übergab,
  kompiliert nicht mehr. Das war schon in 0.3.0 falsch und lieferte einen
  Objektgraph aus fehlgedeuteten Feldern; der Compiler hat es nur nicht bemerkt.
- Wer eine Liste mit dem seit 0.3.0 öffentlichen Typ `TypedList` **ohne**
  Typargument annotiert und dann an eine listenartspezifische Funktion
  weiterreicht, bekommt jetzt ebenfalls einen Fehler. Das trifft auch Code, der
  vorher korrekt war. Abhilfe: den passenden Alias verwenden
  (`Wettkampfergebnisliste`) oder das Typargument angeben
  (`TypedList<'Wettkampfergebnisliste'>`).

Streng nach SemVer ist der zweite Punkt ein Breaking Change auf Quellcode-Ebene.
Er wird hier trotzdem in einem Minor-Release ausgeliefert: Das Paket steht in
`0.x`, wo die öffentliche Schnittstelle laut SemVer ausdrücklich noch nicht
stabilisiert ist, die Laufzeit ist nicht betroffen, ein Build bricht sofort und
sichtbar statt still falsche Ergebnisse zu liefern, und die Behebung ist eine
Textänderung an der Typannotation.

### Was echte Dateien auslösen

- **Gemischte Wettkämpfe.** Von den 244 Wettkämpfen mit Geschlecht `X` in den
  echten Dateien halten sich nur 170 an die Vorgabe `SW`. Die übrigen 74 tragen
  `KG` (33×, kindgerechte Wettkämpfe) oder `MS` (41×, Masters) — beides fachlich
  sinnvolle Zuordnungen, die die Regel der Spezifikation so nicht vorsieht. Als
  Fehler gemeldet wiese die Bibliothek Protokolle zurück, die real im Umlauf
  sind. Deshalb ist es eine Warnung.
- **Wertungs-ID.** Umgekehrt bei der zweiten neuen Regel: Alle 97.330 Ergebnisse
  der 72 echten Wettkampfergebnislisten zeigen auf eine Wertung ihres eigenen
  Wettkampfs — kein einziger Verstoss. Eine Regel, die an so vielen echten
  Datensätzen ausnahmslos gilt, darf ein Fehler sein.

Beide Zahlen erklären, warum auch weitgehend fehlerfreie Dateien Befunde
erzeugen: Die Warnung zur Bestenliste feuert bei knapp einem Drittel der
gemischten Wettkämpfe, und das ist kein Mangel der Dateien, sondern eine Regel
der Spezifikation, an die sich die Praxis nicht hält.

### Geprüft

1358 Tests. Der byte-identische Round-Trip aus 0.1.0 gilt unverändert über alle
echten Wettkampfdateien.

## 0.3.0

Die Wettkampfergebnisliste ist jetzt vollständig typisiert. Damit ist die
interessanteste Listenart erschlossen: Wer bisher Ergebnisse aus nummerierten
Feldern zusammensuchen musste, bekommt nun benannte Felder, geprüfte Werte und
einen Objektgraph, in dem Starts, Platzierungen, Zwischenzeiten und Staffeln
bereits zusammenhängen. Die schema-freie Ebene aus 0.1.0 und die
Wettkampfdefinitionsliste aus 0.2.0 bleiben unverändert gültig.

### Enthalten

- `parseWettkampfergebnisliste(text)` liefert typisierte Records: Feldwerte
  stehen unter ihrem Schema-Namen statt unter einem Index
- `writeWettkampfergebnisliste(records, options)` schreibt aus typisierten
  Records kanonisch zurück und validiert dabei streng — wie bei der
  Definitionsliste verhindert hier, was beim Lesen nur eine Warnung war, das
  Schreiben
- `projectWettkampfergebnisliste(liste)` baut einen Objektgraph: Abschnitte mit
  Kampfgericht und Wettkämpfen, Wettkämpfe mit ihren Wertungen, Starts und
  Staffeln, Starts mit ihren Platzierungen, Zwischenzeiten und Reaktionszeiten.
  Dazu Index-Maps über Wettkampf, Wertung, Abschnitt, Verein, Start, Staffel und
  Schwimmer
- Alle 18 Elemente der Wettkampfergebnisliste sind mit Feldnamen, Datentypen,
  Pflichtangaben, Aufzählungswerten und Kardinalitäten beschrieben
- Die Entität `Schwimmer` steht so in keiner Datei: Die Ergebnisliste kennt nur
  einen denormalisierten Flachsatz, der dieselbe Person je Wertung wiederholt.
  Der Objektgraph fasst diese Zeilen zu einem `Start` je Person und Wettkampf
  zusammen; die Wertungen hängen als `Platzierung` daran
- Neue Querregel: Ist ein Grund der Nichtwertung gesetzt, muss der Platz 0 sein
- Neue Warnung `incomplete-relay` für Staffeln, die einige, aber nicht alle
  Teilnehmenden nennen
- Parser und Writer arbeiten intern listenartunabhängig (`parseTypedList`,
  `writeTypedList`); beide Listenarten sind nur noch dünne Wrapper darüber. Neu
  öffentlich ist der Typ `TypedList`

### Behoben

- Der Objektgraph verdoppelte die Mitglieder einer Staffel, wenn diese in
  mehreren Wertungen platziert war: Eine Viererstaffel erschien mit acht
  Personen, Zwischenzeiten entsprechend doppelt. In den echten Dateien betraf
  das 72 Staffeln und 57 mit doppelten Zwischenzeiten; nach dem Fix bleibt keine
  einzige übrig

### Was echte Dateien auslösen

Diese Befunde stammen aus 72 echten Wettkampfergebnislisten und erklären, warum
auch weitgehend fehlerfreie Dateien Befunde erzeugen:

- Alle 72 Dateien werden ohne einen einzigen `fatal`-Befund gelesen. 48 von
  ihnen validieren ganz ohne Fehler; die übrigen 24 haben ausschliesslich leere
  Pflichtfelder (`missing-required-field`, 49 Fälle) — ein echter Mangel der
  Dateien, kein Formatdialekt. Mit Abstand am häufigsten fehlt der Verein des
  Kampfrichters: 35 der 49 Fälle, verteilt auf 15 Dateien. Der Rest verteilt
  sich auf das Nationenkürzel des Vereins (7 Fälle in 6 Dateien) und einzelne
  Angaben zu Ausrichter und Veranstalter.
- Die Regel „bei Nichtwertung Platz 0" halten die echten Dateien ausnahmslos
  ein: 10.865 Zeilen tragen einen Grund der Nichtwertung, keine einzige weicht
  ab. Deshalb ist der Verstoss ein Fehler und keine Warnung.
- 46 Prozent aller Wertungen tragen keinen einzigen Ergebnissatz — 7860 von
  16.989 in den 48 fehlerfreien Dateien. Die Spezifikation verlangt für jede
  definierte Wertung eine Platzierung, doch das ist die Arbeitsweise der
  Ausschreibung: Sie erzeugt das volle Kreuzprodukt aus Jahrgang und
  Geschlecht, und die meisten dieser Klassen bekommen nie eine Meldung. Die
  leere Wertung ist der Normalfall. Eine Warnung, die 7860 mal feuert und die
  niemand abstellen kann, wäre Lärm — deshalb wird die Regel **bewusst nicht**
  geprüft.
- Die Identität einer Staffel ist das Tripel aus Veranstaltungs-ID,
  Wettkampfnummer und Wettkampfart, nicht die ID allein: In den 48 fehlerfreien
  Dateien starten 152 Staffelkennungen in mehr als einem Wettkampf. Eine
  Auflösung über die ID allein hätte diese Mannschaften miteinander vermengt.
- Die Vereinskennzahl `0` kennzeichnet Vereine ausserhalb des DSV. Sie ist kein
  Schlüssel und bleibt deshalb aus `vereinByKennzahl` heraus.

### Geprüft

1153 Tests. Die Befunde oben sind an den 72 echten Wettkampfergebnislisten
nachgerechnet; der byte-identische Round-Trip aus 0.1.0 gilt unverändert über
alle 108 echten Wettkampfdateien.

### Breaking

Keine. Alle Exporte aus 0.2.0 bestehen unverändert fort; `src/index.ts` ist
gegenüber `v0.2.0` reiner Zuwachs. Drei Punkte, die bei sehr strenger Auslegung
auffallen können:

- `Wettkampfdefinitionsliste` war ein eigenes `interface` und ist jetzt ein
  Alias auf den gemeinsamen Typ `TypedList`. Die Gestalt ist Feld für Feld
  dieselbe (`listenart`, `version`, `records`, `document`), Zuweisungen und
  `extends` funktionieren unverändert. Sichtbar wird der Unterschied nur an zwei
  Stellen: Ein `declare module`-Merge auf das frühere Interface geht nicht mehr,
  und Definitions- und Ergebnisliste sind nun wechselseitig zuweisbar — ein
  Versehen wie `projectWettkampfdefinitionsliste(ergebnisliste)` fängt der
  Compiler nicht mehr ab, sondern erst die Auswertung zur Laufzeit.
- `TypedRecord` wird jetzt aus `parse-typed-list.js` exportiert. Über den
  Paket-Einstiegspunkt ändert sich nichts, und der frühere Pfad re-exportiert
  den Typ weiterhin.
- `DiagnosticCode` hat die Variante `incomplete-relay` bekommen. Wer über den
  Typ erschöpfend `switch`t, muss den neuen Fall abdecken.

## 0.2.0

Die Wettkampfdefinitionsliste ist jetzt vollständig typisiert. Wer bisher nur
Records mit nummerierten Feldern in der Hand hatte, bekommt nun benannte Felder,
geprüfte Werte und einen Objektgraph mit aufgelösten Bezügen. Die schema-freie
Ebene aus 0.1.0 bleibt unverändert gültig und weiterhin für alle vier
Listenarten zuständig.

### Enthalten

- `parseWettkampfdefinitionsliste(text)` liefert typisierte Records: Feldwerte
  stehen unter ihrem Schema-Namen statt unter einem Index
- `writeWettkampfdefinitionsliste(records, options)` schreibt aus typisierten
  Records kanonisch zurück und validiert dabei streng — was beim Lesen nur eine
  Warnung war, verhindert hier das Schreiben
- `projectWettkampfdefinitionsliste(liste)` baut einen Objektgraph: Abschnitte
  mit ihren Wettkämpfen, Wettkämpfe mit ihren Wertungen und Pflichtzeiten, dazu
  Index-Maps über Wettkampf, Wertung und Abschnitt. Datum, Uhrzeit und Zeit sind
  dekodiert, alle übrigen Werte bleiben Zeichenketten
- Alle 19 Elemente der Wettkampfdefinitionsliste sind mit Feldnamen, Datentypen,
  Pflichtangaben, Aufzählungswerten und Kardinalitäten beschrieben
- Validiert werden Feldanzahl, Pflichtfelder, Werttypen, Aufzählungswerte,
  Zahlenbereiche, Kardinalitäten und elementübergreifende Regeln
- Versionsabhängigkeit: einzelne Felder, ganze Elemente und einzelne
  Aufzählungswerte können erst ab DSV8 gelten. Eine DSV7-Datei mit DSV8-Inhalten
  wird beanstandet
- DSV6 wird bereits auf Schema-Ebene mit `fatal` abgelehnt
- Aufzählungsfelder erscheinen in den generierten Typen als
  String-Literal-Union statt als `string`, ebenfalls versionsabhängig
- Ein Wettkampf wird über das Paar aus Nummer und Art identifiziert, nicht über
  die Nummer allein — dieselbe Nummer kommt regelmässig als Vorlauf und als
  Entscheidung vor

### Behoben

- Datumsangaben werden gegen den Kalender geprüft: der 31. Februar wird
  abgelehnt, nicht mehr stillschweigend übernommen

### Was echte Dateien auslösen

Diese Befunde stammen aus 31 echten Wettkampfdefinitionslisten und erklären,
warum auch fehlerfreie Dateien Warnungen erzeugen können:

- 27 der 31 Dateien validieren ohne einen einzigen Fehler. Die übrigen vier
  haben ein leeres Pflichtfeld `BESONDERES.anmerkungen` — ein echter Mangel der
  Dateien, kein Formatdialekt, und deshalb ein Fehler.
- Eine Ausschreibung schreibt die Wettkampfart `N` für Nachschwimmen, obwohl die
  Spezifikation `A` und `N` nur in Ergebnislisten vorsieht. Solche Werte sind im
  Schema ausdrücklich als toleriert markiert: beim Lesen gibt es eine Warnung,
  beim Schreiben sind sie unzulässig. <sup>[1]</sup>

- 22 von 67 Zwischenläufen und Finals nennen keine
  Qualifikationswettkampfnummer, obwohl die Spezifikation sie verlangt. Weil das
  in der Praxis verbreitet ist, gibt es eine Warnung statt eines Fehlers.
- Zwei Dateien enthalten Verweise, bei denen die Wettkampfnummer stimmt, die
  Wettkampfart aber nicht — genau die Fehlerklasse, die eine Auflösung über die
  Nummer allein verschluckt hätte.

#### Richtigstellung

<sup>[1]</sup> Dieser Punkt schrieb ursprünglich die Wettkampfart `N` „dem
DSV-Portal" zu. Das war falsch und wurde nachträglich korrigiert. Die Datei
`dsvportal-13062024-Wk.dsv7` trägt das Präfix nur, weil sie von dort
heruntergeladen wurde; ihr `ERZEUGER`-Element weist **EasyWk 5.25** als
schreibende Software aus. Über welche Software das DSV-Portal Dateien ausgibt,
lässt der Bestand nicht erkennen.

Ausserdem war die Formulierung zu breit: Von den geprüften echten Dateien
schreibt genau eine Ausschreibung ein `N` (dreimal), und `A` kommt gar nicht in
einer Ausschreibung vor, sondern einmal in einer Ergebnisliste. Die Toleranz im
Schema bleibt davon unberührt, nur die Begründung war es nicht.

### Geprüft

893 Tests. Die Befunde oben sind an den 31 echten Wettkampfdefinitionslisten
nachgerechnet; der byte-identische Round-Trip aus 0.1.0 gilt unverändert über
alle 108 echten Wettkampfdateien.

### Breaking

Keine. Alle Exporte aus 0.1.0 — `parseDsv`, `parseDsvOrThrow`, `DsvParseError`,
`writeDsv` samt zugehörigen Typen — bestehen unverändert fort; ihre Signaturen
und die Gestalt von `DsvDocument` sind gleich geblieben. Zwei Punkte, die bei
sehr strenger Auslegung auffallen können:

- `DiagnosticCode` hat neue Varianten bekommen. Wer über den Typ erschöpfend
  `switch`t, muss die neuen Fälle abdecken.
- `parseDsv` meldet neu `element-order-violation` als Warnung, wenn `DATEIENDE`
  nicht das letzte Element ist. Dateien, die bisher ohne Diagnostics durchliefen,
  können dadurch eine Warnung erzeugen; `ok` bleibt davon unberührt.

## 0.1.0

Erste nutzbare Fassung. Liest DSV-Dateien aller vier Listenarten zeilenweise in
Records und schreibt sie byte-identisch zurück — einschliesslich BOM,
Zeilenenden, Kommentaren und Leerzeichen um Werte.

Noch ohne Schema-Validierung und ohne typisierte Listenarten; beides folgt ab
0.2.0.

### Enthalten

- `parseDsv(text)` liefert Dokument, Diagnostics und `ok`
- `parseDsvOrThrow(text)` wirft stattdessen einen `DsvParseError`
- `writeDsv(document)` schreibt ein unverändertes Dokument byte-identisch zurück
- Diagnostics mit Code, Severity und 1-basierter Position statt Ausnahmen beim
  Lesen

### Geprüft

Der Round-Trip ist über 108 echte, anonymisierte Wettkampfdateien byte-identisch.
Ein Mutationsdurchlauf über 33 eingebaute Fehler wird vollständig von der
Testsuite gefangen.

### Breaking

Die Platzhalter `parseLine`, `formatLine`, `DSV_FORMATS`, `FIELD_SEPARATOR` und
der Typ `DsvFormat` sind entfallen.
