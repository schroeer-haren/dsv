import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectWettkampfdefinitionsliste } from '../../src/document/wettkampfdefinitionsliste.js';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { parseWettkampfdefinitionsliste } from '../../src/parse/parse-wettkampfdefinitionsliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

/** Die Zeilen eines vollständigen, gültigen Minimaldokuments. */
function minimal(): string[] {
  return [
    line('FORMAT', ['Wettkampfdefinitionsliste', '8']),
    line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
    line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
    line('VERANSTALTUNGSORT', ['Schwimmhalle Kiel', '', '', 'Kiel', 'GER', '', '', '']),
    line('AUSSCHREIBUNGIMNETZ', ['https://example.org/ausschreibung']),
    line('VERANSTALTER', ['SV Test']),
    line('AUSRICHTER', ['SV Test', 'Max Mustermann', '', '', '', '', '', '', 'info@example.org']),
    line('MELDEADRESSE', ['Max Mustermann', '', '', '', '', '', '', 'info@example.org']),
    line('MELDESCHLUSS', ['01.05.2026', '18:00']),
    line('ABSCHNITT', ['1', '10.05.2026', '', '', '09:00', '']),
    line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
    line('WERTUNG', ['1', 'E', '1', 'JG', '2010', '', '', 'offene Wertung']),
    line('MELDEGELD', ['Meldegeldpauschale', '10,00', '']),
    'DATEIENDE',
  ];
}

const text = (lines: readonly string[]): string => `${lines.join('\r\n')}\r\n`;

/** Liest ein Dokument und projiziert es in einem Schritt. */
function project(lines: readonly string[]): ReturnType<typeof projectWettkampfdefinitionsliste> {
  return projectWettkampfdefinitionsliste(parseWettkampfdefinitionsliste(text(lines)).document);
}

/** Fügt eine Zeile vor DATEIENDE ein. */
function withLine(lines: readonly string[], ...added: readonly string[]): string[] {
  const out = [...lines];
  out.splice(out.length - 1, 0, ...added);
  return out;
}

