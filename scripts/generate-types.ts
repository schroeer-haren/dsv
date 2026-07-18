/**
 * Erzeugt aus den Schema-Definitionen benannte TypeScript-Interfaces.
 *
 * Die Typen werden generiert statt inferiert, weil aus Mapped Types
 * entstandene Keys kein JSDoc tragen können — siehe docs/architecture.md.
 *
 *     npx tsx scripts/generate-types.ts
 */

import { writeFileSync } from 'node:fs';
import type { ElementDef } from '../src/schema/types.js';
import { ABSCHNITT_ERGEBNIS, ABSCHNITT_WKDEF } from '../src/schema/spike-abschnitt.js';

export function renderElement(name: string, def: ElementDef, version: 7 | 8): string {
  const fields = def.fields.filter((f) => f.since === undefined || f.since <= version);

  const body = fields
    .map((f) => {
      const optional = f.required ? '' : '?';
      return [
        `  /**`,
        `   * ${f.doc}`,
        `   *`,
        `   * @see ${f.specRef}`,
        `   */`,
        `  ${f.name}${optional}: string;`,
      ].join('\n');
    })
    .join('\n\n');

  return `export interface ${name} {\n${body}\n}\n`;
}

function main(): void {
  const parts = [
    '// Generiert von scripts/generate-types.ts — nicht von Hand ändern.',
    '',
    renderElement('AbschnittWkdefV7', ABSCHNITT_WKDEF, 7),
    renderElement('AbschnittWkdefV8', ABSCHNITT_WKDEF, 8),
    renderElement('AbschnittErgebnisV7', ABSCHNITT_ERGEBNIS, 7),
    renderElement('AbschnittErgebnisV8', ABSCHNITT_ERGEBNIS, 8),
  ];

  writeFileSync('src/schema/generated.ts', parts.join('\n'));
  console.log('src/schema/generated.ts geschrieben');
}

if (process.argv[1]?.endsWith('generate-types.ts')) main();
