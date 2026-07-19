import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectVereinsmeldeliste } from '../../src/document/vereinsmeldeliste.js';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { parseVereinsmeldeliste } from '../../src/parse/parse-vereinsmeldeliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

const KOPF = [
  line('FORMAT', ['Vereinsmeldeliste', '8']),
  line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
  line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
];

/** Projiziert eine aus Zeilen zusammengesetzte Liste. */
function project(...zeilen: string[]) {
  const text = `${[...KOPF, ...zeilen, 'DATEIENDE'].join('\r\n')}\r\n`;
  return projectVereinsmeldeliste(parseVereinsmeldeliste(text).document);
}

const ABSCHNITT = line('ABSCHNITT', ['1', '15.03.2026', '09:00', 'N']);
const WETTKAMPF = line('WETTKAMPF', ['1', 'V', '1', '1', '100', 'F', 'GL', 'W', '', '']);
const VEREIN = line('VEREIN', ['SV Test', '1234', '10', 'GER', 'J']);
const ANSPRECHPARTNER = line('ANSPRECHPARTNER', [
  'Muster, Max',
  'Musterweg 1',
  '12345',
  'Musterstadt',
  'GER',
  '',
  '',
  'meldung@example.org',
]);
const RUMPF = [ABSCHNITT, WETTKAMPF, VEREIN, ANSPRECHPARTNER];

/** Eine PNMELDUNG; `over` überschreibt einzelne Felder. */
function pnmeldung(over: Partial<Record<string, string>> = {}): string {
  const v = {
    name: 'Muster, Mia',
    dsvId: '100010',
    veranstaltungsId: '1',
    geschlecht: 'W',
    jahrgang: '2008',
    altersklasse: '20',
    nummerTrainer: '',
    nationalitaet1: 'GER',
    nationalitaet2: 'POL',
    nationalitaet3: '',
    ...over,
  };
  return line('PNMELDUNG', Object.values(v) as string[]);
}

/** Eine STMELDUNG; `over` überschreibt einzelne Felder. */
function stmeldung(over: Partial<Record<string, string>> = {}): string {
  const v = {
    nummerDerMannschaft: '1',
    veranstaltungsIdStaffel: '9001',
    wertungsklasseTyp: 'JG',
    mindestJgAk: '2008',
    maximalJgAk: '2010',
    nameDerStaffel: 'Staffel A',
    ...over,
  };
  return line('STMELDUNG', Object.values(v) as string[]);
}

/** Die Codes der Befunde einer Projektion. */
function codes(result: ReturnType<typeof project>): string[] {
  return result.diagnostics.map((d) => d.code);
}

