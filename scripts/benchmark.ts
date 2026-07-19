/**
 * Misst Lesen, Schreiben und Projizieren an einer synthetischen Datei von rund
 * 50 MB.
 *
 * Bewusst ein Skript und kein Test: Es gibt keinen Schwellwert, gegen den sich
 * prüfen liesse, und ein Lauf über 50 MB gehört nicht in jeden Testdurchgang.
 * Der Zweck ist, die Zahlen überhaupt zu kennen und in `docs/benchmark.md`
 * festzuhalten.
 *
 * Zum Vergleich: Die grösste echte Datei hat rund 14.000 Zeilen. Die
 * synthetische ist damit etwa zwei Grössenordnungen grösser als alles, was in
 * der Praxis vorkommt.
 *
 *     npx tsx scripts/benchmark.ts
 *
 * Mit `--expose-gc` wird zwischen den Phasen aufgeräumt, was die
 * Speichermessung ruhiger macht:
 *
 *     node --expose-gc --import tsx scripts/benchmark.ts
 */

import { projectWettkampfdefinitionsliste } from '../src/document/wettkampfdefinitionsliste.js';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { parseWettkampfdefinitionsliste } from '../src/parse/parse-wettkampfdefinitionsliste.js';
import { writeDsv } from '../src/write/write-dsv.js';

/** Zielgrösse in MB; über das erste Argument übersteuerbar, für schnelle Läufe. */
const TARGET_MB = Number(process.argv[2] ?? 50);
const TARGET_BYTES = TARGET_MB * 1024 * 1024;
const CRLF = '\r\n';

/** `wettkampfnr` ist laut Schema höchstens dreistellig (dsv8.md:1151). */
const MAX_WETTKAMPF = 999;

const line = (el: string, ...fields: string[]): string => `${el}:${fields.join(';')};`;

/**
 * Kopf einer gültigen Wettkampfdefinitionsliste. Er muss stimmen, sonst bricht
 * die typisierte Ebene früh ab und misst nicht die Arbeit, um die es geht.
 */
const kopf: string[] = [
  line('FORMAT', 'Wettkampfdefinitionsliste', '7'),
  line('ERZEUGER', 'dsv-benchmark', '1.0', 'bench@example.org'),
  line('VERANSTALTUNG', 'Benchmark', 'Musterstadt', '25', 'AUTOMATISCH'),
  line('VERANSTALTUNGSORT', 'Hallenbad', 'Musterweg 1', '12345', 'Musterstadt', 'GER', '', '', ''),
  line('AUSSCHREIBUNGIMNETZ', 'https://example.org/ausschreibung'),
  line('VERANSTALTER', 'SV Musterstadt'),
  line('AUSRICHTER', 'SV Musterstadt', 'Muster, Max', '', '', '', '', '', '', 'a@example.org'),
  line('MELDEADRESSE', 'Muster, Max', '', '', '', '', '', '', 'meldung@example.org'),
  line('MELDESCHLUSS', '01.03.2026', '18:00'),
  line('ABSCHNITT', '1', '15.03.2026', '08:00', '08:30', '09:00', 'N'),
  line('MELDEGELD', 'Meldegeldpauschale', '10,00', ''),
];

/**
 * Baut eine gültige Datei der Zielgrösse.
 *
 * Die Masse kommt aus WERTUNG-Records: Sie dürfen unbegrenzt oft vorkommen und
 * tragen mit `wertungsId` eine Kennung ohne Wertebereich, lassen sich also
 * beliebig oft eindeutig vergeben. WETTKAMPF dagegen ist über `wettkampfnr` auf
 * 999 begrenzt — mehr davon erzeugte lauter Befunde, und der Messwert wäre
 * nicht mehr der des Normalfalls, sondern der des Fehlerpfads.
 */
