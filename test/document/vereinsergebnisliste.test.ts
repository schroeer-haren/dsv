import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectVereinsergebnisliste } from '../../src/document/vereinsergebnisliste.js';
import { parseVereinsergebnisliste } from '../../src/parse/parse-vereinsergebnisliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

const KOPF = [
  line('FORMAT', ['Vereinsergebnisliste', '8']),
  line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
  line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
  line('VERANSTALTER', ['Schwimmverband Musterland']),
  line('AUSRICHTER', ['SV Test', 'Muster, Max', '', '', '', '', '', '', 'info@example.org']),
];

/** Projiziert eine aus Zeilen zusammengesetzte Liste. */
function project(...zeilen: string[]) {
  const text = `${[...KOPF, ...zeilen, 'DATEIENDE'].join('\r\n')}\r\n`;
  return projectVereinsergebnisliste(parseVereinsergebnisliste(text).document);
}

const ABSCHNITT = line('ABSCHNITT', ['1', '15.03.2026', '09:00', 'N']);
const WETTKAMPF = line('WETTKAMPF', ['1', 'E', '1', '4', '100', 'F', 'GL', 'W', 'SW', '', '']);
const WERTUNG = line('WERTUNG', ['1', 'E', '1', 'JG', '0', '9999', '', 'Offene Wertung']);
const VEREIN = line('VEREIN', ['SV Test', '1234', '10', 'GER']);

/** Ein PERSON-Record; `over` überschreibt einzelne Felder. */
function person(over: Partial<Record<string, string>> = {}): string {
  const v = {
    name: 'Muster, Mia',
    dsvId: '100010',
    veranstaltungsId: '1',
    geschlecht: 'W',
    jahrgang: '2008',
    altersklasse: '20',
    nationalitaet1: 'GER',
    nationalitaet2: 'POL',
    nationalitaet3: '',
    ...over,
  };
  return line('PERSON', Object.values(v) as string[]);
}

/** Ein PERSONENERGEBNIS; `over` überschreibt einzelne Felder. */
function personenergebnis(over: Partial<Record<string, string>> = {}): string {
  const v = {
    veranstaltungsId: '1',
    wettkampfnr: '1',
    wettkampfart: 'E',
    wertungsId: '1',
    platz: '1',
    endzeit: '00:01:02,11',
    grundDerNichtwertung: '',
    disqualifikationsbemerkung: '',
    erhoehtesNachtraeglichesMeldegeld: '',
    ...over,
  };
  return line('PERSONENERGEBNIS', Object.values(v) as string[]);
}

/** Ein STAFFEL-Record; `over` überschreibt einzelne Felder. */
function staffel(over: Partial<Record<string, string>> = {}): string {
  const v = {
    nummerDerMannschaft: '1',
    veranstaltungsIdStaffel: '9001',
    wertungsklasseTyp: 'JG',
    mindestJgAk: '2008',
    maximalJgAk: '2010',
    ...over,
  };
  return line('STAFFEL', Object.values(v) as string[]);
}

/** Ein STAFFELERGEBNIS; `over` überschreibt einzelne Felder. */
function staffelergebnis(over: Partial<Record<string, string>> = {}): string {
  const v = {
    veranstaltungsIdStaffel: '9001',
    wettkampfnr: '1',
    wettkampfart: 'E',
    wertungsId: '1',
    platz: '2',
    endzeit: '00:04:30,84',
    grundDerNichtwertung: '',
    startnummerDisqualifiziert: '',
    disqualifikationsbemerkung: '',
    erhoehtesNachtraeglichesMeldegeld: '',
    ...over,
  };
  return line('STAFFELERGEBNIS', Object.values(v) as string[]);
}

/** Eine STAFFELPERSON; `over` überschreibt einzelne Felder. */
function staffelperson(over: Partial<Record<string, string>> = {}): string {
  const v = {
    veranstaltungsIdStaffel: '9001',
    wettkampfnr: '1',
    wettkampfart: 'E',
    name: 'Muster, Mia',
    dsvId: '100010',
    startnummer: '1',
    geschlecht: 'W',
    jahrgang: '2008',
    altersklasse: '20',
    nationalitaet1: 'GER',
    nationalitaet2: '',
    nationalitaet3: '',
    ...over,
  };
  return line('STAFFELPERSON', Object.values(v) as string[]);
}

