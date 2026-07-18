import { describe, expect, it } from 'vitest';
import type { ElementDef } from '../../src/schema/types.js';
import {
  ABSCHNITT,
  AUSRICHTER,
  ERZEUGER,
  FORMAT,
  KAMPFGERICHT,
  VERANSTALTER,
  VERANSTALTUNG,
  VEREIN,
  WERTUNG,
  WETTKAMPF,
} from '../../src/schema/wettkampfergebnisliste.js';

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

  it('toleriert SPR, aber nicht SP', () => {
    // Die Werteliste der Spezifikation kennt nur SP; das Beispiel der Spec
    // selbst und eine echte Datei schreiben aber SPR.
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
    expect(enumValues(WERTUNG, 'geschlecht')).toEqual(['M', 'W', 'X', 'D']);
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