function buildInput(): string {
  const parts: string[] = [...kopf];

  for (let nr = 1; nr <= MAX_WETTKAMPF; nr++) {
    parts.push(line('WETTKAMPF', String(nr), 'V', '1', '', '100', 'F', 'GL', 'W', 'SW', '', ''));
  }

  let bytes = parts.reduce((n, l) => n + l.length + 2, 0);

  for (let i = 1; bytes < TARGET_BYTES; i++) {
    const nr = ((i - 1) % MAX_WETTKAMPF) + 1;
    const l = line('WERTUNG', String(nr), 'V', String(i), 'JG', '0', '9999', '', `Wertung ${i}`);
    parts.push(l);
    bytes += l.length + 2;
  }

  parts.push('DATEIENDE');
  return parts.join(CRLF) + CRLF;
}

interface Measurement {
  readonly phase: string;
  readonly ms: number;
  readonly retainedMb: number;
  readonly note: string;
}

const results: Measurement[] = [];

function heapMb(): number {
  return process.memoryUsage().heapUsed / 1024 / 1024;
}

/**
 * Misst Zeit und **gehaltenen** Speicher. Vor und nach dem Lauf wird
 * aufgeräumt, während das Ergebnis noch erreichbar ist — die Differenz ist
 * damit das, was die Struktur dauerhaft kostet, nicht der Abfall unterwegs.
 * Ohne `--expose-gc` ist der Wert nur ein grober Anhaltspunkt.
 */
function measure<T>(phase: string, fn: () => T, note: (value: T) => string): T {
  globalThis.gc?.();
  const before = heapMb();

  const start = performance.now();
  const value = fn();
  const ms = performance.now() - start;

  globalThis.gc?.();
  const retainedMb = heapMb() - before;

  results.push({ phase, ms, retainedMb, note: note(value) });
  return value;
}

function main(): void {
  const input = buildInput();
  const mb = input.length / 1024 / 1024;
  const lines = input.split(CRLF).length - 1;

  console.log(`Eingabe: ${mb.toFixed(1)} MB, ${lines.toLocaleString('de-DE')} Zeilen`);
  console.log(`Node ${process.version} auf ${process.platform}/${process.arch}`);
  console.log(`Aufräumen zwischen den Phasen: ${globalThis.gc === undefined ? 'nein' : 'ja'}\n`);

  const parsed = measure(
    'Schema-freies Lesen',
    () => parseDsv(input),
    (r) => `${r.document.items.length.toLocaleString('de-DE')} Items`,
  );

  const typed = measure(
    'Typisiertes Lesen',
    () => parseWettkampfdefinitionsliste(input),
    (r) =>
      `${r.document.records.length.toLocaleString('de-DE')} Records, ${r.diagnostics.length} Diagnostics`,
  );

  measure(
    'Schreiben',
    () => writeDsv(parsed.document),
    (text) => (text === input ? 'byte-identisch' : 'ABWEICHUNG!'),
  );

  measure(
    'Projektion',
    () => projectWettkampfdefinitionsliste(typed.document),
    (r) => `${r.diagnostics.length.toLocaleString('de-DE')} Diagnostics`,
  );

  const width = Math.max(...results.map((r) => r.phase.length));
  console.log(
    `${'Phase'.padEnd(width)}  ${'Zeit'.padStart(9)}  ${'Durchsatz'.padStart(11)}  ${'gehalten'.padStart(10)}  Ergebnis`,
  );
  for (const r of results) {
    const throughput = `${(mb / (r.ms / 1000)).toFixed(0)} MB/s`;
    const retained = `${r.retainedMb.toFixed(0)} MB`;
    console.log(
      `${r.phase.padEnd(width)}  ${`${r.ms.toFixed(0)} ms`.padStart(9)}  ${throughput.padStart(11)}  ${retained.padStart(10)}  ${r.note}`,
    );
  }

  const parseRetained = results[0]?.retainedMb ?? 0;
  console.log(
    `\nSchema-freies Dokument hält das ${(parseRetained / mb).toFixed(1)}-fache der Eingabe.`,
  );
  console.log(`RSS am Ende: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(0)} MB`);
}

main();
