/**
 * Datum im Format `TT.MM.JJJJ` (dsv8.md:271).
 *
 * Das Datum wird als Tripel geführt und nicht auf `Date` abgebildet: `Date`
 * trägt eine Zeitzone mit sich, die im Format nicht vorkommt, und würde
 * ungültige Angaben stillschweigend verschieben (der 32.01. würde zum 01.02.).
 */
export interface Datum {
  /** Tag im Monat, 1–31. */
  readonly day: number;
  /** Monat, 1–12. */
  readonly month: number;
  /** Vierstelliges Jahr. */
  readonly year: number;
}

const PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/**
 * Liest ein Datum, oder `null` bei ungültiger Eingabe.
 *
 * Geprüft werden Tag (1–31) und Monat (1–12); die Länge des jeweiligen Monats
 * wird bewusst nicht geprüft, damit das Lesen nicht an Angaben scheitert, die
 * ein Wettkampfprogramm so ausgegeben hat.
 */
export function decodeDatum(value: string): Datum | null {
  const m = PATTERN.exec(value);
  if (m === null) return null;

  const [, dd, mm, yyyy] = m as unknown as [string, string, string, string];
  const day = Number(dd);
  const month = Number(mm);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  return { day, month, year: Number(yyyy) };
}

/** Schreibt ein Datum als `TT.MM.JJJJ` mit führenden Nullen. */
export function encodeDatum(datum: Datum): string {
  const dd = String(datum.day).padStart(2, '0');
  const mm = String(datum.month).padStart(2, '0');
  const yyyy = String(datum.year).padStart(4, '0');
  return `${dd}.${mm}.${yyyy}`;
}
