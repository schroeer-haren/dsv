import type { Diagnostic } from '../diagnostics/types.js';
import type { TypedRecord } from '../parse/parse-wettkampfdefinitionsliste.js';
import { parseWettkampfdefinitionsliste } from '../parse/parse-wettkampfdefinitionsliste.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../schema/wettkampfdefinitionsliste.js';
import type { FormatVersion } from '../validate/validate-fields.js';
import { fieldsForVersion } from '../validate/validate-fields.js';

export interface WriteOptions {
  readonly eol?: '\r\n' | '\n';
  readonly version?: FormatVersion;
}

/** Fehler beim Schreiben; trägt die Diagnostics der strengen Prüfung. */
export class DsvWriteError extends Error {
  constructor(readonly diagnostics: readonly Diagnostic[]) {
    const first = diagnostics[0];
    super(first === undefined ? 'DSV write failed' : `${first.code}: ${first.message}`);
    this.name = 'DsvWriteError';
  }
}

function isSupportedVersion(version: number): version is FormatVersion {
  return version === 7 || version === 8;
}

/** Ermittelt die Formatversion aus den Optionen, sonst aus dem FORMAT-Record. */
function resolveVersion(
  records: readonly TypedRecord[],
  options: WriteOptions,
): FormatVersion | null {
  if (options.version !== undefined) return options.version;

  const declared = Number(
    records.find((r) => r.element.toUpperCase() === 'FORMAT')?.values['version'],
  );
  return isSupportedVersion(declared) ? declared : null;
}

/** Erzeugt den kanonischen Text, ohne zu prüfen. */
function serialize(
  records: readonly TypedRecord[],
  version: FormatVersion,
  eol: string,
): { text: string; unknown: string[] } {
  const lines: string[] = [];
  const unknown: string[] = [];

  for (const record of records) {
    const def = WETTKAMPFDEFINITIONSLISTE.find(record.element)?.def;

    if (def === undefined || (def.since !== undefined && def.since > version)) {
      unknown.push(record.element);
      continue;
    }

    if (def.bare) {
      lines.push(def.name);
      continue;
    }

    const fields = fieldsForVersion(def, version)
      .map((f) => `${(record.values[f.name] ?? '').trim()};`)
      .join('');
    lines.push(`${def.name}:${fields}`);
  }

  return { text: lines.map((l) => l + eol).join(''), unknown };
}

/**
 * Schreibt typisierte Records als Wettkampfdefinitionsliste.
 *
 * Ausgabeform ist kanonisch: kein Leerzeichen nach dem Doppelpunkt, jedes Feld
 * mit `;` terminiert, `DATEIENDE` ohne Doppelpunkt, standardmässig CRLF.
 * Kommentare, Leerzeilen und Abweichungen der Quelle gehen dabei verloren — wer
 * Byte-Identität braucht, nimmt `writeDsv` auf dem schema-freien Dokument.
 *
 * Geprüft wird streng, und zwar am erzeugten Text statt an den Records: Ein
 * Wert, den der eigene Leser nicht wieder als gültig annimmt, darf die
 * Bibliothek nicht ausliefern. Diese Reihenfolge prüft beides in einem Durchgang
 * — den Inhalt der Records und die Serialisierung selbst — und kann nicht von
 * der Leseseite abweichen, weil sie dieselbe Prüfung benutzt.
 *
 * Strenger als beim Lesen ist dabei nur eines: Tolerierte Aufzählungswerte
 * (`EnumValue` mit `tolerated: true`) ergeben beim Lesen eine Warnung, hier
 * einen Fehler. Was der DSV ausliefert, muss die Bibliothek lesen können; was
 * sie selbst erzeugt, soll der Spezifikation entsprechen.
 *
 * @throws {DsvWriteError} wenn Pflichtfelder fehlen, Werte unzulässig sind,
 * Elemente unbekannt sind oder Kardinalitäten verletzt werden.
 */
export function writeWettkampfdefinitionsliste(
  records: readonly TypedRecord[],
  options: WriteOptions = {},
): string {
  const version = resolveVersion(records, options);

  if (version === null) {
    throw new DsvWriteError([
      {
        code: 'unsupported-format-version',
        severity: 'fatal',
        message: 'No supported DSV format version given; pass options.version or a FORMAT record',
        start: { line: 1, column: 1 },
        end: { line: 1, column: 1 },
      },
    ]);
  }

  const { text, unknown } = serialize(records, version, options.eol ?? '\r\n');

  if (unknown.length > 0) {
    throw new DsvWriteError(
      unknown.map((element) => ({
        code: 'unknown-element' as const,
        severity: 'error' as const,
        message: `${element} is not an element of ${WETTKAMPFDEFINITIONSLISTE.listenart} in DSV${String(version)}`,
        start: { line: 1, column: 1 },
        end: { line: 1, column: 1 },
        data: { element },
      })),
    );
  }

  const check = parseWettkampfdefinitionsliste(text);
  const problems = check.diagnostics.filter(
    (d) => d.severity === 'error' || d.severity === 'fatal' || d.data?.['tolerated'] === true,
  );

  if (problems.length > 0) throw new DsvWriteError(problems);

  return text;
}