describe('projectWettkampfdefinitionsliste', () => {
  it('projiziert ein Minimaldokument in den erwarteten Graph', () => {
    const { graph, diagnostics } = project(minimal());

    expect(diagnostics).toEqual([]);
    expect(graph.veranstaltung).toEqual({
      bezeichnung: 'Testwettkampf',
      ort: 'Kiel',
      bahnlaenge: '25',
      zeitmessung: 'HANDZEIT',
    });

    expect(graph.abschnitte).toHaveLength(1);
    const abschnitt = graph.abschnitte[0];
    expect(abschnitt?.nummer).toBe(1);
    expect(abschnitt?.datum).toEqual({ day: 10, month: 5, year: 2026 });
    expect(abschnitt?.anfangszeit).toBe(9 * 60);
    expect(abschnitt?.wettkaempfe).toHaveLength(1);

    const wettkampf = abschnitt?.wettkaempfe[0];
    expect(wettkampf?.nummer).toBe(1);
    expect(wettkampf?.art).toBe('E');
    expect(wettkampf?.einzelstrecke).toBe(50);
    expect(wettkampf?.technik).toBe('F');
    expect(wettkampf?.geschlecht).toBe('M');
    expect(wettkampf?.qualifikationAus).toBeNull();
    expect(wettkampf?.wertungen).toHaveLength(1);
    expect(wettkampf?.wertungen[0]?.id).toBe(1);
    expect(wettkampf?.wertungen[0]?.name).toBe('offene Wertung');
    expect(wettkampf?.pflichtzeiten).toHaveLength(0);

    expect(graph.wettkaempfeOhneAbschnitt).toEqual([]);
    expect(graph.wettkampfByKey.get('1:E')).toBe(wettkampf);
    expect(graph.wertungById.get(1)).toBe(wettkampf?.wertungen[0]);
    expect(graph.abschnittByNummer.get(1)).toBe(abschnitt);
  });

  it('dekodiert Pflichtzeiten als Hundertstel', () => {
    const { graph, diagnostics } = project(
      withLine(minimal(), line('PFLICHTZEIT', ['1', 'E', 'JG', '2010', '', '00:01:05,43', 'M'])),
    );

    expect(diagnostics).toEqual([]);
    const pflichtzeiten = graph.wettkampfByKey.get('1:E')?.pflichtzeiten;
    expect(pflichtzeiten).toHaveLength(1);
    expect(pflichtzeiten?.[0]?.zeit).toBe(6543);
  });

  it('löst einen Qualifikationsbezug auf', () => {
    const { graph } = project(
      withLine(
        minimal(),
        line('WETTKAMPF', ['1', 'V', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
        line('WERTUNG', ['1', 'V', '2', 'JG', '2010', '', '', 'Vorlaufwertung']),
      ).map((l) =>
        l.startsWith('WETTKAMPF:1;E;')
          ? line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '1', 'V'])
          : l,
      ),
    );

    expect(graph.wettkampfByKey.get('1:E')?.qualifikationAus).toEqual({ nummer: 1, art: 'V' });
  });

  it('meldet einen Qualifikationsbezug ins Leere', () => {
    const { graph, diagnostics } = project(
      minimal().map((l) =>
        l.startsWith('WETTKAMPF:1;E;')
          ? line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '9', 'V'])
          : l,
      ),
    );

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: 'dangling-reference', severity: 'warning' }),
    );
    // Der Bezug bleibt trotzdem als Wertepaar erhalten.
    expect(graph.wettkampfByKey.get('1:E')?.qualifikationAus).toEqual({ nummer: 9, art: 'V' });
  });

  it('legt einen Wettkampf mit unbekannter Abschnittsnummer ins Sonderfeld', () => {
    const { graph, diagnostics } = project(
      minimal().map((l) =>
        l.startsWith('WETTKAMPF:1;E;')
          ? line('WETTKAMPF', ['1', 'E', '7', '1', '50', 'F', 'GL', 'M', 'SW', '', ''])
          : l,
      ),
    );

    const dangling = diagnostics.filter((d) => d.code === 'dangling-reference');
    expect(dangling).toHaveLength(1);
    expect(dangling[0]?.severity).toBe('warning');
    expect(dangling[0]?.data).toMatchObject({ element: 'WETTKAMPF', abschnittsnr: 7 });

    expect(graph.abschnitte[0]?.wettkaempfe).toEqual([]);
    expect(graph.wettkaempfeOhneAbschnitt).toHaveLength(1);
    expect(graph.wettkaempfeOhneAbschnitt[0]?.nummer).toBe(1);
    // Auch der verwaiste Wettkampf ist über den Schlüssel erreichbar.
    expect(graph.wettkampfByKey.get('1:E')).toBe(graph.wettkaempfeOhneAbschnitt[0]);
  });

  it('meldet eine Wertung mit unbekanntem Wettkampf', () => {
    const { graph, diagnostics } = project(
      withLine(minimal(), line('WERTUNG', ['9', 'E', '2', 'JG', '2010', '', '', 'verwaist'])),
    );

    const dangling = diagnostics.filter((d) => d.code === 'dangling-reference');
    expect(dangling).toHaveLength(1);
    expect(dangling[0]?.severity).toBe('warning');
    expect(dangling[0]?.data).toMatchObject({ element: 'WERTUNG', wettkampf: '9:E' });

    // Die verwaiste Wertung bleibt über ihre Kennung auffindbar.
    expect(graph.wertungById.get(2)?.name).toBe('verwaist');
  });

  it('meldet eine Pflichtzeit mit unbekanntem Wettkampf', () => {
    const { diagnostics } = project(
      withLine(minimal(), line('PFLICHTZEIT', ['9', 'E', 'JG', '2010', '', '00:01:05,43', 'M'])),
    );

    const dangling = diagnostics.filter((d) => d.code === 'dangling-reference');
    expect(dangling).toHaveLength(1);
    expect(dangling[0]?.data).toMatchObject({ element: 'PFLICHTZEIT', wettkampf: '9:E' });
  });

  it('hält gleiche Nummer mit verschiedener Art auseinander', () => {
    const { graph, diagnostics } = project(
      withLine(
        minimal(),
        line('WETTKAMPF', ['1', 'V', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
        line('WERTUNG', ['1', 'V', '2', 'JG', '2010', '', '', 'Vorlaufwertung']),
      ),
    );

    expect(diagnostics).toEqual([]);
    expect(graph.wettkampfByKey.size).toBe(2);

    const entscheidung = graph.wettkampfByKey.get('1:E');
    const vorlauf = graph.wettkampfByKey.get('1:V');
    expect(entscheidung).not.toBe(vorlauf);
    expect(entscheidung?.wertungen.map((w) => w.id)).toEqual([1]);
    expect(vorlauf?.wertungen.map((w) => w.id)).toEqual([2]);
    expect(graph.abschnitte[0]?.wettkaempfe).toHaveLength(2);
  });

  it('meldet zwei Wettkämpfe mit gleichem Schlüssel; der erste gewinnt', () => {
    const { graph, diagnostics } = project(
      withLine(
        minimal(),
        line('WETTKAMPF', ['1', 'E', '1', '1', '100', 'R', 'GL', 'W', 'SW', '', '']),
      ),
    );

    const ambiguous = diagnostics.filter((d) => d.code === 'ambiguous-reference');
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0]?.severity).toBe('warning');
    expect(ambiguous[0]?.data).toMatchObject({ element: 'WETTKAMPF', key: '1:E' });

    expect(graph.wettkampfByKey.get('1:E')?.einzelstrecke).toBe(50);
    // Der zweite Wettkampf verschwindet nicht aus dem Abschnitt.
    expect(graph.abschnitte[0]?.wettkaempfe).toHaveLength(2);
  });

  it('hält zwei Wertungen mit unlesbarer Kennung nicht für Duplikate', () => {
    // Ein nicht lesbares Zahlenfeld ergibt `NaN`. Als Map-Schlüssel kollidiert
    // `NaN` mit sich selbst (SameValueZero), deshalb hielte die Duplikatprüfung
    // zwei Wertungen mit unlesbarer Kennung für dieselbe. Der
    // `Number.isFinite`-Wächter vor dem `set` verhindert das.
    const lines = withLine(
      withLine(minimal(), line('WERTUNG', ['1', 'E', 'x', 'JG', '2010', '', '', 'erste'])),
      line('WERTUNG', ['1', 'E', 'y', 'JG', '2011', '', '', 'zweite']),
    );
    const { graph, diagnostics } = project(lines);

    expect(diagnostics.filter((d) => d.code === 'ambiguous-reference')).toEqual([]);
    expect(graph.wertungById.has(Number.NaN)).toBe(false);
  });

  it('meldet zwei Wertungen mit gleicher Kennung; die erste gewinnt', () => {
    const { graph, diagnostics } = project(
      withLine(minimal(), line('WERTUNG', ['1', 'E', '1', 'JG', '2011', '', '', 'zweite'])),
    );

    const ambiguous = diagnostics.filter((d) => d.code === 'ambiguous-reference');
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0]?.data).toMatchObject({ element: 'WERTUNG', wertungsId: 1 });

    expect(graph.wertungById.get(1)?.name).toBe('offene Wertung');
    expect(graph.wettkampfByKey.get('1:E')?.wertungen).toHaveLength(2);
  });

  it('meldet zwei Abschnitte mit gleicher Nummer; der erste gewinnt', () => {
    const { graph, diagnostics } = project(
      withLine(minimal(), line('ABSCHNITT', ['1', '11.05.2026', '', '', '10:00', ''])),
    );

    const ambiguous = diagnostics.filter((d) => d.code === 'ambiguous-reference');
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0]?.data).toMatchObject({ element: 'ABSCHNITT', abschnittsnr: 1 });

    expect(graph.abschnitte).toHaveLength(2);
    expect(graph.abschnittByNummer.get(1)).toBe(graph.abschnitte[0]);
    expect(graph.abschnitte[0]?.wettkaempfe).toHaveLength(1);
    expect(graph.abschnitte[1]?.wettkaempfe).toEqual([]);
  });

  it('hält unlesbare Abschnittsnummern aus der Indexmap heraus', () => {
    // `NaN` stimmt als Map-Schlüssel mit sich selbst überein. Käme es in die
    // Map, gälten zwei unlesbare Nummern als Duplikat, und ein Wettkampf mit
    // unlesbarer `abschnittsnr` hinge an einem willkürlichen Abschnitt.
    const lines = minimal()
      .filter((l) => !l.startsWith('ABSCHNITT:') && !l.startsWith('WETTKAMPF:'))
      .slice();
    const { graph, diagnostics } = project(
      withLine(
        lines,
        line('ABSCHNITT', ['X', '10.05.2026', '', '', '09:00', '']),
        line('ABSCHNITT', ['Y', '11.05.2026', '', '', '10:00', '']),
        line('WETTKAMPF', ['1', 'E', 'Z', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
      ),
    );

    expect(graph.abschnitte).toHaveLength(2);
    expect([...graph.abschnittByNummer.keys()].some((k) => Number.isNaN(k))).toBe(false);
    expect(diagnostics.filter((d) => d.code === 'ambiguous-reference')).toEqual([]);
    expect(graph.wettkaempfeOhneAbschnitt).toHaveLength(1);
    expect(graph.wettkaempfeOhneAbschnitt[0]?.art).toBe('E');
  });

  it('liefert einen zyklenfreien Graph', () => {
    const { graph } = project(
      withLine(minimal(), line('PFLICHTZEIT', ['1', 'E', 'JG', '2010', '', '00:01:05,43', 'M'])),
    );

    expect(() =>
      JSON.stringify({ ...graph, wettkampfByKey: undefined, wertungById: undefined }),
    ).not.toThrow();
    expect(() => JSON.stringify(graph.abschnitte)).not.toThrow();
    expect(() => JSON.stringify([...graph.wettkampfByKey.values()])).not.toThrow();
  });

  it('bricht bei einem leeren Dokument nicht ab', () => {
    const { graph, diagnostics } = projectWettkampfdefinitionsliste(
      parseWettkampfdefinitionsliste('').document,
    );

    expect(graph.abschnitte).toEqual([]);
    expect(graph.veranstaltung.bezeichnung).toBe('');
    expect(diagnostics).toEqual([]);
  });
});

