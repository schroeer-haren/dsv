import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseVereinsmeldeliste } from '../../src/parse/parse-vereinsmeldeliste.js';
import { writeVereinsmeldeliste } from '../../src/write/write-vereinsmeldeliste.js';
import type { ElementDef } from '../../src/schema/types.js';
import {
  ABSCHNITT,
  ANSPRECHPARTNER,
  DATEIENDE,
  ERZEUGER,
  FORMAT,
  HANDICAP,
  KARIABSCHNITT,
  KARIMELDUNG,
  PNMELDUNG,
  STAFFELPERSON,
  STARTPN,
  STARTST,
  STMELDUNG,
  TRAINER,
  VERANSTALTUNG,
  VEREIN,
  VEREINSMELDELISTE,
  WETTKAMPF,
} from '../../src/schema/vereinsmeldeliste.js';

/** Namen der Felder in der Reihenfolge der Spezifikation. */
function names(def: ElementDef): readonly string[] {
  return def.fields.map((f) => f.name);
}

/** Namen der Pflichtfelder in der Reihenfolge der Spezifikation. */
function requiredNames(def: ElementDef): readonly string[] {
  return def.fields.filter((f) => f.required).map((f) => f.name);
}

/**
 * Die Werte einer Werteliste in der Reihenfolge, in der das Schema sie führt.
 *
 * Das ist nicht durchweg „die Reihenfolge der Spezifikation": Bei
 * `zuordnungBestenliste` ist die Spezifikation mit sich selbst uneinig — sie
 * zählt SW, EW, PA, MS, KG, XX (dsv8.md:1097–1106) und SW, MS, KG, EW, PA, XX
 * (dsv8.md:3148–3158, 4804–4813) auf. Eine von drei Listenarten geteilte
 * Konstante kann nur einer der beiden folgen. Die Reihenfolge trägt deshalb
 * keine Bedeutung; die Prüfung stellt nur Zugehörigkeit zur Menge fest, siehe
 * `src/schema/shared-values.ts`.
 */
function enumValues(def: ElementDef, fieldName: string): readonly string[] {
  const found = def.fields.find((f) => f.name === fieldName);
  if (found === undefined) throw new Error(`Feld ${fieldName} fehlt in ${def.name}`);
  return (found.values ?? []).map((v) => v.value);
}

describe('Vereinsmeldeliste — Kopf', () => {
  it('benennt FORMAT', () => {
    expect(FORMAT.name).toBe('FORMAT');
    expect(names(FORMAT)).toEqual(['listart', 'version']);
    expect(requiredNames(FORMAT)).toEqual(['listart', 'version']);
    expect(FORMAT.fields[0]?.doc).toContain('Vereinsmeldeliste');
  });

  it('benennt ERZEUGER', () => {
    expect(names(ERZEUGER)).toEqual(['software', 'version', 'kontakt']);
    expect(requiredNames(ERZEUGER)).toEqual(['software', 'version', 'kontakt']);
  });

  it('benennt VERANSTALTUNG', () => {
    expect(names(VERANSTALTUNG)).toEqual([
      'veranstaltungsbezeichnung',
      'veranstaltungsort',
      'bahnlaenge',
      'zeitmessung',
    ]);
    expect(requiredNames(VERANSTALTUNG)).toEqual(names(VERANSTALTUNG));
    expect(enumValues(VERANSTALTUNG, 'bahnlaenge')).toEqual([
      '16',
      '20',
      '25',
      '33',
      '50',
      'FW',
      'X',
    ]);
    expect(enumValues(VERANSTALTUNG, 'zeitmessung')).toEqual([
      'HANDZEIT',
      'AUTOMATISCH',
      'HALBAUTOMATISCH',
    ]);
  });

  it('benennt ABSCHNITT mit vier Feldern', () => {
    expect(names(ABSCHNITT)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'anfangszeit',
      'relativeAngabe',
    ]);
    expect(requiredNames(ABSCHNITT)).toEqual(['abschnittsnr', 'abschnittsdatum', 'anfangszeit']);
    expect(ABSCHNITT.fields[0]?.range).toEqual({ min: 0, max: 99 });
    expect(ABSCHNITT.fields[3]?.default).toBe('N');
    expect(enumValues(ABSCHNITT, 'relativeAngabe')).toEqual(['J', 'N']);
  });
});

