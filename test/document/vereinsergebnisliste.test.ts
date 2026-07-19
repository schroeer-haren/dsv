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

    it('ordnet die Mitglieder derselben Staffel je Wettkampf getrennt zu', () => {
      // Der Schlüssel ist das Tripel aus Kennung, Wettkampfnummer und
      // Wettkampfart. Fiele die Auflösung auf die Kennung allein zurück,
      // bekäme die erste Staffel alle acht Mitglieder und die zweite keines —
      // genau der Fehler, der schon einmal 72 Staffeln getroffen hat. Die
      // Schlüssel allein zu prüfen genügt nicht: Das prüft nur das Format des
      // Schlüssels, nicht seine Auflösung.
      const zweiter = line('WETTKAMPF', ['2', 'E', '1', '4', '200', 'F', 'GL', 'W', 'SW', '', '']);
      const zweiteWertung = line('WERTUNG', ['2', 'E', '2', 'JG', '0', '9999', '', 'Offen']);
      const mitglied = (n: string, wettkampfnr: string): string =>
        staffelperson({
          startnummer: n,
          wettkampfnr,
          name: `Muster, Mia ${n}`,
          dsvId: `10000${n}`,
        });

      const { graph } = project(
        ABSCHNITT,
        WETTKAMPF,
        zweiter,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        staffel(),
        staffelergebnis(),
        ...['1', '2', '3', '4'].map((n) => mitglied(n, '1')),
        staffelergebnis({ wettkampfnr: '2', wertungsId: '2' }),
        ...['5', '6', '7', '8'].map((n) => mitglied(n, '2')),
      );

      expect(graph.staffelStartByKey.get('9001:1:E')?.personen.map((p) => p.dsvId)).toEqual([
        '100001',
        '100002',
        '100003',
        '100004',
      ]);
      expect(graph.staffelStartByKey.get('9001:2:E')?.personen.map((p) => p.dsvId)).toEqual([
        '100005',
        '100006',
        '100007',
        '100008',
      ]);
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

    // dsv8.md:3814-3815 und :4117-4118 — STAFFELPERSON und STZWISCHENZEIT
    // führen die "Kennung für die Staffel [...] definiert in STAFFEL".
    // STAFFELERGEBNIS hat "Vorkommen 0 - N" (dsv8.md:3936) und darf fehlen;
    // die Besetzung muss auch dann erreichbar bleiben.
    describe('Besetzung hängt an STAFFEL, nicht an STAFFELERGEBNIS', () => {
      it('führt Personen und Zwischenzeiten ohne jedes STAFFELERGEBNIS', () => {
        const zz = line('STZWISCHENZEIT', ['9001', '1', 'E', '1', '100', '00:01:03,61']);
        const result = project(
          ABSCHNITT,
          WETTKAMPF,
          WERTUNG,
          VEREIN,
          staffel(),
          ...['1', '2', '3', '4'].map((n) => staffelperson({ startnummer: n })),
          zz,
        );

        expect(codes(result)).toEqual([]);
        const besetzungen = result.graph.staffelById.get(9001)?.besetzungen;
        expect(besetzungen).toHaveLength(1);
        expect(besetzungen?.[0]).toMatchObject({ wettkampfnr: 1, wettkampfart: 'E' });
        expect(besetzungen?.[0]?.personen.map((p) => p.startnummer)).toEqual([1, 2, 3, 4]);
        expect(besetzungen?.[0]?.zwischenzeiten.map((z) => z.distanz)).toEqual([100]);
        expect(result.graph.staffelStartByKey.size).toBe(0);
      });

      it('teilt die Listen mit dem Start, wenn ein STAFFELERGEBNIS vorliegt', () => {
        const { graph } = project(
          ABSCHNITT,
          WETTKAMPF,
          WERTUNG,
          VEREIN,
          staffel(),
          staffelergebnis(),
          ...['1', '2', '3', '4'].map((n) => staffelperson({ startnummer: n })),
        );

        const start = graph.staffelStartByKey.get('9001:1:E');
        const besetzung = graph.staffelById.get(9001)?.besetzungen[0];
        expect(besetzung?.personen).toBe(start?.personen);
      });

      it('meldet eine STAFFELPERSON auf unbekannte STAFFEL gegen STAFFEL', () => {
        const result = project(
          ABSCHNITT,
          WETTKAMPF,
          WERTUNG,
          VEREIN,
          staffel(),
          staffelperson({ veranstaltungsIdStaffel: '9999' }),
        );

        expect(codes(result)).toEqual(['dangling-reference']);
        expect(result.diagnostics[0]?.message).toBe('STAFFELPERSON refers to unknown STAFFEL 9999');
        expect(result.diagnostics[0]?.data).toMatchObject({
          element: 'STAFFELPERSON',
          veranstaltungsIdStaffel: 9999,
        });
      });

      it('meldet unvollständige Besetzung auch ohne STAFFELERGEBNIS', () => {
        const result = project(
          ABSCHNITT,
          WETTKAMPF,
          WERTUNG,
          VEREIN,
          staffel(),
          ...['1', '2', '3'].map((n) => staffelperson({ startnummer: n })),
        );

        expect(codes(result)).toEqual(['incomplete-relay']);
        expect(result.diagnostics[0]?.data).toMatchObject({
          element: 'STAFFELPERSON',
          key: '9001:1:E',
          genannt: 3,
          erwartet: 4,
        });
      });

      // Ausdrücklich unverändert: STABLOESE nennt in Kapitel 5.3 als Anker
      // "STERGEBNIS" (dsv8.md:4174-4175) — ein Element, das es in dieser
      // Listenart gar nicht gibt. Solange die Absicht der Spec unklar ist,
      // bleibt es beim STAFFELERGEBNIS als Anker.
      it('lässt STABLOESE weiter am STAFFELERGEBNIS hängen', () => {
        const ab = line('STABLOESE', ['9001', '1', 'E', '2', '+', '00:00:00,32']);
        const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, staffel(), ab);

        expect(codes(result)).toEqual(['dangling-reference']);
        expect(result.diagnostics[0]?.message).toBe(
          'STABLOESE refers to unknown STAFFELERGEBNIS 9001:1:E',
        );
      });
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

    it('nimmt eine Staffelperson ohne Staffelergebnis an', () => {
      // Früher ein dangling-reference auf STAFFELERGEBNIS — eine Beziehung,
      // die die Spec nirgends definiert. Der Anker ist STAFFEL
      // (dsv8.md:3814-3815), die hier vorliegt. Was bleibt, ist der Befund zur
      // unvollständigen Besetzung: eine von vier genannt.
      const result = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, staffel(), staffelperson());

      expect(codes(result)).toEqual(['incomplete-relay']);
      expect(result.graph.staffelById.get(9001)?.besetzungen[0]?.personen).toHaveLength(1);
    });

    // dsv8.md:2929 — "Unterlassungswert ist N." Das Schema führte diesen Wert
    // schon, wandte ihn aber nirgends an; die Projektion lieferte "".
    it('setzt den Unterlassungswert eines nicht angegebenen Feldes ein', () => {
      const ohne = line('ABSCHNITT', ['2', '15.03.2026', '09:00', '']);
      const { graph } = project(ohne, WETTKAMPF, WERTUNG, VEREIN);

      expect(graph.abschnittByNummer.get(2)?.relativeAngabe).toBe('N');
    });

    it('lässt einen angegebenen Wert unangetastet', () => {
      const mit = line('ABSCHNITT', ['2', '15.03.2026', '09:00', 'J']);
      const { graph } = project(mit, WETTKAMPF, WERTUNG, VEREIN);

      expect(graph.abschnittByNummer.get(2)?.relativeAngabe).toBe('J');
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

  describe('unlesbare Kennungen werden nicht zu Duplikaten', () => {
    // Ein nicht lesbares Zahlenfeld ergibt `NaN`. Als Map-Schlüssel kollidiert
    // `NaN` mit sich selbst (SameValueZero), deshalb hält jede Duplikatprüfung
    // zwei Sätze mit unlesbarer Kennung für denselben. Der
    // `Number.isFinite`-Wächter vor dem `set` verhindert genau das: Ohne ihn
    // entstünde ein falsches `ambiguous-reference`, und der zweite Satz ginge
    // verloren.

    it('meldet zwei WERTUNGen mit unlesbarer Kennung nicht als Duplikat', () => {
      const a = line('WERTUNG', ['1', 'E', 'x', 'JG', '0', '9999', '', 'Erste']);
      const b = line('WERTUNG', ['1', 'E', 'y', 'JG', '0', '9999', '', 'Zweite']);
      const result = project(ABSCHNITT, WETTKAMPF, a, b, VEREIN);

      expect(codes(result)).not.toContain('ambiguous-reference');
      expect(result.graph.wertungById.has(Number.NaN)).toBe(false);
    });

    it('meldet zwei PERSONen mit unlesbarer Kennung nicht als Duplikat', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person({ veranstaltungsId: 'x' }),
        person({ veranstaltungsId: 'y', name: 'Muster, Mo' }),
      );

      expect(codes(result)).not.toContain('ambiguous-reference');
      expect(result.graph.personById.has(Number.NaN)).toBe(false);
    });

    it('meldet zwei STAFFELn mit unlesbarer Kennung nicht als Duplikat', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        staffel({ veranstaltungsIdStaffel: 'x' }),
        staffel({ veranstaltungsIdStaffel: 'y', nummerDerMannschaft: '2' }),
      );

      expect(codes(result)).not.toContain('ambiguous-reference');
      expect(result.graph.staffelById.has(Number.NaN)).toBe(false);
    });

    it('meldet echte Duplikate weiterhin', () => {
      // Gegenprobe: Der Wächter darf die Duplikatprüfung nicht abschalten.
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person(),
        person({ name: 'Muster, Mo' }),
      );

      expect(codes(result)).toContain('ambiguous-reference');
    });
  });

  describe('doppelte Wertung innerhalb eines Starts', () => {
    // dsv8.md:3471 — "Für jede definierte Wertung muss hier jeweils die
    // erreichte Platzierung ausgegeben werden": je Wertung genau eine. Der Satz
    // steht nur unter PERSONENERGEBNIS; STAFFELERGEBNIS (dsv8.md:3936) kennt
    // keinen solchen Hinweis. Dass dieselbe Erwartung auch für Staffeln gilt,
    // ist eine Übertragung — deshalb hier eine Warnung und kein Fehler.
    //
    // Entscheidend ist der Zuschnitt: geprüft wird je Start, nicht je Element
    // dokumentweit. Eine echte Vereinsergebnisliste hat Dutzende Schwimmer, die
    // sich alle die Wertung 1 teilen; dokumentweit gezählt gäbe das eine
    // Warnung pro Ergebniszeile. In allen 194 660 Ergebniszeilen des echten
    // Bestandes kommt der echte Fall dagegen nie vor.

    it('schweigt, wenn zwei Personen sich dieselbe Wertung teilen', () => {
      // Der Normalfall jeder echten Datei: eine Wertung, viele Schwimmer.
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person(),
        personenergebnis({ wertungsId: '1', platz: '1' }),
        person({ name: 'Muster, Mo', dsvId: '100011', veranstaltungsId: '2' }),
        personenergebnis({ veranstaltungsId: '2', wertungsId: '1', platz: '2' }),
      );

      expect(codes(result)).toEqual([]);
      expect(result.graph.startByKey.get('1:1:E')?.platzierungen[0]?.platz).toBe(1);
      expect(result.graph.startByKey.get('2:1:E')?.platzierungen[0]?.platz).toBe(2);
    });

    it('schweigt, wenn zwei Staffeln sich dieselbe Wertung teilen', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        staffel(),
        staffelergebnis({ wertungsId: '1', platz: '1' }),
        ...['1', '2', '3', '4'].map((n) => staffelperson({ startnummer: n })),
        staffel({ nummerDerMannschaft: '2', veranstaltungsIdStaffel: '9002' }),
        staffelergebnis({
          veranstaltungsIdStaffel: '9002',
          wertungsId: '1',
          platz: '2',
        }),
        ...['1', '2', '3', '4'].map((n) =>
          staffelperson({ veranstaltungsIdStaffel: '9002', startnummer: n }),
        ),
      );

      expect(codes(result)).toEqual([]);
      expect(result.graph.staffelStartByKey.get('9001:1:E')?.platzierungen[0]?.platz).toBe(1);
      expect(result.graph.staffelStartByKey.get('9002:1:E')?.platzierungen[0]?.platz).toBe(2);
    });

    it('meldet zwei PERSONENERGEBNIS desselben Starts mit derselben Wertung', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        person(),
        personenergebnis({ wertungsId: '1', platz: '1' }),
        personenergebnis({ wertungsId: '1', platz: '2' }),
      );

      expect(codes(result)).toEqual(['ambiguous-reference']);
      expect(result.diagnostics[0]?.data).toMatchObject({
        element: 'PERSONENERGEBNIS',
        wertungsId: 1,
      });
      // Die erste Platzierung gewinnt, die zweite wird nicht aufgenommen.
      const start = result.graph.startByKey.get('1:1:E');
      expect(start?.platzierungen).toHaveLength(1);
      expect(start?.platzierungen[0]?.platz).toBe(1);
      // Gemeldet wird die zweite, widersprechende Zeile, nicht die erste.
      expect(result.diagnostics[0]?.line).toBe(12);
    });

    it('meldet zwei STAFFELERGEBNIS derselben Staffel mit derselben Wertung', () => {
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        VEREIN,
        staffel(),
        staffelergebnis({ wertungsId: '1', platz: '1' }),
        staffelergebnis({ wertungsId: '1', platz: '2' }),
        ...['1', '2', '3', '4'].map((n) => staffelperson({ startnummer: n })),
      );

      expect(codes(result)).toEqual(['ambiguous-reference']);
      expect(result.diagnostics[0]?.data).toMatchObject({
        element: 'STAFFELERGEBNIS',
        wertungsId: 1,
      });
      const staffelStart = result.graph.staffelStartByKey.get('9001:1:E');
      expect(staffelStart?.platzierungen).toHaveLength(1);
      // Die erste Platzierung gewinnt — wie im Personenfall. Ohne diese Zusage
      // wäre „erste gewinnt" für die Hälfte der Fälle unbelegt.
      expect(staffelStart?.platzierungen[0]?.platz).toBe(1);
      // Gemeldet wird die zweite, widersprechende Zeile, nicht die erste.
      expect(result.diagnostics[0]?.line).toBe(12);
    });

    it('lässt zwei verschiedene Wertungen desselben Starts zu', () => {
      const zweiteWertung = line('WERTUNG', ['1', 'E', '2', 'JG', '2008', '', 'W', 'Jahrgang']);
      const result = project(
        ABSCHNITT,
        WETTKAMPF,
        WERTUNG,
        zweiteWertung,
        VEREIN,
        person(),
        personenergebnis({ wertungsId: '1', platz: '1' }),
        personenergebnis({ wertungsId: '2', platz: '3' }),
      );

      expect(codes(result)).toEqual([]);
      expect(result.graph.startByKey.get('1:1:E')?.platzierungen.map((p) => p.wertungsId)).toEqual([
        1, 2,
      ]);
    });
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
        // Nachricht, `line` und `element` benennen dasselbe Element.
        element: 'STAFFELERGEBNIS',
        key: '9001:1:E',
        genannt: 3,
        erwartet: 4,
      });
      expect(result.diagnostics[0]?.message).toBe(
        'STAFFELERGEBNIS 9001:1:E names 3 of 4 relay members; either all or none are expected',
      );
      // Zeile 11 ist das STAFFELERGEBNIS, nicht die erste STAFFELPERSON.
      expect(result.diagnostics[0]?.line).toBe(11);
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

    it('nimmt erwartet aus dem Wettkampf des Starts, nicht aus dem ersten des Dokuments', () => {
      // Zwei Staffelwettkämpfe mit verschiedener Starterzahl: 4 und 8. Solange
      // beide gleich viele Starter führen, bliebe unbemerkt, wenn die Prüfung
      // die Starterzahl stets aus dem ersten WETTKAMPF läse.
      const vierer = line('WETTKAMPF', ['1', 'E', '1', '4', '100', 'F', 'GL', 'W', 'SW', '', '']);
      const achter = line('WETTKAMPF', ['2', 'E', '1', '8', '100', 'R', 'GL', 'W', 'SW', '', '']);
      const wertung2 = line('WERTUNG', ['2', 'E', '2', 'JG', '0', '9999', '', 'Zweite Wertung']);

      const result = project(
        ABSCHNITT,
        vierer,
        achter,
        WERTUNG,
        wertung2,
        VEREIN,
        staffel(),
        staffelergebnis(),
        ...['1', '2', '3'].map((n) => staffelperson({ startnummer: n })),
        staffelergebnis({ wettkampfnr: '2', wertungsId: '2' }),
        ...['1', '2', '3'].map((n) => staffelperson({ startnummer: n, wettkampfnr: '2' })),
      );

      expect(codes(result)).toEqual(['incomplete-relay', 'incomplete-relay']);
      const nachKey = new Map(
        result.diagnostics.map((d) => [(d.data as { key: string }).key, d] as const),
      );
      expect(nachKey.get('9001:1:E')?.data).toMatchObject({ genannt: 3, erwartet: 4 });
      expect(nachKey.get('9001:2:E')?.data).toMatchObject({ genannt: 3, erwartet: 8 });
      // Jeder Befund zeigt auf die STAFFELERGEBNIS-Zeile seines eigenen Starts.
      expect(nachKey.get('9001:1:E')?.line).toBe(13);
      expect(nachKey.get('9001:2:E')?.line).toBe(17);
    });
  });
});
