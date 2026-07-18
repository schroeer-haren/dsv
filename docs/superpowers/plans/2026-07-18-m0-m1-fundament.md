# M0 + M1: Typ-Spike und Fundament — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Codegen-Entscheidung an einer echten `.d.ts` absichern (M0) und danach das domänenfreie Fundament bauen, das jede DSV-Datei zeilenweise in Records zerlegt und byte-identisch zurückschreibt (M1, Release 0.1.0).

**Architecture:** Vier Blattmodule ohne Domänenwissen — `diagnostics` (Befunde), `source` (BOM, Zeilenenden, Positionen), `lexer` (Zeile → Element, Felder, Kommentar), `values` (Skalar-Codecs) — darüber ein schema-freier `parse`/`write`-Paar. Jeder Record führt seine Originalzeile mit; der Writer gibt sie unverändert zurück, solange nichts geändert wurde. Damit ist Byte-Identität keine Rekonstruktionsleistung, sondern eine Eigenschaft der Datenstruktur.

**Tech Stack:** TypeScript (strict), Vitest, fast-check, tsup, ESLint + Prettier. Node ≥ 18.

**Spec:** [`docs/superpowers/specs/2026-07-18-weg-zu-v1-design.md`](../specs/2026-07-18-weg-zu-v1-design.md)
**Architektur:** [`docs/architecture.md`](../../architecture.md)

---

## Abweichung von der Spec

Die Spec beschreibt M0 als „`ABSCHNITT` … durch die volle Kette". Die Kette
(Lexer, Parser, Writer) entsteht aber erst in M1. Der Spike prüft ausschließlich
die **Typerzeugung**; dafür genügt Schema → Codegen → Build → `.d.ts`. M0 wird
hier entsprechend zugeschnitten. Das Abbruchkriterium der Spec bleibt unberührt.

## Arbeitsweise

Die Umsetzung läuft auf einem Branch, nicht direkt auf `main`:

```bash
git switch -c feat/m0-m1-fundament
```

Alle Task-Commits gehen dorthin. Erst nach Task 17, Schritt 2 — also nach
bestandenem Test-Review-Zyklus — wird nach `main` gebracht und getaggt. Damit
bleibt `main` durchgehend releasefähig, und der Release-Workflow feuert nicht
auf halbfertigen Zwischenständen.

## Domänenwissen für Umsetzende

Wer diesen Plan ausführt, braucht diese Fakten über das Dateiformat. Alle sind
in `spec/dsv8.md` belegt und an den 108 Fixtures in `test/fixtures/real/`
überprüft.

- Eine Zeile ist **ein Element**: `ELEMENTNAME:attr1;attr2;` — Attribute mit `;`
  **terminiert**, auch das letzte. `split(';')` liefert dadurch ein leeres
  Schlusselement, das **kein** Feld ist.
- **`DATEIENDE`** ist das einzige Element **ohne Doppelpunkt und ohne Attribute**.
- **Kommentarzeilen** stehen in `(* … *)` und beginnen die Zeile. Zusätzlich
  gibt es **Kommentare am Zeilenende**, hinter dem letzten `;` — in 92.261
  Zeilen des Fixture-Bestands. Ein `(*` **innerhalb** eines Feldes ist dagegen
  gewöhnlicher Inhalt.
- **Kein Quoting, kein Escaping.** Anführungszeichen sind normale Zeichen und
  Teil von Wettkampfnamen. Niemals dequoten.
- **Leerzeichen um Werte sind zulässig** und häufig (`FORMAT: Wettkampf…` in 91
  von 108 Dateien). Werte werden getrimmt, der Rohtext bleibt erhalten.
- **`FORMAT:` steht selten in Zeile 1** — meist stehen Erzeuger-Kommentare davor
  (Zeile 3, 6 oder 9). Nur 2 von 108 Dateien beginnen damit.
- **Zeilenenden gemischt**: 95× CRLF, 13× LF im Bestand. Beides muss erhalten
  bleiben.
- Vergleiche von Listart und Version sind **case-insensitiv**
  (`FORMAT:WETTKAMPFERGEBNISLISTE` kommt vor).

## Dateistruktur

| Datei                       | Verantwortung                                               |
| --------------------------- | ----------------------------------------------------------- |
| `src/diagnostics/types.ts`  | `Severity`, `Position`, `Diagnostic`, `DiagnosticCode`      |
| `src/diagnostics/create.ts` | Konstruktor-Helfer für Diagnostics                          |
| `src/source/source-text.ts` | BOM abtrennen, in Zeilen mit erhaltenem Zeilenende zerlegen |
| `src/lexer/lex-line.ts`     | eine Zeile → `LexedLine` (Kommentar / leer / Element)       |
| `src/values/*.ts`           | je ein Skalar-Codec mit `decode`/`encode`                   |
| `src/parse/parse-dsv.ts`    | Zeilen → `DsvDocument` + Diagnostics                        |
| `src/write/write-dsv.ts`    | `DsvDocument` → Text                                        |
| `src/document/types.ts`     | `DsvDocument`, `DsvRecord`, `DsvItem`                       |
| `src/index.ts`              | öffentliche API                                             |
| `scripts/generate-types.ts` | Codegen Schema → `src/schema/generated.ts`                  |

Jedes Modul bekommt eine gleichnamige Testdatei unter `test/`.

---

# M0 — Typ-Spike

### Task 1: Schema-Repräsentation

**Files:**

- Create: `src/schema/types.ts`
- Test: `test/schema/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { element, field } from '../../src/schema/types.js';

describe('element', () => {
  it('hält Name und Felder in Reihenfolge', () => {
    const def = element('ABSCHNITT', [
      field('abschnittsnr', 'Zahl', { required: true, doc: 'Nummer', specRef: 'dsv8.md:914' }),
      field('einlass', 'Uhrzeit', { doc: 'Einlass', specRef: 'dsv8.md:920' }),
    ]);

    expect(def.name).toBe('ABSCHNITT');
    expect(def.fields.map((f) => f.name)).toEqual(['abschnittsnr', 'einlass']);
    expect(def.fields[0]!.required).toBe(true);
    expect(def.fields[1]!.required).toBe(false);
  });

  it('markiert Felder, die es erst ab DSV8 gibt', () => {
    const def = element('BANKVERBINDUNG', [
      field('kontoinhaber', 'ZK', {
        required: true,
        since: 8,
        doc: 'Inhaber',
        specRef: 'dsv8.md:786',
      }),
    ]);

    expect(def.fields[0]!.since).toBe(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/schema/types.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/schema/types.js"`

- [ ] **Step 3: Write minimal implementation**

