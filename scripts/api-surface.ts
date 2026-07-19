/**
 * Ermittelt die öffentliche Oberfläche einschliesslich der Member der
 * exportierten Typen.
 *
 * `docs/public-api.md` friert die Top-Level-Exportnamen ein. Das genügt
 * nicht: Eine Umbenennung wie `meldungen` → `personen` ändert keinen einzigen
 * Exportnamen und ist trotzdem ein Breaking Change. Dieses Modul erzeugt
 * deshalb zusätzlich `docs/public-api-surface.md` — die Feldnamen und
 * Feldtypen jedes erreichbaren Typs.
 *
 * ## Tiefe und Darstellung
 *
 * Jeder benannte Typ wird **genau einmal** und **genau eine Ebene tief**
 * ausgeschrieben; Verweise auf andere benannte Typen stehen als Name da und
 * werden nicht eingesetzt. Die Rekursion steckt darin, dass jeder so
 * verwiesene Typ selbst wieder einen eigenen Eintrag bekommt — auch dann, wenn
 * er nicht exportiert ist, aber von der Oberfläche aus erreichbar. Die
 * Ausgabe ist damit vollständig über die erreichbare Oberfläche, ohne dass ein
 * Typ, auf den zwanzig andere zeigen, zwanzigmal auftaucht.
 *
 * Der Grund ist das Rauschverhalten: Bei voller Auflösung würde eine
 * Umbenennung in `MeldungStart` an jeder Stelle durchschlagen, an der ein
 * `MeldungStart` hängt — der Diff zeigte hunderte Zeilen für eine Änderung, und
 * die Datei wüchse exponentiell mit der Tiefe des Objektgraphen. Bei einer
 * Ebene je Typ entspricht eine Änderung genau einer geänderten Zeile.
 *
 * Anonyme Typen (etwa `{ nummer: number; art: string }`) haben keinen Namen,
 * unter dem sie einen eigenen Eintrag bekommen könnten; sie werden inline
 * ausgeschrieben. Das ist richtig so — sie sind strukturell Teil des Feldes.
 *
 * Member werden alphabetisch sortiert. Die Deklarationsreihenfolge ist kein
 * Teil des Vertrags: Felder umzusortieren bricht keinen Aufrufer, soll den
 * Freeze-Test also auch nicht rot färben.
 *
 *     npx tsx scripts/api-surface.ts
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const entryPoint = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const surfaceDoc = fileURLToPath(new URL('../docs/public-api-surface.md', import.meta.url));

const TYPE_FORMAT =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType |
  ts.TypeFormatFlags.WriteArrayAsGenericType;

/**
 * Die vom Einstiegspunkt exportierten Symbole des jeweiligen Laufs. Dient
 * allein dazu, erreichbare aber nicht exportierte Typen als `intern` zu
 * markieren; wird zu Beginn von `collectSurface` gefüllt.
 */
let exported = new Set<ts.Symbol>();

/** Ein benannter Typ der Oberfläche samt seiner Member. */
interface SurfaceType {
  readonly name: string;
  /** `true`, wenn der Typ nur über ein Feld erreichbar, aber nicht exportiert ist. */
  readonly internal: boolean;
  /** Zeilen des Eintrags, bereits fertig formatiert. */
  readonly members: readonly string[];
}

function createProgram(): ts.Program {
  return ts.createProgram([entryPoint], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
  });
}

/**
 * Sammelt die Oberfläche: alle exportierten Werte und Typen und, transitiv,
 * jeden benannten Typ, der von dort aus über ein Feld erreichbar ist.
 */