/** Die Codes der Befunde einer Projektion. */
function codes(result: ReturnType<typeof project>): string[] {
  return result.diagnostics.map((d) => d.code);
}

describe('projectVereinsergebnisliste', () => {
  it('projiziert die Eckdaten der Veranstaltung', () => {
    const { graph, diagnostics } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN);

    expect(diagnostics).toEqual([]);
    expect(graph.veranstaltung).toEqual({
      bezeichnung: 'Testwettkampf',
      ort: 'Kiel',
      bahnlaenge: '25',
      zeitmessung: 'HANDZEIT',
    });
  });

  it('führt den einen Verein der Datei am Wurzelobjekt', () => {
    const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN);

    expect(graph.verein).toMatchObject({
      bezeichnung: 'SV Test',
      kennzahl: 1234,
      landesschwimmverband: '10',
      nationenkuerzel: 'GER',
    });
  });

  it('lässt den Verein null, wenn die Datei keinen führt', () => {
    const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG);

    expect(graph.verein).toBeNull();
  });

  it('dekodiert Datum und Uhrzeit des Abschnitts', () => {
    const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN);

    expect(graph.abschnitte[0]?.datum).toEqual({ year: 2026, month: 3, day: 15 });
    expect(graph.abschnitte[0]?.anfangszeit).toBe(9 * 60);
  });

  it('hängt den Wettkampf unter seinen Abschnitt', () => {
    const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN);

    expect(graph.abschnitte[0]?.wettkaempfe.map((w) => w.nummer)).toEqual([1]);
    expect(graph.wettkaempfeOhneAbschnitt).toEqual([]);
    expect(graph.wettkampfByKey.get('1:E')?.art).toBe('E');
  });

  it('meldet einen Wettkampf ohne auffindbaren Abschnitt', () => {
    const fremd = line('WETTKAMPF', ['1', 'E', '9', '4', '100', 'F', 'GL', 'W', 'SW', '', '']);
    const result = project(ABSCHNITT, fremd, WERTUNG, VEREIN);

    expect(codes(result)).toContain('dangling-reference');
    expect(result.graph.wettkaempfeOhneAbschnitt.map((w) => w.nummer)).toEqual([1]);
  });

  it('hängt das Kampfgericht an seinen Abschnitt', () => {
    const kari = line('KAMPFGERICHT', ['1', 'SCH', 'Richter, R1', 'SV Test']);
    const { graph } = project(ABSCHNITT, kari, WETTKAMPF, WERTUNG, VEREIN);

    expect(graph.abschnitte[0]?.kampfrichter.map((k) => k.position)).toEqual(['SCH']);
  });

  describe('Personen', () => {
    it('projiziert PERSON als eigene Entität mit Nationalitäten', () => {
      const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, person());

      expect(graph.personen).toHaveLength(1);
      expect(graph.personById.get(1)).toMatchObject({
        veranstaltungsId: 1,
        name: 'Muster, Mia',
        dsvId: '100010',
        jahrgang: '2008',
        nationalitaeten: ['GER', 'POL'],
      });
    });

    it('meldet eine doppelte Veranstaltungs-ID', () => {
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, person(), person());

      expect(codes(result)).toEqual(['ambiguous-reference']);
      expect(result.graph.personById.size).toBe(1);
    });

    it('löst das Ergebnis auf Person und Wettkampf auf', () => {
      const { graph, diagnostics } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person(),
        personenergebnis(),
      );

      expect(diagnostics).toEqual([]);
      const start = graph.startByKey.get('1:1:E');
      expect(start?.endzeit).toBe(6211);
      expect(start?.platzierungen).toHaveLength(1);
      expect(graph.personById.get(1)?.starts).toEqual([start]);
      expect(graph.wettkampfByKey.get('1:E')?.starts).toEqual([start]);
    });

    it('fasst mehrere Wertungen desselben Starts zu einem Start zusammen', () => {
      const zweite = line('WERTUNG', ['1', 'E', '2', 'JG', '2008', '', 'W', 'Jahrgang 2008']);
      const { graph, diagnostics } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweite,
        VEREIN,
        person(),
        personenergebnis({ wertungsId: '1', platz: '1' }),
        personenergebnis({ wertungsId: '2', platz: '3' }),
      );

      expect(diagnostics).toEqual([]);
      expect(graph.startByKey.size).toBe(1);
      expect(graph.startByKey.get('1:1:E')?.platzierungen.map((p) => p.platz)).toEqual([1, 3]);
    });

    // Die nicht gewertete Zeile trägt die Platzhalterzeit `00:00:00,00`; die
    // geschwommene Zeit steht in der gewerteten Zeile. Welche Zeile zuerst
    // kommt, ist beliebig — massgeblich ist die gewertete.
    it('nimmt die Endzeit der gewerteten Zeile, auch wenn sie nicht die erste ist', () => {
      const zweiteWertung = line('WERTUNG', [
        '1',
        'E',
        '2',
        'JG',
        '2008',
        '',
        'W',
        'Jahrgang 2008',
      ]);
      const { graph, diagnostics } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        person(),
        personenergebnis({
          wertungsId: '1',
          platz: '0',
          endzeit: '00:00:00,00',
          grundDerNichtwertung: 'DS',
        }),
        personenergebnis({ wertungsId: '2', platz: '3', endzeit: '00:01:02,11' }),
      );

      expect(diagnostics).toEqual([]);
      expect(graph.startByKey.get('1:1:E')?.endzeit).toBe(6211);
    });

    it('bleibt bei der ersten Zeile, wenn keine Zeile gewertet ist', () => {
      const zweiteWertung = line('WERTUNG', [
        '1',
        'E',
        '2',
        'JG',
        '2008',
        '',
        'W',
        'Jahrgang 2008',
      ]);
      const { graph } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        person(),
        personenergebnis({
          wertungsId: '1',
          platz: '0',
          endzeit: '00:00:11,11',
          grundDerNichtwertung: 'DS',
        }),
        personenergebnis({
          wertungsId: '2',
          platz: '0',
          endzeit: '00:00:22,22',
          grundDerNichtwertung: 'AB',
        }),
      );

      expect(graph.startByKey.get('1:1:E')?.endzeit).toBe(1111);
    });

    it('meldet ein Ergebnis ohne Person', () => {
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, personenergebnis());

      expect(codes(result)).toContain('dangling-reference');
      expect(result.graph.startByKey.get('1:1:E')).toBeDefined();
    });

    it('meldet ein Ergebnis mit unbekannter Wertung', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person(),
        personenergebnis({ wertungsId: '99' }),
      );

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('hängt Zwischenzeit und Reaktion an den Start', () => {
      const zz = line('PNZWISCHENZEIT', ['1', '1', 'E', '50', '00:00:29,03']);
      const rz = line('PNREAKTION', ['1', '1', 'E', '+', '00:00:00,72']);
      const { graph, diagnostics } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person(),
        personenergebnis(),
        zz,
        rz,
      );

      expect(diagnostics).toEqual([]);
      const start = graph.startByKey.get('1:1:E');
      expect(start?.zwischenzeiten).toEqual([
        { distanz: 50, zeit: 2903, line: expect.any(Number) },
      ]);
      expect(start?.reaktionen).toEqual([{ art: '+', zeit: 72, line: expect.any(Number) }]);
    });

    it('meldet eine Zwischenzeit ohne Ergebnis', () => {
      const zz = line('PNZWISCHENZEIT', ['1', '1', 'E', '50', '00:00:29,03']);
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, person(), zz);

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('ergibt NaN für eine nicht lesbare Zahl', () => {
      const { graph } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person({ veranstaltungsId: 'xx' }),
      );

      expect(graph.personen[0]?.veranstaltungsId).toBeNaN();
    });
  });

  describe('Staffeln', () => {
    it('projiziert STAFFEL als eigene Entität', () => {
      const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, staffel());

      expect(graph.staffelById.get(9001)).toMatchObject({
        veranstaltungsId: 9001,
        nummerDerMannschaft: '1',
        wertungsklasseTyp: 'JG',
      });
    });

    it('löst das Staffelergebnis auf Staffel und Wettkampf auf', () => {
      const { graph, diagnostics } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        staffel(),
        staffelergebnis(),
      );

      expect(diagnostics).toEqual([]);
      const start = graph.staffelStartByKey.get('9001:1:E');
      expect(start?.endzeit).toBe(27084);
      expect(graph.staffelById.get(9001)?.starts).toEqual([start]);
      expect(graph.wettkampfByKey.get('1:E')?.staffelStarts).toEqual([start]);
    });

    it('unterscheidet dieselbe Staffel in zwei Wettkämpfen', () => {
      const zweiter = line('WETTKAMPF', ['2', 'E', '1', '4', '200', 'F', 'GL', 'W', 'SW', '', '']);
      const zweiteWertung = line('WERTUNG', ['2', 'E', '2', 'JG', '0', '9999', '', 'Offen']);
      const { graph } = project(
        ABSCHNITT,
        WETTKAMPF,
        zweiter,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        staffel(),
        staffelergebnis(),
        staffelergebnis({ wettkampfnr: '2', wertungsId: '2' }),
      );

      expect([...graph.staffelStartByKey.keys()]).toEqual(['9001:1:E', '9001:2:E']);
      expect(graph.staffelById.get(9001)?.starts).toHaveLength(2);
    });

    it('dedupliziert die je Wertung wiederholten Staffelmitglieder', () => {
      const zweiteWertung = line('WERTUNG', ['1', 'E', '2', 'JG', '2008', '', 'W', 'Jahrgang']);
      const { graph } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        staffel(),
        staffelergebnis({ wertungsId: '1' }),
        staffelperson({ startnummer: '1' }),
        staffelperson({ startnummer: '2', name: 'Muster, Mo' }),
        staffelergebnis({ wertungsId: '2', platz: '0', grundDerNichtwertung: 'DS' }),
        staffelperson({ startnummer: '1' }),
        staffelperson({ startnummer: '2', name: 'Muster, Mo' }),
      );

      const start = graph.staffelStartByKey.get('9001:1:E');
      expect(start?.personen.map((p) => p.startnummer)).toEqual([1, 2]);
      expect(start?.platzierungen.map((p) => p.platz)).toEqual([2, 0]);
    });

    it('dedupliziert auch Zwischenzeiten und Ablösezeiten', () => {
      const zz = line('STZWISCHENZEIT', ['9001', '1', 'E', '1', '100', '00:01:03,61']);
      const ab = line('STABLOESE', ['9001', '1', 'E', '2', '+', '00:00:00,32']);
      const { graph } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        staffel(),
        staffelergebnis(),
        zz,
        ab,
        zz,
        ab,
      );

      const start = graph.staffelStartByKey.get('9001:1:E');
      expect(start?.zwischenzeiten).toHaveLength(1);
      expect(start?.abloesen).toHaveLength(1);
    });

    // Dieselbe Regel wie bei den Personen: Die gewertete Zeile trägt die Zeit.
    it('nimmt die Endzeit der gewerteten Zeile, auch wenn sie nicht die erste ist', () => {
      const zweiteWertung = line('WERTUNG', [
        '1',
        'E',
        '2',
        'JG',
        '2008',
        '',
        'W',
        'Jahrgang 2008',
      ]);
      const { graph, diagnostics } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        staffel(),
        staffelergebnis({
          wertungsId: '1',
          platz: '0',
          endzeit: '00:00:00,00',
          grundDerNichtwertung: 'DS',
        }),
        staffelergebnis({ wertungsId: '2', platz: '3', endzeit: '00:04:30,84' }),
      );

      expect(diagnostics).toEqual([]);
      expect(graph.staffelStartByKey.get('9001:1:E')?.endzeit).toBe(27084);
    });

    it('bleibt bei der ersten Zeile, wenn keine Zeile gewertet ist', () => {
      const zweiteWertung = line('WERTUNG', [
        '1',
        'E',
        '2',
        'JG',
        '2008',
        '',
        'W',
        'Jahrgang 2008',
      ]);
      const { graph } = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        staffel(),
        staffelergebnis({
          wertungsId: '1',
          platz: '0',
          endzeit: '00:00:11,11',
          grundDerNichtwertung: 'DS',
        }),
        staffelergebnis({
          wertungsId: '2',
          platz: '0',
          endzeit: '00:00:22,22',
          grundDerNichtwertung: 'AB',
        }),
      );

      expect(graph.staffelStartByKey.get('9001:1:E')?.endzeit).toBe(1111);
    });

    it('meldet ein Staffelergebnis ohne STAFFEL', () => {
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, staffelergebnis());

      expect(codes(result)).toContain('dangling-reference');
    });

    it('meldet eine Staffelperson ohne Staffelergebnis', () => {
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, staffel(), staffelperson());

      expect(codes(result)).toEqual(['dangling-reference']);
    });

    it('meldet eine doppelte Staffelkennung', () => {
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, staffel(), staffel());

      expect(codes(result)).toEqual(['ambiguous-reference']);
    });
  });

  it('projiziert das vollständige Fixture ohne Befunde', () => {
    const text = readFileSync('test/fixtures/synth/vereinsergebnis.dsv8', 'utf8');
    const { graph, diagnostics } = projectVereinsergebnisliste(
      parseVereinsergebnisliste(text).document,
    );

    expect(diagnostics).toEqual([]);
    expect(graph.personen).toHaveLength(3);
    expect(graph.staffeln).toHaveLength(3);
    expect(graph.abschnitte).toHaveLength(3);
    expect(graph.verein?.bezeichnung).toBe('SV Musterstadt');
    // Die Staffel 9001 gehört in Wettkampf 4 zwei verschiedenen Wertungen an
    // — der Wertung 4 und der Wertung 8 — und wird in jeder eigens platziert.
    // Ihre drei Mitglieder stehen dabei nur einmal in der Datei.
    expect(graph.staffelStartByKey.get('9001:4:E')?.platzierungen.map((p) => p.wertungsId)).toEqual(
      [4, 8],
    );
    expect(graph.staffelStartByKey.get('9001:4:E')?.personen).toHaveLength(4);
  });

  it('bricht bei einer leeren Datei nicht ab', () => {
    const { graph, diagnostics } = projectVereinsergebnisliste(
      parseVereinsergebnisliste('FORMAT:Vereinsergebnisliste;8;\r\nDATEIENDE\r\n').document,
    );

    expect(diagnostics).toEqual([]);
    expect(graph.veranstaltung.bezeichnung).toBe('');
    expect(graph.abschnitte).toEqual([]);
    expect(graph.verein).toBeNull();
  });

  it('erzeugt einen zyklenfreien Graph', () => {
    const { graph } = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      VEREIN,
      person(),
      personenergebnis(),
      staffel(),
      staffelergebnis(),
    );

    expect(() => JSON.stringify(graph)).not.toThrow();
  });
});