describe('Vereinsmeldeliste — WETTKAMPF', () => {
  it('führt zehn Felder und keine Zuordnung zur Bestenliste', () => {
    expect(names(WETTKAMPF)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'abschnittsnr',
      'anzahlStarter',
      'einzelstrecke',
      'technik',
      'ausuebung',
      'geschlecht',
      'qualifikationswettkampfnr',
      'qualifikationswettkampfart',
    ]);
    expect(names(WETTKAMPF)).not.toContain('zuordnungBestenliste');
    expect(requiredNames(WETTKAMPF)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'abschnittsnr',
      'einzelstrecke',
      'technik',
      'ausuebung',
      'geschlecht',
    ]);
  });

  /**
   * Die Wertetabelle nennt nur `V` und `E`. `Z` und `F` kommen aus der
   * Beispielzeile und dem Nachbarfeld, `A` und `N` aus den echten Dateien: Eine
   * der 34 Vereinsmeldelisten meldet einen Wettkampf mit Art `A`. Wie in der
   * Wettkampfdefinitionsliste sind die letzten beiden nur toleriert — lesbar,
   * aber nicht schreibbar.
   *
   * Die qualifizierende Wettkampfart teilt diesen Vorrat ausdrücklich nicht:
   * Aus einem Aus- oder Nachschwimmen qualifiziert man sich nicht weiter, und
   * alle vier Wertetabellen der Spezifikation führen dort nur V, Z, F und E.
   * Der listenartübergreifende Abgleich steht in `listenart-konsistenz.test.ts`.
   */
  it('nimmt sechs Wettkampfarten auf, obwohl die Wertetabelle nur zwei nennt', () => {
    expect(enumValues(WETTKAMPF, 'wettkampfart')).toEqual(['V', 'Z', 'F', 'E', 'A', 'N']);
    expect(enumValues(WETTKAMPF, 'qualifikationswettkampfart')).toEqual(['V', 'Z', 'F', 'E']);
  });

  it('führt die geteilten und die eigenen Wertelisten', () => {
    expect(enumValues(WETTKAMPF, 'technik')).toEqual(['F', 'R', 'B', 'S', 'L', 'X']);
    expect(enumValues(WETTKAMPF, 'ausuebung')).toEqual([
      'GL',
      'BE',
      'AR',
      'ST',
      'WE',
      'GB',
      'KB',
      'KR',
      'X',
    ]);
    expect(enumValues(WETTKAMPF, 'geschlecht')).toEqual(['M', 'W', 'D', 'X']);
  });

  it('kennt KB, KR und D erst ab DSV8', () => {
    const seit8 = (feld: string): readonly string[] =>
      (WETTKAMPF.fields.find((f) => f.name === feld)?.values ?? [])
        .filter((v) => v.since === 8)
        .map((v) => v.value);
    expect(seit8('ausuebung')).toEqual(['KB', 'KR']);
    expect(seit8('geschlecht')).toEqual(['D']);
  });

  it('begrenzt Nummern und Strecke', () => {
    const range = (feld: string) => WETTKAMPF.fields.find((f) => f.name === feld)?.range;
    expect(range('wettkampfnr')).toEqual({ min: 0, max: 999 });
    expect(range('abschnittsnr')).toEqual({ min: 0, max: 99 });
    expect(range('einzelstrecke')).toEqual({ min: 0, max: 25000 });
    expect(range('qualifikationswettkampfnr')).toEqual({ min: 0, max: 999 });
    // Kein statischer Unterlassungswert: dsv8.md:4744-4745 macht ihn vom
    // Wettkampf abhängig — 1 für Einzeldisziplinen, sonst die Zahl der
    // Staffelteilnehmer.
    expect(WETTKAMPF.fields.find((f) => f.name === 'anzahlStarter')?.default).toBeUndefined();
  });
});

