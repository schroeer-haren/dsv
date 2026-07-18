import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectWettkampfergebnisliste } from '../../src/document/wettkampfergebnisliste.js';
import { parseWettkampfergebnisliste } from '../../src/parse/parse-wettkampfergebnisliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

const KOPF = [
  line('FORMAT', ['Wettkampfergebnisliste', '7']),
  line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
  line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
  line('VERANSTALTER', ['SV Test']),
  line('AUSRICHTER', ['SV Test', 'Muster, Max', '', '', '', '', '', '', 'info@example.org']),
];

/** Projiziert eine aus Zeilen zusammengesetzte Liste. */
function project(...zeilen: string[]) {
  const text = `${[...KOPF, ...zeilen, 'DATEIENDE'].join('\r\n')}\r\n`;
  return projectWettkampfergebnisliste(parseWettkampfergebnisliste(text).document);
}

/** Ein PNERGEBNIS mit den üblichen Werten; `over` überschreibt einzelne Felder. */
function pnergebnis(over: Partial<Record<string, string>> = {}): string {
  const v = {
    wettkampfnr: '1',
    wettkampfart: 'E',
    wertungsId: '1',
    platz: '1',
    grundDerNichtwertung: '',
    name: 'Muster, Max',
    dsvId: '100001',
    veranstaltungsId: '1',
    geschlecht: 'M',
    jahrgang: '2010',
    altersklasse: '',
    verein: 'SV Test',
    vereinskennzahl: '1234',
    endzeit: '00:00:28,15',
    disqualifikationsbemerkung: '',
    erhoehtesNachtraeglichesMeldegeld: '',
    nationalitaet1: 'GER',
    nationalitaet2: '',
    nationalitaet3: '',
    ...over,
  };
  return line('PNERGEBNIS', Object.values(v) as string[]);
}

/** Ein STERGEBNIS mit den üblichen Werten; `over` überschreibt einzelne Felder. */
function stergebnis(over: Partial<Record<string, string>> = {}): string {
  const v = {
    wettkampfnr: '2',
    wettkampfart: 'E',
    wertungsId: '5',
    platz: '1',
    grundDerNichtwertung: '',
    nummerDerMannschaft: '1',
    veranstaltungsId: '900',
    verein: 'SV Test',
    vereinskennzahl: '1234',
    endzeit: '00:04:00,00',
    startnummerDisqualifiziert: '',
    disqualifikationsbemerkung: '',
    erhoehtesNachtraeglichesMeldegeld: '',
    ...over,
  };
  return line('STERGEBNIS', Object.values(v) as string[]);
}

/** Eine STAFFELPERSON der Testtaffel `900:2:E` mit der gegebenen Startnummer. */
function staffelperson(startnummer: string, over: Partial<Record<string, string>> = {}): string {
  const v = {
    veranstaltungsIdStaffel: '900',
    wettkampfnr: '2',
    wettkampfart: 'E',
    name: `Muster, Mia ${startnummer}`,
    dsvId: `10000${startnummer}`,
    startnummer,
    geschlecht: 'W',
    jahrgang: '2009',
    altersklasse: '',
    nationalitaet1: '',
    nationalitaet2: '',
    nationalitaet3: '',
    ...over,
  };
  return line('STAFFELPERSON', Object.values(v) as string[]);
}

const STAFFEL_WETTKAMPF = line('WETTKAMPF', [
  '2',
  'E',
  '1',
  '4',
  '100',
  'F',
  'GL',
  'X',
  'SW',
  '',
  '',
]);
const STAFFEL_WERTUNG = line('WERTUNG', ['2', 'E', '5', 'AK', '100', '', 'X', 'Staffel']);
const STAFFEL_WERTUNG2 = line('WERTUNG', ['2', 'E', '6', 'AK', '120', '', 'X', 'Staffel Masters']);