describe('Wertungen gehören zum Wettkampf des Ergebnisses', () => {
  // Wettkampf 2 mit einer eigenen Wertung 2 — dieselbe Veranstaltung, ein
  // anderer Wettkampf.
  const WETTKAMPF_2 = line('WETTKAMPF', ['2', 'E', '1', '4', '100', 'R', 'GL', 'W', 'SW', '', '']);
  const WERTUNG_2 = line('WERTUNG', ['2', 'E', '2', 'JG', '0', '9999', '', 'Zweite Wertung']);

  it('akzeptiert ein Ergebnis, das auf die Wertung seines Wettkampfs zeigt', () => {
    const { diagnostics } = project(
      ABSCHNITT,
      WETTKAMPF,
      WETTKAMPF_2,
      WERTUNG,
      WERTUNG_2,
      VEREIN,
      person(),
      personenergebnis({ wettkampfnr: '2', wertungsId: '2' }),
    );

    expect(diagnostics).toEqual([]);
  });

  it('meldet ein PERSONENERGEBNIS, dessen Wertung zu einem anderen Wettkampf gehört', () => {
    const result = project(
      ABSCHNITT,
      WETTKAMPF,
      WETTKAMPF_2,
      WERTUNG,
      WERTUNG_2,
      VEREIN,
      person(),
      personenergebnis({ wettkampfnr: '2', wertungsId: '1' }),
    );

    expect(codes(result)).toEqual(['dangling-reference']);
    expect(result.diagnostics[0]?.data).toMatchObject({
      element: 'PERSONENERGEBNIS',
      wertungsId: 1,
    });
  });

  it('meldet ein STAFFELERGEBNIS, dessen Wertung zu einem anderen Wettkampf gehört', () => {
    const result = project(
      ABSCHNITT,
      WETTKAMPF,
      WETTKAMPF_2,
      WERTUNG,
      WERTUNG_2,
      VEREIN,
      staffel(),
      staffelperson(),
      staffelergebnis({ wettkampfnr: '2', wertungsId: '1' }),
    );

    expect(codes(result)).toContain('dangling-reference');
  });

  describe('unvollständige Staffeln', () => {
    // dsv8.md:3805 — "Falls nicht alle Staffelteilnehmer angegeben sind, ist
    // die Ausgabe der Staffelpersonen zu unterdrücken." Die Regel steht im
    // eigenen Kapitel der Vereinsergebnisliste, nicht bloss bei der
    // Wettkampfergebnisliste. WETTKAMPF führt vier Starter.

    it('meldet eine Staffel, die einige, aber nicht alle Mitglieder nennt', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        staffel(),
        staffelergebnis(),
        ...['1', '2', '3'].map((n) => staffelperson({ startnummer: n })),
      );

      expect(codes(result)).toEqual(['incomplete-relay']);
      expect(result.diagnostics[0]?.severity).toBe('warning');
      expect(result.diagnostics[0]?.data).toMatchObject({
        element: 'STAFFELPERSON',
        key: '9001:1:E',
        genannt: 3,
        erwartet: 4,
      });
    });

    it('schweigt zu einer vollständigen Staffel', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        staffel(),
        staffelergebnis(),
        ...['1', '2', '3', '4'].map((n) => staffelperson({ startnummer: n })),
      );

      expect(codes(result)).toEqual([]);
    });

    it('schweigt zu einer Staffel ganz ohne Staffelpersonen — die Regel ist befolgt', () => {
      // Gar keine Personen zu nennen ist genau das, was die Spec verlangt,
      // wenn nicht alle bekannt sind.
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, staffel(), staffelergebnis());

      expect(codes(result)).toEqual([]);
    });

    it('zählt verschiedene Startnummern, nicht Zeilen', () => {
      // Der je Wertung wiederholte Personenblock darf die halbe Staffel nicht
      // vollständig erscheinen lassen.
      const zweiteWertung = line('WERTUNG', ['1', 'E', '2', 'JG', '2008', '', 'W', 'Jahrgang']);
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        staffel(),
        staffelergebnis({ wertungsId: '1' }),
        ...['1', '2'].map((n) => staffelperson({ startnummer: n })),
        staffelergebnis({ wertungsId: '2' }),
        ...['1', '2'].map((n) => staffelperson({ startnummer: n })),
      );

      expect(codes(result)).toEqual(['incomplete-relay']);
      expect(result.diagnostics[0]?.data).toMatchObject({ genannt: 2, erwartet: 4 });
    });

    it('schweigt, wenn der Wettkampf keine Starterzahl nennt', () => {
      // Ohne anzahlStarter ist die Vollständigkeit unbestimmt — dann lieber
      // gar nichts melden als raten.
      const ohneAnzahl = line('WETTKAMPF', [
        '1',
        'E',
        '1',
        '',
        '100',
        'F',
        'GL',
        'W',
        'SW',
        '',
        '',
      ]);
      const result = project(
        ABSCHNITT,
        ohneAnzahl,
        WERTUNG,
        VEREIN,
        staffel(),
        staffelergebnis(),
        staffelperson({ startnummer: '1' }),
      );

      expect(codes(result)).toEqual([]);
    });

    it('trennt die Vollständigkeit je Wettkampf derselben Staffel', () => {
      // Dieselbe Mannschaft in zwei Wettkämpfen: nur der unvollständige Start
      // wird gemeldet, nicht die Staffel als Ganzes.
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WETTKAMPF_2,
        WERTUNG,
        WERTUNG_2,
        VEREIN,
        staffel(),
        staffelergebnis(),
        ...['1', '2', '3', '4'].map((n) => staffelperson({ startnummer: n })),
        staffelergebnis({ wettkampfnr: '2', wertungsId: '2' }),
        ...['1', '2'].map((n) => staffelperson({ startnummer: n, wettkampfnr: '2' })),
      );

      expect(codes(result)).toEqual(['incomplete-relay']);
      expect(result.diagnostics[0]?.data).toMatchObject({ key: '9001:2:E', genannt: 2 });
    });
  });
});
