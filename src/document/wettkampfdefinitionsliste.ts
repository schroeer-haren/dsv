import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type {
  TypedRecord,
  Wettkampfdefinitionsliste,
} from '../parse/parse-wettkampfdefinitionsliste.js';
import type { Datum } from '../values/datum.js';
import { decodeDatum } from '../values/datum.js';
import { decodeUhrzeit } from '../values/uhrzeit.js';
import { decodeZeit } from '../values/zeit.js';

/**
 * Objektgraph einer Wettkampfdefinitionsliste.
 *
 * Die Projektion setzt auf den flachen Records auf und löst deren Bezüge auf:
 * Wettkämpfe hängen an ihrem Abschnitt, Wertungen und Pflichtzeiten an ihrem
 * Wettkampf. Bewusste Festlegungen:
 *
 * - Nur einfache Objekte, keine Klassen. Beim Dual-Publish für ESM und CJS gibt
 *   es zwei Modulinstanzen; `instanceof` schlüge über diese Grenze fehl, und
 *   Prototyp-Methoden liessen sich nicht wegoptimieren.
 * - Alle Bezüge werden sofort aufgelöst, nicht über Getter. Lazy Auflösung
 *   verschöbe Fehler auf einen unvorhersehbaren Zeitpunkt und zeigte in der
 *   Konsole Getter statt Werte.
 * - Keine Rückverweise. Ein Zeiger vom Wettkampf auf seinen Abschnitt erzeugte
 *   einen Zyklus, an dem `JSON.stringify` wirft. Stattdessen stehen Index-Maps
 *   auf der obersten Ebene.
 * - Werte bleiben Zeichenketten, ausser Datum, Uhrzeit und Zeit. Die Rohwerte
 *   sind für den Round-Trip nötig; die drei Zeittypen sind ohne Dekodierung
 *   aber praktisch unbrauchbar.
 */
export interface Veranstaltung {
  readonly bezeichnung: string;
  readonly ort: string;
  readonly bahnlaenge: string;
  readonly zeitmessung: string;
}

/** Ein Veranstaltungsabschnitt samt der Wettkämpfe, die in ihm stattfinden. */
export interface Abschnitt {
  readonly nummer: number;
  readonly datum: Datum | null;
  /** Minuten seit Mitternacht, `null` ohne oder bei ungültiger Angabe. */
  readonly einlass: number | null;
  /** Minuten seit Mitternacht, `null` ohne oder bei ungültiger Angabe. */
  readonly kampfrichtersitzung: number | null;
  /** Minuten seit Mitternacht, `null` ohne oder bei ungültiger Angabe. */
  readonly anfangszeit: number | null;
  /** `J`, wenn die Zeiten relativ zum Ende des Vorabschnitts gelten. */
  readonly relativeAngabe: string;
  readonly wettkaempfe: readonly Wettkampf[];
  /** Zeilennummer des zugrunde liegenden ABSCHNITT-Records, 1-basiert. */
  readonly line: number;
}

/** Eine Wertungsgruppe innerhalb eines Wettkampfes. */
export interface Wertung {
  /** Veranstaltungsweit eindeutige Kennung aus `wertungsId`. */
  readonly id: number;
  readonly wertungsklasseTyp: string;
  readonly mindestJgAk: string;
  readonly maximalJgAk: string;
  readonly geschlecht: string;
  readonly name: string;
  readonly line: number;
}

/** Eine Pflichtzeit eines Wettkampfes. */
export interface Pflichtzeit {
  readonly wertungsklasseTyp: string;
  readonly mindestJgAk: string;
  readonly maximalJgAk: string;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly zeit: number | null;
  readonly geschlecht: string;
  readonly line: number;
}

/**
 * Ein einzelner Wettkampf.
 *
 * Ein Wettkampf ist über das Paar aus `nummer` und `art` identifiziert, nicht
 * über die Nummer allein: Dieselbe Nummer kommt regelmässig als Vorlauf und als
 * Entscheidung vor.
 */
