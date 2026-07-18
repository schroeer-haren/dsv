import { describe, expect, it } from 'vitest';
import type { ElementDef } from '../../src/schema/types.js';
import {
  AUSRICHTER,
  AUSSCHREIBUNGIMNETZ,
  ERZEUGER,
  FORMAT,
  MELDEADRESSE,
  MELDESCHLUSS,
  VERANSTALTER,
  VERANSTALTUNG,
  VERANSTALTUNGSORT,
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
