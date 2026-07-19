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

export type { WriteOptions } from './write/write-wettkampfdefinitionsliste.js';

export type { TypedRecord, TypedList } from './parse/parse-typed-list.js';
export type { Wettkampfdefinitionsliste } from './parse/parse-wettkampfdefinitionsliste.js';
export type { Wettkampfergebnisliste } from './parse/parse-wettkampfergebnisliste.js';
export type { Vereinsmeldeliste } from './parse/parse-vereinsmeldeliste.js';
export type { Vereinsergebnisliste } from './parse/parse-vereinsergebnisliste.js';
export type { FormatVersion } from './validate/validate-fields.js';

export type {
  Abschnitt,
  Pflichtzeit,
  ProjectionResult,
  Veranstaltung,
  Wertung,
  Wettkampf,
  Wettkampfdefinition,
} from './document/wettkampfdefinitionsliste.js';
/**
 * Der Objektgraph der Ergebnisliste. Die Namen tragen das Präfix `Ergebnis`,
 * wo die Definitionsliste denselben Begriff anders modelliert — ABSCHNITT etwa
 * führt dort sechs Felder und hier vier.
 */
export type {
  Abloese,
  ErgebnisAbschnitt,
  ErgebnisProjectionResult,
  ErgebnisVeranstaltung,
  ErgebnisWertung,
  ErgebnisWettkampf,
  Kampfrichter,
  Platzierung,
  Reaktion,
  Schwimmer,
  Staffel,
  StaffelPerson,
  StaffelZwischenzeit,
  Start,
  Verein,
  Wettkampfergebnis,
  Zwischenzeit,
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
export type { Datum } from './values/datum.js';

export type {
  DsvDocument,
  DsvItem,
  DsvRecord,
  DsvComment,
  DsvBlank,
  ParseResult,
} from './document/types.js';
export type { Diagnostic, DiagnosticCode, Position, Severity } from './diagnostics/types.js';
