import { requireEncodable } from './require-encodable.js';

/**
 * Schwimmzeit im Format `HH:MM:SS,hh` (dsv8.md:267), intern als Hundertstel.
 *
 * `00:00:00,00` ist der spezifizierte Unterlassungswert für „keine Zeit" und
 * wird bewusst nicht auf `null` abgebildet — sonst ginge beim Zurückschreiben
 * die Unterscheidung zwischen „nicht angegeben" und „ausdrücklich Null"
 * verloren.
 */
const PATTERN = /^(\d{2}):(\d{2}):(\d{2}),(\d{2})$/;

/** Liest eine Zeit als Hundertstel, oder `null` bei ungültiger Eingabe. */
export function decodeZeit(value: string): number | null {
  const m = PATTERN.exec(value);
  if (m === null) return null;

  const [, hh, mm, ss, cs] = m as unknown as [string, string, string, string, string];
  const minutes = Number(mm);
  const seconds = Number(ss);
  if (minutes > 59 || seconds > 59) return null;

  return ((Number(hh) * 60 + minutes) * 60 + seconds) * 100 + Number(cs);
}

/** Grösste darstellbare Zeit: `99:59:59,99`. Das Format führt zwei Stundenstellen. */
const MAX_HUNDERTSTEL = 35_999_999;

/**
 * Schreibt Hundertstel als `HH:MM:SS,hh` mit führenden Nullen.
 *
 * @throws {DsvWriteError} wenn `hundredths` keine ganze Zahl zwischen `0` und
 * `35999999` ist.
 */
export function encodeZeit(hundredths: number): string {
  requireEncodable(
    Number.isInteger(hundredths) && hundredths >= 0 && hundredths <= MAX_HUNDERTSTEL,
    'Zeit',
    hundredths,
    `an integer between 0 and ${String(MAX_HUNDERTSTEL)} (99:59:59,99)`,
  );

  const cs = hundredths % 100;
  const totalSeconds = (hundredths - cs) / 100;
  const ss = totalSeconds % 60;
  const totalMinutes = (totalSeconds - ss) / 60;
  const mm = totalMinutes % 60;
  const hh = (totalMinutes - mm) / 60;

  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)},${pad(cs)}`;
}

/** `true` für den Unterlassungswert „keine Zeit". */
export function isZeroZeit(hundredths: number): boolean {
  return hundredths === 0;
}
