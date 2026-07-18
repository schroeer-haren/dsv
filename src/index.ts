/**
 * @schroeer-haren/dsv
 *
 * Liest und schreibt Dateien im DSV-Standard des Deutschen Schwimm-Verbands.
 *
 * In dieser Fassung arbeitet die Bibliothek schema-frei: Sie zerlegt jede Datei
 * in Records und schreibt sie byte-identisch zurück, prüft aber weder Feldtypen
 * noch Kardinalitäten. Typisierte Listenarten folgen ab 0.2.0.
 */

export { parseDsv, parseDsvOrThrow, DsvParseError } from './parse/parse-dsv.js';
export { writeDsv } from './write/write-dsv.js';

export type {
  DsvDocument,
  DsvItem,
  DsvRecord,
  DsvComment,
  DsvBlank,
  ParseResult,
} from './document/types.js';
export type { Diagnostic, DiagnosticCode, Position, Severity } from './diagnostics/types.js';
