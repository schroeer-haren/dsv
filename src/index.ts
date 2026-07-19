/**
 * @schroeer-haren/dsv
 *
 * Liest und schreibt Dateien im DSV-Standard des Deutschen Schwimm-Verbands.
 *
 * Die schema-freie Ebene (`parseDsv`, `writeDsv`) zerlegt jede Datei in Records
 * und schreibt sie byte-identisch zurück, prüft aber weder Feldtypen noch
 * Kardinalitäten. Darauf setzt die typisierte Ebene auf, für die
 * Wettkampfdefinitionsliste, die Wettkampfergebnisliste, die Vereinsmeldeliste
 * und die Vereinsergebnisliste.
 */

export { parseDsv, parseDsvOrThrow, DsvParseError } from './parse/parse-dsv.js';
export { parseWettkampfdefinitionsliste } from './parse/parse-wettkampfdefinitionsliste.js';
export { parseWettkampfergebnisliste } from './parse/parse-wettkampfergebnisliste.js';
export { parseVereinsmeldeliste } from './parse/parse-vereinsmeldeliste.js';
export { parseVereinsergebnisliste } from './parse/parse-vereinsergebnisliste.js';
export { projectWettkampfdefinitionsliste } from './document/wettkampfdefinitionsliste.js';
export { projectWettkampfergebnisliste } from './document/wettkampfergebnisliste.js';
export { projectVereinsergebnisliste } from './document/vereinsergebnisliste.js';
export { projectVereinsmeldeliste } from './document/vereinsmeldeliste.js';
export { writeDsv } from './write/write-dsv.js';
export {
  writeWettkampfdefinitionsliste,
  DsvWriteError,
} from './write/write-wettkampfdefinitionsliste.js';
export { writeWettkampfergebnisliste } from './write/write-wettkampfergebnisliste.js';
export { writeVereinsmeldeliste } from './write/write-vereinsmeldeliste.js';
export { writeVereinsergebnisliste } from './write/write-vereinsergebnisliste.js';

/**
 * Der ausdrückliche Weg, eine eingelesene Datei mit einem vorbestehenden Mangel
 * wieder auszuschreiben.
 *
 * Echte Dateien lassen ein Pflichtfeld leer — 28 der 142 gesammelten tun das.
 * Der strenge Vorgabeweg verweigert sie deshalb, obwohl der Anwender den Mangel
 * weder verursacht noch berührt hat. Diese Fassungen reichen ihn unverändert
 * weiter und geben statt eines Textes ein `WriteResult`: Was durchgereicht
 * wurde, steht in `preservedDefects`, und daran kommt kein Aufrufer vorbei.
 * Alles, was die Datei unlesbar machen würde, bleibt auch hier verwehrt.
 */
export { writeWettkampfdefinitionslistePreservingDefects } from './write/write-wettkampfdefinitionsliste.js';
export { writeWettkampfergebnislistePreservingDefects } from './write/write-wettkampfergebnisliste.js';
export { writeVereinsmeldelistePreservingDefects } from './write/write-vereinsmeldeliste.js';
export { writeVereinsergebnislistePreservingDefects } from './write/write-vereinsergebnisliste.js';

export type { WriteOptions, WriteResult } from './write/write-wettkampfdefinitionsliste.js';

export type { TypedRecord, TypedList } from './parse/parse-typed-list.js';
export type { Wettkampfdefinitionsliste } from './parse/parse-wettkampfdefinitionsliste.js';
export type { Wettkampfergebnisliste } from './parse/parse-wettkampfergebnisliste.js';
export type { Vereinsmeldeliste } from './parse/parse-vereinsmeldeliste.js';
export type { Vereinsergebnisliste } from './parse/parse-vereinsergebnisliste.js';
export type { FormatVersion } from './validate/format-version.js';

/**
 * Der Objektgraph der Wettkampfdefinitionsliste. Wie in allen vier Graphen
 * trägt jeder Typ das Präfix seiner Listenart — hier `Definition`.
 */
export type {
  DefinitionAbschnitt,
  DefinitionPflichtzeit,
  DefinitionProjectionResult,
  DefinitionVeranstaltung,
  DefinitionWertung,
  DefinitionWettkampf,
  Wettkampfdefinition,
} from './document/wettkampfdefinitionsliste.js';
/**
 * Der Objektgraph der Ergebnisliste, Präfix `Ergebnis`. Das Präfix ist keine
 * Kollisionsvermeidung, sondern eine Aussage: Dieselben Begriffe sind je
 * Listenart anders modelliert — ABSCHNITT etwa führt in der Definitionsliste
 * sechs Felder und hier vier.
 */
