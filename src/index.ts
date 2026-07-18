/**
 * @schroeer-haren/dsv
 *
 * TypeScript-Bibliothek zum Parsen und Erzeugen von DSV-Dateien
 * (Deutscher Schwimm-Verband, Formate DSV7 und DSV8).
 *
 * Achtung: Diese Version ist ein Grundgerüst. Die eigentliche
 * Format-Implementierung folgt.
 */

/** Unterstützte DSV-Formatversionen. */
export type DsvFormat = 'DSV7' | 'DSV8';

/** Liste aller unterstützten Formatversionen. */
export const DSV_FORMATS: readonly DsvFormat[] = ['DSV7', 'DSV8'];

/** Trennzeichen zwischen den Feldern einer DSV-Zeile. */
export const FIELD_SEPARATOR = ';';

/**
 * Zerlegt eine einzelne DSV-Zeile in ihre Felder.
 *
 * Ein abschließendes Trennzeichen (in DSV üblich) wird ignoriert.
 */
export function parseLine(line: string): string[] {
  const trimmed = line.replace(/\r?\n$/, '');
  const withoutTrailing = trimmed.endsWith(FIELD_SEPARATOR)
    ? trimmed.slice(0, -FIELD_SEPARATOR.length)
    : trimmed;

  if (withoutTrailing === '') return [];
  return withoutTrailing.split(FIELD_SEPARATOR);
}

/**
 * Setzt Felder zu einer DSV-Zeile zusammen, inklusive abschließendem
 * Trennzeichen.
 */
export function formatLine(fields: readonly string[]): string {
  return fields.join(FIELD_SEPARATOR) + FIELD_SEPARATOR;
}

// Spike (Task 4): nur zur Prüfung der erzeugten Deklaration, wird in Task 16 entfernt.
export type { AbschnittWkdefV8 } from './schema/generated.js';
