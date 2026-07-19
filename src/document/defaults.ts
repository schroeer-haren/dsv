import type { ListSchema } from '../schema/list-schema.js';

/**
 * Baut die Nachschlagetabelle der Unterlassungswerte einer Listenart.
 *
 * Die Spezifikation nennt für einige Felder einen Wert, der gilt, wenn das Feld
 * nicht angegeben ist — etwa „Unterlassungswert ist N." für die relative
 * Zeitangabe eines Abschnitts (dsv8.md:2929) oder `+` für das Vorzeichen einer
 * Reaktionszeit. Das Schema führte diese Werte bereits, wandte sie aber
 * nirgends an; ein weggelassenes Feld kam als `''` im Objektgraph an.
 *
 * Eingesetzt wird der Wert **allein in den Projektionen**, nicht in
 * `TypedRecord.values`. Das ist die entscheidende Grenze: Die Records sind die
 * Grundlage des Schreibens, und ein dort eingesetzter Unterlassungswert
 * stünde anschliessend ausgeschrieben in der Datei — aus einem weggelassenen
 * Feld würde ein angegebenes, und die Byte-Identität des Durchreichewegs wäre
 * dahin. Der Objektgraph dagegen ist ohnehin die ausgedeutete Sicht: Er löst
 * Bezüge auf und dekodiert Zeiten. Einen Unterlassungswert einzusetzen ist
 * dieselbe Art von Deutung — und für den Leser des Graphen der Unterschied
 * zwischen „steht nicht da" und „bedeutet N".
 */
export function createDefaultLookup(schema: ListSchema): (element: string, field: string) => string {
  const byElement = new Map<string, Map<string, string>>();

  for (const { def } of schema.elements) {
    const byField = new Map<string, string>();
    for (const feld of def.fields) {
      if (feld.default !== undefined) byField.set(feld.name, feld.default);
    }
    if (byField.size > 0) byElement.set(def.name.toUpperCase(), byField);
  }

  return (element, field) => byElement.get(element.toUpperCase())?.get(field) ?? '';
}
