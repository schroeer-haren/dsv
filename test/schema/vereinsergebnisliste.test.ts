import { describe, expect, it } from 'vitest';
import type { ElementDef } from '../../src/schema/types.js';
import {
  ABSCHNITT,
  AUSRICHTER,
  DATEIENDE,
  ERZEUGER,
  FORMAT,
  KAMPFGERICHT,
  PERSON,
  PERSONENERGEBNIS,
  PNREAKTION,
  PNZWISCHENZEIT,
  STABLOESE,
  STAFFEL,
  STAFFELERGEBNIS,
  STAFFELPERSON,
  STZWISCHENZEIT,
  VERANSTALTER,
  VERANSTALTUNG,
  VEREIN,
  VEREINSERGEBNISLISTE,
  WERTUNG,
  WETTKAMPF,
} from '../../src/schema/vereinsergebnisliste.js';
import { STAFFELPERSON as MELDUNG_STAFFELPERSON } from '../../src/schema/vereinsmeldeliste.js';
import { STERGEBNIS } from '../../src/schema/wettkampfergebnisliste.js';

/** Namen der Felder in der Reihenfolge der Spezifikation. */
function names(def: ElementDef): readonly string[] {
  return def.fields.map((f) => f.name);
}

/** Namen der Pflichtfelder in der Reihenfolge der Spezifikation. */
function requiredNames(def: ElementDef): readonly string[] {
  return def.fields.filter((f) => f.required).map((f) => f.name);
}

/** Werte einer Werteliste in der Reihenfolge der Spezifikation. */
function enumValues(def: ElementDef, fieldName: string): readonly string[] {
  const found = def.fields.find((f) => f.name === fieldName);
  if (found === undefined) throw new Error(`Feld ${fieldName} fehlt in ${def.name}`);
  return (found.values ?? []).map((v) => v.value);
}

/** Zahlenbereich eines Feldes. */
function range(def: ElementDef, fieldName: string): unknown {
  return def.fields.find((f) => f.name === fieldName)?.range;
}

/** Wettkampfarten, wie sie die meisten Ergebniselemente führen. */
const ALLE_WETTKAMPFARTEN = ['V', 'Z', 'F', 'E', 'A', 'N'];

