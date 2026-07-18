/**
 * Erzeugt aus den Schema-Definitionen benannte TypeScript-Interfaces.
 *
 * Die Typen werden generiert statt inferiert, weil aus Mapped Types
 * entstandene Keys kein JSDoc tragen können — siehe docs/architecture.md.
 *
 *     npx tsx scripts/generate-types.ts
 */

import { writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import type { ElementDef, FieldDef } from '../src/schema/types.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../src/schema/wettkampfdefinitionsliste.js';

/** Werte, die es in der angegebenen Formatversion schon gibt. */
function valuesFor(field: FieldDef, version: 7 | 8) {
  return (field.values ?? []).filter((v) => v.since === undefined || v.since <= version);
}

/**
 * Typ eines Feldes. Felder mit fester Werteliste werden zur String-Literal-
 * Union, damit die zulässigen Werte beim Tippen erscheinen. Tolerierte Werte
 * gehören dazu: Sie kommen in echten Dateien vor, sind also lesbar.
 */
function renderType(field: FieldDef, version: 7 | 8): string {
  const values = valuesFor(field, version);
  if (values.length === 0) return 'string';
  return values.map((v) => `'${v.value}'`).join(' | ');
}

function renderDoc(field: FieldDef, version: 7 | 8): string[] {
  const lines = [`  /**`, `   * ${field.doc}`];

  const values = valuesFor(field, version);
  if (values.length > 0) {
    lines.push(`   *`);
    for (const v of values) {
      const hinweis = v.tolerated
        ? ' (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)'
        : '';
      lines.push(`   * - \`${v.value}\` — ${v.doc}${hinweis}`);
    }
  }

  lines.push(`   *`, `   * @see ${field.specRef}`, `   */`);
  return lines;
}

export function renderElement(name: string, def: ElementDef, version: 7 | 8): string {
  const fields = def.fields.filter((f) => f.since === undefined || f.since <= version);

  if (fields.length === 0) return `export type ${name} = Record<string, never>;\n`;

  const body = fields
    .map((f) => {
      const optional = f.required ? '' : '?';
      return [...renderDoc(f, version), `  ${f.name}${optional}: ${renderType(f, version)};`].join(
        '\n',
      );
    })
    .join('\n\n');

  return `export interface ${name} {\n${body}\n}\n`;
}

/**
 * Gibt beide Formatversionen aus. Unterscheiden sie sich nicht, wird die
 * zweite ein Alias statt einer Kopie. Ohne das entstünden bei rund 80
 * Elementdefinitionen 160 Interfaces, überwiegend paarweise identisch.
 *
 * Ob sie sich unterscheiden, wird an den gerenderten Fassungen selbst
 * entschieden und nicht an `field.since` allein: Auch ein einzelner Wert mit
 * `since: 8` macht die Unions verschieden, und diese Fassungen darf man nicht
 * aliasen.
 */
export function renderBothVersions(baseName: string, def: ElementDef): string {
  const v7 = renderElement(`${baseName}V7`, def, 7);
  const v8Body = renderElement(`${baseName}V8`, def, 8);

  const identical = renderElement('X', def, 7) === renderElement('X', def, 8);
  const v8 = identical ? `export type ${baseName}V8 = ${baseName}V7;\n` : v8Body;

  return `${v7}\n${v8}`;
}

/** ELEMENTNAME wird zu Elementname — der Rumpf der generierten Typnamen. */
function baseNameOf(elementName: string): string {
  return elementName.charAt(0).toUpperCase() + elementName.slice(1).toLowerCase();
}

/**
 * Läuft am Ende über Prettier, damit die Datei so aussieht, wie `npm run
 * format` sie hinterliesse. Ohne das bräche `npm run generate:check`, sobald
 * eine Union länger wird als die Zeilenbreite: Prettier bräche sie um, der
 * nächste Lauf schriebe sie wieder einzeilig.
 */
async function main(): Promise<void> {
  const parts = [
    '// Generiert von scripts/generate-types.ts — nicht von Hand ändern.',
    '',
    ...WETTKAMPFDEFINITIONSLISTE.elements.map((occurrence) =>
      renderBothVersions(baseNameOf(occurrence.def.name), occurrence.def),
    ),
  ];

  const target = 'src/schema/generated.ts';
  const options = await resolveConfig(target);
  const output = await format(parts.join('\n'), { ...options, filepath: target });

  writeFileSync(target, output);
  console.log(`${target} geschrieben`);
}

if (process.argv[1]?.endsWith('generate-types.ts')) void main();