```ts
/** Skalare Datentypen des DSV-Standards (dsv8.md:249–300). */
export type ScalarType =
  'ZK' | 'Zahl' | 'Zeichen' | 'Zeit' | 'Datum' | 'Uhrzeit' | 'Betrag' | 'JGAK' | 'JN';

export interface FieldDef {
  readonly name: string;
  readonly type: ScalarType;
  readonly required: boolean;
  /** Gesetzt, wenn das Feld erst ab dieser Formatversion existiert. */
  readonly since?: 8;
  /** Wird als JSDoc in die generierten Typen übernommen. */
  readonly doc: string;
  /** Fundstelle in der Spezifikation, z. B. `dsv8.md:914`. */
  readonly specRef: string;
}

export interface ElementDef {
  readonly name: string;
  /** Element ohne Doppelpunkt und ohne Attribute — nur `DATEIENDE`. */
  readonly bare: boolean;
  readonly fields: readonly FieldDef[];
}

interface FieldOptions {
  readonly required?: boolean;
  readonly since?: 8;
  readonly doc: string;
  readonly specRef: string;
}

export function field(name: string, type: ScalarType, options: FieldOptions): FieldDef {
  return {
    name,
    type,
    required: options.required ?? false,
    ...(options.since === undefined ? {} : { since: options.since }),
    doc: options.doc,
    specRef: options.specRef,
  };
}

export function element(
  name: string,
  fields: readonly FieldDef[],
  options: { bare?: boolean } = {},
): ElementDef {
  return { name, bare: options.bare ?? false, fields };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/schema/types.test.ts`
Expected: PASS, 2 Tests

- [ ] **Step 5: Commit**

```bash
git add src/schema/types.ts test/schema/types.test.ts
git commit -m "feat: add schema element and field definitions"
```

---

### Task 2: `ABSCHNITT` in beiden Varianten definieren

**Files:**

- Create: `src/schema/spike-abschnitt.ts`
- Test: `test/schema/spike-abschnitt.test.ts`