export type {
  ErgebnisAbloese,
  ErgebnisAbschnitt,
  ErgebnisKampfrichter,
  ErgebnisPerson,
  ErgebnisPlatzierung,
  ErgebnisProjectionResult,
  ErgebnisReaktion,
  ErgebnisStaffel,
  ErgebnisStaffelPerson,
  ErgebnisStaffelZwischenzeit,
  ErgebnisStart,
  ErgebnisVeranstaltung,
  ErgebnisVerein,
  ErgebnisWertung,
  ErgebnisWettkampf,
  ErgebnisZwischenzeit,
  Wettkampfergebnis,
} from './document/wettkampfergebnisliste.js';
/**
 * Der Objektgraph der Vereinsergebnisliste. Auch hier tragen die Namen ein
 * Präfix: Dieselben Begriffe sind je Listenart anders modelliert — die
 * Vereinsergebnisliste kennt PERSON als eigene Entität, die
 * Wettkampfergebnisliste nicht.
 */
export type {
  Vereinsergebnis,
  VereinsergebnisAbloese,
  VereinsergebnisAbschnitt,
  VereinsergebnisKampfrichter,
  VereinsergebnisPerson,
  VereinsergebnisPlatzierung,
  VereinsergebnisProjectionResult,
  VereinsergebnisReaktion,
  VereinsergebnisStaffel,
  VereinsergebnisStaffelBesetzung,
  VereinsergebnisStaffelPerson,
  VereinsergebnisStaffelPlatzierung,
  VereinsergebnisStaffelStart,
  VereinsergebnisStaffelZwischenzeit,
  VereinsergebnisStart,
  VereinsergebnisVeranstaltung,
  VereinsergebnisVerein,
  VereinsergebnisWertung,
  VereinsergebnisWettkampf,
  VereinsergebnisZwischenzeit,
} from './document/vereinsergebnisliste.js';
/**
 * Der Objektgraph der Vereinsmeldeliste. Sie ist eine Meldung, kein Ergebnis —
 * die Namen tragen deshalb das Präfix `Meldung`.
 */
export type {
  MeldungAbschnitt,
  MeldungAnsprechpartner,
  MeldungHandicap,
  MeldungKampfrichter,
  MeldungKampfrichterEinsatz,
  MeldungPerson,
  MeldungProjectionResult,
  MeldungStaffel,
  MeldungStaffelPerson,
  MeldungStart,
  MeldungTrainer,
  MeldungVeranstaltung,
  MeldungVerein,
  MeldungWettkampf,
  Vereinsmeldung,
} from './document/vereinsmeldeliste.js';
/**
 * Die Wert-Codecs. Der Objektgraph führt Datumsangaben als `Datum`, Zeiten als
 * Hundertstelsekunden und Uhrzeiten als Minuten seit Mitternacht — nicht als
 * Zeichenketten. Wer einen solchen Wert anzeigen oder zurückschreiben will,
 * braucht dieselbe Formatierungsregel, die die Bibliothek intern benutzt:
 * führende Nullen, Komma als Dezimaltrennzeichen, volle `HH:MM:SS,hh`-Form
 * auch für Zeiten unter einer Stunde. Nachgebaut wird sie erfahrungsgemäss
 * knapp daneben, deshalb sind die Codecs Teil der Oberfläche.
 */
export type { Datum } from './values/datum.js';
export { decodeDatum, encodeDatum } from './values/datum.js';
export { decodeZeit, encodeZeit, isZeroZeit } from './values/zeit.js';
export { decodeUhrzeit, encodeUhrzeit } from './values/uhrzeit.js';

export type {
  DsvDocument,
  DsvItem,
  DsvRecord,
  DsvComment,
  DsvBlank,
  ParseResult,
} from './document/types.js';
export type { Diagnostic, DiagnosticCode, Severity } from './diagnostics/types.js';

/**
 * Die generierten Elementtypen, je Listenart und Formatversion einer pro
 * Element der Spezifikation. Sie tragen die Feldbedeutungen und die
 * Fundstelle in der Spezifikation (`@see dsv8.md:361`) als Doc-Kommentar und
 * machen sie damit beim Tippen sichtbar — der eigentliche Ertrag des
 * Codegen-Ansatzes.
 *
 * Die Namen tragen durchgehend das Suffix `V7` oder `V8` und kollidieren
 * deshalb nicht mit den handgeschriebenen Typen des Objektgraphen. Der
 * Sternexport ist Absicht: `src/schema/generated.ts` wird erzeugt, und ein
 * neu hinzukommendes Element soll ohne Handarbeit mit herauskommen. Dass die
 * Oberfläche dadurch nicht unbemerkt wächst, sichert `test/public-api.test.ts`
 * gegen `docs/public-api.md` ab.
 */
export type * from './schema/generated.js';