describe('Vereinsergebnisliste — Kopf', () => {
  it('benennt FORMAT', () => {
    expect(FORMAT.name).toBe('FORMAT');
    expect(names(FORMAT)).toEqual(['listart', 'version']);
    expect(requiredNames(FORMAT)).toEqual(['listart', 'version']);
    expect(FORMAT.fields[0]?.doc).toContain('Vereinsergebnisliste');
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

  it('benennt VERANSTALTER mit einem Feld', () => {
    expect(names(VERANSTALTER)).toEqual(['nameDesVeranstalters']);
    expect(requiredNames(VERANSTALTER)).toEqual(['nameDesVeranstalters']);
  });

  it('benennt AUSRICHTER mit neun Feldern', () => {
    expect(names(AUSRICHTER)).toEqual([
      'nameDesAusrichters',
      'name',
      'strasse',
      'plz',
      'ort',
      'land',
      'telefon',
      'fax',
      'email',
    ]);
    expect(requiredNames(AUSRICHTER)).toEqual(['nameDesAusrichters', 'name', 'email']);
  });

  it('benennt ABSCHNITT mit vier Feldern', () => {
    expect(names(ABSCHNITT)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'anfangszeit',
      'relativeAngabe',
    ]);
    expect(requiredNames(ABSCHNITT)).toEqual(['abschnittsnr', 'abschnittsdatum', 'anfangszeit']);
    expect(range(ABSCHNITT, 'abschnittsnr')).toEqual({ min: 0, max: 99 });
    expect(ABSCHNITT.fields[3]?.default).toBe('N');
    expect(enumValues(ABSCHNITT, 'relativeAngabe')).toEqual(['J', 'N']);
  });

  it('benennt KAMPFGERICHT mit WKH und ZBV', () => {
    expect(names(KAMPFGERICHT)).toEqual([
      'abschnittsnr',
      'position',
      'nameKampfrichter',
      'vereinDesKampfrichters',
    ]);
    expect(requiredNames(KAMPFGERICHT)).toEqual(names(KAMPFGERICHT));
    expect(enumValues(KAMPFGERICHT, 'position')).toEqual([
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
      'WKH',
      'ASCH',
      'SIB',
      'SAUF',
      'VER',
      'ZBV',
    ]);
    expect(enumValues(KAMPFGERICHT, 'position')).toHaveLength(20);
  });
});

describe('Vereinsergebnisliste — WETTKAMPF und WERTUNG', () => {
  it('führt WETTKAMPF mit elf Feldern', () => {
    expect(WETTKAMPF.fields).toHaveLength(11);
    expect(names(WETTKAMPF)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'abschnittsnr',
      'anzahlStarter',
      'einzelstrecke',
      'technik',
      'ausuebung',
      'geschlecht',
      'zuordnungBestenliste',
      'qualifikationswettkampfnr',
      'qualifikationswettkampfart',
    ]);
    expect(requiredNames(WETTKAMPF)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'abschnittsnr',
      'einzelstrecke',
      'technik',
      'ausuebung',
      'geschlecht',
      'zuordnungBestenliste',
    ]);
    expect(range(WETTKAMPF, 'wettkampfnr')).toEqual({ min: 0, max: 999 });
    expect(range(WETTKAMPF, 'abschnittsnr')).toEqual({ min: 0, max: 99 });
    expect(range(WETTKAMPF, 'einzelstrecke')).toEqual({ min: 0, max: 25000 });
    expect(range(WETTKAMPF, 'qualifikationswettkampfnr')).toEqual({ min: 0, max: 999 });
    expect(WETTKAMPF.fields[3]?.default).toBe('1');
  });

  it('führt die Wertelisten von WETTKAMPF', () => {
    expect(enumValues(WETTKAMPF, 'wettkampfart')).toEqual(['V', 'Z', 'F', 'E', 'A', 'N']);
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
    expect(enumValues(WETTKAMPF, 'zuordnungBestenliste')).toEqual([
      'SW',
      'EW',
      'PA',
      'MS',
      'KG',
      'XX',
    ]);
    expect(enumValues(WETTKAMPF, 'qualifikationswettkampfart')).toEqual(['V', 'Z', 'F', 'E']);
  });

  it('führt WERTUNG mit acht Feldern', () => {
    expect(names(WERTUNG)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'wertungsklasseTyp',
      'mindestJgAk',
      'maximalJgAk',
      'geschlecht',
      'wertungsname',
    ]);
    expect(requiredNames(WERTUNG)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'wertungsklasseTyp',
      'mindestJgAk',
      'wertungsname',
    ]);
    expect(enumValues(WERTUNG, 'wertungsklasseTyp')).toEqual(['JG', 'AK']);
    expect(enumValues(WERTUNG, 'geschlecht')).toEqual(['M', 'W', 'D', 'X']);
  });

  /**
   * Die Wertetabelle der WERTUNG nennt A und N nicht (dsv8.md:3197). Sie ist
   * als unvollständig gelesen: `wertungsId` ist in jedem Ergebnis Pflicht und
   * darf nur auf eine Wertung des eigenen Wettkampfs zeigen — Ergebnisse eines
   * Aus- oder Nachschwimmens hätten sonst keine mögliche Wertung.
   */
  it('kennt in WERTUNG wie in WETTKAMPF alle sechs Wettkampfarten', () => {
    expect(enumValues(WERTUNG, 'wettkampfart')).toEqual(['V', 'Z', 'F', 'E', 'A', 'N']);
    expect(enumValues(WETTKAMPF, 'wettkampfart')).toEqual(['V', 'Z', 'F', 'E', 'A', 'N']);
  });

  it('lässt aus einem Aus- oder Nachschwimmen nicht weiterqualifizieren', () => {
    expect(enumValues(WETTKAMPF, 'qualifikationswettkampfart')).toEqual(['V', 'Z', 'F', 'E']);
  });
});

