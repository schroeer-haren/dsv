import { describe, expect, it } from 'vitest';
import type { ElementDef } from '../../src/schema/types.js';
import {
  ABSCHNITT,
  AUSRICHTER,
  AUSSCHREIBUNGIMNETZ,
  BANKVERBINDUNG,
  BESONDERES,
  DATEIENDE,
  ERZEUGER,
  FORMAT,
  LASTSCHRIFT,
  MELDEADRESSE,
  MELDEGELD,
  MELDESCHLUSS,
  NACHWEIS,
  PFLICHTZEIT,
  VERANSTALTER,
  VERANSTALTUNG,
  VERANSTALTUNGSORT,
  WERTUNG,
  WETTKAMPF,
  WETTKAMPFDEFINITIONSLISTE,
} from '../../src/schema/wettkampfdefinitionsliste.js';

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

const kopfElemente = [
  FORMAT,
  ERZEUGER,
  VERANSTALTUNG,
  VERANSTALTUNGSORT,
  AUSSCHREIBUNGIMNETZ,
  VERANSTALTER,
  AUSRICHTER,
  MELDEADRESSE,
  MELDESCHLUSS,
];

describe('Wettkampfdefinitionsliste — Kopf und Adressen', () => {
  it('benennt FORMAT', () => {
    expect(FORMAT.name).toBe('FORMAT');
    expect(names(FORMAT)).toEqual(['listart', 'version']);
    expect(requiredNames(FORMAT)).toEqual(['listart', 'version']);
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
  });

  it('zählt die Bahnlängen der VERANSTALTUNG auf', () => {
    expect(enumValues(VERANSTALTUNG, 'bahnlaenge')).toEqual([
      '16',
      '20',
      '25',
      '33',
      '50',
      'FW',
      'X',
    ]);
  });

  it('zählt die Arten der Zeitmessung auf', () => {
    expect(enumValues(VERANSTALTUNG, 'zeitmessung')).toEqual([
      'HANDZEIT',
      'AUTOMATISCH',
      'HALBAUTOMATISCH',
    ]);
  });

  it('benennt VERANSTALTUNGSORT und macht Ort und Land zur Pflicht', () => {
    expect(names(VERANSTALTUNGSORT)).toEqual([
      'nameSchwimmhalle',
      'strasse',
      'plz',
      'ort',
      'land',
      'telefon',
      'fax',
      'email',
    ]);
    expect(requiredNames(VERANSTALTUNGSORT)).toEqual(['nameSchwimmhalle', 'ort', 'land']);
  });

  it('benennt AUSSCHREIBUNGIMNETZ', () => {
    expect(names(AUSSCHREIBUNGIMNETZ)).toEqual(['internetadresse']);
    expect(requiredNames(AUSSCHREIBUNGIMNETZ)).toEqual([]);
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

  it('benennt MELDEADRESSE und lässt Ort und Land offen', () => {
    expect(names(MELDEADRESSE)).toEqual([
      'name',
      'strasse',
      'plz',
      'ort',
      'land',
      'telefon',
      'fax',
      'email',
    ]);
    expect(requiredNames(MELDEADRESSE)).toEqual(['name', 'email']);
  });

  it('benennt MELDESCHLUSS', () => {
    expect(names(MELDESCHLUSS)).toEqual(['datum', 'uhrzeit']);
    expect(requiredNames(MELDESCHLUSS)).toEqual(['datum', 'uhrzeit']);
  });

  it('belegt jedes Feld mit einer Fundstelle', () => {
    for (const def of kopfElemente) {
      for (const f of def.fields) {
        expect(f.specRef, `${def.name}.${f.name}`).toMatch(/^dsv8\.md:\d+$/);
      }
    }
  });
});

/** Werte einer Werteliste samt Versionsmarkierung. */
function enumEntries(def: ElementDef, fieldName: string): readonly [string, 8 | undefined][] {
  const found = def.fields.find((f) => f.name === fieldName);
  if (found === undefined) throw new Error(`Feld ${fieldName} fehlt in ${def.name}`);
  return (found.values ?? []).map((v) => [v.value, v.since]);
}

/** Von der Spezifikation für diese Listenart vorgesehen. */
const wettkampfartWerte = ['V', 'Z', 'F', 'E'];
/** Im Format bekannt, aber laut Spec nur in den Ergebnislisten. */
const wettkampfartToleriert = ['A', 'N'];

describe('Wettkampfdefinitionsliste — Wettkämpfe und Meldegeld', () => {
  it('benennt BANKVERBINDUNG und führt den Kontoinhaber erst ab DSV8', () => {
    expect(names(BANKVERBINDUNG)).toEqual(['nameDerBank', 'iban', 'bic', 'kontoinhaber']);
    expect(requiredNames(BANKVERBINDUNG)).toEqual(['iban', 'kontoinhaber']);
    expect(BANKVERBINDUNG.fields.find((f) => f.name === 'kontoinhaber')?.since).toBe(8);
    expect(BANKVERBINDUNG.fields.find((f) => f.name === 'iban')?.since).toBeUndefined();
  });

  it('benennt LASTSCHRIFT mit Unterlassungswert N', () => {
    expect(names(LASTSCHRIFT)).toEqual(['hinweis']);
    expect(requiredNames(LASTSCHRIFT)).toEqual([]);
    expect(LASTSCHRIFT.fields[0]?.default).toBe('N');
    expect(enumValues(LASTSCHRIFT, 'hinweis')).toEqual(['J', 'N']);
  });

  it('benennt BESONDERES', () => {
    expect(names(BESONDERES)).toEqual(['anmerkungen']);
    expect(requiredNames(BESONDERES)).toEqual(['anmerkungen']);
  });

  it('benennt NACHWEIS', () => {
    expect(names(NACHWEIS)).toEqual(['nachweisVon', 'nachweisBis', 'bahnlaenge']);
    expect(requiredNames(NACHWEIS)).toEqual(['nachweisVon', 'bahnlaenge']);
    expect(enumValues(NACHWEIS, 'bahnlaenge')).toEqual(['25', '50', 'FW', 'AL']);
  });

  it('benennt ABSCHNITT', () => {
    expect(names(ABSCHNITT)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'einlass',
      'kampfrichtersitzung',
      'anfangszeit',
      'relativeAngabe',
    ]);
    expect(requiredNames(ABSCHNITT)).toEqual(['abschnittsnr', 'abschnittsdatum', 'anfangszeit']);
    expect(ABSCHNITT.fields.find((f) => f.name === 'relativeAngabe')?.default).toBe('N');
    expect(enumValues(ABSCHNITT, 'relativeAngabe')).toEqual(['J', 'N']);
  });

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

  it('begrenzt die qualifizierende Wettkampfnummer wie die Wettkampfnummer selbst', () => {
    // Die Wettkampfnummer ist laut dsv8.md:993 maximal dreistellig — unabhängig
    // davon, ob sie den Wettkampf selbst oder den qualifizierenden nennt.
    expect(WETTKAMPF.fields.find((f) => f.name === 'qualifikationswettkampfnr')?.range).toEqual({
      min: 0,
      max: 999,
    });
  });

  it('zählt die Ausübungen des WETTKAMPFs samt Versionsmarkierung auf', () => {
    expect(enumEntries(WETTKAMPF, 'ausuebung')).toEqual([
      ['GL', undefined],
      ['BE', undefined],
      ['AR', undefined],
      ['ST', undefined],
      ['WE', undefined],
      ['GB', undefined],
      ['KB', 8],
      ['KR', 8],
      ['X', undefined],
    ]);
  });

  it('zählt die Geschlechter des WETTKAMPFs samt Versionsmarkierung auf', () => {
    expect(enumEntries(WETTKAMPF, 'geschlecht')).toEqual([
      ['M', undefined],
      ['W', undefined],
      ['D', 8],
      ['X', undefined],
    ]);
  });

  it('zählt Technik und Zuordnung zur Bestenliste auf', () => {
    expect(enumValues(WETTKAMPF, 'technik')).toEqual(['F', 'R', 'B', 'S', 'L', 'X']);
    expect(enumValues(WETTKAMPF, 'zuordnungBestenliste')).toEqual([
      'SW',
      'EW',
      'PA',
      'MS',
      'KG',
      'XX',
    ]);
    expect(enumValues(WETTKAMPF, 'wettkampfart')).toEqual([
      ...wettkampfartWerte,
      ...wettkampfartToleriert,
    ]);
    // Ohne die tolerierten Arten: Aus einem Aus- oder Nachschwimmen
    // qualifiziert man sich nicht weiter (dsv8.md:1119). Der Abgleich über
    // alle vier Listenarten steht in `listenart-konsistenz.test.ts`.
    expect(enumValues(WETTKAMPF, 'qualifikationswettkampfart')).toEqual([...wettkampfartWerte]);
  });

  it('trennt spezifikationskonforme von tolerierten Wettkampfarten', () => {
    // A und N sieht die Spec nur in den Ergebnislisten vor; eine echte
    // Ausschreibung schreibt N trotzdem. Sie sind deshalb enthalten,
    // aber als toleriert markiert — beim Lesen Warnung, beim Schreiben
    // unzulässig.
    const werte = WETTKAMPF.fields.find((f) => f.name === 'wettkampfart')?.values ?? [];

    expect(werte.filter((v) => v.tolerated !== true).map((v) => v.value)).toEqual(
      wettkampfartWerte,
    );
    expect(werte.filter((v) => v.tolerated === true).map((v) => v.value)).toEqual(
      wettkampfartToleriert,
    );
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
  });

  it.each([
    ['WERTUNG', WERTUNG],
    ['PFLICHTZEIT', PFLICHTZEIT],
  ])('modelliert %s.maximalJgAk ohne statischen Unterlassungswert', (_name, def) => {
    // Der Unterlassungswert ist der Wert von mindestJgAk, also kontextabhängig.
    // Ein statischer Default wäre falsch — der Verweis steht nur im Doc-Text.
    const maximal = def.fields.find((f) => f.name === 'maximalJgAk');
    expect(maximal?.default).toBeUndefined();
    expect(maximal?.doc).toContain('mindestJgAk');
  });

  it('benennt PFLICHTZEIT', () => {
    expect(names(PFLICHTZEIT)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsklasseTyp',
      'mindestJgAk',
      'maximalJgAk',
      'pflichtzeit',
      'geschlecht',
    ]);
    expect(requiredNames(PFLICHTZEIT)).toEqual([
      'wettkampfnr',
      'wettkampfart',
      'wertungsklasseTyp',
      'mindestJgAk',
      'pflichtzeit',
    ]);
  });

  it('benennt MELDEGELD und prüft den Typ ohne Rücksicht auf Grossschreibung', () => {
    expect(names(MELDEGELD)).toEqual(['meldegeldTyp', 'betrag', 'wettkampfnr']);
    expect(requiredNames(MELDEGELD)).toEqual(['meldegeldTyp', 'betrag']);
    expect(MELDEGELD.fields[0]?.caseInsensitive).toBe(true);
    expect(enumEntries(MELDEGELD, 'meldegeldTyp')).toEqual([
      ['Meldegeldpauschale', undefined],
      ['Einzelmeldegeld', undefined],
      ['Staffelmeldegeld', undefined],
      ['Wkmeldegeld', undefined],
      ['Mannschaftmeldegeld', undefined],
      ['Teilnehmermeldegeld', 8],
      ['Abschnittspauschale', 8],
    ]);
  });

  it('führt DATEIENDE ohne Attribute', () => {
    expect(DATEIENDE.name).toBe('DATEIENDE');
    expect(DATEIENDE.fields).toEqual([]);
    expect(DATEIENDE.bare).toBe(true);
  });
});

