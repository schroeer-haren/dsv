import { describe, expect, it } from 'vitest';
import type { ElementDef } from '../../src/schema/types.js';
import {
  ABSCHNITT,
  AUSRICHTER,
  DATEIENDE,
  ERZEUGER,
  FORMAT,
  KAMPFGERICHT,
  PNERGEBNIS,
  PNREAKTION,
  PNZWISCHENZEIT,
  STABLOESE,
  STAFFELPERSON,
  STERGEBNIS,
  STZWISCHENZEIT,
  VERANSTALTER,
  VERANSTALTUNG,
  VEREIN,
  WERTUNG,
  WETTKAMPF,
  WETTKAMPFERGEBNISLISTE,
} from '../../src/schema/wettkampfergebnisliste.js';

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

/** Wettkampfarten der Ergebnisliste — hier gehören A und N regulär dazu. */
const wettkampfartWerte = ['V', 'Z', 'F', 'E', 'A', 'N'];

describe('Wettkampfergebnisliste — Kopf', () => {
  it('benennt FORMAT', () => {
    expect(FORMAT.name).toBe('FORMAT');
    expect(names(FORMAT)).toEqual(['listart', 'version']);
    expect(requiredNames(FORMAT)).toEqual(['listart', 'version']);
    expect(FORMAT.fields[0]?.doc).toContain('Wettkampfergebnisliste');
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
    expect(requiredNames(VERANSTALTUNG)).toEqual([
      'veranstaltungsbezeichnung',
      'veranstaltungsort',
      'bahnlaenge',
      'zeitmessung',
    ]);
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

  it('benennt VERANSTALTER', () => {
    expect(names(VERANSTALTER)).toEqual(['nameDesVeranstalters']);
    expect(requiredNames(VERANSTALTER)).toEqual(['nameDesVeranstalters']);
  });

  it('benennt AUSRICHTER', () => {
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

  it('führt ABSCHNITT mit nur vier Feldern', () => {
    // Anders als in der Wettkampfdefinitionsliste: ohne Einlass und
    // Kampfrichtersitzung.
    expect(names(ABSCHNITT)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'anfangszeit',
      'relativeAngabe',
    ]);
    expect(requiredNames(ABSCHNITT)).toEqual(['abschnittsnr', 'abschnittsdatum', 'anfangszeit']);
    expect(ABSCHNITT.fields.find((f) => f.name === 'relativeAngabe')?.default).toBe('N');
    expect(enumValues(ABSCHNITT, 'relativeAngabe')).toEqual(['J', 'N']);
  });

  it('benennt KAMPFGERICHT', () => {
    expect(names(KAMPFGERICHT)).toEqual([
      'abschnittsnr',
      'position',
      'nameKampfrichter',
      'vereinDesKampfrichters',
    ]);
    expect(requiredNames(KAMPFGERICHT)).toEqual([
      'abschnittsnr',
      'position',
      'nameKampfrichter',
      'vereinDesKampfrichters',
    ]);
  });

  it('zählt die Positionen des KAMPFGERICHTs auf', () => {
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
  });

  it('führt SP regulär und SPR nur geduldet', () => {
    // Die Werteliste der Spezifikation kennt nur SP; das Beispiel der Spec
    // selbst und eine echte Datei schreiben aber SPR. Beide werden gelesen —
    // SP als regulärer Wert, SPR mit Warnung und beim Schreiben unzulässig.
    const werte = KAMPFGERICHT.fields.find((f) => f.name === 'position')?.values ?? [];

    expect(werte.filter((v) => v.tolerated === true).map((v) => v.value)).toEqual(['SPR']);
    expect(werte.find((v) => v.value === 'SP')?.tolerated).toBeUndefined();
  });
});

describe('Wettkampfergebnisliste — Wettkampf, Wertung, Verein', () => {
  it('benennt WETTKAMPF', () => {
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
    expect(WETTKAMPF.fields.find((f) => f.name === 'anzahlStarter')?.default).toBe('1');
  });

  it('kennt im WETTKAMPF die Wettkampfarten A und N ohne Vorbehalt', () => {
    const werte = WETTKAMPF.fields.find((f) => f.name === 'wettkampfart')?.values ?? [];

    expect(werte.map((v) => v.value)).toEqual(wettkampfartWerte);
    expect(werte.filter((v) => v.tolerated === true)).toEqual([]);
  });

  it('lässt die qualifizierende Wettkampfart ohne A und N', () => {
    // Die Spezifikation führt für dieses Feld nur V, Z, F und E auf.
    expect(enumValues(WETTKAMPF, 'qualifikationswettkampfart')).toEqual(['V', 'Z', 'F', 'E']);
  });

  it('zählt Technik, Ausübung, Geschlecht und Bestenliste des WETTKAMPFs auf', () => {
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
    // Reihenfolge nach Kapitel 5.1 (dsv8.md:1097–1107). Kapitel 5.4 ordnet
    // denselben Vorrat als SW, MS, KG, EW, PA, XX (dsv8.md:4804–4813); da
    // beide Listenarten sich eine Werteliste teilen, kann sie nur einer
    // Reihenfolge folgen. Die Reihenfolge trägt keine Bedeutung.
    expect(enumValues(WETTKAMPF, 'zuordnungBestenliste')).toEqual([
      'SW',
      'EW',
      'PA',
      'MS',
      'KG',
      'XX',
    ]);
  });

  it('benennt WERTUNG', () => {
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
    // Reihenfolge nach Kapitel 5.4 (dsv8.md:4940–4944), dem Kapitel dieser
    // Listenart — und damit gleich der von WETTKAMPF oben. Kapitel 5.1 führt
    // dasselbe Feld als M, W, X, D auf; das gilt für die
    // Wettkampfdefinitionsliste.
    expect(enumValues(WERTUNG, 'geschlecht')).toEqual(['M', 'W', 'D', 'X']);
  });

  it('kennt in der WERTUNG die Wettkampfarten A und N ohne Vorbehalt', () => {
    const werte = WERTUNG.fields.find((f) => f.name === 'wettkampfart')?.values ?? [];

    expect(werte.map((v) => v.value)).toEqual(wettkampfartWerte);
    expect(werte.filter((v) => v.tolerated === true)).toEqual([]);
  });

  it('benennt VEREIN', () => {
    expect(names(VEREIN)).toEqual([
      'vereinsbezeichnung',
      'vereinskennzahl',
      'landesschwimmverband',
      'nationenkuerzel',
    ]);
    expect(requiredNames(VEREIN)).toEqual([
      'vereinsbezeichnung',
      'vereinskennzahl',
      'landesschwimmverband',
      'nationenkuerzel',
    ]);
  });

  it('belegt jedes Feld der Kopfelemente mit einer Fundstelle', () => {
    const kopf = [
      FORMAT,
      ERZEUGER,
      VERANSTALTUNG,
      VERANSTALTER,
      AUSRICHTER,
      ABSCHNITT,
      KAMPFGERICHT,
      WETTKAMPF,
      WERTUNG,
      VEREIN,
    ];

    for (const def of kopf) {
      for (const f of def.fields) {
        expect(f.specRef, `${def.name}.${f.name}`).toMatch(/^dsv8\.md:\d+$/);
      }
    }
  });
});

describe('Wettkampfergebnisliste — Ergebniselemente', () => {
  it('benennt PNERGEBNIS', () => {
    expect(names(PNERGEBNIS)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'grundDerNichtwertung',
      'name',
      'dsvId',
      'veranstaltungsId',
      'geschlecht',
      'jahrgang',
      'altersklasse',
      'verein',
      'vereinskennzahl',
      'endzeit',
      'disqualifikationsbemerkung',
      'erhoehtesNachtraeglichesMeldegeld',
      'nationalitaet1',
      'nationalitaet2',
      'nationalitaet3',
    ]);
    expect(requiredNames(PNERGEBNIS)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'name',
      'dsvId',
      'veranstaltungsId',
      'geschlecht',
      'jahrgang',
      'verein',
      'vereinskennzahl',
      'endzeit',
    ]);
    expect(enumValues(PNERGEBNIS, 'grundDerNichtwertung')).toEqual(['DS', 'NA', 'AB', 'AU', 'ZU']);
    expect(enumValues(PNERGEBNIS, 'erhoehtesNachtraeglichesMeldegeld')).toEqual(['E', 'F', 'N']);
  });

  it('kennt bei Personen kein X als Geschlecht', () => {
    // Anders als WETTKAMPF und WERTUNG: X steht für gemischte Wettkämpfe
    // beziehungsweise Wertungen, nie für eine einzelne Person.
    expect(enumValues(PNERGEBNIS, 'geschlecht')).toEqual(['M', 'W', 'D']);
    expect(enumValues(PNERGEBNIS, 'geschlecht')).not.toContain('X');
    expect(enumValues(STAFFELPERSON, 'geschlecht')).toEqual(['M', 'W', 'D']);
    expect(enumValues(WETTKAMPF, 'geschlecht')).toContain('X');
  });

  it('benennt PNZWISCHENZEIT', () => {
    expect(names(PNZWISCHENZEIT)).toEqual([
      'veranstaltungsId',
      'wettkampfnr',
      'wettkampfart',
      'distanz',
      'zwischenzeit',
    ]);
    expect(requiredNames(PNZWISCHENZEIT)).toEqual(names(PNZWISCHENZEIT));
  });

  it('benennt PNREAKTION mit Vorzeichen als Unterlassungswert', () => {
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
    expect(PNREAKTION.fields.find((f) => f.name === 'art')?.default).toBe('+');
    expect(enumValues(PNREAKTION, 'art')).toEqual(['+', '-']);
  });

  it('benennt STERGEBNIS', () => {
    expect(names(STERGEBNIS)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'grundDerNichtwertung',
      'nummerDerMannschaft',
      'veranstaltungsId',
      'verein',
      'vereinskennzahl',
      'endzeit',
      'startnummerDisqualifiziert',
      'disqualifikationsbemerkung',
      'erhoehtesNachtraeglichesMeldegeld',
    ]);
    expect(requiredNames(STERGEBNIS)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsId',
      'platz',
      'nummerDerMannschaft',
      'veranstaltungsId',
      'verein',
      'vereinskennzahl',
      'endzeit',
    ]);
    expect(enumValues(STERGEBNIS, 'grundDerNichtwertung')).toEqual(['DS', 'NA', 'AB', 'AU', 'ZU']);
  });

  it('benennt STAFFELPERSON', () => {
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
  });

  it('benennt STZWISCHENZEIT', () => {
    expect(names(STZWISCHENZEIT)).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'startnummer',
      'distanz',
      'zwischenzeit',
    ]);
    expect(requiredNames(STZWISCHENZEIT)).toEqual(names(STZWISCHENZEIT));
  });

  it('benennt STABLOESE', () => {
    // Kommt in keiner der 75 echten Dateien vor; allein aus der
    // Spezifikation abgeleitet.
    expect(STABLOESE.name).toBe('STABLOESE');
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
    expect(STABLOESE.fields.find((f) => f.name === 'art')?.default).toBe('+');
    expect(enumValues(STABLOESE, 'art')).toEqual(['+', '-']);
  });

  it('führt in allen Ergebniselementen dieselben Wettkampfarten', () => {
    const mitWettkampfart = [
      PNERGEBNIS,
      PNZWISCHENZEIT,
      PNREAKTION,
      STERGEBNIS,
      STAFFELPERSON,
      STZWISCHENZEIT,
      STABLOESE,
    ];

    for (const def of mitWettkampfart) {
      expect(enumValues(def, 'wettkampfart'), def.name).toEqual(wettkampfartWerte);
    }
  });

  it('führt DATEIENDE ohne Attribute', () => {
    expect(DATEIENDE.name).toBe('DATEIENDE');
    expect(DATEIENDE.fields).toEqual([]);
    expect(DATEIENDE.bare).toBe(true);
  });
});

