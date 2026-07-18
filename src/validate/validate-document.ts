import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic, Position } from '../diagnostics/types.js';
import type { DsvDocument, DsvRecord } from '../document/types.js';
import type { ListSchema } from '../schema/list-schema.js';
import type { FormatVersion } from './validate-fields.js';
import { validateFields } from './validate-fields.js';
import { validateValues } from './validate-values.js';

const AT_START = { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };

function at(line: number): { start: Position; end: Position } {
  return { start: { line, column: 1 }, end: { line, column: 1 } };
}

function isSupportedVersion(version: number | null): version is FormatVersion {
  return version === 7 || version === 8;
}

/**
 * Prüft die Kardinalität jedes Listenelements. Elemente, die es in dieser
 * Formatversion noch nicht gibt, bleiben aussen vor — sie werden bereits als
 * `unknown-element` gemeldet.
 */
function validateCardinalities(
  byElement: Map<string, DsvRecord[]>,
  schema: ListSchema,
  version: FormatVersion,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const occurrence of schema.elements) {
    const def = occurrence.def;
    if (def.since !== undefined && def.since > version) continue;

    const records = byElement.get(def.name.toUpperCase()) ?? [];
    const actual = records.length;
    const max = occurrence.max;

    if (actual >= occurrence.min && (max === null || actual <= max)) continue;

    const first = records[0];
    diagnostics.push(
      createDiagnostic(
        'cardinality-violation',
        'error',
        `${def.name} occurs ${String(actual)} time(s), expected ${String(occurrence.min)}..${max === null ? 'n' : String(max)}`,
        {
          ...(first === undefined ? AT_START : at(first.line)),
          data: { element: def.name, min: occurrence.min, max, actual },
        },
      ),
    );
  }

  return diagnostics;
}

/** Feldindizes im WETTKAMPF-Record, in DSV7 und DSV8 gleich. */
const WETTKAMPF_TECHNIK = 5;
const WETTKAMPF_AUSUEBUNG = 6;

/** Ausübungswerte, die nur bei Technik `S` zulässig sind (dsv8.md:1070). */
const KICK_AUSUEBUNGEN = new Set(['KB', 'KR']);

/**
 * Querregeln zwischen Elementen: Meldegelder werden entweder überwiesen oder
 * eingezogen, nicht beides (dsv8.md:813).
 */
function validateCrossRules(byElement: Map<string, DsvRecord[]>): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const lastschrift = byElement.get('LASTSCHRIFT');
  const bankverbindung = byElement.get('BANKVERBINDUNG');

  if (lastschrift !== undefined && bankverbindung !== undefined) {
    const first = lastschrift[0];
    diagnostics.push(
      createDiagnostic(
        'mutually-exclusive-elements',
        'error',
        'LASTSCHRIFT and BANKVERBINDUNG must not both be present',
        {
          ...(first === undefined ? AT_START : at(first.line)),
          data: { elements: ['LASTSCHRIFT', 'BANKVERBINDUNG'] },
        },
      ),
    );
  }

  for (const record of byElement.get('WETTKAMPF') ?? []) {
    // Kicks in Bauch- und Rückenlage gibt es nur als Schmetterling
    // (dsv8.md:1070, dsv8.md:1072).
    const ausuebung = (record.fields[WETTKAMPF_AUSUEBUNG] ?? '').trim();
    if (!KICK_AUSUEBUNGEN.has(ausuebung)) continue;

    const technik = (record.fields[WETTKAMPF_TECHNIK] ?? '').trim();
    if (technik === 'S') continue;

    diagnostics.push(
      createDiagnostic(
        'invalid-value',
        'error',
        `WETTKAMPF.ausuebung: "${ausuebung}" is only allowed with technik S, found "${technik}"`,
        {
          ...at(record.line),
          data: { element: 'WETTKAMPF', field: 'ausuebung', value: ausuebung, technik },
        },
      ),
    );
  }

  for (const record of byElement.get('MELDEGELD') ?? []) {
    // Der Typ wird case-insensitiv verglichen (dsv8.md:1360).
    if (record.fields[0]?.toLowerCase() !== 'wkmeldegeld') continue;
    if ((record.fields[2] ?? '').trim() !== '') continue;

    diagnostics.push(
      createDiagnostic(
        'conditional-field-required',
        'error',
        'MELDEGELD of type Wkmeldegeld requires a wettkampfnr',
        {
          ...at(record.line),
          data: { element: 'MELDEGELD', field: 'wettkampfnr', condition: 'Wkmeldegeld' },
        },
      ),
    );
  }

  return diagnostics;
}

/**
 * Prüft ein gelesenes Dokument gegen das Schema seiner Listenart: Formatversion,
 * Kardinalitäten, Querregeln sowie je Record Feldanzahl, Pflichtfelder und Werte.
 */
export function validateDocument(document: DsvDocument, schema: ListSchema): Diagnostic[] {
  const version = document.version;

  if (!isSupportedVersion(version)) {
    // DSV6 und älter sind nicht abwärtskompatibel — jede weitere Prüfung würde
    // nur Folgefehler erzeugen.
    return [
      createDiagnostic(
        'unsupported-format-version',
        'fatal',
        `Unsupported DSV format version: ${version === null ? 'missing' : String(version)}`,
        { ...AT_START, data: { version } },
      ),
    ];
  }

  const diagnostics: Diagnostic[] = [];
  const byElement = new Map<string, DsvRecord[]>();

  for (const item of document.items) {
    if (item.kind !== 'element') continue;

    const key = item.element.toUpperCase();
    const bucket = byElement.get(key);
    if (bucket === undefined) byElement.set(key, [item]);
    else bucket.push(item);

    const occurrence = schema.find(item.element);
    const def = occurrence?.def;

    if (def === undefined || (def.since !== undefined && def.since > version)) {
      diagnostics.push(
        createDiagnostic(
          'unknown-element',
          'error',
          `${item.element} is not an element of ${schema.listenart} in DSV${String(version)}`,
          { ...at(item.line), data: { element: item.element } },
        ),
      );
      continue;
    }

    diagnostics.push(...validateFields(item, def, version));
    diagnostics.push(...validateValues(item, def, version));
  }

  diagnostics.push(...validateCardinalities(byElement, schema, version));
  diagnostics.push(...validateCrossRules(byElement));

  return diagnostics;
}
