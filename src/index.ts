/**
 * @schroeer-haren/dsv
 *
 * Liest und schreibt Dateien im DSV-Standard des Deutschen Schwimm-Verbands.
 *
 * Die schema-freie Ebene (`parseDsv`, `writeDsv`) zerlegt jede Datei in Records
 * und schreibt sie byte-identisch zurück, prüft aber weder Feldtypen noch
 * Kardinalitäten. Darauf setzt die typisierte Ebene auf, für die
 * Wettkampfdefinitionsliste und die Wettkampfergebnisliste.
 */

export { parseDsv, parseDsvOrThrow, DsvParseError } from './parse/parse-dsv.js';
export { parseWettkampfdefinitionsliste } from './parse/parse-wettkampfdefinitionsliste.js';
export { parseWettkampfergebnisliste } from './parse/parse-wettkampfergebnisliste.js';
export { projectWettkampfdefinitionsliste } from './document/wettkampfdefinitionsliste.js';
export { writeDsv } from './write/write-dsv.js';
export {
  writeWettkampfdefinitionsliste,
  DsvWriteError,
} from './write/write-wettkampfdefinitionsliste.js';
export { writeWettkampfergebnisliste } from './write/write-wettkampfergebnisliste.js';

export type { WriteOptions } from './write/write-wettkampfdefinitionsliste.js';

export type { TypedRecord, TypedList } from './parse/parse-typed-list.js';
export type { Wettkampfdefinitionsliste } from './parse/parse-wettkampfdefinitionsliste.js';
export type { Wettkampfergebnisliste } from './parse/parse-wettkampfergebnisliste.js';
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