const ABSCHNITT = line('ABSCHNITT', ['1', '10.05.2026', '09:00', '']);
const WETTKAMPF = line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']);
const WERTUNG = line('WERTUNG', ['1', 'E', '1', 'JG', '2010', '', '', 'offene Wertung']);
const WERTUNG2 = line('WERTUNG', ['1', 'E', '2', 'AK', '20', '', '', 'Masterswertung']);
const VEREIN = line('VEREIN', ['SV Test', '1234', '10', 'GER']);

describe('projectWettkampfergebnisliste', () => {
  it('hängt Wettkämpfe an ihren Abschnitt und Wertungen an ihren Wettkampf', () => {
    const { graph, diagnostics } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, pnergebnis());

    expect(diagnostics).toEqual([]);
    expect(graph.abschnitte).toHaveLength(1);
    expect(graph.abschnitte[0]?.wettkaempfe).toHaveLength(1);
    expect(graph.abschnitte[0]?.wettkaempfe[0]?.wertungen).toHaveLength(1);
    expect(graph.abschnitte[0]?.wettkaempfe[0]?.starts).toHaveLength(1);
  });

  it('dekodiert Datum, Uhrzeit und Zeit, alles andere bleibt Zeichenkette', () => {
    const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, pnergebnis());

    const abschnitt = graph.abschnitte[0];
    expect(abschnitt?.datum).toEqual({ day: 10, month: 5, year: 2026 });
    expect(abschnitt?.anfangszeit).toBe(9 * 60);

    const start = graph.abschnitte[0]?.wettkaempfe[0]?.starts[0];
    // 28,15 s in Hundertstelsekunden.
    expect(start?.endzeit).toBe(2815);
    expect(start?.jahrgang).toBe('2010');
    expect(start?.verein).toBe('SV Test');
  });

  it('fasst die Zeilen einer Person zu einem Start mit mehreren Platzierungen zusammen', () => {
    // dsv8.md:5019 — dieselbe Person erscheint einmal je Wertung. Die Zeilen
    // beschreiben denselben Schwimmvorgang, nur unterschiedlich gewertet.
    const { graph, diagnostics } = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      WERTUNG2,
      VEREIN,
      pnergebnis({ wertungsId: '1', platz: '1' }),
      pnergebnis({ wertungsId: '2', platz: '3' }),
    );

    expect(diagnostics).toEqual([]);
    const starts = graph.abschnitte[0]?.wettkaempfe[0]?.starts ?? [];
    expect(starts).toHaveLength(1);
    expect(starts[0]?.endzeit).toBe(2815);
    expect(starts[0]?.platzierungen.map((p) => [p.wertungsId, p.platz])).toEqual([
      [1, 1],
      [2, 3],
    ]);
  });

  it('meldet einen Widerspruch, wenn zwei Zeilen derselben Person nicht übereinstimmen', () => {
    const { graph, diagnostics } = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      WERTUNG2,
      VEREIN,
      pnergebnis({ wertungsId: '1' }),
      pnergebnis({ wertungsId: '2', endzeit: '00:00:29,00' }),
    );

    expect(diagnostics.map((d) => d.code)).toEqual(['ambiguous-reference']);
    // Der erste Wert gewinnt, beide Platzierungen bleiben erhalten.
    expect(graph.abschnitte[0]?.wettkaempfe[0]?.starts[0]?.endzeit).toBe(2815);
    expect(graph.abschnitte[0]?.wettkaempfe[0]?.starts[0]?.platzierungen).toHaveLength(2);
  });

  it('hängt Zwischenzeit und Reaktion an den Start der Person', () => {
    const { graph, diagnostics } = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      VEREIN,
      pnergebnis(),
      line('PNZWISCHENZEIT', ['1', '1', 'E', '25', '00:00:13,50']),
      line('PNREAKTION', ['1', '1', 'E', '+', '00:00:00,70']),
    );

    expect(diagnostics).toEqual([]);
    const start = graph.abschnitte[0]?.wettkaempfe[0]?.starts[0];
    expect(start?.zwischenzeiten).toEqual([{ distanz: 25, zeit: 1350, line: expect.any(Number) }]);
    expect(start?.reaktionen).toEqual([{ art: '+', zeit: 70, line: expect.any(Number) }]);
  });

  it('sammelt die Staffel samt Personen, Zwischenzeiten und Ablösezeiten', () => {
    const { graph, diagnostics } = project(
      ABSCHNITT,
      line('WETTKAMPF', ['2', 'E', '1', '4', '100', 'F', 'GL', 'X', 'SW', '', '']),
      line('WERTUNG', ['2', 'E', '5', 'AK', '100', '', 'X', 'Staffel']),
      VEREIN,
      line('STERGEBNIS', [
        '2',
        'E',
        '5',
        '1',
        '',
        '1',
        '900',
        'SV Test',
        '1234',
        '00:04:00,00',
        '',
        '',
        '',
      ]),
      line('STAFFELPERSON', [
        '900',
        '2',
        'E',
        'Muster, Mia',
        '100002',
        '1',
        'W',
        '2009',
        '',
        '',
        '',
        '',
      ]),
      line('STZWISCHENZEIT', ['900', '2', 'E', '1', '50', '00:00:30,00']),
      line('STABLOESE', ['900', '2', 'E', '1', '+', '00:00:00,50']),
    );

    expect(diagnostics).toEqual([]);
    const staffel = graph.staffelByKey.get('900:2:E');
    expect(staffel?.personen).toHaveLength(1);
    expect(staffel?.zwischenzeiten).toHaveLength(1);
    expect(staffel?.abloesen).toEqual([
      { startnummer: 1, art: '+', zeit: 50, line: expect.any(Number) },
    ]);
    expect(graph.abschnitte[0]?.wettkaempfe[0]?.staffeln).toHaveLength(1);
  });

  it('fasst die Zeilen einer Staffel zu einem Ergebnis mit mehreren Platzierungen zusammen', () => {
    // Wie auf der Personenseite: Eine Staffel erscheint einmal je Wertung. In
    // den 75 echten Ergebnislisten tragen 134 STERGEBNIS-Schlüssel mehr als
    // eine Zeile. Ohne diese Zusammenfassung ergäbe jede Wertungszeile eine
    // eigene Staffel, und nur die letzte bliebe im Index.
    const { graph, diagnostics } = project(
      ABSCHNITT,
      STAFFEL_WETTKAMPF,
      STAFFEL_WERTUNG,
      STAFFEL_WERTUNG2,
      VEREIN,
      stergebnis({ wertungsId: '5', platz: '1' }),
      stergebnis({ wertungsId: '6', platz: '3' }),
    );

    expect(diagnostics).toEqual([]);
    const staffeln = graph.abschnitte[0]?.wettkaempfe[0]?.staffeln ?? [];
    expect(staffeln).toHaveLength(1);
    expect(staffeln[0]?.endzeit).toBe(24000);
    expect(staffeln[0]?.platzierungen.map((p) => [p.wertungsId, p.platz])).toEqual([
      [5, 1],
      [6, 3],
    ]);
    expect(graph.staffelByKey.get('900:2:E')?.platzierungen).toHaveLength(2);
  });

  it('zählt die Mitglieder einer in mehreren Wertungen platzierten Staffel nur einmal', () => {
    // Ist eine Staffel in zwei Wertungen platziert, wiederholen echte Dateien
    // den kompletten STAFFELPERSON-Block je Wertung — siehe
    // b-shsv-2025-02-22_FSK_Foerdemasters-Pr.dsv7, Zeilen 5375-5378 und
    // 5473-5476 für die Staffel 212:7:E. Eine Vierer-Staffel hat vier
    // Mitglieder, nicht acht.
    const { graph, diagnostics } = project(
      ABSCHNITT,
      STAFFEL_WETTKAMPF,
      STAFFEL_WERTUNG,
      STAFFEL_WERTUNG2,
      VEREIN,
      stergebnis({ wertungsId: '5', platz: '1' }),
      ...['1', '2', '3', '4'].map((n) => staffelperson(n)),
      line('STZWISCHENZEIT', ['900', '2', 'E', '1', '50', '00:00:30,00']),
      line('STABLOESE', ['900', '2', 'E', '2', '+', '00:00:00,50']),
      stergebnis({ wertungsId: '6', platz: '3' }),
      ...['1', '2', '3', '4'].map((n) => staffelperson(n)),
      line('STZWISCHENZEIT', ['900', '2', 'E', '1', '50', '00:00:30,00']),
      line('STABLOESE', ['900', '2', 'E', '2', '+', '00:00:00,50']),
    );

    expect(diagnostics).toEqual([]);
    const staffel = graph.staffelByKey.get('900:2:E');
    expect(staffel?.personen.map((p) => p.startnummer)).toEqual([1, 2, 3, 4]);
    expect(staffel?.zwischenzeiten).toHaveLength(1);
    expect(staffel?.abloesen).toHaveLength(1);
    expect(staffel?.platzierungen).toHaveLength(2);
  });

  it('behält verschiedene Mitglieder derselben Startnummer nicht doppelt, aber echte Zeiten', () => {
    // Verschiedene Distanzen derselben Startnummer sind eigene Zwischenzeiten.
    const { graph } = project(
      ABSCHNITT,
      STAFFEL_WETTKAMPF,
      STAFFEL_WERTUNG,
      VEREIN,
      stergebnis({ wertungsId: '5' }),
      line('STZWISCHENZEIT', ['900', '2', 'E', '1', '25', '00:00:14,00']),
      line('STZWISCHENZEIT', ['900', '2', 'E', '1', '50', '00:00:30,00']),
      line('STABLOESE', ['900', '2', 'E', '2', '+', '00:00:00,50']),
      line('STABLOESE', ['900', '2', 'E', '3', '+', '00:00:00,60']),
    );

    const staffel = graph.staffelByKey.get('900:2:E');
    expect(staffel?.zwischenzeiten).toHaveLength(2);
    expect(staffel?.abloesen).toHaveLength(2);
  });

  it('meldet einen Widerspruch, wenn zwei Zeilen derselben Staffel nicht übereinstimmen', () => {
    const { graph, diagnostics } = project(
      ABSCHNITT,
      STAFFEL_WETTKAMPF,
      STAFFEL_WERTUNG,
      STAFFEL_WERTUNG2,
      VEREIN,
      stergebnis({ wertungsId: '5' }),
      stergebnis({ wertungsId: '6', endzeit: '00:04:01,00' }),
    );

    expect(diagnostics.map((d) => d.code)).toEqual(['ambiguous-reference']);
    // Der erste Wert gewinnt, beide Platzierungen bleiben erhalten.
    const staffel = graph.staffelByKey.get('900:2:E');
    expect(staffel?.endzeit).toBe(24000);
    expect(staffel?.platzierungen).toHaveLength(2);
  });

  it('meldet Staffel-Unterelemente, deren STERGEBNIS fehlt', () => {
    // Ein stilles Überspringen wäre Datenverlust ohne Meldung.
    for (const zeile of [
      line('STAFFELPERSON', [
        '777',
        '2',
        'E',
        'Muster, Mia',
        '100002',
        '1',
        'W',
        '2009',
        '',
        '',
        '',
        '',
      ]),
      line('STZWISCHENZEIT', ['777', '2', 'E', '1', '50', '00:00:30,00']),
      line('STABLOESE', ['777', '2', 'E', '1', '+', '00:00:00,50']),
    ]) {
      const { diagnostics } = project(
        ABSCHNITT,
        STAFFEL_WETTKAMPF,
        STAFFEL_WERTUNG,
        VEREIN,
        stergebnis(),
        zeile,
      );

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]?.code).toBe('dangling-reference');
      expect(diagnostics[0]?.data).toMatchObject({
        element: zeile.slice(0, zeile.indexOf(':')),
        key: '777:2:E',
      });
    }
  });

  it('führt Index-Maps auf oberster Ebene und bleibt frei von Zyklen', () => {
    const { graph } = project(ABSCHNITT, WETTKAMPF, WERTUNG, VEREIN, pnergebnis());

    expect(graph.abschnittByNummer.get(1)?.nummer).toBe(1);
    expect(graph.wettkampfByKey.get('1:E')?.nummer).toBe(1);
    expect(graph.wertungById.get(1)?.name).toBe('offene Wertung');
    expect(graph.vereinByKennzahl.get(1234)?.bezeichnung).toBe('SV Test');
    expect(graph.startByKey.get('1:1:E')?.name).toBe('Muster, Max');
    expect(() => JSON.stringify(graph.abschnitte)).not.toThrow();
  });

  it('meldet einen Wettkampf ohne Abschnitt, verliert ihn aber nicht', () => {
    const { graph, diagnostics } = project(
      ABSCHNITT,
      line('WETTKAMPF', ['1', 'E', '9', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
      WERTUNG,
      VEREIN,
    );

    expect(diagnostics.map((d) => d.code)).toContain('dangling-reference');
    expect(graph.wettkaempfeOhneAbschnitt).toHaveLength(1);
    expect(graph.wettkampfByKey.get('1:E')).toBeDefined();
  });

  it('meldet ein Ergebnis, dessen Wettkampf oder Wertung fehlt', () => {
    const ohneWettkampf = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      VEREIN,
      pnergebnis({ wettkampfnr: '9' }),
    );
    expect(ohneWettkampf.diagnostics.map((d) => d.code)).toContain('dangling-reference');

    const ohneWertung = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      VEREIN,
      pnergebnis({ wertungsId: '9' }),
    );
    expect(ohneWertung.diagnostics.map((d) => d.code)).toContain('dangling-reference');
  });

  it('meldet eine Zwischenzeit ohne zugehörige Person', () => {
    const { diagnostics } = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      VEREIN,
      pnergebnis(),
      line('PNZWISCHENZEIT', ['7', '1', 'E', '25', '00:00:13,50']),
    );

    expect(diagnostics.map((d) => d.code)).toEqual(['dangling-reference']);
  });

  it('schweigt zur Vereinskennzahl 0 — sie kennzeichnet vereinslose Meldungen', () => {
    // 0 ist kein Schlüssel, sondern das Kennzeichen für nicht dem DSV
    // angehörende Vereine. Mehrere Vereine tragen sie zu Recht.
    const { graph, diagnostics } = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      line('VEREIN', ['Auslandsverein A', '0', '0', 'AUT']),
      line('VEREIN', ['Auslandsverein B', '0000', '0', 'SUI']),
      pnergebnis({ verein: 'Auslandsverein A', vereinskennzahl: '0' }),
    );

    expect(diagnostics).toEqual([]);
    expect(graph.vereinByKennzahl.has(0)).toBe(false);
    expect(graph.vereine).toHaveLength(2);
  });

  it('meldet eine doppelt vergebene Vereinskennzahl ungleich 0', () => {
    const { diagnostics } = project(
      ABSCHNITT,
      WETTKAMPF,
      WERTUNG,
      VEREIN,
      line('VEREIN', ['SV Test Kiel', '1234', '10', 'GER']),
      pnergebnis(),
    );

    expect(diagnostics.map((d) => d.code)).toEqual(['ambiguous-reference']);
  });

  it('bietet die Schwimmer-Aggregation über alle Starts einer Person', () => {
    const { graph } = project(
      ABSCHNITT,
      WETTKAMPF,
      line('WETTKAMPF', ['2', 'E', '1', '1', '100', 'F', 'GL', 'M', 'SW', '', '']),
      WERTUNG,
      line('WERTUNG', ['2', 'E', '2', 'JG', '2010', '', '', 'offene Wertung']),
      VEREIN,
      pnergebnis(),
      pnergebnis({ wettkampfnr: '2', wertungsId: '2', endzeit: '00:01:02,00' }),
    );

    const schwimmer = graph.schwimmerById.get(1);
    expect(schwimmer?.name).toBe('Muster, Max');
    expect(schwimmer?.starts).toHaveLength(2);
    expect(schwimmer?.starts.map((s) => s.wettkampfnr)).toEqual([1, 2]);
  });
});