describe('Vereinsergebnisliste — Verein und Personen', () => {
  it('führt VEREIN mit vier Feldern und ohne Lastschrift', () => {
    expect(names(VEREIN)).toEqual([
      'vereinsbezeichnung',
      'vereinskennzahl',
      'landesschwimmverband',
      'nationenkuerzel',
    ]);
    expect(requiredNames(VEREIN)).toEqual(names(VEREIN));
    expect(names(VEREIN)).not.toContain('lastschrift');
  });

  it('führt PERSON mit neun Feldern und ohne Trainerfeld', () => {
    expect(names(PERSON)).toEqual([
      'name',
      'dsvId',
      'veranstaltungsId',
      'geschlecht',
      'jahrgang',
      'altersklasse',
      'nationalitaet1',
      'nationalitaet2',
      'nationalitaet3',
    ]);
    expect(requiredNames(PERSON)).toEqual([
      'name',
      'dsvId',
      'veranstaltungsId',
      'geschlecht',
      'jahrgang',
    ]);
    expect(names(PERSON)).not.toContain('nummerTrainer');
    expect(enumValues(PERSON, 'geschlecht')).toEqual(['M', 'W', 'D']);
  });

  it('führt PERSONENERGEBNIS mit neun Feldern', () => {
    expect(names(PERSONENERGEBNIS)).toEqual([
      'veranstaltungsId',
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'endzeit',
      'grundDerNichtwertung',
      'disqualifikationsbemerkung',
      'erhoehtesNachtraeglichesMeldegeld',
    ]);
    expect(requiredNames(PERSONENERGEBNIS)).toEqual([
      'veranstaltungsId',
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'endzeit',
    ]);
    expect(enumValues(PERSONENERGEBNIS, 'wettkampfart')).toEqual(ALLE_WETTKAMPFARTEN);
    expect(enumValues(PERSONENERGEBNIS, 'grundDerNichtwertung')).toEqual([
      'DS',
      'NA',
      'AB',
      'AU',
      'ZU',
    ]);
    expect(enumValues(PERSONENERGEBNIS, 'erhoehtesNachtraeglichesMeldegeld')).toEqual([
      'E',
      'F',
      'N',
    ]);
  });

  it('führt PNZWISCHENZEIT und PNREAKTION', () => {
    expect(names(PNZWISCHENZEIT)).toEqual([
      'veranstaltungsId',
      'wettkampfnr',
      'wettkampfart',
      'distanz',
      'zwischenzeit',
    ]);
    expect(requiredNames(PNZWISCHENZEIT)).toEqual(names(PNZWISCHENZEIT));

    expect(names(PNREAKTION)).toEqual([
      'veranstaltungsId',
      'wettkampfnr',
      'wettkampfart',
      'art',
      'reaktionszeit',
    ]);
    expect(requiredNames(PNREAKTION)).toEqual([
      'veranstaltungsId',
      'wettkampfnr',
      'wettkampfart',
      'reaktionszeit',
    ]);
    expect(enumValues(PNREAKTION, 'art')).toEqual(['+', '-']);
    expect(PNREAKTION.fields[3]?.default).toBe('+');
  });
});

describe('Vereinsergebnisliste — Staffeln', () => {
  it('führt STAFFEL mit fünf Feldern und ohne Staffelnamen', () => {
    expect(names(STAFFEL)).toEqual([
      'nummerDerMannschaft',
      'veranstaltungsIdStaffel',
      'wertungsklasseTyp',
      'mindestJgAk',
      'maximalJgAk',
    ]);
    expect(requiredNames(STAFFEL)).toEqual([
      'nummerDerMannschaft',
      'veranstaltungsIdStaffel',
      'wertungsklasseTyp',
      'mindestJgAk',
    ]);
    expect(names(STAFFEL)).not.toContain('nameDerStaffel');
    expect(enumValues(STAFFEL, 'wertungsklasseTyp')).toEqual(['JG', 'AK']);
  });

  it('führt STAFFELPERSON hier mit genau zwölf Feldern', () => {
    expect(STAFFELPERSON.fields).toHaveLength(12);
    expect(names(STAFFELPERSON)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'name',
      'dsvId',
      'startnummer',
      'geschlecht',
      'jahrgang',
      'altersklasse',
      'nationalitaet1',
      'nationalitaet2',
      'nationalitaet3',
    ]);
    expect(requiredNames(STAFFELPERSON)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'name',
      'dsvId',
      'startnummer',
      'geschlecht',
      'jahrgang',
    ]);
    expect(enumValues(STAFFELPERSON, 'geschlecht')).toEqual(['M', 'W', 'D']);
  });

  it('unterscheidet STAFFELPERSON von dem gleichnamigen Element der Vereinsmeldeliste', () => {
    expect(MELDUNG_STAFFELPERSON.fields).toHaveLength(4);
    expect(STAFFELPERSON.fields).toHaveLength(12);
    expect(names(STAFFELPERSON)).not.toEqual(names(MELDUNG_STAFFELPERSON));
  });

  it('führt STAFFELERGEBNIS mit zehn Feldern', () => {
    expect(names(STAFFELERGEBNIS)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'endzeit',
      'grundDerNichtwertung',
      'startnummerDisqualifiziert',
      'disqualifikationsbemerkung',
      'erhoehtesNachtraeglichesMeldegeld',
    ]);
    expect(requiredNames(STAFFELERGEBNIS)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'endzeit',
    ]);
    expect(enumValues(STAFFELERGEBNIS, 'grundDerNichtwertung')).toEqual([
      'DS',
      'NA',
      'AB',
      'AU',
      'ZU',
    ]);
  });

  it('heisst STAFFELERGEBNIS, wo die Wettkampfergebnisliste STERGEBNIS führt', () => {
    expect(STAFFELERGEBNIS.name).toBe('STAFFELERGEBNIS');
    expect(STERGEBNIS.name).toBe('STERGEBNIS');
    expect(VEREINSERGEBNISLISTE.find('STERGEBNIS')).toBeUndefined();
    expect(VEREINSERGEBNISLISTE.find('STAFFELERGEBNIS')).toBeDefined();
  });

  it('führt STZWISCHENZEIT und STABLOESE', () => {
    expect(names(STZWISCHENZEIT)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'startnummer',
      'distanz',
      'zwischenzeit',
    ]);
    expect(requiredNames(STZWISCHENZEIT)).toEqual(names(STZWISCHENZEIT));

    expect(names(STABLOESE)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'startnummer',
      'art',
      'reaktionszeit',
    ]);
    expect(requiredNames(STABLOESE)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'startnummer',
      'reaktionszeit',
    ]);
    expect(enumValues(STABLOESE, 'art')).toEqual(['+', '-']);
    expect(STABLOESE.fields[4]?.default).toBe('+');
  });

  it('führt DATEIENDE ohne Felder', () => {
    expect(DATEIENDE.bare).toBe(true);
    expect(DATEIENDE.fields).toEqual([]);
  });
});

