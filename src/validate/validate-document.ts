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

/**
 * Wettkampfarten, die sich aus einem vorherigen Lauf speisen und deshalb dessen
 * Nummer nennen müssen (dsv8.md:1110).
 *
 * Gemeldet als `warning`, nicht als `error`: Von den 67 Zwischenläufen und
 * Finals in `test/fixtures/real` lassen 22 das Feld leer, verteilt auf zwei
 * Dateien (b-csc-2026-02-22-Gersthof-Wk.dsv7 und
 * b-freital-2026-07-04-Windbergfest-Wk.dsv7). Dort trägt erst der Kommentar die
 * Zuordnung, etwa „50m Rücken weiblich (Finale)" zu Wettkampf 103. Als Fehler
 * gemeldet wiese die Bibliothek Ausschreibungen zurück, die real im Umlauf sind.
 */
const QUALIFIZIERENDE_ARTEN = new Set(['Z', 'F']);

/** Ausübungswerte, die nur bei Technik `S` zulässig sind (dsv8.md:1070). */
const KICK_AUSUEBUNGEN = new Set(['KB', 'KR']);

/**
 * Ein Element einer Listenart samt der Feldindizes, die eine Feldregel braucht.
 * Die Indizes stammen aus dem Schema und gelten deshalb je Listenart — dieselben
 * Felder liegen in verschiedenen Listenarten an verschiedenen Stellen.
 */
interface FieldRuleTarget {
  readonly element: string;
  readonly indices: readonly number[];
}

/**
 * Sucht alle Elemente der Listenart, die sämtliche genannten Felder führen, und
 * gibt je Element deren Indizes zurück.
 *
 * Feldregeln hängen damit an Feldnamen statt an Positionen. Sie greifen in jeder
 * Listenart, die die Felder kennt, ohne dass Elementnamen aufgezählt werden
 * müssen: Der Grund der Nichtwertung heisst in der Wettkampfergebnisliste
 * `PNERGEBNIS`/`STERGEBNIS`, in der Vereinsergebnisliste `PERSONENERGEBNIS`/
 * `STAFFELERGEBNIS`, und in beiden liegt er an anderer Stelle.
 */
function targetsWithFields(schema: ListSchema, fields: readonly string[]): FieldRuleTarget[] {
  const targets: FieldRuleTarget[] = [];

  for (const occurrence of schema.elements) {
    const names = occurrence.def.fields.map((f) => f.name);
    const indices = fields.map((name) => names.indexOf(name));
    if (indices.some((index) => index < 0)) continue;

    targets.push({ element: occurrence.def.name, indices });
  }

  return targets;
}

/** Liest ein Feld eines Records ohne umgebende Leerzeichen. */
function fieldAt(record: DsvRecord, index: number | undefined): string {
  return (record.fields[index ?? -1] ?? '').trim();
}

/**
 * Querregeln zwischen Elementen und zwischen Feldern eines Elements, etwa: Meldegelder
 * werden entweder überwiesen oder eingezogen, nicht beides (dsv8.md:813).
 *
 * Die Regeln gelten listenartübergreifend, aber auf zweierlei Weise:
 *
 * - **Feldregeln** hängen an Feldnamen. Welche Elemente sie prüfen und an
 *   welcher Stelle die Felder dort liegen, ermittelt `targetsWithFields` zur
 *   Laufzeit aus dem Schema. So greift etwa die Nichtwertungsregel in der
 *   Wettkampfergebnisliste auf `PNERGEBNIS`/`STERGEBNIS` und in der
 *   Vereinsergebnisliste auf `PERSONENERGEBNIS`/`STAFFELERGEBNIS`, obwohl die
 *   Elemente anders heissen und die Felder anders liegen.
 * - **Elementregeln** hängen an einem Elementnamen, weil die Regel selbst von
 *   diesem Element handelt: `LASTSCHRIFT`/`BANKVERBINDUNG` und `MELDEGELD` gibt
 *   es nur in der Wettkampfdefinitionsliste. In Listenarten ohne diese Elemente
 *   bleibt die Regel folgenlos.
 */