Belege: Wettkampfdefinitionsliste 6 Attribute (`dsv8.md:894–969`),
alle übrigen Listenarten 4 Attribute (`dsv8.md:2886–2929`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { ABSCHNITT_ERGEBNIS, ABSCHNITT_WKDEF } from '../../src/schema/spike-abschnitt.js';

describe('ABSCHNITT', () => {
  it('hat 6 Attribute in der Wettkampfdefinitionsliste', () => {
    expect(ABSCHNITT_WKDEF.fields.map((f) => f.name)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'einlass',
      'kampfrichtersitzung',
      'anfangszeit',
      'relativeAngabe',
    ]);
  });

  it('hat 4 Attribute in den übrigen Listenarten', () => {
    expect(ABSCHNITT_ERGEBNIS.fields.map((f) => f.name)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'anfangszeit',
      'relativeAngabe',
    ]);
  });

  it('kennzeichnet Pflichtfelder', () => {
    const required = ABSCHNITT_WKDEF.fields.filter((f) => f.required).map((f) => f.name);
    expect(required).toEqual(['abschnittsnr', 'abschnittsdatum', 'anfangszeit']);
  });

  it('belegt jedes Feld mit einer Spec-Fundstelle', () => {
    for (const f of ABSCHNITT_WKDEF.fields) {
      expect(f.specRef).toMatch(/^dsv8\.md:\d+$/);
      expect(f.doc.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/schema/spike-abschnitt.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

```ts
import { element, field } from './types.js';

/** ABSCHNITT der Wettkampfdefinitionsliste — 6 Attribute (dsv8.md:894). */
export const ABSCHNITT_WKDEF = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts, maximal zweistellig.',
    specRef: 'dsv8.md:914',
  }),
  field('abschnittsdatum', 'Datum', {
    required: true,
    doc: 'Datum, an dem der Abschnitt stattfindet.',
    specRef: 'dsv8.md:916',
  }),
  field('einlass', 'Uhrzeit', {
    doc: 'Uhrzeit des Einlasses.',
    specRef: 'dsv8.md:918',
  }),
  field('kampfrichtersitzung', 'Uhrzeit', {
    doc: 'Uhrzeit der Kampfrichtersitzung.',
    specRef: 'dsv8.md:920',
  }),
  field('anfangszeit', 'Uhrzeit', {
    required: true,
    doc: 'Uhrzeit, zu der der Abschnitt beginnt.',
    specRef: 'dsv8.md:922',
  }),
  field('relativeAngabe', 'JN', {
    doc: 'J, wenn die Anfangszeit relativ zum Ende des Vorabschnitts zu verstehen ist. Unterlassungswert N.',
    specRef: 'dsv8.md:924',
  }),
]);

/** ABSCHNITT der übrigen Listenarten — 4 Attribute (dsv8.md:2886). */
export const ABSCHNITT_ERGEBNIS = element('ABSCHNITT', [
  ABSCHNITT_WKDEF.fields[0]!,
  ABSCHNITT_WKDEF.fields[1]!,
  ABSCHNITT_WKDEF.fields[4]!,
  ABSCHNITT_WKDEF.fields[5]!,
]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/schema/spike-abschnitt.test.ts`
Expected: PASS, 4 Tests

- [ ] **Step 5: Commit**

```bash
git add src/schema/spike-abschnitt.ts test/schema/spike-abschnitt.test.ts
git commit -m "feat: define ABSCHNITT for both list type variants"
```

---

### Task 3: Codegen-Skript

**Files:**

- Create: `scripts/generate-types.ts`
- Modify: `package.json` (Skript `generate`)

Das Skript erzeugt aus den Elementdefinitionen benannte Interfaces mit JSDoc.
Pro Element und Formatversion **ein** Interface — kein Generic, weil ein
`V extends 7 | 8` sonst durch alle Schichten propagieren müsste.

- [ ] **Step 1: Write the failing test**

**Files:** Test: `test/schema/generate-types.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { renderElement } from '../../scripts/generate-types.js';
import { ABSCHNITT_WKDEF } from '../../src/schema/spike-abschnitt.js';

describe('renderElement', () => {
  const dsv7 = renderElement('AbschnittWkdef', ABSCHNITT_WKDEF, 7);

  it('erzeugt ein benanntes Interface', () => {
    expect(dsv7).toContain('export interface AbschnittWkdef {');
  });

  it('macht optionale Felder optional', () => {
    expect(dsv7).toContain('abschnittsnr: string;');
    expect(dsv7).toContain('einlass?: string;');
  });

  it('schreibt JSDoc mit Spec-Fundstelle an jedes Feld', () => {
    expect(dsv7).toContain('Nummer des Abschnitts, maximal zweistellig.');
    expect(dsv7).toContain('@see dsv8.md:914');
  });

  it('lässt seit DSV8 hinzugekommene Felder in der DSV7-Fassung weg', () => {
    const withSince = {
      ...ABSCHNITT_WKDEF,
      fields: [
        ...ABSCHNITT_WKDEF.fields,
        {
          name: 'neu',
          type: 'ZK' as const,
          required: false,
          since: 8 as const,
          doc: 'Neu',
          specRef: 'dsv8.md:1',
        },
      ],
    };
    expect(renderElement('X', withSince, 7)).not.toContain('neu');
    expect(renderElement('X', withSince, 8)).toContain('neu?: string;');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/schema/generate-types.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * Erzeugt aus den Schema-Definitionen benannte TypeScript-Interfaces.
 *
 * Die Typen werden generiert statt inferiert, weil aus Mapped Types
 * entstandene Keys kein JSDoc tragen können — siehe docs/architecture.md.
 *
 *     node scripts/generate-types.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/schema/generate-types.test.ts`
Expected: PASS, 4 Tests

- [ ] **Step 5: Node-Typen installieren**

Ohne diese Typen scheitert `npm run typecheck` an jedem `node:fs`-Import — und
damit auch der Release-Workflow, der `typecheck` ausführt.

```bash
npm install -D @types/node
npx tsc --noEmit
```

Expected: keine Ausgabe

- [ ] **Step 6: Generate and wire up the script**

```bash
node scripts/generate-types.ts
```

In `package.json` unter `scripts` ergänzen:

```json
"generate": "node scripts/generate-types.ts",
"generate:check": "npm run generate && git diff --exit-code src/schema/generated.ts"
```

- [ ] **Step 7: Commit**

```bash
git add scripts/generate-types.ts test/schema/generate-types.test.ts src/schema/generated.ts package.json package-lock.json
git commit -m "feat: generate named interfaces from schema definitions"
```

---

### Task 4: Spike auswerten und Entscheidung dokumentieren

**Files:**

- Modify: `src/index.ts` (temporärer Export für die Prüfung)
- Modify: `docs/architecture.md` (Ergebnis festhalten)

- [ ] **Step 1: Typ exportieren und bauen**

In `src/index.ts` ergänzen:

```ts
export type { AbschnittWkdefV8 } from './schema/generated.js';
```

Run: `npm run build`

- [ ] **Step 2: Erzeugte Deklaration prüfen**

Run: `grep -A 12 "interface AbschnittWkdefV8" dist/index.d.ts`

Erwartet: das Interface mit JSDoc pro Feld, **ohne** Schema-Literal.

- [ ] **Step 3: Abbruchkriterium anwenden**

Codegen gilt als **bestätigt**, wenn beides zutrifft:

1. `dist/index.d.ts` enthält `interface AbschnittWkdefV8` als benanntes
   Interface — nicht als `Prettify<Pick<…>>` o. Ä.
2. `dist/index.d.ts` enthält **kein** Schema-Literal (`grep -c "specRef" dist/index.d.ts || true` → `0`; `grep -c` beendet sich bei null Treffern mit Status 1)

Trifft eines nicht zu, greift der in der Spec benannte Rückfallpfad.

- [ ] **Step 4: Ergebnis in architecture.md festhalten**

Im Abschnitt „Leitentscheidung" einen Absatz ergänzen, der das Spike-Ergebnis
mit Datum nennt.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts docs/architecture.md
git commit -m "docs: record the outcome of the type generation spike"
```

---

# M1 — Fundament (Release 0.1.0)

### Task 5: Diagnostics

**Files:**

- Create: `src/diagnostics/types.ts`, `src/diagnostics/create.ts`
- Test: `test/diagnostics/create.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createDiagnostic } from '../../src/diagnostics/create.js';

describe('createDiagnostic', () => {
  it('trägt Code, Severity, Position und Nachricht', () => {
    const d = createDiagnostic('missing-format-element', 'error', 'FORMAT element is missing', {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 1 },
    });

    expect(d.code).toBe('missing-format-element');
    expect(d.severity).toBe('error');
    expect(d.start.line).toBe(1);
  });

  it('nimmt strukturierte Zusatzdaten auf', () => {
    const d = createDiagnostic('unexpected-field-count', 'warning', 'Unexpected field count', {
      start: { line: 5, column: 1 },
      end: { line: 5, column: 20 },
      data: { expected: 6, actual: 4 },
    });

    expect(d.data).toEqual({ expected: 6, actual: 4 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/diagnostics/create.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

`src/diagnostics/types.ts`:

```ts
/**
 * `fatal` bedeutet: Die Eingabe ist keine verwertbare DSV-Datei. Nur diese
 * Stufe wirft auch in der nicht-werfenden API.
 */
export type Severity = 'fatal' | 'error' | 'warning' | 'info';

/** 1-basiert; `column` zählt UTF-16-Code-Units. */
export interface Position {
  readonly line: number;
  readonly column: number;
}

export type DiagnosticCode =
  | 'missing-format-element'
  | 'missing-dateiende-element'
  | 'format-not-first-element'
  | 'unknown-encoding-replacement-character'
  | 'unterminated-field-list'
  | 'empty-input';

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: Severity;
  /** Englisch. Lokalisierung erfolgt über `code` und `data`. */
  readonly message: string;
  readonly start: Position;
  readonly end: Position;
  readonly data?: Readonly<Record<string, unknown>>;
}
```

`src/diagnostics/create.ts`:

```ts
import type { Diagnostic, DiagnosticCode, Position, Severity } from './types.js';

interface DiagnosticLocation {
  readonly start: Position;
  readonly end: Position;
  readonly data?: Readonly<Record<string, unknown>>;
}

export function createDiagnostic(
  code: DiagnosticCode,
  severity: Severity,
  message: string,
  location: DiagnosticLocation,
): Diagnostic {
  return {
    code,
    severity,
    message,
    start: location.start,
    end: location.end,
    ...(location.data === undefined ? {} : { data: location.data }),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/diagnostics/create.test.ts`
Expected: PASS, 2 Tests

- [ ] **Step 5: Commit**

```bash
git add src/diagnostics test/diagnostics
git commit -m "feat: add diagnostic types and constructor"
```

---

### Task 6: `source` — BOM und Zeilenenden

**Files:**

- Create: `src/source/source-text.ts`
- Test: `test/source/source-text.test.ts`

Dieses Modul ist die Voraussetzung dafür, dass der Round-Trip byte-genau wird:
Zeilenende und BOM-Zustand werden mitgeführt, statt normalisiert zu werden.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createSourceText } from '../../src/source/source-text.js';

describe('createSourceText', () => {
  it('trennt ein BOM ab und merkt es sich', () => {
    const src = createSourceText('﻿FORMAT:X;7;');
    expect(src.hasBom).toBe(true);
    expect(src.lines[0]!.content).toBe('FORMAT:X;7;');
  });

  it('erhält CRLF je Zeile', () => {
    const src = createSourceText('A\r\nB\r\n');
    expect(src.lines.map((l) => l.eol)).toEqual(['\r\n', '\r\n']);
    expect(src.lines.map((l) => l.content)).toEqual(['A', 'B']);
  });

  it('erhält gemischte Zeilenenden', () => {
    const src = createSourceText('A\r\nB\nC');
    expect(src.lines.map((l) => l.eol)).toEqual(['\r\n', '\n', '']);
  });

  it('merkt sich eine letzte Zeile ohne Zeilenumbruch', () => {
    expect(createSourceText('A\nB').lines[1]!.eol).toBe('');
    expect(createSourceText('A\nB\n').lines[1]!.eol).toBe('\n');
  });

  it('nummeriert Zeilen ab 1', () => {
    expect(createSourceText('A\nB').lines.map((l) => l.number)).toEqual([1, 2]);
  });

  it('liefert für leere Eingabe keine Zeilen', () => {
    expect(createSourceText('').lines).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/source/source-text.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

```ts
export type LineEnding = '\r\n' | '\n' | '';

export interface SourceLine {
  /** Zeileninhalt ohne Zeilenende. */
  readonly content: string;
  /** Das tatsächliche Zeilenende; `''` bei fehlendem Abschluss der letzten Zeile. */
  readonly eol: LineEnding;
  /** 1-basiert. */
  readonly number: number;
}

export interface SourceText {
  /** Eingabe ohne BOM. */
  readonly text: string;
  readonly hasBom: boolean;
  readonly lines: readonly SourceLine[];
}

const BOM = '﻿';

export function createSourceText(input: string): SourceText {
  const hasBom = input.startsWith(BOM);
  const text = hasBom ? input.slice(BOM.length) : input;

  const lines: SourceLine[] = [];
  let index = 0;
  let number = 1;

  while (index < text.length) {
    const next = text.indexOf('\n', index);

    if (next === -1) {
      lines.push({ content: text.slice(index), eol: '', number });
      break;
    }

    const hasCr = next > index && text[next - 1] === '\r';
    lines.push({
      content: text.slice(index, hasCr ? next - 1 : next),
      eol: hasCr ? '\r\n' : '\n',
      number,
    });

    index = next + 1;
    number++;
  }

  return { text, hasBom, lines };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/source/source-text.test.ts`
Expected: PASS, 6 Tests

- [ ] **Step 5: Commit**

```bash
git add src/source test/source
git commit -m "feat: split source text while preserving BOM and line endings"
```

---

### Task 7: Lexer — Kommentar- und Leerzeilen

**Files:**

- Create: `src/lexer/lex-line.ts`
- Test: `test/lexer/lex-line.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { lexLine } from '../../src/lexer/lex-line.js';

describe('lexLine — Kommentare und Leerzeilen', () => {
  it('erkennt eine Kommentarzeile', () => {
    const l = lexLine('(* erzeugt mit EasyWk *)', 1);
    expect(l.kind).toBe('comment');
  });

  it('erkennt eine eingerückte Kommentarzeile', () => {
    expect(lexLine('   (* x *)', 1).kind).toBe('comment');
  });

  it('erkennt eine leere Zeile', () => {
    expect(lexLine('', 1).kind).toBe('blank');
    expect(lexLine('   ', 1).kind).toBe('blank');
  });

  it('behält die Originalzeile bei', () => {
    expect(lexLine('   (* x *)', 7).raw).toBe('   (* x *)');
    expect(lexLine('   (* x *)', 7).line).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/lexer/lex-line.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

```ts
export interface LexedComment {
  readonly kind: 'comment';
  readonly raw: string;
  readonly line: number;
}

export interface LexedBlank {
  readonly kind: 'blank';
  readonly raw: string;
  readonly line: number;
}

export type LexedLine = LexedComment | LexedBlank;

export function lexLine(raw: string, line: number): LexedLine {
  const trimmed = raw.trim();

  if (trimmed === '') return { kind: 'blank', raw, line };
  if (trimmed.startsWith('(*')) return { kind: 'comment', raw, line };

  throw new Error('not implemented');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/lexer/lex-line.test.ts`
Expected: PASS, 4 Tests

- [ ] **Step 5: Commit**

```bash
git add src/lexer test/lexer
git commit -m "feat: lex comment and blank lines"
```

---

### Task 8: Lexer — Elementzeilen mit Feldern

**Files:**

- Modify: `src/lexer/lex-line.ts`
- Modify: `test/lexer/lex-line.test.ts`

Der entscheidende Punkt: Attribute sind **terminiert**, nicht getrennt. Aus
`A:1;2;` werden zwei Felder, nicht drei.

- [ ] **Step 1: Write the failing test**

```ts
describe('lexLine — Elementzeilen', () => {
  it('trennt Elementnamen und Felder', () => {
    const l = lexLine('WETTKAMPF:1;V;', 1);
    expect(l.kind).toBe('element');
    if (l.kind !== 'element') return;
    expect(l.element).toBe('WETTKAMPF');
    expect(l.fields).toEqual(['1', 'V']);
  });

  it('verwirft genau ein leeres Schlussfeld, nicht mehr', () => {
    const l = lexLine('A:1;;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['1', '']);
  });

  it('trimmt Werte, behält aber den Rohtext', () => {
    const l = lexLine('FORMAT: Wettkampfergebnisliste;7;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['Wettkampfergebnisliste', '7']);
    expect(l.rawFields).toEqual([' Wettkampfergebnisliste', '7']);
  });

  it('behandelt Anführungszeichen als gewöhnliche Zeichen', () => {
    const l = lexLine('VERANSTALTUNG:"Letzte Chance";Dresden;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields[0]).toBe('"Letzte Chance"');
  });

  it('erkennt DATEIENDE als Element ohne Doppelpunkt', () => {
    const l = lexLine('DATEIENDE', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.element).toBe('DATEIENDE');
    expect(l.bare).toBe(true);
    expect(l.fields).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/lexer/lex-line.test.ts`
Expected: FAIL — `Error: not implemented`

- [ ] **Step 3: Write minimal implementation**

Ergänze in `src/lexer/lex-line.ts`:

```ts
export interface LexedElement {
  readonly kind: 'element';
  readonly element: string;
  /** Getrimmte Werte. */
  readonly fields: readonly string[];
  /** Werte exakt wie in der Datei, inklusive umgebender Leerzeichen. */
  readonly rawFields: readonly string[];
  /** Element ohne Doppelpunkt und Attribute — nur `DATEIENDE`. */
  readonly bare: boolean;
  readonly raw: string;
  readonly line: number;
}

export type LexedLine = LexedComment | LexedBlank | LexedElement;
```

und ersetze das `throw` durch:

```ts
const colon = raw.indexOf(':');

if (colon === -1) {
  return { kind: 'element', element: trimmed, fields: [], rawFields: [], bare: true, raw, line };
}

const rest = raw.slice(colon + 1);
const parts = rest.split(';');

// Attribute sind terminiert, nicht getrennt: das letzte Teilstück nach dem
// abschließenden `;` ist kein Feld. Fehlt der Abschluss, bleibt es eines.
if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();

return {
  kind: 'element',
  element: raw.slice(0, colon).trim(),
  fields: parts.map((p) => p.trim()),
  rawFields: parts,
  bare: false,
  raw,
  line,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/lexer/lex-line.test.ts`
Expected: PASS, 9 Tests

- [ ] **Step 5: Commit**

```bash
git add src/lexer test/lexer
git commit -m "feat: lex element lines into terminated fields"
```

---

### Task 9: Lexer — Kommentar am Zeilenende

**Files:**

- Modify: `src/lexer/lex-line.ts`
- Modify: `test/lexer/lex-line.test.ts`

Betrifft 92.261 Zeilen im Fixture-Bestand. Ohne diesen Schritt entsteht dort
ein zusätzliches Scheinfeld.

- [ ] **Step 1: Write the failing test**

```ts
describe('lexLine — Kommentar am Zeilenende', () => {
  it('trennt einen Kommentar hinter dem letzten Semikolon ab', () => {
    const l = lexLine('PNERGEBNIS:1;E;1011; (* Jahrgang 2007 *)', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['1', 'E', '1011']);
    expect(l.comment).toBe(' (* Jahrgang 2007 *)');
  });

  it('lässt ein (* innerhalb eines Feldes unangetastet', () => {
    const l = lexLine('VERANSTALTUNG:Cup (* kein Kommentar;Ort;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['Cup (* kein Kommentar', 'Ort']);
    expect(l.comment).toBeNull();
  });

  it('setzt comment auf null, wenn keiner vorhanden ist', () => {
    const l = lexLine('A:1;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.comment).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/lexer/lex-line.test.ts`
Expected: FAIL — `comment` ist `undefined`

- [ ] **Step 3: Write minimal implementation**

`comment: string | null` zu `LexedElement` hinzufügen. Vor dem Aufteilen der
Felder den Zeilenendkommentar abtrennen:

```ts
/**
 * Trennt einen Kommentar am Zeilenende ab. Nur ein `(* … *)`, das dem letzten
 * Semikolon folgt, gilt als Kommentar — innerhalb eines Feldes ist `(*`
 * gewöhnlicher ZK-Inhalt (dsv8.md:251).
 */
function splitTrailingComment(rest: string): { body: string; comment: string | null } {
  const match = /^(.*;)(\s*\(\*.*\*\)\s*)$/.exec(rest);
  if (match === null) return { body: rest, comment: null };
  return { body: match[1]!, comment: match[2]! };
}
```

und im Elementzweig `rest` durch `body` ersetzen sowie `comment` zurückgeben.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/lexer/lex-line.test.ts`
Expected: PASS, 12 Tests

- [ ] **Step 5: Commit**

```bash
git add src/lexer test/lexer
git commit -m "feat: separate end-of-line comments from fields"
```

---

### Task 10: Dokumentmodell und Parser

**Files:**

- Create: `src/document/types.ts`, `src/parse/parse-dsv.ts`
- Test: `test/parse/parse-dsv.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';

const FILE = [
  '(* erzeugt mit EasyWk *)',
  'FORMAT: Wettkampfergebnisliste;7;',
  'ERZEUGER:EasyWk;5.27;info@easywk.de;',
  'DATEIENDE',
  '',
].join('\r\n');

describe('parseDsv', () => {
  it('liest Listart und Version, auch mit Leerzeichen nach dem Doppelpunkt', () => {
    const { document } = parseDsv(FILE);
    expect(document.listenart).toBe('Wettkampfergebnisliste');
    expect(document.version).toBe(7);
  });

  it('vergleicht die Listart case-insensitiv', () => {
    const { document } = parseDsv('FORMAT:WETTKAMPFERGEBNISLISTE;7;\r\nDATEIENDE\r\n');
    expect(document.listenart?.toLowerCase()).toBe('wettkampfergebnisliste');
  });

  it('akzeptiert Kommentarzeilen vor FORMAT', () => {
    const { diagnostics } = parseDsv(FILE);
    expect(diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });

  it('behält alle Zeilen in Originalreihenfolge', () => {
    const { document } = parseDsv(FILE);
    // Vier Zeilen, nicht fünf: Ein abschließendes \r\n beendet die vierte
    // Zeile, es beginnt keine leere fünfte. Sonst entstünde beim Schreiben
    // eine Phantomzeile und der Round-Trip wäre kaputt.
    expect(document.items.map((i) => i.kind)).toEqual(['comment', 'element', 'element', 'element']);
  });

  it('meldet eine fehlende FORMAT-Zeile', () => {
    const { diagnostics, ok } = parseDsv('DATEIENDE\r\n');
    expect(ok).toBe(false);
    expect(diagnostics.map((d) => d.code)).toContain('missing-format-element');
  });

  it('meldet leere Eingabe als fatal', () => {
    expect(parseDsv('').diagnostics[0]?.severity).toBe('fatal');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/parse/parse-dsv.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

`src/document/types.ts`:

```ts
import type { LineEnding } from '../source/source-text.js';

export interface DsvRecord {
  readonly kind: 'element';
  readonly element: string;
  readonly fields: readonly string[];
  readonly rawFields: readonly string[];
  readonly comment: string | null;
  readonly bare: boolean;
  readonly line: number;
  /** Vollständige Originalzeile ohne Zeilenende. Grundlage der Byte-Identität. */
  readonly raw: string;
  readonly eol: LineEnding;
}

export interface DsvComment {
  readonly kind: 'comment';
  readonly raw: string;
  readonly line: number;
  readonly eol: LineEnding;
}

export interface DsvBlank {
  readonly kind: 'blank';
  readonly raw: string;
  readonly line: number;
  readonly eol: LineEnding;
}

export type DsvItem = DsvRecord | DsvComment | DsvBlank;

export interface DsvDocument {
  /** Rohwert aus FORMAT, ungetrimmt vergleichen ist unzulässig — case-insensitiv prüfen. */
  readonly listenart: string | null;
  readonly version: number | null;
  readonly items: readonly DsvItem[];
  readonly hasBom: boolean;
}

export interface ParseResult<T> {
  readonly document: T;
  readonly diagnostics: readonly import('../diagnostics/types.js').Diagnostic[];
  /** `true`, wenn keine Diagnostic mit Severity `error` oder `fatal` vorliegt. */
  readonly ok: boolean;
}
```

`src/parse/parse-dsv.ts`:

```ts
import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvDocument, DsvItem, ParseResult } from '../document/types.js';
import { lexLine } from '../lexer/lex-line.js';
import type { SourceLine } from '../source/source-text.js';
import { createSourceText } from '../source/source-text.js';

/**
 * Verarbeitet Zeilen zu Items. Nimmt bewusst ein `Iterable` statt eines Arrays
 * entgegen: Damit lässt sich später eine streamende Quelle einsetzen, ohne
 * diese Funktion zu ändern (siehe Spec, Streaming als M1-Designvorgabe).
 */
function collectItems(lines: Iterable<SourceLine>): DsvItem[] {
  const items: DsvItem[] = [];

  for (const line of lines) {
    const lexed = lexLine(line.content, line.number);

    if (lexed.kind === 'element') {
      items.push({
        kind: 'element',
        element: lexed.element,
        fields: lexed.fields,
        rawFields: lexed.rawFields,
        comment: lexed.comment,
        bare: lexed.bare,
        line: line.number,
        raw: line.content,
        eol: line.eol,
      });
      continue;
    }

    items.push({ kind: lexed.kind, raw: line.content, line: line.number, eol: line.eol });
  }

  return items;
}

const AT_START = { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };

export function parseDsv(input: string): ParseResult<DsvDocument> {
  const source = createSourceText(input);
  const items = collectItems(source.lines);
  const diagnostics: Diagnostic[] = [];

  const elements = items.filter(
    (i): i is Extract<DsvItem, { kind: 'element' }> => i.kind === 'element',
  );
  const format = elements.find((e) => e.element.toUpperCase() === 'FORMAT');

  if (source.lines.length === 0) {
    diagnostics.push(createDiagnostic('empty-input', 'fatal', 'Input is empty', AT_START));
  } else if (format === undefined) {
    diagnostics.push(
      createDiagnostic('missing-format-element', 'error', 'FORMAT element is missing', AT_START),
    );
  } else if (elements[0] !== format) {
    // Kommentarzeilen davor sind normal und zählen nicht mit — FORMAT muss nur
    // das erste ELEMENT sein (dsv8.md:331).
    diagnostics.push(
      createDiagnostic(
        'format-not-first-element',
        'warning',
        'FORMAT is not the first element in the file',
        { start: { line: format.line, column: 1 }, end: { line: format.line, column: 1 } },
      ),
    );
  }

  if (source.lines.length > 0 && !elements.some((e) => e.element.toUpperCase() === 'DATEIENDE')) {
    diagnostics.push(
      createDiagnostic(
        'missing-dateiende-element',
        'warning',
        'DATEIENDE element is missing',
        AT_START,
      ),
    );
  }

  if (input.includes('�')) {
    diagnostics.push(
      createDiagnostic(
        'unknown-encoding-replacement-character',
        'warning',
        'Input contains U+FFFD; it was probably decoded with the wrong encoding',
        AT_START,
      ),
    );
  }

  const version = format?.fields[1];

  const document: DsvDocument = {
    listenart: format?.fields[0] ?? null,
    version: version !== undefined && /^\d+$/.test(version) ? Number(version) : null,
    items,
    hasBom: source.hasBom,
  };

  return {
    document,
    diagnostics,
    ok: !diagnostics.some((d) => d.severity === 'error' || d.severity === 'fatal'),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/parse/parse-dsv.test.ts`
Expected: PASS, 6 Tests

- [ ] **Step 5: Commit**

```bash
git add src/document src/parse test/parse
git commit -m "feat: assemble parsed lines into a document with diagnostics"
```

---

### Task 11: `parseDsvOrThrow`

**Files:**

- Modify: `src/parse/parse-dsv.ts`
- Modify: `test/parse/parse-dsv.test.ts`

Zwei Funktionen statt einer Option `strict`, damit der Rückgabetyp ehrlich
bleibt.

- [ ] **Step 1: Write the failing test**

```ts
import { parseDsvOrThrow } from '../../src/parse/parse-dsv.js';

describe('parseDsvOrThrow', () => {
  it('liefert das Dokument bei fehlerfreier Eingabe', () => {
    expect(parseDsvOrThrow(FILE).listenart).toBe('Wettkampfergebnisliste');
  });

  it('wirft bei einer Diagnostic der Severity error', () => {
    expect(() => parseDsvOrThrow('DATEIENDE\r\n')).toThrow(/missing-format-element/);
  });

  it('wirft nicht bei blossen Warnungen', () => {
    expect(() => parseDsvOrThrow(FILE)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/parse/parse-dsv.test.ts`
Expected: FAIL — `parseDsvOrThrow` nicht exportiert

- [ ] **Step 3: Write minimal implementation**

```ts
export class DsvParseError extends Error {
  constructor(readonly diagnostics: readonly Diagnostic[]) {
    const first = diagnostics[0];
    super(first === undefined ? 'DSV parse failed' : `${first.code}: ${first.message}`);
    this.name = 'DsvParseError';
  }
}

export function parseDsvOrThrow(input: string): DsvDocument {
  const result = parseDsv(input);
  if (!result.ok)
    throw new DsvParseError(result.diagnostics.filter((d) => d.severity !== 'warning'));
  return result.document;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/parse/parse-dsv.test.ts`
Expected: PASS, 9 Tests

- [ ] **Step 5: Commit**

```bash
git add src/parse test/parse
git commit -m "feat: add throwing parse variant"
```

---

### Task 12: Writer

**Files:**

- Create: `src/write/write-dsv.ts`
- Test: `test/write/write-dsv.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { writeDsv } from '../../src/write/write-dsv.js';

describe('writeDsv', () => {
  it('gibt eine unveränderte Datei byte-identisch zurück', () => {
    const text = 'FORMAT: X;7;\r\n(* c *)\r\nDATEIENDE\r\n';
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it('erhält ein BOM', () => {
    const text = '﻿FORMAT:X;7;\nDATEIENDE\n';
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it('erhält gemischte Zeilenenden', () => {
    const text = 'FORMAT:X;7;\r\nA:1;\nDATEIENDE';
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/write/write-dsv.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

```ts
import type { DsvDocument } from '../document/types.js';

const BOM = '﻿';

/**
 * Gibt das Dokument als Text aus. Solange die Records unverändert sind, ist das
 * Ergebnis byte-identisch mit der Eingabe — der Writer spielt den mitgeführten
 * Rohtext zurück, statt ihn zu rekonstruieren.
 */
export function writeDsv(document: DsvDocument): string {
  const body = document.items.map((item) => item.raw + item.eol).join('');
  return document.hasBom ? BOM + body : body;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/write/write-dsv.test.ts`
Expected: PASS, 3 Tests

- [ ] **Step 5: Commit**

```bash
git add src/write test/write
git commit -m "feat: write documents back byte for byte"
```

---

### Task 13: Round-Trip über alle 108 Fixtures

**Files:**

- Create: `test/round-trip.test.ts`

Das zentrale Abnahmekriterium von M1.

- [ ] **Step 1: Write the failing test**

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { writeDsv } from '../src/write/write-dsv.js';

const DIR = 'test/fixtures/real';
const files = readdirSync(DIR).filter((f) => /\.dsv[678]?$/i.test(f));

describe('Round-Trip über echte Dateien', () => {
  it('findet den erwarteten Bestand', () => {
    expect(files).toHaveLength(108);
  });

  it.each(files)('%s bleibt byte-identisch', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it.each(files)('%s wird ohne Fehler gelesen', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    const errors = parseDsv(text).diagnostics.filter(
      (d) => d.severity === 'error' || d.severity === 'fatal',
    );
    expect(errors).toEqual([]);
  });
});
```

- [ ] **Step 2: Zweiten Test schreiben, der die Zerlegung prüft**

Der Round-Trip allein ist als Abnahmekriterium **zu schwach**: `writeDsv` gibt
`item.raw` zurück, der Test bliebe also auch dann grün, wenn `fields`,
`rawFields` und `comment` durchweg falsch wären. Dieser Test schließt die Lücke.

```ts
describe('Zerlegung echter Dateien', () => {
  it.each(files)('%s: kein Feld enthält ein Trennzeichen', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    for (const item of parseDsv(text).document.items) {
      if (item.kind !== 'element') continue;
      for (const f of item.fields) {
        expect(f).not.toContain(';');
        expect(f).not.toContain('\n');
      }
    }
  });

  it.each(files)('%s: gleichnamige Elemente haben gleich viele Felder', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    const counts = new Map<string, Set<number>>();

    for (const item of parseDsv(text).document.items) {
      if (item.kind !== 'element' || item.bare) continue;
      const seen = counts.get(item.element) ?? new Set<number>();
      seen.add(item.fields.length);
      counts.set(item.element, seen);
    }

    // Wettkampfdefinitions- und Ergebnislisten sind in sich einheitlich; eine
    // schwankende Feldzahl wäre ein Zeichen für falsch abgetrennte Kommentare.
    for (const [element, sizes] of counts) {
      expect(sizes.size, `${element} hat unterschiedliche Feldzahlen`).toBe(1);
    }
  });

  it('trennt Kommentare am Zeilenende in der erwarteten Größenordnung ab', () => {
    let withComment = 0;
    for (const name of files) {
      const text = readFileSync(join(DIR, name), 'utf8');
      for (const item of parseDsv(text).document.items) {
        if (item.kind === 'element' && item.comment !== null) withComment++;
      }
    }
    // Im Bestand gemessen; ein starker Abfall bedeutet, dass Kommentare als
    // Felder durchgerutscht sind.
    expect(withComment).toBeGreaterThan(80_000);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/round-trip.test.ts`

Erwartet: alle grün. Schlägt eine Datei fehl, ist das ein echter Befund — die
Ursache im Lexer beheben, **nicht** den Test aufweichen.

Sollte der Test „gleich viele Felder" an einer Datei scheitern, ist das ein
Fund und keine Störung: Er bedeutet, dass eine Zeile anders zerlegt wurde als
ihre Geschwister. Erst die Ursache verstehen, dann entscheiden, ob die Regel
oder der Lexer falsch ist.

- [ ] **Step 4: Commit**

```bash
git add test/round-trip.test.ts
git commit -m "test: verify round trip and field splitting over all real fixtures"
```

---

### Task 14: Property-Test für den Lexer

**Files:**

- Create: `test/lexer/lex-line.property.test.ts`
- Modify: `package.json` (fast-check als devDependency)

- [ ] **Step 1: Install fast-check**

```bash
npm install -D fast-check
```

- [ ] **Step 2: Write the test**

```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { lexLine } from '../../src/lexer/lex-line.js';

/** ZK erlaubt alle Zeichen ausser Semikolon und Zeilenumbruch (dsv8.md:251). */
const zk = fc.stringMatching(/^[^;\r\n]*$/);

describe('lexLine — Eigenschaften', () => {
  it('erhält die Feldwerte über Zerlegen und Zusammensetzen', () => {
    fc.assert(
      fc.property(fc.array(zk, { minLength: 1, maxLength: 12 }), (fields) => {
        const line = `X:${fields.join(';')};`;
        const lexed = lexLine(line, 1);
        if (lexed.kind !== 'element') throw new Error('erwartet: element');
        expect(lexed.rawFields).toEqual(fields);
      }),
    );
  });

  it('gibt für jede Elementzeile den Rohtext unverändert zurück', () => {
    fc.assert(
      fc.property(fc.array(zk, { maxLength: 6 }), (fields) => {
        const line = `X:${fields.join(';')};`;
        expect(lexLine(line, 1).raw).toBe(line);
      }),
    );
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/lexer/lex-line.property.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json test/lexer/lex-line.property.test.ts
git commit -m "test: add property tests for the lexer"
```

---

### Task 15: Skalar-Codecs (`values`)

**Files:**

- Create: `src/values/zeit.ts`, `src/values/datum.ts`, `src/values/uhrzeit.ts`
- Test: `test/values/zeit.test.ts`, `test/values/datum.test.ts`, `test/values/uhrzeit.test.ts`

Diese Codecs werden in 0.1.0 noch von nichts benutzt — sie gehören laut Spec zu
M1, weil M2 sie sofort braucht und sie als reine Funktionen ohne Domänenkontext
prüfbar sind. Sie werden **nicht** öffentlich exportiert, solange sie unbenutzt
sind.

Zeit ist der heikelste Typ: `HH:MM:SS,hh`, intern Hundertstel als Integer.
Gleitkomma scheidet aus, weil Zwischenzeiten addiert werden.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { decodeZeit, encodeZeit, isZeroZeit } from '../../src/values/zeit.js';

describe('decodeZeit', () => {
  it('liest HH:MM:SS,hh als Hundertstel', () => {
    expect(decodeZeit('00:01:00,82')).toBe(6082);
    expect(decodeZeit('00:00:29,03')).toBe(2903);
    expect(decodeZeit('01:00:00,00')).toBe(360000);
  });

  it('erkennt die Nullzeit, den Unterlassungswert für „keine Zeit"', () => {
    expect(decodeZeit('00:00:00,00')).toBe(0);
    expect(isZeroZeit(0)).toBe(true);
  });

  it('weist fehlerhafte Werte mit null zurück, statt zu raten', () => {
    expect(decodeZeit('1:01,44')).toBeNull();
    expect(decodeZeit('')).toBeNull();
    expect(decodeZeit('00:00:00.00')).toBeNull();
  });
});

describe('encodeZeit', () => {
  it('ist die Umkehrung von decodeZeit', () => {
    for (const s of ['00:01:00,82', '00:00:29,03', '00:04:30,84', '00:00:00,00']) {
      expect(encodeZeit(decodeZeit(s)!)).toBe(s);
    }
  });

  it('schreibt führende Nullen', () => {
    expect(encodeZeit(5)).toBe('00:00:00,05');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/values/zeit.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * Schwimmzeit im Format `HH:MM:SS,hh` (dsv8.md:264), intern als Hundertstel.
 *
 * `00:00:00,00` ist der spezifizierte Unterlassungswert für „keine Zeit" und
 * wird bewusst nicht auf `null` abgebildet — sonst ginge beim Zurückschreiben
 * die Unterscheidung zwischen „nicht angegeben" und „ausdrücklich Null"
 * verloren.
 */
const PATTERN = /^(\d{2}):(\d{2}):(\d{2}),(\d{2})$/;

export function decodeZeit(value: string): number | null {
  const m = PATTERN.exec(value);
  if (m === null) return null;

  const [, hh, mm, ss, cs] = m as unknown as [string, string, string, string, string];
  const minutes = Number(mm);
  const seconds = Number(ss);
  if (minutes > 59 || seconds > 59) return null;

  return ((Number(hh) * 60 + minutes) * 60 + seconds) * 100 + Number(cs);
}

export function encodeZeit(hundredths: number): string {
  const cs = hundredths % 100;
  const totalSeconds = (hundredths - cs) / 100;
  const ss = totalSeconds % 60;
  const totalMinutes = (totalSeconds - ss) / 60;
  const mm = totalMinutes % 60;
  const hh = (totalMinutes - mm) / 60;

  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)},${pad(cs)}`;
}

export function isZeroZeit(hundredths: number): boolean {
  return hundredths === 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/values/zeit.test.ts`
Expected: PASS, 5 Tests

- [ ] **Step 5: Property-Test für die Umkehrbarkeit**

```ts
import fc from 'fast-check';

it('encode und decode sind zueinander invers', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 99 * 360000 }), (cs) => {
      expect(decodeZeit(encodeZeit(cs))).toBe(cs);
    }),
  );
});
```

- [ ] **Step 6: Datum und Uhrzeit nach demselben Muster**

`Datum` ist `TT.MM.JJJJ` (dsv8.md:266), `Uhrzeit` ist `HH:MM` im
24-Stunden-Format (dsv8.md:268). Beide mit `decode`/`encode`, beide geben bei
ungültiger Eingabe `null` zurück statt zu raten.

- [ ] **Step 7: Commit**

```bash
git add src/values test/values
git commit -m "feat: add codecs for the time and date scalar types"
```

---

### Task 16: Öffentliche API und Entfernen der Attrappen

**Files:**

- Modify: `src/index.ts`
- Modify: `test/index.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

`test/index.test.ts` vollständig ersetzen:

```ts
import { describe, expect, it } from 'vitest';
import * as api from '../src/index.js';

describe('öffentliche API', () => {
  it('exportiert genau die vorgesehene Oberfläche', () => {
    expect(Object.keys(api).sort()).toEqual([
      'DsvParseError',
      'parseDsv',
      'parseDsvOrThrow',
      'writeDsv',
    ]);
  });

  it('liest und schreibt eine Datei', () => {
    const text = 'FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n';
    expect(api.writeDsv(api.parseDsvOrThrow(text))).toBe(text);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/index.test.ts`
Expected: FAIL — Attrappen noch exportiert

- [ ] **Step 3: Write minimal implementation**

`src/index.ts` vollständig ersetzen:

```ts
/**
 * @schroeer-haren/dsv
 *
 * Liest und schreibt Dateien im DSV-Standard des Deutschen Schwimm-Verbands.
 *
 * In dieser Fassung arbeitet die Bibliothek schema-frei: Sie zerlegt jede Datei
 * in Records und schreibt sie byte-identisch zurück, prüft aber weder Feldtypen
 * noch Kardinalitäten. Typisierte Listenarten folgen ab 0.2.0.
 */

export { parseDsv, parseDsvOrThrow, DsvParseError } from './parse/parse-dsv.js';
export { writeDsv } from './write/write-dsv.js';

export type {
  DsvDocument,
  DsvItem,
  DsvRecord,
  DsvComment,
  DsvBlank,
  ParseResult,
} from './document/types.js';
export type { Diagnostic, DiagnosticCode, Position, Severity } from './diagnostics/types.js';
```

Den Spike-Export `AbschnittWkdefV8` aus Task 4 wieder entfernen — er war nur
Prüfmittel.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/index.test.ts`
Expected: PASS, 2 Tests

- [ ] **Step 5: README aktualisieren**

Abschnitt „Verwendung" durch ein Beispiel mit `parseDsv`/`writeDsv` ersetzen und
den Status auf 0.1.0 heben.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts test/index.test.ts README.md
git commit -m "feat!: replace placeholder exports with the parsing API"
```

---

### Task 17: Test-Review-Zyklus und Release 0.1.0

**Files:**

- Modify: `CHANGELOG.md` (neu anlegen)

- [ ] **Step 1: Vollständige Prüfung**

Run: `npm run check && npm run build`
Expected: alles grün

- [ ] **Step 2: Test-Review-Zyklus durchführen**

Nach Abschnitt „Test-Review-Zyklus" der Spec. Stufen 1–3 als je ein Subagent
**ohne Zugriff auf `src/`**, Stufe 4 mit drei unabhängigen Prüfern je Fund,
bestätigt bei mindestens 2 von 3. Schleifen, bis keine kritischen und wichtigen
Funde mehr offen sind, höchstens drei Runden.

- [ ] **Step 3: CHANGELOG anlegen**

```markdown
# Changelog

## 0.1.0

Erste nutzbare Fassung. Liest DSV-Dateien aller vier Listenarten zeilenweise in
Records und schreibt sie byte-identisch zurück, einschliesslich BOM,
Zeilenenden, Kommentaren und Leerzeichen. Noch ohne Schema-Validierung und ohne
typisierte Listenarten.

**Breaking:** Die Platzhalter `parseLine`, `formatLine`, `DSV_FORMATS`,
`FIELD_SEPARATOR` und der Typ `DsvFormat` sind entfallen.
```

- [ ] **Step 4: Release**

```bash
git add CHANGELOG.md
git commit -m "docs: add changelog for 0.1.0"

# Branch nach main bringen — erst jetzt, nach bestandenem Review-Zyklus
git switch main
git merge --no-ff feat/m0-m1-fundament
npm run check && npm run build
git push origin main

gh release create v0.1.0 --title v0.1.0 --generate-notes
```

- [ ] **Step 5: Veröffentlichung prüfen**

```bash
gh run watch --exit-status
npm view @schroeer-haren/dsv version
```

Expected: `0.1.0`
