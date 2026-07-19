import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvRecord } from '../document/types.js';
import type { ElementDef, EnumValue, FieldDef, ScalarType } from '../schema/types.js';
import { decodeDatum } from '../values/datum.js';
import { decodeUhrzeit } from '../values/uhrzeit.js';
import { decodeZeit } from '../values/zeit.js';
import type { FormatVersion } from './format-version.js';
import { fieldsForVersion, isBlank } from './validate-fields.js';

const ZAHL = /^\d+$/;
/** Betrag mit genau zwei Nachkommastellen, z. B. `10,00` (dsv8.md:283). */
const BETRAG = /^\d+,\d{2}$/;
/**
 * Jahrgang (ein bis vier Ziffern), Altersklassenbuchstabe oder Masters-Staffel
 * mit zwei bis drei Ziffern und Pluszeichen (dsv8.md:291).
 */
const JGAK = /^(?:\d{1,4}|[ABCDEJ]|\d{2,3}\+)$/;

/** Prüft einen Wert gegen seinen skalaren Datentyp. */
function matchesType(value: string, type: ScalarType): boolean {
  switch (type) {
    case 'ZK':
      return true;
    case 'Zeichen':
      return [...value].length === 1;
    case 'Zahl':
      return ZAHL.test(value);
    case 'Datum':
      return decodeDatum(value) !== null;
    case 'Uhrzeit':
      return decodeUhrzeit(value) !== null;
    case 'Zeit':
      return decodeZeit(value) !== null;
    case 'Betrag':
      return BETRAG.test(value);
    case 'JGAK':
      return JGAK.test(value);
  }
}

/**
 * Sucht den passenden Aufzählungswert. Liefert `undefined`, wenn der Wert in
 * dieser Formatversion nicht zulässig ist.
 */
function findEnumValue(
  value: string,
  def: FieldDef,
  version: FormatVersion,
): EnumValue | undefined {
  return def.values?.find((v) => {
    if (v.since !== undefined && v.since > version) return false;
    return def.caseInsensitive ? v.value.toLowerCase() === value.toLowerCase() : v.value === value;
  });
}

function invalidValue(
  code: 'invalid-value' | 'invalid-enum-value',
  message: string,
  def: FieldDef,
  value: string,
  at: { line: number },
): Diagnostic {
  return createDiagnostic(code, 'error', message, {
    ...at,
    data: { field: def.name, value },
  });
}

/**
 * Prüft Werttypen, Zahlenbereiche und Aufzählungswerte eines Records.
 *
 * Leere Werte werden übersprungen: Ob ein Pflichtfeld gesetzt sein muss, hat
 * bereits `validateFields` entschieden.
 */
export function validateValues(
  record: DsvRecord,
  def: ElementDef,
  version: FormatVersion,
): Diagnostic[] {
  const at = {
    line: record.line,
  };

  const diagnostics: Diagnostic[] = [];

  for (const [index, fieldDef] of fieldsForVersion(def, version).entries()) {
    const value = record.fields[index];
    if (value === undefined || isBlank(value)) continue;

    if (!matchesType(value, fieldDef.type)) {
      diagnostics.push(
        invalidValue(
          'invalid-value',
          `${def.name}.${fieldDef.name}: "${value}" is not a valid ${fieldDef.type}`,
          fieldDef,
          value,
          at,
        ),
      );
      continue;
    }

    const range = fieldDef.range;
    if (range !== undefined) {
      const numeric = Number(value);
      if (numeric < range.min || numeric > range.max) {
        diagnostics.push(
          invalidValue(
            'invalid-value',
            `${def.name}.${fieldDef.name}: ${value} is outside ${String(range.min)}..${String(range.max)}`,
            fieldDef,
            value,
            at,
          ),
        );
        continue;
      }
    }

    if (fieldDef.values !== undefined) {
      const match = findEnumValue(value, fieldDef, version);

      if (match === undefined) {
        diagnostics.push(
          invalidValue(
            'invalid-enum-value',
            `${def.name}.${fieldDef.name}: "${value}" is not an allowed value in DSV${String(version)}`,
            fieldDef,
            value,
            at,
          ),
        );
      } else if (match.specGap === true) {
        // Lücke der Spezifikation, kein Verbot: Der Wert wird gelesen und
        // geschrieben, die Toleranz bleibt aber sichtbar.
        diagnostics.push(
          createDiagnostic(
            'invalid-enum-value',
            'info',
            `${def.name}.${fieldDef.name}: "${value}" is missing from the specification's list, accepted as a gap`,
            { ...at, data: { field: fieldDef.name, value, specGap: true } },
          ),
        );
      } else if (match.tolerated === true) {
        // Im Format bekannt, für diese Listenart aber nicht vorgesehen. Als
        // Fehler gemeldet wiese die Bibliothek Dateien zurück, die der DSV
        // selbst ausliefert.
        diagnostics.push(
          createDiagnostic(
            'invalid-enum-value',
            'warning',
            `${def.name}.${fieldDef.name}: "${value}" is not specified for this list type`,
            { ...at, data: { field: fieldDef.name, value, tolerated: true } },
          ),
        );
      }
    }
  }

  return diagnostics;
}
