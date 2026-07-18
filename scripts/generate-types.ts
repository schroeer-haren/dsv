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

/**
 * Gibt beide Formatversionen aus. Unterscheiden sie sich nicht — weil das
 * Element kein `since`-Feld hat —, wird die zweite ein Alias statt einer
 * Kopie. Ohne das entstünden bei rund 80 Elementdefinitionen 160 Interfaces,
 * überwiegend paarweise identisch.
 */
export function renderBothVersions(baseName: string, def: ElementDef): string {
  const v7 = renderElement(`${baseName}V7`, def, 7);
  const v8Body = renderElement(`${baseName}V8`, def, 8);

  const identical = def.fields.every((f) => f.since === undefined);
  const v8 = identical ? `export type ${baseName}V8 = ${baseName}V7;\n` : v8Body;

  return `${v7}\n${v8}`;
}

function main(): void {
  const parts = [
    '// Generiert von scripts/generate-types.ts — nicht von Hand ändern.',
    '',
    renderBothVersions('AbschnittWkdef', ABSCHNITT_WKDEF),
    renderBothVersions('AbschnittErgebnis', ABSCHNITT_ERGEBNIS),
  ];

  writeFileSync('src/schema/generated.ts', parts.join('\n'));
  console.log('src/schema/generated.ts geschrieben');
}

if (process.argv[1]?.endsWith('generate-types.ts')) main();