const REAL = 'test/fixtures/real';

/** Die fehlerfreien echten Ergebnislisten — nur sie werden hier projiziert. */
const errorFree = readdirSync(REAL)
  .filter((f) => /\.dsv[678]?$/i.test(f))
  .map((f) => ({
    name: f,
    result: parseWettkampfergebnisliste(readFileSync(join(REAL, f), 'utf8')),
  }))
  .filter(
    ({ result }) =>
      result.document.listenart.toLowerCase() === 'wettkampfergebnisliste' && result.ok,
  );

describe('Projektion über echte Ergebnislisten', () => {
  it('projiziert genau die 48 fehlerfreien Dateien', () => {
    expect(errorFree.length).toBe(48);
  });

  it('löst jeden Bezug auf und erzeugt genau eine Warnung insgesamt', () => {
    const alle = errorFree.flatMap(({ name, result }) =>
      projectWettkampfergebnisliste(result.document).diagnostics.map((d) => ({
        name,
        code: d.code,
        message: d.message,
      })),
    );

    // 28 Warnungen über alle 48 Dateien, und keine davon betrifft die Bezüge
    // der Ergebniszeilen: Jedes PNERGEBNIS findet seinen Wettkampf und seine
    // Wertung, jede PNZWISCHENZEIT ihre Person, jede STAFFELPERSON ihre
    // Staffel. Alle 28 sind Mängel der Quelldateien:
    //
    //   26x ein Finale nennt einen qualifizierenden Wettkampf, den die Datei
    //       nicht führt (etwa 101:F verweist auf 1:E),
    //    1x eine WERTUNG verweist auf einen Wettkampf 5:F, den es nicht gibt,
    //    1x eine Datei führt die Vereinskennzahl 5129 zweimal, als
    //       "SV Neptun" und als "SV Neptun Kiel".
    expect(alle).toHaveLength(28);

    const nachCode = alle.reduce<Record<string, number>>((acc, d) => {
      acc[d.code] = (acc[d.code] ?? 0) + 1;
      return acc;
    }, {});
    expect(nachCode).toEqual({ 'dangling-reference': 27, 'ambiguous-reference': 1 });

    // Kein Bezug einer Ergebniszeile zeigt ins Leere.
    expect(
      alle.filter((d) =>
        ['PNERGEBNIS', 'PNZWISCHENZEIT', 'PNREAKTION', 'STERGEBNIS', 'STAFFELPERSON'].some((e) =>
          d.message.startsWith(e),
        ),
      ),
    ).toEqual([]);

    expect(alle.filter((d) => d.message.includes('5129'))).toHaveLength(1);
  });

  it.each(errorFree.map((e) => e.name))(
    '%s: jedes Ergebnis findet Wettkampf und Wertung',
    (name) => {
      const entry = errorFree.find((e) => e.name === name);
      const records = entry?.result.document.records ?? [];
      const { graph } = projectWettkampfergebnisliste(entry!.result.document);

      const starts = [...graph.startByKey.values()];
      const platzierungen = starts.flatMap((s) => s.platzierungen);

      // Jede PNERGEBNIS-Zeile ist als genau eine Platzierung wiederzufinden.
      expect(platzierungen).toHaveLength(records.filter((r) => r.element === 'PNERGEBNIS').length);

      for (const start of starts) {
        expect(graph.wettkampfByKey.has(`${String(start.wettkampfnr)}:${start.wettkampfart}`)).toBe(
          true,
        );
        for (const p of start.platzierungen) expect(graph.wertungById.has(p.wertungsId)).toBe(true);
      }

      // Jede PNZWISCHENZEIT hat ihre Person gefunden.
      expect(starts.flatMap((s) => s.zwischenzeiten)).toHaveLength(
        records.filter((r) => r.element === 'PNZWISCHENZEIT').length,
      );
    },
  );
});