export interface Wettkampf {
  readonly nummer: number;
  readonly art: string;
  readonly abschnittsnr: number;
  readonly anzahlStarter: string;
  readonly einzelstrecke: number;
  readonly technik: string;
  readonly ausuebung: string;
  readonly geschlecht: string;
  readonly zuordnungBestenliste: string;
  readonly wertungen: readonly Wertung[];
  readonly pflichtzeiten: readonly Pflichtzeit[];
  /** Auflösung von qualifikationswettkampfnr/-art, `null` wenn nicht gesetzt. */
  readonly qualifikationAus: { readonly nummer: number; readonly art: string } | null;
  readonly line: number;
}

export interface Wettkampfdefinition {
  readonly veranstaltung: Veranstaltung;
  readonly abschnitte: readonly Abschnitt[];
  /** Wettkämpfe, deren `abschnittsnr` auf keinen Abschnitt zeigt. */
  readonly wettkaempfeOhneAbschnitt: readonly Wettkampf[];
  /** Schlüssel ist `${nummer}:${art}`. */
  readonly wettkampfByKey: ReadonlyMap<string, Wettkampf>;
  readonly wertungById: ReadonlyMap<number, Wertung>;
  readonly abschnittByNummer: ReadonlyMap<number, Abschnitt>;
}

export interface ProjectionResult {
  readonly graph: Wettkampfdefinition;
  readonly diagnostics: readonly Diagnostic[];
}

const EMPTY_VERANSTALTUNG: Veranstaltung = {
  bezeichnung: '',
  ort: '',
  bahnlaenge: '',
  zeitmessung: '',
};

/** Feldwert eines Records; fehlende Felder ergeben die leere Zeichenkette. */
function value(record: TypedRecord, name: string): string {
  return record.values[name] ?? '';
}

/**
 * Liest ein Zahlenfeld. Nicht lesbare Angaben ergeben `NaN` statt eines
 * geratenen Wertes — `Number('')` wäre `0` und damit eine echte Nummer.
 */
function number(record: TypedRecord, name: string): number {
  const raw = value(record, name).trim();
  if (raw === '' || !/^[+-]?\d+$/.test(raw)) return Number.NaN;
  return Number(raw);
}

/** Schlüssel eines Wettkampfes aus Nummer und Art. */
function key(nummer: number, art: string): string {
  return `${nummer}:${art}`;
}

/** Ein Diagnostic auf der Zeile eines Records; Spalten kennt diese Ebene nicht. */
function at(line: number): {
  start: { line: number; column: number };
  end: { line: number; column: number };
} {
  return { start: { line, column: 1 }, end: { line, column: 1 } };
}

/** Zwischenstand eines Wettkampfes, dessen Kinderlisten noch wachsen. */
interface WettkampfBuilder {
  readonly wertungen: Wertung[];
  readonly pflichtzeiten: Pflichtzeit[];
  readonly wettkampf: Wettkampf;
}

/**
 * Baut aus einer gelesenen Wettkampfdefinitionsliste einen Objektgraph mit
 * aufgelösten Bezügen.
 *
 * Die Projektion bricht nie ab: Zeigt ein Bezug ins Leere oder ist ein
 * Schlüssel doppelt vergeben, entsteht eine Warnung, und der Graph wird — bei
 * doppelten Schlüsseln gewinnt der erste — so vollständig wie möglich
 * aufgebaut. Ein Wettkampf ohne auffindbaren Abschnitt geht nicht verloren,
 * sondern landet in `wettkaempfeOhneAbschnitt`.
 */