describe('Vereinsmeldeliste — Verein und Personen', () => {
  it('benennt VEREIN mit fünf Feldern', () => {
    expect(names(VEREIN)).toEqual([
      'vereinsbezeichnung',
      'vereinskennzahl',
      'landesschwimmverband',
      'nationenkuerzel',
      'lastschrift',
    ]);
    expect(requiredNames(VEREIN)).toEqual([
      'vereinsbezeichnung',
      'vereinskennzahl',
      'landesschwimmverband',
      'nationenkuerzel',
    ]);
    const lastschrift = VEREIN.fields[4];
    expect(lastschrift?.since).toBe(8);
    expect(lastschrift?.default).toBe('N');
    expect(enumValues(VEREIN, 'lastschrift')).toEqual(['J', 'N']);
  });

  it('benennt ANSPRECHPARTNER', () => {
    expect(names(ANSPRECHPARTNER)).toEqual([
      'name',
      'strasse',
      'plz',
      'ort',
      'land',
      'telefon',
      'fax',
      'email',
    ]);
    expect(requiredNames(ANSPRECHPARTNER)).toEqual(['name', 'email']);
  });

  it('benennt KARIMELDUNG', () => {
    expect(names(KARIMELDUNG)).toEqual([
      'nummerKampfrichter',
      'name',
      'kampfrichtergruppe',
      'geschlecht',
    ]);
    expect(requiredNames(KARIMELDUNG)).toEqual([
      'nummerKampfrichter',
      'name',
      'kampfrichtergruppe',
    ]);
    expect(enumValues(KARIMELDUNG, 'kampfrichtergruppe')).toEqual(['WKR', 'AUS', 'SCH', 'SPR']);
    expect(enumValues(KARIMELDUNG, 'geschlecht')).toEqual(['M', 'W', 'D']);
    expect(KARIMELDUNG.fields[3]?.since).toBe(8);
  });

  it('benennt KARIABSCHNITT ohne WKH und ZBV', () => {
    expect(names(KARIABSCHNITT)).toEqual([
      'nummerKampfrichter',
      'abschnittsnummer',
      'einsatzwunsch',
    ]);
    expect(requiredNames(KARIABSCHNITT)).toEqual(['nummerKampfrichter', 'abschnittsnummer']);
    expect(enumValues(KARIABSCHNITT, 'einsatzwunsch')).toEqual([
      'SCH',
      'STA',
      'ZRO',
      'ZR',
      'ZNO',
      'ZN',
      'RZN',
      'SR',
      'WRO',
      'WR',
      'AUS',
      'SP',
      'PKF',
      'STO',
      'ASCH',
      'SIB',
      'SAUF',
      'VER',
    ]);
    expect(enumValues(KARIABSCHNITT, 'einsatzwunsch')).not.toContain('WKH');
    expect(enumValues(KARIABSCHNITT, 'einsatzwunsch')).not.toContain('ZBV');
  });

  it('benennt TRAINER', () => {
    expect(names(TRAINER)).toEqual(['nummerTrainer', 'name', 'geschlecht']);
    expect(requiredNames(TRAINER)).toEqual(['nummerTrainer', 'name']);
    expect(TRAINER.fields[2]?.since).toBe(8);
  });
});

