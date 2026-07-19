import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseVereinsergebnisliste } from '../../src/parse/parse-vereinsergebnisliste.js';
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
      'SPR',
    ]);
    expect(enumValues(KAMPFGERICHT, 'position')).toHaveLength(21);

    // `SPR` ist der einzige tolerierte Wert: Die Wertetabelle führt `SP`, das
    // Beispiel desselben Kapitels schreibt `SPR` (dsv8.md:4255). Genauso in
    // der Wettkampfergebnisliste, die dieselbe Beispielzeile führt.
    expect(
      KAMPFGERICHT.fields
        .find((f) => f.name === 'position')
        ?.values?.filter((v) => v.tolerated === true)
        .map((v) => v.value),
    ).toEqual(['SPR']);
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
describe('Vereinsergebnisliste — Datentypen', () => {
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
    VERANSTALTER: {
      nameDesVeranstalters: 'ZK',
    },
    AUSRICHTER: {
      nameDesAusrichters: 'ZK',
      name: 'ZK',
      strasse: 'ZK',
      plz: 'ZK',
      ort: 'ZK',
      land: 'ZK',
      telefon: 'ZK',
      fax: 'ZK',
      email: 'ZK',
    },
    ABSCHNITT: {
      abschnittsnr: 'Zahl',
      abschnittsdatum: 'Datum',
      anfangszeit: 'Uhrzeit',
      relativeAngabe: 'Zeichen',
    },
    KAMPFGERICHT: {
      abschnittsnr: 'Zahl',
      position: 'ZK',
      nameKampfrichter: 'ZK',
      vereinDesKampfrichters: 'ZK',
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
      zuordnungBestenliste: 'ZK',
      qualifikationswettkampfnr: 'Zahl',
      qualifikationswettkampfart: 'Zeichen',
    },
    WERTUNG: {
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      wertungsId: 'Zahl',
      wertungsklasseTyp: 'ZK',
      mindestJgAk: 'JGAK',
      maximalJgAk: 'JGAK',
      geschlecht: 'Zeichen',
      wertungsname: 'ZK',
    },
    VEREIN: {
      vereinsbezeichnung: 'ZK',
      vereinskennzahl: 'Zahl',
      landesschwimmverband: 'Zahl',
      nationenkuerzel: 'ZK',
    },
    PERSON: {
      name: 'ZK',
      dsvId: 'Zahl',
      veranstaltungsId: 'Zahl',
      geschlecht: 'Zeichen',
      jahrgang: 'Zahl',
      altersklasse: 'Zahl',
      nationalitaet1: 'ZK',
      nationalitaet2: 'ZK',
      nationalitaet3: 'ZK',
    },
    PERSONENERGEBNIS: {
      veranstaltungsId: 'Zahl',
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      wertungsId: 'Zahl',
      platz: 'Zahl',
      endzeit: 'Zeit',
      grundDerNichtwertung: 'ZK',
      disqualifikationsbemerkung: 'ZK',
      erhoehtesNachtraeglichesMeldegeld: 'Zeichen',
    },
    PNZWISCHENZEIT: {
      veranstaltungsId: 'Zahl',
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      distanz: 'Zahl',
      zwischenzeit: 'Zeit',
    },
    PNREAKTION: {
      veranstaltungsId: 'Zahl',
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      art: 'Zeichen',
      reaktionszeit: 'Zeit',
    },
    STAFFEL: {
      nummerDerMannschaft: 'Zahl',
      veranstaltungsIdStaffel: 'Zahl',
      wertungsklasseTyp: 'ZK',
      mindestJgAk: 'JGAK',
      maximalJgAk: 'JGAK',
    },
    STAFFELPERSON: {
      veranstaltungsIdStaffel: 'Zahl',
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      name: 'ZK',
      dsvId: 'Zahl',
      startnummer: 'Zahl',
      geschlecht: 'Zeichen',
      jahrgang: 'Zahl',
      altersklasse: 'Zahl',
      nationalitaet1: 'ZK',
      nationalitaet2: 'ZK',
      nationalitaet3: 'ZK',
    },
    STAFFELERGEBNIS: {
      veranstaltungsIdStaffel: 'Zahl',
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      wertungsId: 'Zahl',
      platz: 'Zahl',
      endzeit: 'Zeit',
      grundDerNichtwertung: 'ZK',
      startnummerDisqualifiziert: 'Zahl',
      disqualifikationsbemerkung: 'ZK',
      erhoehtesNachtraeglichesMeldegeld: 'Zeichen',
    },
    STZWISCHENZEIT: {
      veranstaltungsIdStaffel: 'Zahl',
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      startnummer: 'Zahl',
      distanz: 'Zahl',
      zwischenzeit: 'Zeit',
    },
    STABLOESE: {
      veranstaltungsIdStaffel: 'Zahl',
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      startnummer: 'Zahl',
      art: 'Zeichen',
      reaktionszeit: 'Zeit',
    },
  };

  it('deklariert für jedes Feld den erwarteten Datentyp', () => {
    const actual: Record<string, Record<string, string>> = {};

    for (const occurrence of VEREINSERGEBNISLISTE.elements) {
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
describe('Vereinsergebnisliste — Typprüfung greift beim Lesen', () => {
  const FIXTURE = readFileSync('test/fixtures/synth/vereinsergebnis.dsv8', 'utf8');

  /** Ersetzt im Fixture den ersten Treffer und liest die Datei erneut. */
  function mitFehler(suchen: string, ersetzen: string) {
    expect(FIXTURE).toContain(suchen);
    return parseVereinsergebnisliste(FIXTURE.replace(suchen, ersetzen));
  }

  it('liest das unveränderte Fixture ohne Befund', () => {
    expect(parseVereinsergebnisliste(FIXTURE).diagnostics).toEqual([]);
  });

  it('meldet eine fehlerhafte Angabe in PERSONENERGEBNIS.endzeit', () => {
    const result = mitFehler('00:01:02,11', '99:99:99,99');
    const befunde = result.diagnostics.filter((d) => d.code === 'invalid-value');

    expect(befunde.length).toBeGreaterThan(0);
    expect(befunde[0]?.severity).toBe('error');
    expect(befunde[0]?.data).toMatchObject({ field: 'endzeit', value: '99:99:99,99' });
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
 * Hält die DSV8-Markierungen fest — vollständig, wie es der Gegentest der
 * Vereinsmeldeliste für ihre Felder tut.
 *
 * DSV7 kennt weder die Kicks `KB`/`KR` noch das Geschlecht `D`. Ohne diesen
 * Test bliebe unbelegt, dass die Vereinsergebnisliste beides erst ab DSV8
 * zulässt — und ein fehlendes `since: 8` fiele nicht auf, weil die
 * synthetischen Fixtures dieser Listenart durchweg DSV8 sind.
 */
describe('Vereinsergebnisliste — DSV8-Markierungen', () => {
  /** Die erst ab DSV8 erlaubten Werte eines Feldes. */
  function seit8(def: ElementDef, fieldName: string): readonly string[] {
    const found = def.fields.find((f) => f.name === fieldName);
    if (found === undefined) throw new Error(`Feld ${fieldName} fehlt in ${def.name}`);
    return (found.values ?? []).filter((v) => v.since === 8).map((v) => v.value);
  }

  it('lässt die Kicks erst ab DSV8 zu', () => {
    expect(seit8(WETTKAMPF, 'ausuebung')).toEqual(['KB', 'KR']);
  });

  /**
   * Nur an WETTKAMPF und WERTUNG kommt divers mit DSV8 hinzu (dsv8.md:3143
   * bzw. dsv8.md:3285). An PERSON und STAFFELPERSON steht `D` schon in DSV7
   * (dsv7.md:3260 bzw. dsv7.md:3731) — dort wäre eine Markierung falsch und
   * würde eine gültige DSV7-Datei zurückweisen.
   */
  it('lässt divers an WETTKAMPF und WERTUNG erst ab DSV8 zu', () => {
    expect(seit8(WETTKAMPF, 'geschlecht')).toEqual(['D']);
    expect(seit8(WERTUNG, 'geschlecht')).toEqual(['D']);
  });

  it('lässt divers an PERSON und STAFFELPERSON schon in DSV7 zu', () => {
    expect(seit8(PERSON, 'geschlecht')).toEqual([]);
    expect(seit8(STAFFELPERSON, 'geschlecht')).toEqual([]);
  });

  /**
   * Die Vereinsergebnisliste ist rein additiv gegenüber DSV7: kein Element und
   * kein Feld kommt hinzu, nur Werte. Diese Erwartung steht ausgeschrieben da,
   * damit ein versehentlich gesetztes `since` auffällt.
   */
  it('führt weder ein Element noch ein Feld erst ab DSV8 ein', () => {
    const elementeSeit8: string[] = [];
    const felderSeit8: string[] = [];
    const werteSeit8: string[] = [];

    for (const occurrence of VEREINSERGEBNISLISTE.elements) {
      if (occurrence.def.since === 8) elementeSeit8.push(occurrence.def.name);
      for (const f of occurrence.def.fields) {
        if (f.since === 8) felderSeit8.push(`${occurrence.def.name}.${f.name}`);
        for (const v of f.values ?? []) {
          if (v.since === 8) werteSeit8.push(`${occurrence.def.name}.${f.name}=${v.value}`);
        }
      }
    }

    expect(elementeSeit8).toEqual([]);
    expect(felderSeit8).toEqual([]);
    expect(werteSeit8).toEqual([
      'WETTKAMPF.ausuebung=KB',
      'WETTKAMPF.ausuebung=KR',
      'WETTKAMPF.geschlecht=D',
      'WERTUNG.geschlecht=D',
    ]);
  });
});