export function projectWettkampfdefinitionsliste(
  liste: Wettkampfdefinitionsliste,
): ProjectionResult {
  const diagnostics: Diagnostic[] = [];

  const veranstaltung = projectVeranstaltung(liste.records);

  const abschnitte: Abschnitt[] = [];
  const abschnittWettkaempfe = new Map<Abschnitt, Wettkampf[]>();
  const abschnittByNummer = new Map<number, Abschnitt>();

  for (const record of liste.records) {
    if (record.element !== 'ABSCHNITT') continue;

    const wettkaempfe: Wettkampf[] = [];
    const nummer = number(record, 'abschnittsnr');
    const abschnitt: Abschnitt = {
      nummer,
      datum: decodeDatum(value(record, 'abschnittsdatum')),
      einlass: decodeUhrzeit(value(record, 'einlass')),
      kampfrichtersitzung: decodeUhrzeit(value(record, 'kampfrichtersitzung')),
      anfangszeit: decodeUhrzeit(value(record, 'anfangszeit')),
      relativeAngabe: value(record, 'relativeAngabe'),
      wettkaempfe,
      line: record.line,
    };

    abschnitte.push(abschnitt);
    abschnittWettkaempfe.set(abschnitt, wettkaempfe);

    if (abschnittByNummer.has(nummer)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate ABSCHNITT number ${nummer}; the first one wins`,
          { ...at(record.line), data: { element: 'ABSCHNITT', abschnittsnr: nummer } },
        ),
      );
    } else if (Number.isFinite(nummer)) {
      abschnittByNummer.set(nummer, abschnitt);
    }
  }

  const builders = new Map<string, WettkampfBuilder>();
  const wettkaempfeOhneAbschnitt: Wettkampf[] = [];

  for (const record of liste.records) {
    if (record.element !== 'WETTKAMPF') continue;

    const nummer = number(record, 'wettkampfnr');
    const art = value(record, 'wettkampfart');
    const abschnittsnr = number(record, 'abschnittsnr');

    const qualNummer = number(record, 'qualifikationswettkampfnr');
    const qualArt = value(record, 'qualifikationswettkampfart');
    const qualifikationAus =
      Number.isFinite(qualNummer) || qualArt !== '' ? { nummer: qualNummer, art: qualArt } : null;

    const wertungen: Wertung[] = [];
    const pflichtzeiten: Pflichtzeit[] = [];
    const wettkampf: Wettkampf = {
      nummer,
      art,
      abschnittsnr,
      anzahlStarter: value(record, 'anzahlStarter'),
      einzelstrecke: number(record, 'einzelstrecke'),
      technik: value(record, 'technik'),
      ausuebung: value(record, 'ausuebung'),
      geschlecht: value(record, 'geschlecht'),
      zuordnungBestenliste: value(record, 'zuordnungBestenliste'),
      wertungen,
      pflichtzeiten,
      qualifikationAus,
      line: record.line,
    };

    const wettkampfKey = key(nummer, art);
    if (builders.has(wettkampfKey)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate WETTKAMPF ${wettkampfKey}; the first one wins`,
          { ...at(record.line), data: { element: 'WETTKAMPF', key: wettkampfKey } },
        ),
      );
    } else {
      builders.set(wettkampfKey, { wertungen, pflichtzeiten, wettkampf });
    }

    const abschnitt = abschnittByNummer.get(abschnittsnr);
    if (abschnitt === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `WETTKAMPF ${wettkampfKey} refers to unknown ABSCHNITT ${value(record, 'abschnittsnr')}`,
          {
            ...at(record.line),
            data: { element: 'WETTKAMPF', key: wettkampfKey, abschnittsnr },
          },
        ),
      );
      wettkaempfeOhneAbschnitt.push(wettkampf);
    } else {
      abschnittWettkaempfe.get(abschnitt)?.push(wettkampf);
    }
  }

  // Qualifikationsbezüge erst prüfen, wenn alle Wettkämpfe bekannt sind — ein
  // Vorlauf darf in der Datei hinter seiner Entscheidung stehen.
  for (const record of liste.records) {
    if (record.element !== 'WETTKAMPF') continue;

    const qualNummer = number(record, 'qualifikationswettkampfnr');
    const qualArt = value(record, 'qualifikationswettkampfart');
    if (!Number.isFinite(qualNummer) && qualArt === '') continue;

    const qualKey = key(qualNummer, qualArt);
    if (builders.has(qualKey)) continue;

    diagnostics.push(
      createDiagnostic(
        'dangling-reference',
        'warning',
        `WETTKAMPF ${key(number(record, 'wettkampfnr'), value(record, 'wettkampfart'))} refers to unknown qualifying WETTKAMPF ${qualKey}`,
        {
          ...at(record.line),
          data: { element: 'WETTKAMPF', reference: 'qualifikation', wettkampf: qualKey },
        },
      ),
    );
  }

  const wertungById = new Map<number, Wertung>();

  for (const record of liste.records) {
    if (record.element !== 'WERTUNG') continue;

    const id = number(record, 'wertungsId');
    const wertung: Wertung = {
      id,
      wertungsklasseTyp: value(record, 'wertungsklasseTyp'),
      mindestJgAk: value(record, 'mindestJgAk'),
      maximalJgAk: value(record, 'maximalJgAk'),
      geschlecht: value(record, 'geschlecht'),
      name: value(record, 'wertungsname'),
      line: record.line,
    };

    if (wertungById.has(id)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate WERTUNG id ${id}; the first one wins`,
          { ...at(record.line), data: { element: 'WERTUNG', wertungsId: id } },
        ),
      );
    } else if (Number.isFinite(id)) {
      wertungById.set(id, wertung);
    }

    const wettkampfKey = key(number(record, 'wettkampfnr'), value(record, 'wettkampfart'));
    const builder = builders.get(wettkampfKey);
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `WERTUNG ${id} refers to unknown WETTKAMPF ${wettkampfKey}`,
          {
            ...at(record.line),
            data: { element: 'WERTUNG', wertungsId: id, wettkampf: wettkampfKey },
          },
        ),
      );
      continue;
    }

    builder.wertungen.push(wertung);
  }

  for (const record of liste.records) {
    if (record.element !== 'PFLICHTZEIT') continue;

    const pflichtzeit: Pflichtzeit = {
      wertungsklasseTyp: value(record, 'wertungsklasseTyp'),
      mindestJgAk: value(record, 'mindestJgAk'),
      maximalJgAk: value(record, 'maximalJgAk'),
      zeit: decodeZeit(value(record, 'pflichtzeit')),
      geschlecht: value(record, 'geschlecht'),
      line: record.line,
    };

    const wettkampfKey = key(number(record, 'wettkampfnr'), value(record, 'wettkampfart'));
    const builder = builders.get(wettkampfKey);
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `PFLICHTZEIT refers to unknown WETTKAMPF ${wettkampfKey}`,
          { ...at(record.line), data: { element: 'PFLICHTZEIT', wettkampf: wettkampfKey } },
        ),
      );
      continue;
    }

    builder.pflichtzeiten.push(pflichtzeit);
  }

  const wettkampfByKey = new Map<string, Wettkampf>();
  for (const [wettkampfKey, builder] of builders) {
    wettkampfByKey.set(wettkampfKey, builder.wettkampf);
  }

  return {
    graph: {
      veranstaltung,
      abschnitte,
      wettkaempfeOhneAbschnitt,
      wettkampfByKey,
      wertungById,
      abschnittByNummer,
    },
    diagnostics,
  };
}

/** Die Eckdaten der Veranstaltung; ohne VERANSTALTUNG-Record leere Werte. */
function projectVeranstaltung(records: readonly TypedRecord[]): Veranstaltung {
  const record = records.find((r) => r.element === 'VERANSTALTUNG');
  if (record === undefined) return EMPTY_VERANSTALTUNG;

  return {
    bezeichnung: value(record, 'veranstaltungsbezeichnung'),
    ort: value(record, 'veranstaltungsort'),
    bahnlaenge: value(record, 'bahnlaenge'),
    zeitmessung: value(record, 'zeitmessung'),
  };
}