describe('Vereinsmeldeliste — Meldungen', () => {
  it('benennt PNMELDUNG mit zehn Feldern', () => {
    expect(names(PNMELDUNG)).toEqual([
      'name',
      'dsvId',
      'veranstaltungsId',
      'geschlecht',
      'jahrgang',
      'altersklasse',
      'nummerTrainer',
      'nationalitaet1',
      'nationalitaet2',
      'nationalitaet3',
    ]);
    expect(requiredNames(PNMELDUNG)).toEqual([
      'name',
      'dsvId',
      'veranstaltungsId',
      'geschlecht',
      'jahrgang',
    ]);
    expect(enumValues(PNMELDUNG, 'geschlecht')).toEqual(['M', 'W', 'D']);
  });

  it('benennt HANDICAP mit sieben Feldern', () => {
    expect(names(HANDICAP)).toEqual([
      'veranstaltungsId',
      'dbsId',
      'ipcId',
      'startklasse',
      'startklasseBrust',
      'startklasseLagen',
      'exceptions',
    ]);
    expect(requiredNames(HANDICAP)).toEqual([
      'veranstaltungsId',
      'startklasse',
      'startklasseBrust',
      'startklasseLagen',
    ]);
    expect(enumValues(HANDICAP, 'startklasse')).toEqual([
      'AB',
      ...Array.from({ length: 14 }, (_, i) => `S${String(i + 1)}`),
    ]);
    expect(enumValues(HANDICAP, 'startklasseBrust')).toEqual([
      'AB',
      ...Array.from({ length: 14 }, (_, i) => `SB${String(i + 1)}`),
    ]);
    expect(enumValues(HANDICAP, 'startklasseLagen')).toEqual([
      'AB',
      ...Array.from({ length: 14 }, (_, i) => `SM${String(i + 1)}`),
    ]);
  });

  it('benennt STARTPN und STARTST gleich', () => {
    expect(names(STARTPN)).toEqual(['veranstaltungsId', 'wettkampfnummer', 'meldezeit']);
    expect(requiredNames(STARTPN)).toEqual(['veranstaltungsId', 'wettkampfnummer']);
    expect(names(STARTST)).toEqual(['veranstaltungsIdStaffel', 'wettkampfnummer', 'meldezeit']);
    expect(STARTPN.fields[2]?.default).toBe('00:00:00,00');
    expect(STARTST.fields[2]?.default).toBe('00:00:00,00');
  });

  it('benennt STMELDUNG', () => {
    expect(names(STMELDUNG)).toEqual([
      'nummerDerMannschaft',
      'veranstaltungsIdStaffel',
      'wertungsklasseTyp',
      'mindestJgAk',
      'maximalJgAk',
      'nameDerStaffel',
    ]);
    expect(requiredNames(STMELDUNG)).toEqual([
      'nummerDerMannschaft',
      'veranstaltungsIdStaffel',
      'wertungsklasseTyp',
      'mindestJgAk',
    ]);
    expect(enumValues(STMELDUNG, 'wertungsklasseTyp')).toEqual(['JG', 'AK']);
  });

  it('führt STAFFELPERSON hier mit genau vier Feldern', () => {
    expect(STAFFELPERSON.fields).toHaveLength(4);
    expect(names(STAFFELPERSON)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnummer',
      'veranstaltungsId',
      'startnummer',
    ]);
    expect(requiredNames(STAFFELPERSON)).toEqual(names(STAFFELPERSON));
  });

  it('führt DATEIENDE ohne Felder', () => {
    expect(DATEIENDE.bare).toBe(true);
    expect(DATEIENDE.fields).toEqual([]);
  });
});

