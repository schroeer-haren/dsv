/**
 * Datum im Format `TT.MM.JJJJ` (dsv8.md:271).
 *
 * Das Datum wird als Tripel geführt und nicht auf `Date` abgebildet: `Date`
 * trägt eine Zeitzone mit sich, die im Format nicht vorkommt, und würde
 * ungültige Angaben stillschweigend verschieben (der 32.01. würde zum 01.02.).
 */
export interface Datum {
  /** Tag im Monat, 1 bis zur Länge des Monats. */
  readonly day: number;
  /** Monat, 1–12. */
  readonly month: number;
  /** Vierstelliges Jahr. */
  readonly year: number;
}

const PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;

const MONATSLAENGEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Schaltjahr nach der vollen gregorianischen Regel. */
function istSchaltjahr(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** Länge eines Monats in Tagen; `month` muss zwischen 1 und 12 liegen. */
function tageImMonat(month: number, year: number): number {
  if (month === 2 && istSchaltjahr(year)) return 29;
  return MONATSLAENGEN[month - 1] ?? 0;
}

/**
 * Liest ein Datum, oder `null` bei ungültiger Eingabe.
 *
 * Geprüft werden Form, Monat (1–12) und der Kalender: Der Tag muss es im
 * angegebenen Monat wirklich geben, Schaltjahre eingeschlossen — der
 * 29.02.2024 ist gültig, der 29.02.2025 nicht. Früher prüfte diese Funktion
 * nur die Form (Tag 1–31), um beim Lesen nicht an Angaben zu scheitern, die
 * ein Wettkampfprogramm so ausgegeben hat. Ein Abgleich über alle
 * Testdateien ergab jedoch keine einzige unmögliche Angabe, und eine
 * unabhängige Fremdimplementierung desselben Formats prüft hier ebenfalls
 * den echten Kalender. Der 31.02. ist damit kein Datum, das die Bibliothek
 * weiterreicht, sondern ein Fehler in der Quelldatei.
 *
 * Die Prüfung kommt ohne `Date` aus: `Date` trägt eine Zeitzone mit sich, die
 * im Format nicht vorkommt, und verschöbe ungültige Angaben stillschweigend
 * (der 31.02. würde zum 03.03.), statt sie zu melden.
 */
export function decodeDatum(value: string): Datum | null {
  const m = PATTERN.exec(value);
  if (m === null) return null;

  const [, dd, mm, yyyy] = m as unknown as [string, string, string, string];
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > tageImMonat(month, year)) return null;

  return { day, month, year };
}

/** Schreibt ein Datum als `TT.MM.JJJJ` mit führenden Nullen. */
export function encodeDatum(datum: Datum): string {
  const dd = String(datum.day).padStart(2, '0');
  const mm = String(datum.month).padStart(2, '0');
  const yyyy = String(datum.year).padStart(4, '0');
  return `${dd}.${mm}.${yyyy}`;
}