function validateCrossRules(byElement: Map<string, DsvRecord[]>, schema: ListSchema): Diagnostic[] {
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

  // Kicks in Bauch- und Rückenlage gibt es nur als Schmetterling
  // (dsv8.md:1070, dsv8.md:1072).
  for (const target of targetsWithFields(schema, ['technik', 'ausuebung'])) {
    const [technikIndex, ausuebungIndex] = target.indices;

    for (const record of byElement.get(target.element.toUpperCase()) ?? []) {
      const ausuebung = fieldAt(record, ausuebungIndex);
      const technik = fieldAt(record, technikIndex);

      if (!KICK_AUSUEBUNGEN.has(ausuebung) || technik === 'S') continue;

      diagnostics.push(
        createDiagnostic(
          'invalid-value',
          'error',
          `${target.element}.ausuebung: "${ausuebung}" is only allowed with technik S, found "${technik}"`,
          {
            ...at(record.line),
            data: { element: target.element, field: 'ausuebung', value: ausuebung, technik },
          },
        ),
      );
    }
  }

  // Zwischenläufe und Finals nennen den Lauf, der für sie qualifiziert
  // (dsv8.md:1110).
  for (const target of targetsWithFields(schema, ['wettkampfart', 'qualifikationswettkampfnr'])) {
    const [artIndex, nummerIndex] = target.indices;

    for (const record of byElement.get(target.element.toUpperCase()) ?? []) {
      const art = fieldAt(record, artIndex);
      if (!QUALIFIZIERENDE_ARTEN.has(art)) continue;
      if (fieldAt(record, nummerIndex) !== '') continue;

      diagnostics.push(
        createDiagnostic(
          'conditional-field-required',
          'warning',
          `${target.element} of type ${art} should name a qualifikationswettkampfnr`,
          {
            ...at(record.line),
            data: {
              element: target.element,
              field: 'qualifikationswettkampfnr',
              condition: art,
            },
          },
        ),
      );
    }
  }

  // Gemischte Wettkämpfe gehören in die Standard-Bestenliste: „Falls gemischte
  // Wettkämpfe ist SW anzugeben" (dsv8.md:3159).
  //
  // Gemeldet als `warning`, nicht als `error`: Von den 244 Wettkämpfen mit
  // Geschlecht X in `test/fixtures/real` halten sich nur 170 daran. Die
  // übrigen 74 tragen KG (33×, kindgerechte Wettkämpfe) oder MS (41×,
  // Masters) — beides fachlich sinnvolle Zuordnungen, die die Spec-Regel so
  // nicht vorsieht. Als Fehler gemeldet wiese die Bibliothek Protokolle
  // zurück, die real im Umlauf sind.
  for (const target of targetsWithFields(schema, ['geschlecht', 'zuordnungBestenliste'])) {
    const [geschlechtIndex, zuordnungIndex] = target.indices;

    for (const record of byElement.get(target.element.toUpperCase()) ?? []) {
      if (fieldAt(record, geschlechtIndex).toUpperCase() !== 'X') continue;

      const zuordnung = fieldAt(record, zuordnungIndex);
      if (zuordnung.toUpperCase() === 'SW') continue;

      diagnostics.push(
        createDiagnostic(
          'invalid-value',
          'warning',
          `${target.element}.zuordnungBestenliste should be SW for mixed competitions, found "${zuordnung}"`,
          {
            ...at(record.line),
            data: {
              element: target.element,
              field: 'zuordnungBestenliste',
              value: zuordnung,
              geschlecht: 'X',
            },
          },
        ),
      );
    }
  }

  // Wer nicht gewertet wird, belegt keinen Platz (dsv8.md:5093, dsv8.md:5476).
  for (const target of targetsWithFields(schema, ['platz', 'grundDerNichtwertung'])) {
    const [platzIndex, grundIndex] = target.indices;

    for (const record of byElement.get(target.element.toUpperCase()) ?? []) {
      const grund = fieldAt(record, grundIndex);
      if (grund === '') continue;

      const platz = fieldAt(record, platzIndex);
      if (platz === '0') continue;

      diagnostics.push(
        createDiagnostic(
          'invalid-value',
          'error',
          `${target.element}.platz must be 0 when grundDerNichtwertung is set, found "${platz}"`,
          {
            ...at(record.line),
            data: {
              element: target.element,
              field: 'platz',
              value: platz,
              grundDerNichtwertung: grund,
            },
          },
        ),
      );
    }
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
  diagnostics.push(...validateCrossRules(byElement, schema));

  return diagnostics;
}