describe('projectVereinsmeldeliste', () => {
  it('projiziert Veranstaltung, Verein und Ansprechpartner', () => {
    const { graph, diagnostics } = project(...RUMPF);

    expect(diagnostics).toEqual([]);
    expect(graph.veranstaltung.bezeichnung).toBe('Testwettkampf');
    expect(graph.verein).toMatchObject({
      bezeichnung: 'SV Test',
      kennzahl: 1234,
      lastschrift: 'J',
    });
    expect(graph.ansprechpartner?.name).toBe('Muster, Max');
  });

  it('lässt Verein und Ansprechpartner null, wenn die Datei sie nicht führt', () => {
    const { graph } = project(ABSCHNITT, WETTKAMPF);

    expect(graph.verein).toBeNull();
    expect(graph.ansprechpartner).toBeNull();
  });

  it('hängt den Wettkampf unter seinen Abschnitt', () => {
    const { graph } = project(...RUMPF);

    expect(graph.abschnitte[0]?.wettkaempfe.map((w) => w.nummer)).toEqual([1]);
    expect(graph.abschnitte[0]?.datum).toEqual({ year: 2026, month: 3, day: 15 });
    expect(graph.wettkampfByKey.get('1:V')?.technik).toBe('F');
  });

  it('meldet einen Wettkampf ohne auffindbaren Abschnitt', () => {
    const fremd = line('WETTKAMPF', ['1', 'V', '9', '1', '100', 'F', 'GL', 'W', '', '']);
    const result = project(ABSCHNITT, fremd, VEREIN, ANSPRECHPARTNER);

    expect(codes(result)).toEqual(['dangling-reference']);
    expect(result.graph.wettkaempfeOhneAbschnitt).toHaveLength(1);
  });

  it('meldet eine doppelte Abschnittsnummer', () => {
    const zweiter = line('ABSCHNITT', ['1', '16.03.2026', '14:00', 'J']);
    const result = project(ABSCHNITT, zweiter, WETTKAMPF, VEREIN, ANSPRECHPARTNER);

    expect(codes(result)).toEqual(['ambiguous-reference']);
    // Der erste Abschnitt gewinnt: Die Indexmap trägt seine Werte, nicht die
    // des zweiten Records.
    expect(result.graph.abschnittByNummer.size).toBe(1);
    expect(result.graph.abschnittByNummer.get(1)).toMatchObject({
      datum: { year: 2026, month: 3, day: 15 },
      relativeAngabe: 'N',
    });
    // Beide Records bleiben als Objekte erhalten.
    expect(result.graph.abschnitte).toHaveLength(2);
  });

  it('meldet einen doppelten Wettkampf aus Nummer und Art', () => {
    const zweiter = line('WETTKAMPF', ['1', 'V', '1', '1', '200', 'R', 'GL', 'M', '', '']);
    const result = project(ABSCHNITT, WETTKAMPF, zweiter, VEREIN, ANSPRECHPARTNER);

    expect(codes(result)).toEqual(['ambiguous-reference']);
    // Der erste Wettkampf gewinnt.
    expect(result.graph.wettkampfByKey.size).toBe(1);
    expect(result.graph.wettkampfByKey.get('1:V')).toMatchObject({
      einzelstrecke: 100,
      technik: 'F',
      geschlecht: 'W',
    });
  });

  describe('Personenmeldungen', () => {
    it('projiziert PNMELDUNG mit Nationalitäten', () => {
      const { graph, diagnostics } = project(...RUMPF, pnmeldung());

      expect(diagnostics).toEqual([]);
      expect(graph.meldungById.get(1)).toMatchObject({
        veranstaltungsId: 1,
        name: 'Muster, Mia',
        nationalitaeten: ['GER', 'POL'],
        trainer: null,
      });
    });

    it('löst den Trainer auf', () => {
      const trainer = line('TRAINER', ['1', 'Trainer, Tina', 'W']);
      const { graph, diagnostics } = project(...RUMPF, trainer, pnmeldung({ nummerTrainer: '1' }));

      expect(diagnostics).toEqual([]);
      expect(graph.meldungById.get(1)?.trainer?.name).toBe('Trainer, Tina');
    });

    it('meldet eine unbekannte Trainernummer', () => {
      const result = project(...RUMPF, pnmeldung({ nummerTrainer: '9' }));

      expect(codes(result)).toEqual(['dangling-reference']);
      expect(result.graph.meldungById.get(1)?.trainer).toBeNull();
    });

    it('hängt den Start an Meldung und Wettkampf', () => {
      const start = line('STARTPN', ['1', '1', '00:01:02,11']);
      const { graph, diagnostics } = project(...RUMPF, pnmeldung(), start);

      expect(diagnostics).toEqual([]);
      const projiziert = graph.meldungById.get(1)?.starts[0];
      expect(projiziert).toMatchObject({ wettkampfnr: 1, wettkampfart: 'V', meldezeit: 6211 });
      expect(graph.wettkampfByKey.get('1:V')?.starts).toEqual([projiziert]);
    });

    it('meldet einen Start ohne Meldung', () => {
      const start = line('STARTPN', ['7', '1', '00:01:02,11']);
      const result = project(...RUMPF, start);

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('hängt das Handicap an die Meldung', () => {
      const handicap = line('HANDICAP', ['1', 'DBS-4711', 'IPC-4711', 'S10', 'SB9', 'SM10', '']);
      const { graph, diagnostics } = project(...RUMPF, pnmeldung(), handicap);

      expect(diagnostics).toEqual([]);
      expect(graph.meldungById.get(1)?.handicap?.startklasse).toBe('S10');
    });

    it('meldet ein Handicap ohne Meldung', () => {
      const handicap = line('HANDICAP', ['7', '', '', 'AB', 'AB', 'AB', '']);
      const result = project(...RUMPF, handicap);

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('meldet ein zweites Handicap zu derselben Meldung', () => {
      const erstes = line('HANDICAP', ['1', 'DBS-4711', 'IPC-4711', 'S10', 'SB9', 'SM10', '']);
      const zweites = line('HANDICAP', ['1', 'DBS-0815', 'IPC-0815', 'S5', 'SB4', 'SM5', 'X']);
      const result = project(...RUMPF, pnmeldung(), erstes, zweites);

      expect(codes(result)).toEqual(['ambiguous-reference']);
      // Das erste Handicap gewinnt.
      expect(result.graph.meldungById.get(1)?.handicap).toMatchObject({
        dbsId: 'DBS-4711',
        startklasse: 'S10',
        startklasseBrust: 'SB9',
      });
    });

    it('meldet eine doppelte Veranstaltungs-ID', () => {
      const result = project(...RUMPF, pnmeldung(), pnmeldung({ name: 'Zweite, Zoe' }));

      expect(codes(result)).toEqual(['ambiguous-reference']);
      // Die erste Meldung gewinnt.
      expect(result.graph.meldungById.size).toBe(1);
      expect(result.graph.meldungById.get(1)?.name).toBe('Muster, Mia');
    });

    // dsv8.md:2524 — reine Staffelschwimmer werden als PNMELDUNG ohne STARTPN
    // geführt. Das ist der Normalfall, keine Auffälligkeit.
    it('meldet eine Meldung ohne Einzelstart nicht als Auffälligkeit', () => {
      const { graph, diagnostics } = project(
        ...RUMPF,
        pnmeldung(),
        stmeldung(),
        line('STAFFELPERSON', ['9001', '1', '1', '1']),
      );

      expect(diagnostics).toEqual([]);
      expect(graph.meldungById.get(1)?.starts).toEqual([]);
    });
  });

  describe('Staffelmeldungen', () => {
    it('projiziert STMELDUNG mit Start und Personen', () => {
      const { graph, diagnostics } = project(
        ...RUMPF,
        pnmeldung(),
        stmeldung(),
        line('STARTST', ['9001', '1', '00:04:12,34']),
        line('STAFFELPERSON', ['9001', '1', '1', '2']),
      );

      expect(diagnostics).toEqual([]);
      const staffel = graph.staffelmeldungById.get(9001);
      expect(staffel).toMatchObject({ nummerDerMannschaft: '1', name: 'Staffel A' });
      expect(staffel?.starts[0]).toMatchObject({ wettkampfnr: 1, meldezeit: 25234 });
      expect(staffel?.personen[0]).toMatchObject({ veranstaltungsId: 1, startnummer: 2 });
      expect(graph.wettkampfByKey.get('1:V')?.staffelStarts).toEqual(staffel?.starts);
    });

    it('meldet eine Staffelperson ohne Personenmeldung', () => {
      const result = project(...RUMPF, stmeldung(), line('STAFFELPERSON', ['9001', '1', '7', '1']));

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('meldet eine Staffelperson ohne Staffelmeldung', () => {
      const result = project(...RUMPF, pnmeldung(), line('STAFFELPERSON', ['9999', '1', '1', '1']));

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('meldet einen Staffelstart ohne Staffelmeldung', () => {
      const result = project(...RUMPF, line('STARTST', ['9999', '1', '']));

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('meldet eine doppelte Staffelkennung', () => {
      const result = project(
        ...RUMPF,
        stmeldung(),
        stmeldung({ nummerDerMannschaft: '2', nameDerStaffel: 'Staffel B' }),
      );

      expect(codes(result)).toEqual(['ambiguous-reference']);
      // Die erste Staffelmeldung gewinnt.
      expect(result.graph.staffelmeldungById.size).toBe(1);
      expect(result.graph.staffelmeldungById.get(9001)).toMatchObject({
        nummerDerMannschaft: '1',
        name: 'Staffel A',
      });
      expect(result.graph.staffelmeldungen).toHaveLength(2);
    });

    // Eine nicht lesbare Kennung ergibt `NaN`. Käme sie in die Indexmap, fänden
    // Bezüge mit ebenso unlesbarer Kennung sie über `NaN` wieder — `Map` nutzt
    // SameValueZero, `NaN` ist dort sein eigener Schlüssel. Solche Bezüge sind
    // aber keine Auflösung, sondern zwei Lesefehler.
    it('nimmt eine unlesbare Staffelkennung nicht in die Indexmap auf', () => {
      const result = project(
        ...RUMPF,
        pnmeldung(),
        stmeldung({ veranstaltungsIdStaffel: 'xx' }),
        line('STARTST', ['xx', '1', '']),
        line('STAFFELPERSON', ['xx', '1', '1', '1']),
      );

      expect(codes(result)).toEqual(['dangling-reference', 'dangling-reference']);
      expect(result.graph.staffelmeldungById.size).toBe(0);
      expect([...result.graph.staffelmeldungById.keys()].some(Number.isNaN)).toBe(false);

      const staffel = result.graph.staffelmeldungen[0];
      expect(staffel?.veranstaltungsId).toBeNaN();
      expect(staffel?.starts).toEqual([]);
      expect(staffel?.personen).toEqual([]);
    });
  });

  describe('Wettkampfbezug ohne Wettkampfart', () => {
    // STARTPN und STARTST nennen nur die Wettkampfnummer (dsv8.md:2381,
    // dsv8.md:2499), WETTKAMPF ist aber über Nummer UND Art identifiziert.
    const vorlauf = line('WETTKAMPF', ['1', 'V', '1', '1', '100', 'F', 'GL', 'W', '', '']);
    const finale = line('WETTKAMPF', ['1', 'F', '1', '1', '100', 'F', 'GL', 'W', '1', 'V']);

    it('ordnet zu, wenn es genau einen Wettkampf mit der Nummer gibt', () => {
      const { graph, diagnostics } = project(
        ...RUMPF,
        pnmeldung(),
        line('STARTPN', ['1', '1', '00:01:02,11']),
      );

      expect(diagnostics).toEqual([]);
      expect(graph.meldungById.get(1)?.starts[0]?.wettkampfart).toBe('V');
    });

    it('meldet mehrere Wettkämpfe mit derselben Nummer als mehrdeutig', () => {
      const result = project(
        ABSCHNITT,
        vorlauf,
        finale,
        VEREIN,
        ANSPRECHPARTNER,
        pnmeldung(),
        line('STARTPN', ['1', '1', '00:01:02,11']),
      );

      expect(codes(result)).toEqual(['ambiguous-reference']);
      // Der erste Wettkampf gewinnt, der Start geht nicht verloren.
      expect(result.graph.meldungById.get(1)?.starts[0]?.wettkampfart).toBe('V');
      expect(result.graph.wettkampfByKey.get('1:V')?.starts).toHaveLength(1);
    });

    it('meldet dieselbe Mehrdeutigkeit für STARTST', () => {
      const result = project(
        ABSCHNITT,
        vorlauf,
        finale,
        VEREIN,
        ANSPRECHPARTNER,
        stmeldung(),
        line('STARTST', ['9001', '1', '']),
      );

      expect(codes(result)).toEqual(['ambiguous-reference']);
      expect(result.graph.staffelmeldungById.get(9001)?.starts[0]?.wettkampfart).toBe('V');
    });

    it('meldet eine Nummer, zu der es keinen Wettkampf gibt', () => {
      const result = project(...RUMPF, pnmeldung(), line('STARTPN', ['1', '9', '']));

      expect(codes(result)).toEqual(['dangling-reference']);
      expect(result.graph.meldungById.get(1)?.starts[0]?.wettkampfart).toBe('');
    });
  });

  describe('Kampfrichter', () => {
    const kari = line('KARIMELDUNG', ['1', 'Richter, Rita', 'SCH', 'W']);

    it('hängt den Einsatz an Kampfrichter und Abschnitt', () => {
      const einsatz = line('KARIABSCHNITT', ['1', '1', 'SCH']);
      const { graph, diagnostics } = project(...RUMPF, kari, einsatz);

      expect(diagnostics).toEqual([]);
      const projiziert = graph.kampfrichterByNummer.get(1)?.einsaetze[0];
      expect(projiziert).toMatchObject({ abschnittsnummer: 1, einsatzwunsch: 'SCH' });
      expect(graph.abschnitte[0]?.kampfrichterEinsaetze).toEqual([projiziert]);
    });

    it('meldet einen Einsatz ohne Kampfrichtermeldung', () => {
      const result = project(...RUMPF, line('KARIABSCHNITT', ['9', '1', 'SCH']));

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('meldet einen Einsatz in einem unbekannten Abschnitt', () => {
      const result = project(...RUMPF, kari, line('KARIABSCHNITT', ['1', '9', 'SCH']));

      expect(codes(result)).toEqual(['dangling-reference']);
    });
  });

  it('projiziert das vollständige Fixture ohne Befunde', () => {
    const text = readFileSync('test/fixtures/synth/vereinsmeldung.dsv8', 'utf8');
    const { graph, diagnostics } = projectVereinsmeldeliste(parseVereinsmeldeliste(text).document);

    expect(diagnostics).toEqual([]);
    expect(graph.meldungen).toHaveLength(3);
    expect(graph.staffelmeldungen).toHaveLength(2);
    expect(graph.kampfrichter).toHaveLength(4);
    expect(graph.trainer).toHaveLength(4);
    expect(graph.verein?.bezeichnung).toBe('SV Musterstadt');
  });

  it('bricht bei einer leeren Datei nicht ab', () => {
    const { graph, diagnostics } = projectVereinsmeldeliste(
      parseVereinsmeldeliste('FORMAT:Vereinsmeldeliste;8;\r\nDATEIENDE\r\n').document,
    );

    expect(diagnostics).toEqual([]);
    expect(graph.abschnitte).toEqual([]);
    expect(graph.verein).toBeNull();
  });

  it('erzeugt einen zyklenfreien Graph', () => {
    const { graph } = project(
      ...RUMPF,
      pnmeldung(),
      line('STARTPN', ['1', '1', '00:01:02,11']),
      stmeldung(),
      line('STARTST', ['9001', '1', '']),
    );

    expect(() => JSON.stringify(graph)).not.toThrow();
  });

  it('ergibt NaN für eine nicht lesbare Zahl', () => {
    const { graph } = project(...RUMPF, pnmeldung({ veranstaltungsId: 'xx' }));

    expect(graph.meldungen[0]?.veranstaltungsId).toBeNaN();
  });
});

const REAL = 'test/fixtures/real';

/** Alle echten Fixtures, die eine Vereinsmeldeliste sind. */
const realMeldeLists = readdirSync(REAL)
  .filter((f) => /\.dsv[678]?$/i.test(f))
  .filter((f) => {
    const { document } = parseDsv(readFileSync(join(REAL, f), 'utf8'));
    return (
      document.listenart?.toLowerCase() === 'vereinsmeldeliste' &&
      (document.version === 7 || document.version === 8)
    );
  });

/** Projiziert eine echte Datei. */
function projectReal(name: string): ReturnType<typeof projectVereinsmeldeliste> {
  return projectVereinsmeldeliste(
    parseVereinsmeldeliste(readFileSync(join(REAL, name), 'utf8')).document,
  );
}

/**
 * Der Objektgraph dieser Listenart war bis zu diesem Bestand ausschliesslich an
 * selbstgebauten Zeilen geprüft. Hier läuft er über 34 echte Dateien.
 */
describe('Projektion über echte Vereinsmeldelisten', () => {
  it('findet den erwarteten Bestand', () => {
    expect(realMeldeLists).toHaveLength(34);
  });

  it.each(realMeldeLists)('%s ergibt einen nicht-leeren Graph', (name) => {
    const { graph } = projectReal(name);
    expect(graph.abschnitte.length).toBeGreaterThan(0);
    expect(graph.wettkampfByKey.size).toBeGreaterThan(0);
    expect(graph.verein).not.toBeNull();
  });

  it.each(realMeldeLists)('%s: jeder Wettkampf findet seinen Abschnitt', (name) => {
    expect(projectReal(name).graph.wettkaempfeOhneAbschnitt).toEqual([]);
  });

  /**
   * Über alle 34 Dateien entsteht **keine einzige** Diagnostic. Ein exakter
   * Wert statt einer Schranke: Sobald eine echte Datei eine hängende oder
   * mehrdeutige Referenz enthält, soll das auffallen.
   */
  it('erzeugt über alle 34 Dateien keine einzige Warnung', () => {
    const diagnostics = realMeldeLists.flatMap((name) =>
      projectReal(name).diagnostics.map((d) => ({ name, code: d.code, severity: d.severity })),
    );

    expect(diagnostics).toEqual([]);
  });

  /**
   * Der interessante Fall: STARTPN nennt den Wettkampf nur über die Nummer,
   * ohne die Art (dsv8.md:2381). Mehrdeutig wird das erst, wenn dieselbe Nummer
   * unter mehreren Arten geführt ist.
   *
   * In den echten Dateien gibt es genau **eine** solche Nummer —
   * `2026-06-28-Gera-SVHaren-Me.dsv7` führt Wettkampf 322 als `V` und als `E` —
   * und auf sie zeigt **kein einziger Start**. Die Mehrdeutigkeit existiert
   * also strukturell, wird aber nie ausgelöst. Deshalb steht oben null und
   * nicht eins.
   */
  it('löst jeden Start eindeutig auf, trotz einer mehrdeutigen Wettkampfnummer', () => {
    const ambiguous = realMeldeLists.flatMap((name) =>
      projectReal(name).diagnostics.filter((d) => d.code === 'ambiguous-reference'),
    );

    expect(ambiguous).toEqual([]);

    const arten = new Map<string, number>();
    let starts = 0;

    for (const name of realMeldeLists) {
      for (const meldung of projectReal(name).graph.meldungen) {
        for (const start of meldung.starts) {
          starts++;
          arten.set(start.wettkampfart, (arten.get(start.wettkampfart) ?? 0) + 1);
        }
      }
    }

    expect(starts).toBe(1338);
    // Jeder Start hat eine aufgelöste Art — keiner bleibt leer.
    expect(Object.fromEntries([...arten].sort())).toEqual({ E: 1298, V: 40 });
  });

  /**
   * dsv8.md:2524 — „Reine Staffelschwimmer müssen als PNMELDUNG ohne STARTPN
   * angegeben werden." Genau ein solcher Fall steht in den echten Dateien. Er
   * ist der vorgesehene Normalfall, keine Auffälligkeit, und erzeugt deshalb
   * keine Diagnostic.
   */
  it('führt genau eine Personenmeldung ohne Einzelstart', () => {
    const ohneStart = realMeldeLists.flatMap((name) =>
      projectReal(name)
        .graph.meldungen.filter((m) => m.starts.length === 0)
        .map(() => name),
    );

    expect(ohneStart).toHaveLength(1);
  });

  it('zählt den Gesamtbestand des Graphen', () => {
    let meldungen = 0;
    let staffelmeldungen = 0;
    let kampfrichter = 0;
    let trainer = 0;

    for (const name of realMeldeLists) {
      const { graph } = projectReal(name);
      meldungen += graph.meldungen.length;
      staffelmeldungen += graph.staffelmeldungen.length;
      kampfrichter += graph.kampfrichter.length;
      trainer += graph.trainer.length;
    }

    expect({ meldungen, staffelmeldungen, kampfrichter, trainer }).toEqual({
      meldungen: 268,
      staffelmeldungen: 28,
      kampfrichter: 78,
      trainer: 30,
    });
  });
});
