import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';

/** Formatversion des DSV-Standards, gegen die geprüft wird. */
export type FormatVersion = 7 | 8;

/**
 * Prüft, ob eine gelesene Versionsangabe von dieser Bibliothek unterstützt
 * wird. `null` steht für „keine Versionsangabe lesbar" und ist damit ebenfalls
 * nicht unterstützt — die Aufrufer entscheiden, ob sie diesen Fall getrennt
 * behandeln.
 */
export function isSupportedVersion(version: number | null): version is FormatVersion {
  return version === 7 || version === 8;
}

/**
 * Erzeugt die Diagnostic für eine nicht unterstützte Formatversion. Bewusst
 * eine gemeinsame Stelle: Die schema-freie und die typisierte Ebene sollen zu
 * derselben Datei dasselbe sagen, mit demselben Code und derselben Meldung.
 */
export function unsupportedFormatVersion(version: number | null): Diagnostic {
  return createDiagnostic(
    'unsupported-format-version',
    'fatal',
    `Unsupported DSV format version: ${version === null ? 'missing' : String(version)}`,
    {
      line: 1,
      data: { version },
    },
  );
}