describe('Vereinsmeldeliste — Schema', () => {
  it('führt siebzehn Elemente in der Reihenfolge der Spezifikation', () => {
    expect(VEREINSMELDELISTE.listenart).toBe('Vereinsmeldeliste');
    expect(VEREINSMELDELISTE.elements.map((e) => e.def.name)).toEqual([
      'FORMAT',
      'ERZEUGER',
      'VERANSTALTUNG',
      'ABSCHNITT',
      'WETTKAMPF',
      'VEREIN',
      'ANSPRECHPARTNER',
      'KARIMELDUNG',
      'KARIABSCHNITT',
      'TRAINER',
      'PNMELDUNG',
      'HANDICAP',
      'STARTPN',
      'STMELDUNG',
      'STARTST',
      'STAFFELPERSON',
      'DATEIENDE',
    ]);
  });

  it('vergibt die vorgesehenen Kardinalitäten', () => {
    const card = (name: string): string => {
      const found = VEREINSMELDELISTE.find(name);
      if (found === undefined) throw new Error(`${name} fehlt`);
      return `${String(found.min)}..${found.max === null ? 'n' : String(found.max)}`;
    };
    for (const name of [
      'FORMAT',
      'ERZEUGER',
      'VERANSTALTUNG',
      'VEREIN',
      'ANSPRECHPARTNER',
      'DATEIENDE',
    ]) {
      expect(card(name)).toBe('1..1');
    }
    expect(card('ABSCHNITT')).toBe('1..n');
    expect(card('WETTKAMPF')).toBe('1..n');
    for (const name of [
      'KARIMELDUNG',
      'KARIABSCHNITT',
      'TRAINER',
      'PNMELDUNG',
      'HANDICAP',
      'STARTPN',
      'STMELDUNG',
      'STARTST',
      'STAFFELPERSON',
    ]) {
      expect(card(name)).toBe('0..n');
    }
  });

  it('belegt jedes Feld mit einer Fundstelle in der Spezifikation', () => {
    for (const { def } of VEREINSMELDELISTE.elements) {
      for (const f of def.fields) {
        expect(f.specRef).toMatch(/^dsv8\.md:\d+$/);
      }
    }
  });
});

/**
 * Hält den Datentyp jedes Schemafeldes fest — vollständig, nicht stichprobenartig.
 *
 * Die übrigen Schema-Tests prüfen Feldnamen, Pflichtangaben, Wertelisten,
 * Bereiche und Unterlassungswerte, aber nie den Typ. Ein Feld, das versehentlich
 * als `ZK` statt als `Zeit` deklariert ist, bestünde sie alle: Der Wert
 * `00:01:02,11` sieht in beiden Fällen wohlgeformt aus, und die synthetischen
 * Fixtures stammen aus derselben Tabelle wie das Schema, tragen den Fehler also
 * mit, statt ihn aufzudecken.
 *
 * Die Erwartung steht deshalb ausgeschrieben da und wird nicht aus dem Schema
 * abgeleitet — sonst prüfte der Test sich selbst.
 */
