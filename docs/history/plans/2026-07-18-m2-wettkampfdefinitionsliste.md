# M2: Wettkampfdefinitionsliste typisiert — Implementation Plan

> **Historisches Dokument — kein gültiger Stand.**
> Dieser Text beschreibt einen Planungsstand während der Entwicklung vor 1.0.
> Er wird nicht gepflegt, und einige der hier getroffenen Entscheidungen wurden
> später revidiert. Verbindlich ist allein die Dokumentation eine Ebene höher —
> [`docs/architecture.md`](../../architecture.md) für den Aufbau,
> [`docs/public-api.md`](../../public-api.md) für die Oberfläche.
> Warum die Datei trotzdem hier liegt: [`docs/history/README.md`](../README.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Wettkampfdefinitionsliste vollständig typisiert lesen, validieren und schreiben — der vertikale Durchstich durch alle Schichten, bevor sich die Architektur auf vier Listenarten vervierfacht (Release 0.2.0).

**Architecture:** Die Schema-Tabelle wird um Aufzählungswerte, Unterlassungswerte und Kardinalitäten erweitert und trägt die Versionsmarkierungen sowohl an Feldern als auch an einzelnen Enum-Werten. Parser, Validierung, Writer und die generierten Typen lesen alle dieselbe Tabelle. Die schema-freie Ebene aus 0.1.0 bleibt unverändert darunter bestehen.

**Tech Stack:** TypeScript (strict), Vitest, fast-check, tsup.

**Spec:** [`docs/history/specs/2026-07-18-weg-zu-v1-design.md`](../specs/2026-07-18-weg-zu-v1-design.md)
**Vorgänger:** [`2026-07-18-m0-m1-fundament.md`](2026-07-18-m0-m1-fundament.md)

---

## Was aus M1 schon steht

- `src/source/`, `src/lexer/`, `src/diagnostics/` — unverändert nutzen
- `src/parse/parse-dsv.ts` — schema-freies `parseDsv`, liefert `DsvDocument` mit Records
- `src/write/write-dsv.ts` — gibt Rohtext zurück, byte-identisch
- `src/schema/types.ts` — `element()`, `field()`, `ScalarType`, `ElementDef`, `FieldDef`
- `scripts/generate-types.ts` — `renderElement`, `renderBothVersions`
- 518 Tests, 108 Fixtures, davon **33 Wettkampfdefinitionslisten**

## Befund, der das Schema-Modell ändert

Die Aufzählungswerte sind **versionsabhängig**, nicht nur die Felder:

| Feld                   | DSV7                  | DSV8                                                    |
| ---------------------- | --------------------- | ------------------------------------------------------- |
| `WETTKAMPF.geschlecht` | `M`, `W`, `X`         | zusätzlich `D`                                          |
| `WETTKAMPF.ausuebung`  | `GL BE AR ST WE GB X` | zusätzlich `KB`, `KR`                                   |
| `MELDEGELD.typ`        | 5 Typen               | zusätzlich `Teilnehmermeldegeld`, `Abschnittspauschale` |

Belegt in `spec/dsv7.md:1006–1010` gegen `spec/dsv8.md:1088–1094`. Das M1-Modell
kennt `since` nur an Feldern — es muss auch an einzelnen Enum-Werten hängen.
Sonst würde eine DSV7-Datei mit `D` stillschweigend akzeptiert.

## Drei Vokabulare, die nicht zusammengelegt werden dürfen

Aus dem Abgleich mit der unabhängigen Ruby-Implementierung, jeweils in der Spec
bestätigt:

- **Geschlecht** ist dreimal verschieden: `WETTKAMPF` (M/W/D/X),
  `WERTUNG` (M/W/X/D), `PFLICHTZEIT` (M/W/**D ohne X**, dsv8.md:1340–1344,
  mit ausdrücklicher Begründung in der Spec).
- **Bahnlänge** ist zweimal verschieden: `VERANSTALTUNG`
  (16/20/25/33/50/FW/X) gegen `NACHWEIS` (25/50/FW/**AL**, dsv8.md:886–892).
- **Wettkampfart** ist in der Wettkampfdefinitionsliste `V/Z/F/E` — die
  Ergebnislisten kennen zusätzlich `A`/`N`. Nicht listenübergreifend teilen.

Ein gemeinsamer Enum wäre in beide Richtungen falsch: zu lax beim Lesen, zu
streng beim Schreiben.

## Weitere Festlegungen aus dem Quellenabgleich

- **Die Feldanzahl ist exakt, kein Mindestmaß.** Auch optionale Attribute am
  Zeilenende brauchen ihre Trennzeichen. Zu wenige **und** zu viele Felder sind
  ein Befund.
- **Leerer Wert und fehlender Wert sind dasselbe.** Ein optionales Feld mit
  leerem Wert überspringt die Typprüfung; ein Pflichtfeld mit leerem Wert ist
  ein Befund.
- **`Einzelstrecke` erlaubt ausdrücklich `0`** neben dem Bereich 1–25000.
- **Meldegeldtypen werden case-insensitiv verglichen** (die Spec schreibt
  `Meldegeldpauschale`, echte Dateien schreiben `MELDEGELDPAUSCHALE`). Alle
  übrigen Enums strikt.

## Elementtabelle (autoritativ)

Aus `spec/dsv8.md` extrahiert, gegen die Beispielzeilen des Kapitels und gegen
33 echte Dateien geprüft. Feldanzahlen stimmen mit der unabhängigen
Ruby-Implementierung überein.

| #   | Element               | Vorkommen | Felder            | Anmerkung                                      |
| --- | --------------------- | --------- | ----------------- | ---------------------------------------------- |
| 1   | `FORMAT`              | 1         | 2                 | Listart, Version                               |
| 2   | `ERZEUGER`            | 1         | 3                 | alle Pflicht                                   |
| 3   | `VERANSTALTUNG`       | 1         | 4                 | Bahnlänge, Zeitmessung als Enum                |
| 4   | `VERANSTALTUNGSORT`   | 1         | 8                 | Ort und Land Pflicht                           |
| 5   | `AUSSCHREIBUNGIMNETZ` | 1         | 1                 | Element Pflicht, Attribut optional             |
| 6   | `VERANSTALTER`        | 1         | 1                 |                                                |
| 7   | `AUSRICHTER`          | 1         | 9                 | eMail Pflicht                                  |
| 8   | `MELDEADRESSE`        | 1         | 8                 | Ort und Land **nicht** Pflicht                 |
| 9   | `MELDESCHLUSS`        | 1         | 2                 | Datum, Uhrzeit                                 |
| 10  | `BANKVERBINDUNG`      | 0–1       | 3 / **4 ab DSV8** | IBAN Pflicht, Name der Bank nicht              |
| 11  | `LASTSCHRIFT`         | 0–1       | 1                 | **nur DSV8**                                   |
| 12  | `BESONDERES`          | 0–1       | 1                 |                                                |
| 13  | `NACHWEIS`            | 0–1       | 3                 | eigener Bahnlängen-Enum                        |
| 14  | `ABSCHNITT`           | 1–N       | 6                 | zwei optionale Uhrzeiten vor einer pflichtigen |
| 15  | `WETTKAMPF`           | 1–N       | 11                |                                                |
| 16  | `WERTUNG`             | 1–N       | 8                 |                                                |
| 17  | `PFLICHTZEIT`         | 0–N       | 7                 |                                                |
| 18  | `MELDEGELD`           | 1–N       | 3                 |                                                |
| 19  | `DATEIENDE`           | 1         | 0                 | ohne Doppelpunkt                               |

Die vollständigen Attributlisten mit Typ, Pflichtangabe und Spec-Zeile stehen in
Task 3 und 4.

## Abdeckungslücken, die synthetische Fixtures brauchen

Diese Elemente kommen in **keiner** der 33 echten Dateien vor und sind nur über
die Spec belegt:

- `NACHWEIS` (0 Vorkommen)
- `LASTSCHRIFT` (0 Vorkommen, DSV8-Neuheit)
- `BANKVERBINDUNG.kontoinhaber` (DSV8-Neuheit)
- `PFLICHTZEIT` — nur **2** Vorkommen, und die unabhängige Ruby-Implementierung
  lässt das Element ausdrücklich aus, weil ihr Autor die Spec-Beispiele als
  widersprüchlich einstufte. Für dieses Element gibt es also **weder
  nennenswerte Realdaten noch einen Gegencheck** — es ist die riskanteste
  Stelle in M2 und braucht besonders sorgfältige synthetische Fixtures.

---

# Aufgaben

### Task 1: Schema-Modell um Aufzählungswerte erweitern

**Files:** Modify `src/schema/types.ts`, `test/schema/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('field mit Aufzählungswerten', () => {
  it('trägt die erlaubten Werte mit Bedeutung', () => {
    const f = field('zeitmessung', 'ZK', {
      required: true,
      doc: 'Art der Zeitmessung.',
      specRef: 'dsv8.md:435',
      values: [
        { value: 'HANDZEIT', doc: 'Handzeit' },
        { value: 'AUTOMATISCH', doc: 'Automatische Zeitmessung' },
      ],
    });

    expect(f.values?.map((v) => v.value)).toEqual(['HANDZEIT', 'AUTOMATISCH']);
  });

  it('markiert Werte, die es erst ab DSV8 gibt', () => {
    const f = field('ausuebung', 'ZK', {
      required: true,
      doc: 'Ausübung.',
      specRef: 'dsv8.md:1037',
      values: [
        { value: 'GL', doc: 'ganze Lage' },
        { value: 'KB', doc: 'Kicks Bauchlage', since: 8 },
      ],
    });

    expect(f.values?.find((v) => v.value === 'KB')?.since).toBe(8);
  });

  it('nimmt einen Unterlassungswert auf', () => {
    const f = field('relativeAngabe', 'Zeichen', {
      doc: 'Relative Angabe.',
      specRef: 'dsv8.md:932',
      values: [
        { value: 'J', doc: 'relativ' },
        { value: 'N', doc: 'absolut' },
      ],
      default: 'N',
    });

    expect(f.default).toBe('N');
  });

  it('vergleicht Werte je nach Feld strikt oder case-insensitiv', () => {
    const strikt = field('technik', 'Zeichen', {
      required: true,
      doc: 'Technik.',
      specRef: 'dsv8.md:1029',
      values: [{ value: 'F', doc: 'Freistil' }],
    });
    const lax = field('meldegeldTyp', 'ZK', {
      required: true,
      doc: 'Meldegeld-Typ.',
      specRef: 'dsv8.md:1360',
      values: [{ value: 'Meldegeldpauschale', doc: 'pauschal je Verein' }],
      caseInsensitive: true,
    });

    expect(strikt.caseInsensitive).toBe(false);
    expect(lax.caseInsensitive).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/schema/types.test.ts`
Expected: FAIL — `values` existiert nicht auf `FieldOptions`

- [ ] **Step 3: Write minimal implementation**

`FieldDef` und `FieldOptions` erweitern:

```ts
export interface EnumValue {
  readonly value: string;
  readonly doc: string;
  /** Gesetzt, wenn der Wert erst ab dieser Formatversion zulässig ist. */
  readonly since?: 8;
}
```

`FieldDef` bekommt `readonly values?: readonly EnumValue[]`,
`readonly default?: string` und `readonly caseInsensitive: boolean`.
`field()` setzt `caseInsensitive` auf `options.caseInsensitive ?? false`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/schema/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/schema/types.ts test/schema/types.test.ts
git commit -m "feat: allow schema fields to carry versioned enum values"
```

---

### Task 2: Listenschema mit Kardinalitäten

**Files:** Create `src/schema/list-schema.ts`, Test `test/schema/list-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { element, field } from '../../src/schema/types.js';
import { listSchema, occurrence } from '../../src/schema/list-schema.js';

const dummy = element('X', [field('a', 'ZK', { doc: 'a', specRef: 'dsv8.md:1' })]);

describe('listSchema', () => {
  const schema = listSchema('Wettkampfdefinitionsliste', [
    occurrence(dummy, { min: 1, max: 1 }),
    occurrence(element('Y', []), { min: 0, max: null }),
  ]);

  it('kennt die Listart', () => {
    expect(schema.listenart).toBe('Wettkampfdefinitionsliste');
  });

  it('findet ein Element case-insensitiv', () => {
    expect(schema.find('x')?.def.name).toBe('X');
    expect(schema.find('nicht-da')).toBeUndefined();
  });

  it('führt Kardinalitäten je Element', () => {
    expect(schema.find('X')?.min).toBe(1);
    expect(schema.find('X')?.max).toBe(1);
    expect(schema.find('Y')?.max).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/schema/list-schema.test.ts`
Expected: FAIL — Modul nicht gefunden

- [ ] **Step 3: Write minimal implementation**

`ElementOccurrence` mit `def`, `min`, `max` (`null` = unbegrenzt);
`ListSchema` mit `listenart`, `elements` und `find(name)`, das
case-insensitiv sucht — echte Dateien schreiben Elementnamen groß, die Spec
gemischt.

- [ ] **Step 4: Run test to verify it passes / Step 5: Commit**

```bash
git commit -m "feat: add list schema with element cardinalities"
```

---

### Task 3: Elementdefinitionen, Teil 1 — Kopf und Adressen

**Files:** Create `src/schema/wettkampfdefinitionsliste.ts`, Test dito

Elemente `FORMAT`, `ERZEUGER`, `VERANSTALTUNG`, `VERANSTALTUNGSORT`,
`AUSSCHREIBUNGIMNETZ`, `VERANSTALTER`, `AUSRICHTER`, `MELDEADRESSE`,
`MELDESCHLUSS`.

Attributlisten mit Spec-Zeilen:

| Element             | #   | Attribut                  | Typ     | Pfl | Zeile |
| ------------------- | --- | ------------------------- | ------- | --- | ----- |
| FORMAT              | 1   | listart                   | ZK      | J   | 361   |
|                     | 2   | version                   | Zahl    | J   | 363   |
| ERZEUGER            | 1   | software                  | ZK      | J   | 387   |
|                     | 2   | version                   | ZK      | J   | 389   |
|                     | 3   | kontakt                   | ZK      | J   | 391   |
| VERANSTALTUNG       | 1   | veranstaltungsbezeichnung | ZK      | J   | 421   |
|                     | 2   | veranstaltungsort         | ZK      | J   | 424   |
|                     | 3   | bahnlaenge                | ZK      | J   | 427   |
|                     | 4   | zeitmessung               | ZK      | J   | 435   |
| VERANSTALTUNGSORT   | 1   | nameSchwimmhalle          | ZK      | J   | 474   |
|                     | 2   | strasse                   | ZK      | N   | 477   |
|                     | 3   | plz                       | ZK      | N   | 479   |
|                     | 4   | ort                       | ZK      | J   | 481   |
|                     | 5   | land                      | ZK      | J   | 483   |
|                     | 6   | telefon                   | ZK      | N   | 485   |
|                     | 7   | fax                       | ZK      | N   | 487   |
|                     | 8   | email                     | ZK      | N   | 489   |
| AUSSCHREIBUNGIMNETZ | 1   | internetadresse           | ZK      | N   | 555   |
| VERANSTALTER        | 1   | nameDesVeranstalters      | ZK      | J   | 572   |
| AUSRICHTER          | 1   | nameDesAusrichters        | ZK      | J   | 591   |
|                     | 2   | name                      | ZK      | J   | 594   |
|                     | 3   | strasse                   | ZK      | N   | 596   |
|                     | 4   | plz                       | ZK      | N   | 598   |
|                     | 5   | ort                       | ZK      | N   | 600   |
|                     | 6   | land                      | ZK      | N   | 602   |
|                     | 7   | telefon                   | ZK      | N   | 604   |
|                     | 8   | fax                       | ZK      | N   | 606   |
|                     | 9   | email                     | ZK      | J   | 608   |
| MELDEADRESSE        | 1   | name                      | ZK      | J   | 674   |
|                     | 2   | strasse                   | ZK      | N   | 676   |
|                     | 3   | plz                       | ZK      | N   | 678   |
|                     | 4   | ort                       | ZK      | N   | 680   |
|                     | 5   | land                      | ZK      | N   | 682   |
|                     | 6   | telefon                   | ZK      | N   | 684   |
|                     | 7   | fax                       | ZK      | N   | 686   |
|                     | 8   | email                     | ZK      | J   | 688   |
| MELDESCHLUSS        | 1   | datum                     | Datum   | J   | 748   |
|                     | 2   | uhrzeit                   | Uhrzeit | J   | 750   |

Enums: `bahnlaenge` = `16` (16⅔ m), `20`, `25`, `33` (33⅓ m), `50`, `FW`
(Freiwasser), `X` (sonstige) — dsv8.md:451–454.
`zeitmessung` = `HANDZEIT`, `AUTOMATISCH`, `HALBAUTOMATISCH` — dsv8.md:458–462.

- [ ] **Step 1: Test schreiben**, der je Element Feldanzahl, Reihenfolge und
      Pflichtangaben prüft, sowie dass jede `specRef` auf eine Zeile zeigt, die den
      Attributnamen enthält (gegen `spec/dsv8.md` gelesen — dieser Test darf die
      Spec-Datei lesen und überspringt sich selbst, wenn sie fehlt, damit CI ohne
      `spec/` grün bleibt).
- [ ] **Step 2: RED bestätigen**
- [ ] **Step 3: Implementieren**
- [ ] **Step 4: GREEN bestätigen**
- [ ] **Step 5: Commit** — `feat: define the header elements of the competition list`

---

### Task 4: Elementdefinitionen, Teil 2 — Wettkämpfe und Meldegeld

**Files:** Modify `src/schema/wettkampfdefinitionsliste.ts`

Elemente `BANKVERBINDUNG`, `LASTSCHRIFT`, `BESONDERES`, `NACHWEIS`,
`ABSCHNITT`, `WETTKAMPF`, `WERTUNG`, `PFLICHTZEIT`, `MELDEGELD`, `DATEIENDE`.

| Element        | #   | Attribut                   | Typ     | Pfl | Zeile |
| -------------- | --- | -------------------------- | ------- | --- | ----- |
| BANKVERBINDUNG | 1   | nameDerBank                | ZK      | N   | 778   |
|                | 2   | iban                       | ZK      | J   | 781   |
|                | 3   | bic                        | ZK      | N   | 783   |
|                | 4   | kontoinhaber               | ZK      | J   | 791   | **since 8**                      |
| LASTSCHRIFT    | 1   | hinweis                    | Zeichen | N   | 813   | **Element since 8**, default `N` |
| BESONDERES     | 1   | anmerkungen                | ZK      | J   | 843   |
| NACHWEIS       | 1   | nachweisVon                | Datum   | J   | 861   |
|                | 2   | nachweisBis                | Datum   | N   | 863   |
|                | 3   | bahnlaenge                 | ZK      | J   | 865   |
| ABSCHNITT      | 1   | abschnittsnr               | Zahl    | J   | 904   |
|                | 2   | abschnittsdatum            | Datum   | J   | 918   |
|                | 3   | einlass                    | Uhrzeit | N   | 922   |
|                | 4   | kampfrichtersitzung        | Uhrzeit | N   | 926   |
|                | 5   | anfangszeit                | Uhrzeit | J   | 928   |
|                | 6   | relativeAngabe             | Zeichen | N   | 932   | default `N`                      |
| WETTKAMPF      | 1   | wettkampfnr                | Zahl    | J   | 979   |
|                | 2   | wettkampfart               | Zeichen | J   | 981   |
|                | 3   | abschnittsnr               | Zahl    | J   | 997   |
|                | 4   | anzahlStarter              | Zahl    | N   | 999   | default `1`                      |
|                | 5   | einzelstrecke              | Zahl    | J   | 1001  |
|                | 6   | technik                    | Zeichen | J   | 1029  |
|                | 7   | ausuebung                  | ZK      | J   | 1037  |
|                | 8   | geschlecht                 | Zeichen | J   | 1062  |
|                | 9   | zuordnungBestenliste       | ZK      | J   | 1075  |
|                | 10  | qualifikationswettkampfnr  | Zahl    | N   | 1081  |
|                | 11  | qualifikationswettkampfart | Zeichen | N   | 1119  |
| WERTUNG        | 1   | wettkampfnr                | Zahl    | J   | 1151  |
|                | 2   | wettkampfart               | Zeichen | J   | 1153  |
|                | 3   | wertungsId                 | Zahl    | J   | 1161  |
|                | 4   | wertungsklasseTyp          | ZK      | J   | 1165  |
|                | 5   | mindestJgAk                | JGAK    | J   | 1171  |
|                | 6   | maximalJgAk                | JGAK    | N   | 1174  |
|                | 7   | geschlecht                 | Zeichen | N   | 1220  |
|                | 8   | wertungsname               | ZK      | J   | 1236  |
| PFLICHTZEIT    | 1   | wettkampfnr                | Zahl    | J   | 1258  |
|                | 2   | wettkampfart               | Zeichen | J   | 1260  |
|                | 3   | wertungsklasseTyp          | ZK      | J   | 1281  |
|                | 4   | mindestJgAk                | JGAK    | J   | 1287  |
|                | 5   | maximalJgAk                | JGAK    | N   | 1290  |
|                | 6   | pflichtzeit                | Zeit    | J   | 1321  |
|                | 7   | geschlecht                 | Zeichen | N   | 1323  |
| MELDEGELD      | 1   | meldegeldTyp               | ZK      | J   | 1360  | caseInsensitive                  |
|                | 2   | betrag                     | Betrag  | J   | 1382  |
|                | 3   | wettkampfnr                | Zahl    | N   | 1389  |

Enums:

- `NACHWEIS.bahnlaenge` = `25`, `50`, `FW`, `AL` (alle) — dsv8.md:886–892.
  **Eigener Wertevorrat**, nicht der von `VERANSTALTUNG`.
- `wettkampfart` = `V` Vorlauf, `Z` Zwischenlauf, `F` Finale, `E` Entscheidung
  — dsv8.md:1015–1018.
- `technik` = `F` Freistil, `R` Rücken, `B` Brust, `S` Schmetterling,
  `L` Lagen, `X` Sonderform — dsv8.md:1043–1048.
- `ausuebung` = `GL`, `BE`, `AR`, `ST`, `WE`, `GB`, `X`, dazu **since 8**:
  `KB` Kicks Bauchlage, `KR` Kicks Rückenlage (beide nur bei Technik `S`) —
  dsv8.md:1052–1073.
- `WETTKAMPF.geschlecht` = `M`, `W`, `X` gemischt, dazu **since 8**: `D` divers
  — dsv7.md:1006–1010 gegen dsv8.md:1088–1094.
- `zuordnungBestenliste` = `SW`, `EW`, `PA`, `MS`, `KG`, `XX` — dsv8.md:1096–1108.
- `wertungsklasseTyp` = `JG` Jahrgang, `AK` Altersklasse.
- `WERTUNG.geschlecht` = `M`, `W`, `X` mixed, `D` divers.
- `PFLICHTZEIT.geschlecht` = `M`, `W`, `D` — **ohne `X`**, dsv8.md:1340–1344.
- `LASTSCHRIFT.hinweis` = `J`, `N`, default `N`.
- `relativeAngabe` = `J`, `N`, default `N`.
- `meldegeldTyp` = `Meldegeldpauschale`, `Einzelmeldegeld`, `Staffelmeldegeld`,
  `Wkmeldegeld`, `Mannschaftmeldegeld`, dazu **since 8**:
  `Teilnehmermeldegeld`, `Abschnittspauschale` — dsv8.md:1368–1380.

- [ ] Test → RED → Implementierung → GREEN → Commit
      `feat: define the competition and fee elements of the competition list`

---

### Task 5: Feldanzahl und Pflichtfelder validieren

**Files:** Create `src/validate/validate-fields.ts`, Test dito

Neue Diagnostic-Codes: `unknown-element`, `missing-required-field`,
`unexpected-field-count` (existiert bereits in der Union).

- [ ] **Step 1: Test schreiben**

```ts
it('meldet zu wenige und zu viele Felder', () => {
  /* … */
});
it('meldet ein leeres Pflichtfeld wie ein fehlendes', () => {
  /* … */
});
it('lässt ein leeres optionales Feld ohne Befund durch', () => {
  /* … */
});
it('meldet ein unbekanntes Element', () => {
  /* … */
});
it('kennt in DSV7 die erst ab DSV8 angehängten Felder nicht', () => {
  /* … */
});
```

Der letzte Test ist der wichtigste: `BANKVERBINDUNG` mit 4 Feldern ist in DSV7
ein Befund, in DSV8 korrekt.

- [ ] RED → Implementierung → GREEN → Commit
      `feat: validate field counts and required fields against the schema`

---

### Task 6: Werttypen und Aufzählungswerte validieren

**Files:** Create `src/validate/validate-values.ts`, Test dito

Neue Codes: `invalid-value`, `invalid-enum-value`.

Prüfungen je `ScalarType`: `Zahl` nur Ziffern; `Datum`, `Uhrzeit`, `Zeit`,
`Betrag` über die Codecs aus M1; `JGAK` gegen die drei Formen (Jahrgang,
Buchstabe A–E/J, Masters mit Plus); `Zeichen` genau ein Zeichen; `ZK` immer
gültig.

- [ ] Tests, die insbesondere abdecken:
  - `Einzelstrecke` akzeptiert `0` **und** 1–25000, weist 25001 zurück
  - `WETTKAMPF.geschlecht = 'D'` ist in DSV8 gültig, in DSV7 ein Befund
  - `ausuebung = 'KB'` ebenso
  - `meldegeldTyp = 'MELDEGELDPAUSCHALE'` ist gültig (case-insensitiv),
    `technik = 'f'` dagegen nicht (strikt)
  - `PFLICHTZEIT.geschlecht = 'X'` ist ein Befund, obwohl `X` bei `WETTKAMPF`
    gültig ist
- [ ] RED → Implementierung → GREEN → Commit
      `feat: validate scalar types and enum values`

---

### Task 7: Kardinalitäten und Querregeln

**Files:** Create `src/validate/validate-document.ts`, Test dito

Neue Codes: `cardinality-violation`, `mutually-exclusive-elements`,
`conditional-field-required`, `unsupported-format-version`.

Regeln:

- Kardinalität je Element gegen das Listenschema
- `LASTSCHRIFT` und `BANKVERBINDUNG` schließen einander aus (dsv8.md:830)
- `MELDEGELD` mit Typ `Wkmeldegeld` verlangt eine Wettkampfnummer (dsv8.md:1389)
- `LASTSCHRIFT` in einer DSV7-Datei ist ein Befund (Element erst ab DSV8)
- **Formatversion**: alles außer 7 und 8 wird mit `fatal` abgelehnt — das ist
  die in `architecture.md` festgelegte DSV6-Ablehnung

- [ ] RED → Implementierung → GREEN → Commit
      `feat: validate cardinalities and cross-element rules`

---

### Task 8: Typisiertes Lesen

**Files:** Create `src/parse/parse-wettkampfdefinitionsliste.ts`, Test dito

```ts
export function parseWettkampfdefinitionsliste(
  input: string,
): ParseResult<Wettkampfdefinitionsliste>;
```

Liest über `parseDsv`, ermittelt die Version aus `FORMAT`, validiert gegen das
Listenschema und liefert die Records zusätzlich als benannte Felder. Die
Diagnostics beider Ebenen werden zusammengeführt.

- [ ] Tests gegen **alle 33 echten Wettkampfdefinitionslisten**: keine
      Diagnostic der Stufe `error` oder `fatal`. Das ist das schärfste Kriterium
      dieses Meilensteins — es prüft die gesamte Schema-Tabelle gegen die Realität.
- [ ] RED → Implementierung → GREEN → Commit
      `feat: read competition definition lists into typed records`

---

### Task 9: Synthetische Fixtures für die Abdeckungslücken

**Files:** Create `test/fixtures/synth/`, Test `test/coverage.test.ts`

- [ ] Je eine synthetische Datei für: `NACHWEIS`, `LASTSCHRIFT` (DSV8),
      `BANKVERBINDUNG` mit `kontoinhaber` (DSV8), `PFLICHTZEIT` in allen
      Varianten, sowie eine Datei, die **jedes** Feld jedes Elements einmal mit
      gesetztem und einmal mit leerem Wert zeigt.
- [ ] Ein Test, der aus dem Schema ableitet, welche Felder es gibt, und prüft,
      dass jedes davon in mindestens einer Fixture gesetzt und leer vorkommt.
      Dieser Test macht Abdeckungslücken sichtbar, statt sie zu vermuten.
- [ ] Commit — `test: add synthetic fixtures for fields absent from real data`

---

### Task 10: Schema-basiertes Schreiben

**Files:** Create `src/write/write-wettkampfdefinitionsliste.ts`, Test dito

Baut aus typisierten Records eine Datei. Kanonische Formatierung: kein
Leerzeichen nach dem Doppelpunkt, Felder terminiert, Unterlassungswerte
weggelassen (aber Trennzeichen gesetzt), Zeilenende konfigurierbar,
Standard CRLF.

- [ ] Test: `parse → write → parse` ist semantisch äquivalent (nicht
      byte-identisch — das gilt nur für unveränderte Dokumente über die
      Low-Level-Ebene aus M1)
- [ ] Test: Beim Schreiben wird streng validiert; ein Befund der Stufe `error`
      verhindert die Ausgabe
- [ ] Commit — `feat: write competition definition lists from typed records`

---

### Task 11: Generierte Typen für die Listenart

**Files:** Modify `scripts/generate-types.ts`, `src/schema/generated.ts`

- [ ] Codegen um Enum-Typen erweitern: aus den `values` eines Feldes wird eine
      String-Literal-Union statt `string`, mit den Bedeutungen als JSDoc
- [ ] Versionsabhängige Werte respektieren: die DSV7-Union enthält `D` nicht
- [ ] `AbschnittWkdef` und die Spike-Datei durch die echten Elemente ersetzen
- [ ] `npm run generate:check` muss sauber bleiben
- [ ] Commit — `feat: generate string literal unions for enum fields`

---

### Task 12: High-Level-Projektion

**Files:** Create `src/document/wettkampfdefinitionsliste.ts`, Test dito

Plain Objects, eager aufgelöst, keine Klassen, keine Rückverweise (sonst wirft
`JSON.stringify` auf Zyklen). Aufgelöst werden:

- `abschnitte[]` mit den ihnen zugeordneten `wettkaempfe[]`
- je Wettkampf die `wertungen[]` und `pflichtzeiten[]`
- Index-Maps statt Rückverweisen: `wettkampfByNr`, `wertungById`

Mehrdeutige oder ins Leere laufende Referenzen erzeugen eine Diagnostic
(`dangling-reference`, `ambiguous-reference`), brechen das Lesen aber nicht ab.

- [ ] Test gegen echte Dateien: Jeder `WERTUNG`-Eintrag findet seinen Wettkampf
- [ ] Commit — `feat: project competition definition lists into an object graph`

---

### Task 13: Test-Review-Zyklus und Release 0.2.0

- [ ] `npm run check && npm run build && npm run generate:check`
- [ ] Test-Review-Zyklus nach Spec: Stufen 1–3 als je ein Subagent **ohne
      Zugriff auf `src/`**, Stufe 4 mit drei unabhängigen Prüfern je Fund,
      bestätigt bei mindestens 2 von 3. Schleifen, bis keine kritischen und
      wichtigen Funde offen sind, höchstens drei Runden.
- [ ] Zusätzlich ein Mutationsdurchlauf wie in M1 — dort hat er sieben Lücken
      gefunden, die kein anderes Verfahren zeigte.
- [ ] CHANGELOG ergänzen, README um ein Beispiel je Listenart erweitern
- [ ] `gh release create v0.2.0 --title v0.2.0 --generate-notes`
- [ ] Veröffentlichung prüfen: `npm view @schroeer-haren/dsv version`