describe('Wettkampfdefinitionsliste — unterschiedliche Wertelisten', () => {
  it('hält die drei Geschlechts-Wertelisten auseinander', () => {
    // WETTKAMPF kennt divers und gemischt, WERTUNG kennt beides ohne
    // Versionsmarkierung, PFLICHTZEIT kennt bewusst kein X.
    expect(enumValues(WETTKAMPF, 'geschlecht')).toEqual(['M', 'W', 'D', 'X']);
    expect(enumValues(WERTUNG, 'geschlecht')).toEqual(['M', 'W', 'X', 'D']);
    expect(enumValues(PFLICHTZEIT, 'geschlecht')).toEqual(['M', 'W', 'D']);

    expect(enumValues(PFLICHTZEIT, 'geschlecht')).not.toContain('X');
    expect(enumValues(WETTKAMPF, 'geschlecht')).not.toEqual(enumValues(WERTUNG, 'geschlecht'));
    expect(enumValues(WERTUNG, 'geschlecht')).not.toEqual(enumValues(PFLICHTZEIT, 'geschlecht'));
  });

  it('hält die beiden Bahnlängen-Wertelisten auseinander', () => {
    expect(enumValues(VERANSTALTUNG, 'bahnlaenge')).not.toEqual(enumValues(NACHWEIS, 'bahnlaenge'));
    expect(enumValues(NACHWEIS, 'bahnlaenge')).toContain('AL');
    expect(enumValues(VERANSTALTUNG, 'bahnlaenge')).not.toContain('AL');
  });
});

