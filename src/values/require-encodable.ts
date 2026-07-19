import { createDiagnostic } from '../diagnostics/create.js';
import { DsvWriteError } from '../write/write-error.js';

/**
 * Weist eine Eingabe zurück, die sich nicht in eine gültige Darstellung
 * bringen lässt.
 *
 * Die Codecs sind seit 0.9.0 öffentlich, gerade damit niemand die
 * Formatierungsregel selbst nachbaut. Sie prüften ihre Eingabe aber nicht:
 * `encodeZeit(-1)` ergab `"00:00:00,-1"`, `encodeDatum` schrieb den 31.02.
 * klaglos, obwohl `decodeDatum` ihn als Kalenderfehler zurückweist. Damit
 * erzeugten sie genau das, was der eigene Leser ablehnt — der Grundsatz, den
 * `writeTypedList` sonst durchsetzt.
 *
 * Geworfen wird, statt `null` zu liefern. Die Symmetrie zu den Decodern ist
 * nur scheinbar: Ein Decoder liest **fremde** Eingabe, wo Ungültiges der
 * Normalfall ist und zum Ergebnis gehört. Ein Encoder bekommt den **eigenen**
 * Wert des Aufrufers; ist der ungültig, liegt ein Fehler im aufrufenden
 * Programm vor, keine Eigenschaft der Daten. Ein `null`-Rückgabewert zwänge
 * jede Aufrufstelle zu einer Fallunterscheidung für einen Fall, der nicht
 * eintreten sollte — und die nächstliegende Reaktion darauf, `?? ''`, verlöre
 * den Wert stillschweigend. Ein Wurf zeigt den Fehler dort, wo er entstand.
 */
export function requireEncodable(
  ok: boolean,
  typ: string,
  wert: unknown,
  erwartet: string,
): void {
  if (ok) return;

  throw new DsvWriteError([
    createDiagnostic(
      'invalid-value',
      'error',
      `Cannot encode ${typ} from ${JSON.stringify(wert)}; expected ${erwartet}`,
      { line: 1, data: { value: wert } },
    ),
  ]);
}
