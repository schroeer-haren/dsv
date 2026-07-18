/**
 * @schroeer-haren/dsv
 *
 * Liest und schreibt Dateien im DSV-Standard des Deutschen Schwimm-Verbands.
 *
 * Die schema-freie Ebene (`parseDsv`, `writeDsv`) zerlegt jede Datei in Records
 * und schreibt sie byte-identisch zurück, prüft aber weder Feldtypen noch
 * Kardinalitäten. Darauf setzt die typisierte Ebene auf, bislang für die
 * Wettkampfdefinitionsliste; weitere Listenarten folgen.
 */

export { parseDsv, parseDsvOrThrow, DsvParseError } from './parse/parse-dsv.js';
export { parseWettkampfdefinitionsliste } from './parse/parse-wettkampfdefinitionsliste.js';
export { writeDsv } from './write/write-dsv.js';

export type {
  TypedRecord,
  Wettkampfdefinitionsliste,
} from './parse/parse-wettkampfdefinitionsliste.js';
export type { FormatVersion } from './validate/validate-fields.js';

export type {
  DsvDocument,
  DsvItem,
  DsvRecord,
  DsvComment,
  DsvBlank,
  ParseResult,
} from './document/types.js';
export type { Diagnostic, DiagnosticCode, Position, Severity } from './diagnostics/types.js';
