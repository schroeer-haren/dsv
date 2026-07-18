/**
 * Uhrzeit im Format `HH:MM` im 24-Stunden-Format (dsv8.md:275), intern als
 * Minuten seit Mitternacht.
 */
const PATTERN = /^(\d{2}):(\d{2})$/;

/** Liest eine Uhrzeit als Minuten seit Mitternacht, oder `null` bei ungültiger Eingabe. */
export function decodeUhrzeit(value: string): number | null {
  const m = PATTERN.exec(value);
  if (m === null) return null;

  const [, hh, mm] = m as unknown as [string, string, string];
  const hours = Number(hh);
  const minutes = Number(mm);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/** Schreibt Minuten seit Mitternacht als `HH:MM` mit führenden Nullen. */
export function encodeUhrzeit(minutesOfDay: number): string {
  const mm = minutesOfDay % 60;
  const hh = (minutesOfDay - mm) / 60;

  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}`;
}