describe('WETTKAMPFDEFINITIONSLISTE', () => {
  it('kennt die Listart', () => {
    expect(WETTKAMPFDEFINITIONSLISTE.listenart).toBe('Wettkampfdefinitionsliste');
  });

  it('führt 19 Elemente in der Reihenfolge der Spezifikation', () => {
    expect(WETTKAMPFDEFINITIONSLISTE.elements.map((e) => e.def.name)).toEqual([
      'FORMAT',
      'ERZEUGER',
      'VERANSTALTUNG',
      'VERANSTALTUNGSORT',
      'AUSSCHREIBUNGIMNETZ',
      'VERANSTALTER',
      'AUSRICHTER',
      'MELDEADRESSE',
      'MELDESCHLUSS',
      'BANKVERBINDUNG',
      'LASTSCHRIFT',
      'BESONDERES',
      'NACHWEIS',
      'ABSCHNITT',
      'WETTKAMPF',
      'WERTUNG',
      'PFLICHTZEIT',
      'MELDEGELD',
      'DATEIENDE',
    ]);
    expect(WETTKAMPFDEFINITIONSLISTE.elements).toHaveLength(19);
  });

  it('führt die Kardinalitäten je Element', () => {
    const card = (name: string): string => {
      const found = WETTKAMPFDEFINITIONSLISTE.find(name);
      if (found === undefined) throw new Error(`Element ${name} fehlt`);
      return `${found.min}..${found.max === null ? 'N' : found.max}`;
    };

    expect(card('FORMAT')).toBe('1..1');
    expect(card('ERZEUGER')).toBe('1..1');
    expect(card('VERANSTALTUNG')).toBe('1..1');
    expect(card('VERANSTALTUNGSORT')).toBe('1..1');
    expect(card('AUSSCHREIBUNGIMNETZ')).toBe('1..1');
    expect(card('VERANSTALTER')).toBe('1..1');
    expect(card('AUSRICHTER')).toBe('1..1');
    expect(card('MELDEADRESSE')).toBe('1..1');
    expect(card('MELDESCHLUSS')).toBe('1..1');
    expect(card('BANKVERBINDUNG')).toBe('0..1');
    expect(card('LASTSCHRIFT')).toBe('0..1');
    expect(card('BESONDERES')).toBe('0..1');
    expect(card('NACHWEIS')).toBe('0..1');
    expect(card('ABSCHNITT')).toBe('1..N');
    expect(card('WETTKAMPF')).toBe('1..N');
    expect(card('WERTUNG')).toBe('1..N');
    expect(card('PFLICHTZEIT')).toBe('0..N');
    expect(card('MELDEGELD')).toBe('1..N');
    expect(card('DATEIENDE')).toBe('1..1');
  });

  it('belegt jedes Feld jedes Elements mit einer Fundstelle', () => {
    for (const { def } of WETTKAMPFDEFINITIONSLISTE.elements) {
      for (const f of def.fields) {
        expect(f.specRef, `${def.name}.${f.name}`).toMatch(/^dsv8\.md:\d+$/);
      }
    }
  });
});