describe('Vereinsmeldeliste — Datentypen', () => {
  const ERWARTETE_TYPEN: Readonly<Record<string, Readonly<Record<string, string>>>> = {
    FORMAT: {
      listart: 'ZK',
      version: 'Zahl',
    },
    ERZEUGER: {
      software: 'ZK',
      version: 'ZK',
      kontakt: 'ZK',
    },
    VERANSTALTUNG: {
      veranstaltungsbezeichnung: 'ZK',
      veranstaltungsort: 'ZK',
      bahnlaenge: 'ZK',
      zeitmessung: 'ZK',
    },
    ABSCHNITT: {
      abschnittsnr: 'Zahl',
      abschnittsdatum: 'Datum',
      anfangszeit: 'Uhrzeit',
      relativeAngabe: 'Zeichen',
    },
    WETTKAMPF: {
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      abschnittsnr: 'Zahl',
      anzahlStarter: 'Zahl',
      einzelstrecke: 'Zahl',
      technik: 'Zeichen',
      ausuebung: 'ZK',
      geschlecht: 'Zeichen',
      qualifikationswettkampfnr: 'Zahl',
      qualifikationswettkampfart: 'Zeichen',
    },
    VEREIN: {
      vereinsbezeichnung: 'ZK',
      vereinskennzahl: 'Zahl',
      landesschwimmverband: 'Zahl',
      nationenkuerzel: 'ZK',
      lastschrift: 'Zeichen',
    },
    ANSPRECHPARTNER: {
      name: 'ZK',
      strasse: 'ZK',
      plz: 'ZK',
      ort: 'ZK',
      land: 'ZK',
      telefon: 'ZK',
      fax: 'ZK',
      email: 'ZK',
    },
    KARIMELDUNG: {
      nummerKampfrichter: 'Zahl',
      name: 'ZK',
      kampfrichtergruppe: 'ZK',
      geschlecht: 'Zeichen',
    },
    KARIABSCHNITT: {
      nummerKampfrichter: 'Zahl',
      abschnittsnummer: 'Zahl',
      einsatzwunsch: 'ZK',
    },
    TRAINER: {
      nummerTrainer: 'Zahl',
      name: 'ZK',
      geschlecht: 'Zeichen',
    },
    PNMELDUNG: {
      name: 'ZK',
      dsvId: 'Zahl',
      veranstaltungsId: 'Zahl',
      geschlecht: 'Zeichen',
      jahrgang: 'Zahl',
      altersklasse: 'Zahl',
      nummerTrainer: 'Zahl',
      nationalitaet1: 'ZK',
      nationalitaet2: 'ZK',
      nationalitaet3: 'ZK',
    },
    HANDICAP: {
      veranstaltungsId: 'Zahl',
      dbsId: 'ZK',
      ipcId: 'ZK',
      startklasse: 'ZK',
      startklasseBrust: 'ZK',
      startklasseLagen: 'ZK',
      exceptions: 'ZK',
    },
    STARTPN: {
      veranstaltungsId: 'Zahl',
      wettkampfnummer: 'Zahl',
      meldezeit: 'Zeit',
    },
    STMELDUNG: {
      nummerDerMannschaft: 'Zahl',
      veranstaltungsIdStaffel: 'Zahl',
      wertungsklasseTyp: 'ZK',
      mindestJgAk: 'JGAK',
      maximalJgAk: 'JGAK',
      nameDerStaffel: 'ZK',
    },
    STARTST: {
      veranstaltungsIdStaffel: 'Zahl',
      wettkampfnummer: 'Zahl',
      meldezeit: 'Zeit',
    },
    STAFFELPERSON: {
      veranstaltungsIdStaffel: 'Zahl',
      wettkampfnummer: 'Zahl',
      veranstaltungsId: 'Zahl',
      startnummer: 'Zahl',
    },
  };

  it('deklariert für jedes Feld den erwarteten Datentyp', () => {
    const actual: Record<string, Record<string, string>> = {};

    for (const occurrence of VEREINSMELDELISTE.elements) {
      if (occurrence.def.fields.length === 0) continue;
      const fields: Record<string, string> = {};
      for (const f of occurrence.def.fields) fields[f.name] = f.type;
      actual[occurrence.def.name] = fields;
    }

    expect(actual).toEqual(ERWARTETE_TYPEN);
  });
});

/**
 * Gegenprobe zur Datentyp-Tabelle: Die Typen müssen beim Lesen auch wirken.
 *
 * Ohne diese Tests bliebe offen, ob ein als `Zeit` oder `Datum` deklariertes
 * Feld tatsächlich geprüft wird — ein Feld, das versehentlich `ZK` heisst,
 * nähme jeden Unsinn stillschweigend an.
 */
