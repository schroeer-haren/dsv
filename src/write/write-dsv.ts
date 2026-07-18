import type { DsvDocument } from '../document/types.js';

const BOM = '\uFEFF';

/**
 * Gibt das Dokument als Text aus. Solange die Records unverändert sind, ist das
 * Ergebnis byte-identisch mit der Eingabe — der Writer spielt den mitgeführten
 * Rohtext zurück, statt ihn zu rekonstruieren.
 */
export function writeDsv(document: DsvDocument): string {
  const body = document.items.map((item) => item.raw + item.eol).join('');
  return document.hasBom ? BOM + body : body;
}
