import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvDocument, ParseResult } from '../document/types.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../schema/wettkampfdefinitionsliste.js';
import { validateDocument } from '../validate/validate-document.js';
import type { FormatVersion } from '../validate/validate-fields.js';
import { fieldsForVersion } from '../validate/validate-fields.js';
import { parseDsv } from './parse-dsv.js';

/** Ein Record, dessen Feldwerte unter ihren Schema-Namen erreichbar sind. */
export interface TypedRecord {
  readonly element: string;
  readonly line: number;
  /** Feldwerte unter ihrem Schema-Namen. Fehlende optionale Felder sind ''. */
  readonly values: Readonly<Record<string, string>>;
}

export interface Wettkampfdefinitionsliste {
  readonly listenart: string;
  readonly version: FormatVersion;
  readonly records: readonly TypedRecord[];
  /** Das zugrunde liegende schema-freie Dokument, für Round-Trip und Rohzugriff. */
  readonly document: DsvDocument;
}

const LISTENART = 'Wettkampfdefinitionsliste';
const AT_START = { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };

function isSupportedVersion(version: number | null): version is FormatVersion {
  return version === 7 || version === 8;
}

/** Ergebnis ohne typisierte Records, wenn die Datei gar nicht auswertbar ist. */
function rejected(
  document: DsvDocument,
  diagnostics: readonly Diagnostic[],
): ParseResult<Wettkampfdefinitionsliste> {
  return {
    document: {
      listenart: document.listenart ?? '',
      // Platzhalter: `records` ist leer, damit ist die Version bedeutungslos.
      version: 7,
      records: [],
      document,
    },
    diagnostics,
    ok: false,
  };
}

/**
 * Liest eine Wettkampfdefinitionsliste und legt jeden Feldwert unter seinem
 * Schema-Namen ab.
 *
 * Gelesen wird bewusst nachsichtig: Auch wenn Felder fehlen oder Werte
 * unzulässig sind, entstehen typisierte Records — die Mängel stehen in den
 * Diagnostics. Nur eine falsche Listenart und eine nicht unterstützte
 * Formatversion verhindern die Auswertung ganz, weil dann jede weitere Zuordnung
 * von Feldnamen zu Werten geraten wäre.
 */
export function parseWettkampfdefinitionsliste(
  input: string,
): ParseResult<Wettkampfdefinitionsliste> {
  const parsed = parseDsv(input);
  const document = parsed.document;
  const listenart = document.listenart;

  if (listenart !== null && listenart.toLowerCase() !== LISTENART.toLowerCase()) {
    return rejected(document, [
      ...parsed.diagnostics,
      createDiagnostic(
        'wrong-list-type',
        'fatal',
        `Expected list type ${LISTENART}, found ${listenart}`,
        { ...AT_START, data: { expected: LISTENART, actual: listenart } },
      ),
    ]);
  }

  const validation = validateDocument(document, WETTKAMPFDEFINITIONSLISTE);
  const diagnostics = [...parsed.diagnostics, ...validation];

  if (!isSupportedVersion(document.version)) {
    // `validateDocument` hat bereits `unsupported-format-version` gemeldet.
    return rejected(document, diagnostics);
  }

  const version = document.version;
  const records: TypedRecord[] = [];

  for (const item of document.items) {
    if (item.kind !== 'element') continue;

    const def = WETTKAMPFDEFINITIONSLISTE.find(item.element)?.def;
    if (def === undefined) continue;

    const values: Record<string, string> = {};
    for (const [index, fieldDef] of fieldsForVersion(def, version).entries()) {
      values[fieldDef.name] = item.fields[index] ?? '';
    }

    records.push({ element: def.name, line: item.line, values });
  }

  return {
    document: { listenart: listenart ?? LISTENART, version, records, document },
    diagnostics,
    ok: !diagnostics.some((d) => d.severity === 'error' || d.severity === 'fatal'),
  };
}