export function collectSurface(): { values: string[]; types: SurfaceType[] } {
  const program = createProgram();
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryPoint);
  if (source === undefined) throw new Error(`Einstiegspunkt nicht gefunden: ${entryPoint}`);

  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (moduleSymbol === undefined) throw new Error('Einstiegspunkt ist kein Modul.');

  const values: string[] = [];
  const types = new Map<string, SurfaceType>();
  const queue: { name: string; type: ts.Type; internal: boolean }[] = [];

  /** Merkt sich einen benannten Typ zur späteren Ausgabe. */
  function enqueue(name: string, type: ts.Type, internal: boolean): void {
    if (types.has(name) || queue.some((q) => q.name === name)) return;
    queue.push({ name, type, internal });
  }

  const moduleExports = checker.getExportsOfModule(moduleSymbol).map((symbol) => ({
    name: symbol.getName(),
    target:
      (symbol.getFlags() & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol,
  }));
  exported = new Set(moduleExports.map((e) => e.target));

  for (const { name, target: symbol } of moduleExports) {
    const flags = symbol.getFlags();

    if (
      (flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Class)) !==
      0
    ) {
      enqueue(name, checker.getDeclaredTypeOfSymbol(symbol), false);
    }
    if ((flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Function)) !== 0) {
      const declaration = symbol.getDeclarations()?.[0];
      const type =
        declaration === undefined
          ? checker.getDeclaredTypeOfSymbol(symbol)
          : checker.getTypeOfSymbolAtLocation(symbol, declaration);
      values.push(`${name}: ${checker.typeToString(type, undefined, TYPE_FORMAT)}`);
      collectReferenced(checker, type, enqueue);
    }
  }

  while (queue.length > 0) {
    const next = queue.shift();
    if (next === undefined) break;
    types.set(next.name, {
      name: next.name,
      internal: next.internal,
      members: renderMembers(checker, next.type, enqueue),
    });
  }

  return {
    values: values.sort(),
    types: [...types.values()].sort((a, b) => a.name.localeCompare(b.name, 'en')),
  };
}

/**
 * Schreibt die Member eines Typs aus.
 *
 * Aufgeklappt wird nur, was ein Objekttyp ist. Ein Alias auf eine Union von
 * String-Literalen etwa hat aus Sicht des Checkers die Member von `String`;
 * die gehören nicht uns und ihre Namen tragen wechselnde interne IDs
 * (`__@iterator@667`), was den Snapshot bei jedem TypeScript-Update rauschen
 * liesse. Solche Typen stehen als `= <Typ>` da — ihre Werteliste ist der
 * Vertrag, nicht eine Memberliste.
 *
 * Aus demselben Grund werden nur Properties ausgegeben, die in `src/`
 * deklariert sind: `message` und `stack` an `DsvParseError` kommen aus `Error`
 * und sind nicht unsere Oberfläche.
 */
function renderMembers(
  checker: ts.TypeChecker,
  type: ts.Type,
  enqueue: (name: string, type: ts.Type, internal: boolean) => void,
): string[] {
  if ((type.getFlags() & ts.TypeFlags.Object) === 0) {
    collectReferenced(checker, type, enqueue);
    // `InTypeAlias` schreibt den Rumpf aus statt nur den Aliasnamen — sonst
    // stünde unter `### DsvItem` bloss `= DsvItem`.
    return [
      `= ${checker.typeToString(type, undefined, TYPE_FORMAT | ts.TypeFormatFlags.InTypeAlias)}`,
    ];
  }

  const properties = checker.getPropertiesOfType(type).filter(isOwnProperty);

  const lines = properties.map((property) => {
    const declaration = property.getDeclarations()?.[0];
    const propertyType =
      declaration === undefined
        ? checker.getTypeOfSymbol(property)
        : checker.getTypeOfSymbolAtLocation(property, declaration);
    collectReferenced(checker, propertyType, enqueue);

    const optional = (property.getFlags() & ts.SymbolFlags.Optional) !== 0 ? '?' : '';
    const readonly = isReadonly(declaration) ? 'readonly ' : '';
    return `${readonly}${property.getName()}${optional}: ${checker.typeToString(propertyType, declaration, TYPE_FORMAT)}`;
  });

  const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
  for (const signature of signatures) {
    lines.push(`(): ${checker.signatureToString(signature)}`);
  }

  return lines.sort();
}

/** `true`, wenn die Property in diesem Paket deklariert ist. */
function isOwnProperty(property: ts.Symbol): boolean {
  const file = property.getDeclarations()?.[0]?.getSourceFile().fileName;
  return file !== undefined && file.includes('/src/') && !file.includes('/node_modules/');
}

