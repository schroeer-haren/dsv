import type { ParseResult } from '../document/types.js';
import { VEREINSMELDELISTE } from '../schema/vereinsmeldeliste.js';
import type { TypedList } from './parse-typed-list.js';
import { parseTypedList } from './parse-typed-list.js';

/**
 * Eine gelesene Vereinsmeldeliste.
 *
 * Der Typparameter ist ein Phantom: Er unterscheidet die Listenart im
 * Typsystem, ohne die Laufzeitform zu verändern.
 */
export type Vereinsmeldeliste = TypedList<'Vereinsmeldeliste'>;

/**
 * Liest eine Vereinsmeldeliste und legt jeden Feldwert unter seinem
 * Schema-Namen ab.
 *
 * Wie bei den anderen Listenarten wird nachsichtig gelesen: Mängel stehen in
 * den Diagnostics, verhindern aber die typisierten Records nicht. Nur eine
 * falsche Listenart und eine nicht unterstützte Formatversion führen zu
 * `fatal` und einem leeren Bestand.
 */
export function parseVereinsmeldeliste(input: string): ParseResult<Vereinsmeldeliste> {
  return parseTypedList<'Vereinsmeldeliste'>(input, VEREINSMELDELISTE);
}
