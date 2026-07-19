import type { ParseResult } from '../document/types.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../schema/wettkampfdefinitionsliste.js';
import type { TypedList } from './parse-typed-list.js';
import { parseTypedList } from './parse-typed-list.js';

export type { TypedRecord } from './parse-typed-list.js';

/**
 * Eine gelesene Wettkampfdefinitionsliste.
 *
 * Der Typparameter ist ein Phantom: Er unterscheidet die Listenart im
 * Typsystem, ohne die Laufzeitform zu verändern.
 */
export type Wettkampfdefinitionsliste = TypedList<'Wettkampfdefinitionsliste'>;

/**
 * Liest eine Wettkampfdefinitionsliste und legt jeden Feldwert unter seinem
 * Schema-Namen ab.
 *
 * Gelesen wird bewusst nachsichtig: Auch wenn Felder fehlen oder Werte
 * unzulässig sind, entstehen typisierte Records — die Mängel stehen in den
 * Diagnostics. Nur eine falsche Listenart und eine nicht unterstützte
 * Formatversion verhindern die Auswertung ganz.
 */
export function parseWettkampfdefinitionsliste(
  input: string,
): ParseResult<Wettkampfdefinitionsliste> {
  return parseTypedList<'Wettkampfdefinitionsliste'>(input, WETTKAMPFDEFINITIONSLISTE);
}