const REAL = 'test/fixtures/real';

/** Alle Fixtures eines Verzeichnisses, die eine Wettkampfdefinitionsliste sind. */
function definitionLists(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /\.dsv[678]?$/i.test(f))
    .filter((f) => {
      const { document } = parseDsv(readFileSync(join(dir, f), 'utf8'));
      return (
        document.listenart?.toLowerCase() === 'wettkampfdefinitionsliste' &&
        (document.version === 7 || document.version === 8)
      );
    });
}

const realLists = definitionLists(REAL);

/** Einzige echte Datei mit einer WERTUNG ohne passenden Wettkampf; siehe unten. */
const DANGLING_WERTUNG = new Set(['gh-dsvparser-definition.dsv7']);

/** Projiziert eine Fixture-Datei. */
function projectFile(name: string): ReturnType<typeof projectWettkampfdefinitionsliste> {
  return projectWettkampfdefinitionsliste(
    parseWettkampfdefinitionsliste(readFileSync(join(REAL, name), 'utf8')).document,
  );
}

describe('Projektion über echte Dateien', () => {
  it('findet den erwarteten Bestand', () => {
    expect(realLists).toHaveLength(31);
  });

  it.each(realLists)('%s ergibt einen nicht-leeren Graph', (name) => {
    const { graph } = projectFile(name);
    expect(graph.abschnitte.length).toBeGreaterThan(0);
    expect(graph.wettkampfByKey.size).toBeGreaterThan(0);
  });

  it.each(realLists)('%s: jeder Wettkampf findet seinen Abschnitt', (name) => {
    expect(projectFile(name).graph.wettkaempfeOhneAbschnitt).toEqual([]);
  });

  it.each(realLists.filter((n) => !DANGLING_WERTUNG.has(n)))(
    '%s: jede Wertung findet ihren Wettkampf',
    (name) => {
      const { diagnostics } = projectFile(name);
      expect(
        diagnostics.filter(
          (d) => d.code === 'dangling-reference' && d.data?.['element'] === 'WERTUNG',
        ),
      ).toEqual([]);
    },
  );

  /**
   * Über alle 31 echten Dateien entstehen genau 22 Warnungen, verteilt auf drei
   * Dateien. Alle drei sind Mängel der Quelldateien, nicht der Projektion, und
   * werden deshalb namentlich festgehalten statt weggeräumt. Ändert sich die
   * Zahl, ist das ein Fund.
   *
   * - `b-shsv-…-Wk.dsv7`, Zeile 76: WETTKAMPF 132;F verweist als
   *   Qualifikationswettkampf auf 32;E. Wettkampf 32 gibt es in der Datei nur
   *   als Vorlauf (32;V, Zeile 64) — die Art des Verweises ist falsch.
   * - `gh-dsvparser-definition.dsv7`, Zeile 25: WERTUNG 7 gehört zu 5;F.
   *   Wettkampf 5 gibt es nur als Entscheidung (5;E, Zeile 17).
   * - `user-emsland-25mehrde.dsv7`: 20 WERTUNG-Zeilen stehen wortgleich doppelt
   *   in der Datei; jede Wiederholung ergibt eine doppelte `wertungsId`.
   */
  it('erzeugt über alle echten Dateien genau 22 Warnungen', () => {
    const alle = realLists.flatMap((name) =>
      projectFile(name).diagnostics.map((d) => ({ name, code: d.code, line: d.line })),
    );

    expect(
      alle.every((d) => d.code === 'dangling-reference' || d.code === 'ambiguous-reference'),
    ).toBe(true);
    expect(alle).toHaveLength(22);

    expect(alle.filter((d) => d.code === 'dangling-reference')).toEqual([
      { name: 'b-shsv-2026-09-19_FSK_Foerdepokal-Wk.dsv7', code: 'dangling-reference', line: 76 },
      { name: 'gh-dsvparser-definition.dsv7', code: 'dangling-reference', line: 25 },
    ]);

    const doppelt = alle.filter((d) => d.code === 'ambiguous-reference');
    expect(doppelt).toHaveLength(20);
    expect(new Set(doppelt.map((d) => d.name))).toEqual(new Set(['user-emsland-25mehrde.dsv7']));
  });

  it.each(realLists)('%s ergibt einen zyklenfreien Graph', (name) => {
    expect(() => JSON.stringify(projectFile(name).graph.abschnitte)).not.toThrow();
  });
});