describe('Vereinsergebnisliste — Schema', () => {
  it('führt zwanzig Elemente in der Reihenfolge der Spezifikation', () => {
    expect(VEREINSERGEBNISLISTE.listenart).toBe('Vereinsergebnisliste');
    expect(VEREINSERGEBNISLISTE.elements.map((e) => e.def.name)).toEqual([
      'FORMAT',
      'ERZEUGER',
      'VERANSTALTUNG',
      'VERANSTALTER',
      'AUSRICHTER',
      'ABSCHNITT',
      'KAMPFGERICHT',
      'WETTKAMPF',
      'WERTUNG',
      'VEREIN',
      'PERSON',
      'PERSONENERGEBNIS',
      'PNZWISCHENZEIT',
      'PNREAKTION',
      'STAFFEL',
      'STAFFELPERSON',
      'STAFFELERGEBNIS',
      'STZWISCHENZEIT',
      'STABLOESE',
      'DATEIENDE',
    ]);
    expect(VEREINSERGEBNISLISTE.elements).toHaveLength(20);
  });

  it('vergibt die vorgesehenen Kardinalitäten', () => {
    const card = (name: string): string => {
      const found = VEREINSERGEBNISLISTE.find(name);
      if (found === undefined) throw new Error(`${name} fehlt`);
      return `${String(found.min)}..${found.max === null ? 'n' : String(found.max)}`;
    };
    for (const name of [
      'FORMAT',
      'ERZEUGER',
      'VERANSTALTUNG',
      'VERANSTALTER',
      'AUSRICHTER',
      'VEREIN',
      'DATEIENDE',
    ]) {
      expect(card(name)).toBe('1..1');
    }
    for (const name of ['ABSCHNITT', 'WETTKAMPF', 'WERTUNG']) {
      expect(card(name)).toBe('1..n');
    }
    for (const name of [
      'KAMPFGERICHT',
      'PERSON',
      'PERSONENERGEBNIS',
      'PNZWISCHENZEIT',
      'PNREAKTION',
      'STAFFEL',
      'STAFFELPERSON',
      'STAFFELERGEBNIS',
      'STZWISCHENZEIT',
      'STABLOESE',
    ]) {
      expect(card(name)).toBe('0..n');
    }
  });

  it('belegt jedes Feld mit einer Fundstelle in der Spezifikation', () => {
    for (const { def } of VEREINSERGEBNISLISTE.elements) {
      for (const f of def.fields) {
        expect(f.specRef).toMatch(/^dsv8\.md:\d+$/);
      }
    }
  });

  it('führt alle Fundstellen im Kapitel der Vereinsergebnisliste', () => {
    for (const { def } of VEREINSERGEBNISLISTE.elements) {
      for (const f of def.fields) {
        const line = Number(f.specRef.split(':')[1]);
        expect(line).toBeGreaterThanOrEqual(2670);
        expect(line).toBeLessThanOrEqual(4240);
      }
    }
  });
});
