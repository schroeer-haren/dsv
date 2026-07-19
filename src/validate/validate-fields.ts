import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvRecord } from '../document/types.js';
import type { ElementDef, FieldDef } from '../schema/types.js';
import type { FormatVersion } from './format-version.js';

/**
 * Gibt die Felder zurück, die in dieser Formatversion gelten. Felder mit
 * `since: 8` gibt es in einer DSV7-Datei nicht — dort fehlt auch ihr
 * Trennzeichen.
 */
export function fieldsForVersion(def: ElementDef, version: FormatVersion): readonly FieldDef[] {
  return def.fields.filter((f) => f.since === undefined || f.since <= version);
}

/** Leerer und fehlender Wert sind im DSV-Standard dasselbe. */
export function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

/**
 * Prüft die Feldanzahl und die Pflichtfelder eines Records gegen sein
 * Element. Die Feldanzahl ist exakt: Auch optionale Attribute am Zeilenende
 * brauchen ihre Trennzeichen.
 */
export function validateFields(
  record: DsvRecord,
  def: ElementDef,
  version: FormatVersion,
): Diagnostic[] {
  const at = {
    start: { line: record.line, column: 1 },
    end: { line: record.line, column: 1 },
  };

  const expectedFields = fieldsForVersion(def, version);
  const expected = expectedFields.length;
  const actual = record.fields.length;

  if (actual !== expected) {
    return [
      createDiagnostic(
        'unexpected-field-count',
        'error',
        `${def.name} expects ${String(expected)} field(s), found ${String(actual)}`,
        { ...at, data: { expected, actual } },
      ),
    ];
  }

  const diagnostics: Diagnostic[] = [];

  for (const [index, fieldDef] of expectedFields.entries()) {
    if (fieldDef.required && isBlank(record.fields[index])) {
      diagnostics.push(
        createDiagnostic(
          'missing-required-field',
          'error',
          `${def.name} requires a value for field ${fieldDef.name}`,
          { ...at, data: { field: fieldDef.name } },
        ),
      );
    }
  }

  return diagnostics;
}