describe('Versionsmarkierung am Element', () => {
  it('markiert LASTSCHRIFT als DSV8-Neuheit', () => {
    // Das ganze Element gibt es erst ab DSV8; ohne Markierung am Element
    // könnte die Validierung es in einer DSV7-Datei nicht beanstanden.
    expect(LASTSCHRIFT.since).toBe(8);
  });

  it('lässt Elemente beider Formatversionen unmarkiert', () => {
    expect(BANKVERBINDUNG.since).toBeUndefined();
    expect(ABSCHNITT.since).toBeUndefined();
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
describe('Wettkampfdefinitionsliste — Datentypen', () => {
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
    VERANSTALTUNGSORT: {
      nameSchwimmhalle: 'ZK',
      strasse: 'ZK',
      plz: 'ZK',
      ort: 'ZK',
      land: 'ZK',
      telefon: 'ZK',
      fax: 'ZK',
      email: 'ZK',
    },
    AUSSCHREIBUNGIMNETZ: {
      internetadresse: 'ZK',
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
    MELDEADRESSE: {
      name: 'ZK',
      strasse: 'ZK',
      plz: 'ZK',
      ort: 'ZK',
      land: 'ZK',
      telefon: 'ZK',
      fax: 'ZK',
      email: 'ZK',
    },
    MELDESCHLUSS: {
      datum: 'Datum',
      uhrzeit: 'Uhrzeit',
    },
    BANKVERBINDUNG: {
      nameDerBank: 'ZK',
      iban: 'ZK',
      bic: 'ZK',
      kontoinhaber: 'ZK',
    },
    LASTSCHRIFT: {
      hinweis: 'Zeichen',
    },
    BESONDERES: {
      anmerkungen: 'ZK',
    },
    NACHWEIS: {
      nachweisVon: 'Datum',
      nachweisBis: 'Datum',
      bahnlaenge: 'ZK',
    },
    ABSCHNITT: {
      abschnittsnr: 'Zahl',
      abschnittsdatum: 'Datum',
      einlass: 'Uhrzeit',
      kampfrichtersitzung: 'Uhrzeit',
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
    PFLICHTZEIT: {
      wettkampfnr: 'Zahl',
      wettkampfart: 'Zeichen',
      wertungsklasseTyp: 'ZK',
      mindestJgAk: 'JGAK',
      maximalJgAk: 'JGAK',
      pflichtzeit: 'Zeit',
      geschlecht: 'Zeichen',
    },
    MELDEGELD: {
      meldegeldTyp: 'ZK',
      betrag: 'Betrag',
      wettkampfnr: 'Zahl',
    },
  };

  it('deklariert für jedes Feld den erwarteten Datentyp', () => {
    const actual: Record<string, Record<string, string>> = {};

    for (const occurrence of WETTKAMPFDEFINITIONSLISTE.elements) {
      if (occurrence.def.fields.length === 0) continue;
      const fields: Record<string, string> = {};
      for (const f of occurrence.def.fields) fields[f.name] = f.type;
      actual[occurrence.def.name] = fields;
    }

    expect(actual).toEqual(ERWARTETE_TYPEN);
  });
});