describe('WETTKAMPFERGEBNISLISTE', () => {
  it('kennt die Listart', () => {
    expect(WETTKAMPFERGEBNISLISTE.listenart).toBe('Wettkampfergebnisliste');
  });

  it('führt 18 Elemente in der Reihenfolge der Spezifikation', () => {
    expect(WETTKAMPFERGEBNISLISTE.elements.map((e) => e.def.name)).toEqual([
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
      'PNERGEBNIS',
      'PNZWISCHENZEIT',
      'PNREAKTION',
      'STERGEBNIS',
      'STAFFELPERSON',
      'STZWISCHENZEIT',
      'STABLOESE',
      'DATEIENDE',
    ]);
    expect(WETTKAMPFERGEBNISLISTE.elements).toHaveLength(18);
  });

  it('führt die Kardinalitäten je Element', () => {
    const card = (name: string): string => {
      const found = WETTKAMPFERGEBNISLISTE.find(name);
      if (found === undefined) throw new Error(`Element ${name} fehlt`);
      return `${found.min}..${found.max === null ? 'N' : found.max}`;
    };

    for (const name of [
      'FORMAT',
      'ERZEUGER',
      'VERANSTALTUNG',
      'VERANSTALTER',
      'AUSRICHTER',
      'DATEIENDE',
    ]) {
      expect(card(name), name).toBe('1..1');
    }
    for (const name of ['ABSCHNITT', 'WETTKAMPF', 'WERTUNG', 'VEREIN']) {
      expect(card(name), name).toBe('1..N');
    }
    for (const name of [
      'KAMPFGERICHT',
      'PNERGEBNIS',
      'PNZWISCHENZEIT',
      'PNREAKTION',
      'STERGEBNIS',
      'STAFFELPERSON',
      'STZWISCHENZEIT',
      'STABLOESE',
    ]) {
      expect(card(name), name).toBe('0..N');
    }
  });

  it('belegt jedes Feld jedes Elements mit einer Fundstelle', () => {
    for (const { def } of WETTKAMPFERGEBNISLISTE.elements) {
      for (const f of def.fields) {
        expect(f.specRef, `${def.name}.${f.name}`).toMatch(/^dsv8\.md:\d+$/);
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
describe('Wettkampfergebnisliste — Datentypen', () => {
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
    PNERGEBNIS: {
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      wertungsId: 'Zahl',
      platz: 'Zahl',
      grundDerNichtwertung: 'ZK',
      name: 'ZK',
      dsvId: 'Zahl',
      veranstaltungsId: 'Zahl',
      geschlecht: 'Zeichen',
      jahrgang: 'Zahl',
      altersklasse: 'Zahl',
      verein: 'ZK',
      vereinskennzahl: 'Zahl',
      endzeit: 'Zeit',
      disqualifikationsbemerkung: 'ZK',
      erhoehtesNachtraeglichesMeldegeld: 'Zeichen',
      nationalitaet1: 'ZK',
      nationalitaet2: 'ZK',
      nationalitaet3: 'ZK',
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
    STERGEBNIS: {
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      wertungsId: 'Zahl',
      platz: 'Zahl',
      grundDerNichtwertung: 'ZK',
      nummerDerMannschaft: 'Zahl',
      veranstaltungsId: 'Zahl',
      verein: 'ZK',
      vereinskennzahl: 'Zahl',
      endzeit: 'Zeit',
      startnummerDisqualifiziert: 'Zahl',
      disqualifikationsbemerkung: 'ZK',
      erhoehtesNachtraeglichesMeldegeld: 'Zeichen',
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

    for (const occurrence of WETTKAMPFERGEBNISLISTE.elements) {
      if (occurrence.def.fields.length === 0) continue;
      const fields: Record<string, string> = {};
      for (const f of occurrence.def.fields) fields[f.name] = f.type;
      actual[occurrence.def.name] = fields;
    }

    expect(actual).toEqual(ERWARTETE_TYPEN);
  });
});