describe('Vereinsmeldeliste — Typprüfung greift beim Lesen', () => {
  const FIXTURE = readFileSync('test/fixtures/synth/vereinsmeldung.dsv8', 'utf8');

  /** Ersetzt im Fixture den ersten Treffer und liest die Datei erneut. */
  function mitFehler(suchen: string, ersetzen: string) {
    expect(FIXTURE).toContain(suchen);
    return parseVereinsmeldeliste(FIXTURE.replace(suchen, ersetzen));
  }

  it('liest das unveränderte Fixture ohne Befund', () => {
    expect(parseVereinsmeldeliste(FIXTURE).diagnostics).toEqual([]);
  });

  it('meldet eine fehlerhafte Angabe in STARTPN.meldezeit', () => {
    const result = mitFehler('00:00:31,45', '99:99:99,99');
    const befunde = result.diagnostics.filter((d) => d.code === 'invalid-value');

    expect(befunde.length).toBeGreaterThan(0);
    expect(befunde[0]?.severity).toBe('error');
    expect(befunde[0]?.data).toMatchObject({ field: 'meldezeit', value: '99:99:99,99' });
  });

  it('meldet eine fehlerhafte Angabe in ABSCHNITT.abschnittsdatum', () => {
    const result = mitFehler('15.03.2026', '32.13.2026');
    const befunde = result.diagnostics.filter((d) => d.code === 'invalid-value');

    expect(befunde.length).toBeGreaterThan(0);
    expect(befunde[0]?.severity).toBe('error');
    expect(befunde[0]?.data).toMatchObject({ field: 'abschnittsdatum', value: '32.13.2026' });
  });
});

/**
 * `SB10` fehlt in der Aufzählung der Brust-Startklassen (dsv8.md:2320 ff.),
 * während `S10` und `SM10` bei den beiden anderen Startklassen stehen.
 * `docs/architecture.md` wertet das als Lücke der Vorlage, nicht als Verbot:
 * Der Wert wird gelesen und geschrieben, mit einer `info`-Diagnostic.
 */
describe('Vereinsmeldeliste — SB10 als Lücke der Spezifikation', () => {
  /** Der Eintrag eines Wertes in der Werteliste eines Feldes. */
  function eintrag(fieldName: string, wert: string) {
    return HANDICAP.fields.find((f) => f.name === fieldName)?.values?.find((v) => v.value === wert);
  }

  it('führt SB10 als specGap', () => {
    expect(eintrag('startklasseBrust', 'SB10')?.specGap).toBe(true);
  });

  it('markiert die spezifizierten Nachbarwerte nicht', () => {
    expect(eintrag('startklasseBrust', 'SB9')?.specGap).toBeUndefined();
    expect(eintrag('startklasseBrust', 'SB11')?.specGap).toBeUndefined();
  });

  it('markiert S10 und SM10 nicht, weil beide in der Spezifikation stehen', () => {
    expect(eintrag('startklasse', 'S10')?.specGap).toBeUndefined();
    expect(eintrag('startklasseLagen', 'SM10')?.specGap).toBeUndefined();
  });

  it('unterscheidet specGap von tolerated — SB10 bleibt schreibbar', () => {
    expect(eintrag('startklasseBrust', 'SB10')?.tolerated).toBeUndefined();
  });
});

/**
 * Die Gegenprobe am ganzen Weg: `SB10` soll gelesen werden, dabei genau eine
 * `info` erzeugen und keinen Fehler — und beim Schreiben erhalten bleiben.
 * Darin unterscheidet es sich von `tolerated`, das den Schreibpfad sperrt.
 */
describe('Vereinsmeldeliste — SB10 wird gelesen und geschrieben', () => {
  const MIT_SB10 = readFileSync('test/fixtures/synth/vereinsmeldung.dsv8', 'utf8').replace(
    /(HANDICAP:[^;]*;[^;]*;[^;]*;[^;]*;)[^;]*/,
    '$1SB10',
  );

  it('erzeugt genau eine info und keinen Fehler', () => {
    const { diagnostics } = parseVereinsmeldeliste(MIT_SB10);

    expect(MIT_SB10).toContain('SB10');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('info');
    expect(diagnostics[0]?.data).toMatchObject({ field: 'startklasseBrust', value: 'SB10' });
    expect(diagnostics.filter((d) => d.severity === 'error' || d.severity === 'fatal')).toEqual([]);
  });

  it('schreibt SB10 zurück, statt es zu verwerfen', () => {
    const { document } = parseVereinsmeldeliste(MIT_SB10);

    expect(writeVereinsmeldeliste(document.records)).toContain('SB10');
  });
});