function isReadonly(declaration: ts.Declaration | undefined): boolean {
  if (declaration === undefined) return false;
  const modifiers = ts.canHaveModifiers(declaration) ? ts.getModifiers(declaration) : undefined;
  return modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword) ?? false;
}

/**
 * Findet die benannten Typen, auf die ein Typ verweist, und meldet sie zur
 * Ausgabe an. Läuft durch Unions, Intersections, Arrays und Typargumente
 * hindurch, damit auch `ReadonlyMap<number, MeldungPerson>` den
 * `MeldungPerson` erreicht.
 */
function collectReferenced(
  checker: ts.TypeChecker,
  type: ts.Type,
  enqueue: (name: string, type: ts.Type, internal: boolean) => void,
  seen = new Set<ts.Type>(),
): void {
  if (seen.has(type)) return;
  seen.add(type);

  if (type.isUnionOrIntersection()) {
    for (const part of type.types) collectReferenced(checker, part, enqueue, seen);
    return;
  }

  for (const argument of checker.getTypeArguments(type as ts.TypeReference) ?? []) {
    collectReferenced(checker, argument, enqueue, seen);
  }

  const symbol = type.aliasSymbol ?? type.getSymbol();
  if (symbol === undefined) return;
  const declaration = symbol.getDeclarations()?.[0];
  if (declaration === undefined) return;

  // Nur Typen aus diesem Paket. Alles aus node_modules oder aus der lib gehört
  // nicht uns und kann nicht von uns gebrochen werden.
  const file = declaration.getSourceFile().fileName;
  if (!file.includes('/src/') || file.includes('/node_modules/')) return;

  if (
    !ts.isInterfaceDeclaration(declaration) &&
    !ts.isTypeAliasDeclaration(declaration) &&
    !ts.isClassDeclaration(declaration)
  ) {
    return;
  }

  enqueue(symbol.getName(), checker.getDeclaredTypeOfSymbol(symbol), !exported.has(symbol));
}

/** Erzeugt den Inhalt von `docs/public-api-surface.md`. */
export function renderSurface(): string {
  const { values, types } = collectSurface();
  const internal = types.filter((t) => t.internal);

  const lines: string[] = [
    '# Öffentliche Oberfläche — Snapshot',
    '',
    '<!-- Erzeugt von scripts/api-surface.ts. Nicht von Hand bearbeiten. -->',
    '',
    'Diese Datei ist **generiert** und dient als Prüfsumme: Sie friert nicht nur',
    'die Exportnamen ein, sondern auch die Member der exportierten Typen. Die von',
    'Hand gepflegte Dokumentation der Oberfläche steht in',
    '[`public-api.md`](./public-api.md) — dort steht, _was_ jeder Export tut; hier',
    'steht, _woraus_ er besteht.',
    '',
    'Jeder benannte Typ steht genau einmal und genau eine Ebene tief. Verweise auf',
    'andere benannte Typen stehen als Name da; deren Aufbau findet sich unter ihrem',
    'eigenen Eintrag. Member sind alphabetisch sortiert, weil ihre Reihenfolge kein',
    'Teil des Vertrags ist. Mit `intern` markierte Typen werden nicht exportiert,',
    'sind aber über ein Feld erreichbar und damit trotzdem Teil der Oberfläche.',
    '',
    'Neu erzeugen mit `npm run api-surface`; `npm run api-surface:check` prüft, dass',
    'die Datei zum Quellstand passt.',
    '',
    `Stand: ${types.length} Typen (davon ${internal.length} intern), ${values.length} Werte.`,
    '',
    '## Werte',
    '',
    '```ts',
    ...values,
    '```',
    '',
    '## Typen',
    '',
  ];

  for (const type of types) {
    lines.push(`### ${type.name}${type.internal ? ' (intern)' : ''}`, '', '```ts');
    lines.push(...type.members);
    lines.push('```', '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

const invokedDirectly =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (invokedDirectly) {
  writeFileSync(surfaceDoc, renderSurface(), 'utf8');
  console.log(`docs/public-api-surface.md geschrieben.`);
}
