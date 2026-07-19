import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { collectSurface, renderSurface } from '../scripts/api-surface.js';

/**
 * Friert die öffentliche Oberfläche ein. `docs/public-api.md` ist die
 * verbindliche Liste; dieser Test vergleicht sie mit dem, was `src/index.ts`
 * tatsächlich exportiert. Jede Abweichung — ein neuer Export, ein entfernter,
 * ein umbenannter oder eine geänderte Art — lässt ihn fehlschlagen.
 *
 * Die Exporte werden über den TypeScript-Compiler ermittelt und nicht über
 * `Object.keys`, weil Typ-Exporte zur Laufzeit nicht existieren. Der Test
 * braucht deshalb keinen vorherigen Build.
 */

const entryPoint = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const apiDoc = fileURLToPath(new URL('../docs/public-api.md', import.meta.url));
const surfaceDoc = fileURLToPath(new URL('../docs/public-api-surface.md', import.meta.url));

type ExportKind = 'class' | 'constant' | 'function' | 'type';

/** Ein Eintrag der Oberfläche: Name und Art, unabhängig von der Beschreibung. */
interface ApiEntry {
  readonly name: string;
  readonly kind: ExportKind;
}

/** Liest die tatsächlichen Exporte des Einstiegspunkts aus dem Typsystem. */
function actualExports(): ApiEntry[] {
  const program = ts.createProgram([entryPoint], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryPoint);
  if (source === undefined) throw new Error(`Einstiegspunkt nicht gefunden: ${entryPoint}`);

  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (moduleSymbol === undefined) throw new Error('Einstiegspunkt ist kein Modul.');

  return checker.getExportsOfModule(moduleSymbol).map((symbol) => {
    const target =
      (symbol.getFlags() & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
    return { name: symbol.getName(), kind: kindOf(target.getFlags(), symbol.getName()) };
  });
}

function kindOf(flags: ts.SymbolFlags, name: string): ExportKind {
  if ((flags & ts.SymbolFlags.Class) !== 0) return 'class';
  if ((flags & ts.SymbolFlags.Function) !== 0) return 'function';
  if ((flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)) !== 0) return 'type';
  if ((flags & ts.SymbolFlags.Variable) !== 0) return 'constant';
  throw new Error(`Unbekannte Art des Exports ${name} (Flags ${flags}).`);
}

/** Liest die verbindliche Liste aus der Dokumentation. */
function documentedExports(): (ApiEntry & { readonly description: string })[] {
  // Prettier richtet die Tabellenspalten mit Leerzeichen aus; die Auffüllung
  // gehört deshalb zum erwarteten Format und nicht zum Zellinhalt.
  const row = /^\|\s*`(\w+)`\s*\|\s*(class|constant|function|type)\s*\|\s*(.+?)\s*\|$/;
  const entries: (ApiEntry & { readonly description: string })[] = [];

  for (const line of readFileSync(apiDoc, 'utf8').split('\n')) {
    const match = row.exec(line.trim());
    if (match === null) continue;
    const [, name, kind, description] = match;
    if (name === undefined || kind === undefined || description === undefined) continue;
    entries.push({ name, kind: kind as ExportKind, description });
  }

  return entries;
}

function format(entries: readonly ApiEntry[]): string[] {
  return entries.map((e) => `${e.kind} ${e.name}`).sort();
}

describe('öffentliche API', () => {
  const documented = documentedExports();
  const actual = actualExports();

  it('ist in docs/public-api.md vollständig dokumentiert', () => {
    expect(format(actual)).toEqual(format(documented));
  });

  it('beschreibt jeden Eintrag mit einer Zeile', () => {
    for (const entry of documented) {
      expect(entry.description.trim(), `${entry.name} braucht eine Beschreibung`).not.toBe('');
      expect(entry.description, `${entry.name}: Beschreibung ist mehrzeilig`).not.toContain('\n');
    }
  });

  it('führt jeden Namen genau einmal', () => {
    const names = documented.map((e) => e.name);
    expect(names).toEqual([...new Set(names)]);
  });
});

/**
 * Der Freeze über die Exportnamen allein genügt nicht: Ein umbenanntes Feld
 * eines exportierten Typs ändert keinen Exportnamen und ist trotzdem ein
 * Breaking Change. `docs/public-api-surface.md` hält deshalb zusätzlich die
 * Member jedes erreichbaren Typs fest — Aufbau und Begründung der Tiefe stehen
 * am Kopf von `scripts/api-surface.ts`.
 */
describe('Member der öffentlichen Typen', () => {
  it('entsprechen docs/public-api-surface.md', () => {
    const expected = readFileSync(surfaceDoc, 'utf8');
    const actual = renderSurface();

    // Der Vergleich läuft zeilenweise: Bei einer Abweichung zeigt Vitest dann
    // die geänderte Zeile und nicht 2500 Zeilen Diff.
    expect(
      actual.split('\n'),
      'Oberfläche und Snapshot weichen ab — mit `npm run api-surface` neu erzeugen und den Diff prüfen.',
    ).toEqual(expected.split('\n'));
  });
});

/**
 * Typen, die von der Oberfläche aus über ein Feld erreichbar sind, aber
 * bewusst **nicht** exportiert werden. Die Liste ist absichtlich leer: Wer
 * einen Eintrag hinzufügt, muss danebenschreiben, warum ein Anwender diesen
 * Typ nicht benennen können soll, obwohl er ihn in Händen hält.
 *
 * Ohne Begründung an Ort und Stelle liest sich eine solche Ausnahme später als
 * Versehen — genau so ist `VereinsergebnisStaffelBesetzung` bis kurz vor 1.0
 * unexportiert geblieben.
 */
const ERLAUBT_INTERN: readonly string[] = [];

/**
 * Schliesst die Lücke zwischen den beiden Freezes oben: Der Namensvergleich
 * sieht nur, was exportiert _ist_, und der Snapshot notiert einen internen Typ
 * nur als Markierung `(intern)` — beide werden grün, während ein Anwender einen
 * Typ vor sich hat, den er nicht importieren kann. Er erreicht ihn dann nur
 * strukturell über `Elterntyp['feld'][number]`.
 */
describe('erreichbare Typen', () => {
  it('sind alle exportiert', () => {
    const internal = collectSurface()
      .types.filter((type) => type.internal)
      .map((type) => type.name)
      .filter((name) => !ERLAUBT_INTERN.includes(name));

    expect(
      internal,
      'Diese Typen sind über ein Feld der Oberfläche erreichbar, aber nicht aus src/index.ts exportiert — ' +
        'entweder exportieren oder mit Begründung in ERLAUBT_INTERN aufnehmen.',
    ).toEqual([]);
  });

  it('führt in ERLAUBT_INTERN keinen Namen, der gar nicht mehr intern ist', () => {
    const internal = new Set(
      collectSurface()
        .types.filter((type) => type.internal)
        .map((type) => type.name),
    );
    for (const name of ERLAUBT_INTERN) {
      expect(internal.has(name), `${name} ist nicht (mehr) intern — Eintrag entfernen`).toBe(true);
    }
  });
});
