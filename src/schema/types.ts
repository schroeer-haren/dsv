/** Skalare Datentypen des DSV-Standards (dsv8.md:249–300). */
export type ScalarType =
  'ZK' | 'Zahl' | 'Zeichen' | 'Zeit' | 'Datum' | 'Uhrzeit' | 'Betrag' | 'JGAK';

/** Ein einzelner erlaubter Wert eines Feldes mit fester Werteliste. */
export interface EnumValue {
  readonly value: string;
  /** Bedeutung des Wertes, wird als JSDoc übernommen. */
  readonly doc: string;
  /** Gesetzt, wenn der Wert erst ab dieser Formatversion erlaubt ist. */
  readonly since?: 8;
  /**
   * Wert, den die Spezifikation für diese Listenart nicht vorsieht, der im
   * Format aber existiert und real vorkommt. Wird beim Lesen als `warning`
   * gemeldet statt als `error` — sonst wiese die Bibliothek Dateien zurück,
   * die der DSV selbst ausliefert. Beim Schreiben bleibt er unzulässig.
   */
  readonly tolerated?: boolean;
}

/** Zulässiger Zahlenbereich eines Feldes, Grenzen einschliesslich. */
export interface NumberRange {
  readonly min: number;
  readonly max: number;
}

export interface FieldDef {
  readonly name: string;
  readonly type: ScalarType;
  readonly required: boolean;
  /** Gesetzt, wenn das Feld erst ab dieser Formatversion existiert. */
  readonly since?: 8;
  /** Wird als JSDoc in die generierten Typen übernommen. */
  readonly doc: string;
  /** Fundstelle in der Spezifikation, z. B. `dsv8.md:904`. */
  readonly specRef: string;
  /** Erlaubte Werte, falls das Feld eine feste Werteliste hat. */
  readonly values?: readonly EnumValue[];
  /** Unterlassungswert, der gilt, wenn das Feld nicht angegeben ist. */
  readonly default?: string;
  /**
   * Zulässiger Zahlenbereich, jeweils einschliesslich. Eine Regel des Feldes,
   * nicht des Typs `Zahl` — nur wenige Felder haben eine solche Schranke.
   */
  readonly range?: NumberRange;
  /** `true`, wenn die Werteliste ohne Rücksicht auf Gross-/Kleinschreibung geprüft wird. */
  readonly caseInsensitive: boolean;
}

export interface ElementDef {
  readonly name: string;
  /** Gesetzt, wenn es das Element erst ab dieser Formatversion gibt. */
  readonly since?: 8;
  /** Element ohne Doppelpunkt und ohne Attribute — nur `DATEIENDE`. */
  readonly bare: boolean;
  readonly fields: readonly FieldDef[];
}

interface FieldOptions {
  readonly required?: boolean;
  readonly since?: 8;
  readonly doc: string;
  readonly specRef: string;
  readonly values?: readonly EnumValue[];
  readonly default?: string;
  readonly range?: NumberRange;
  readonly caseInsensitive?: boolean;
}

export function field(name: string, type: ScalarType, options: FieldOptions): FieldDef {
  return {
    name,
    type,
    required: options.required ?? false,
    ...(options.since === undefined ? {} : { since: options.since }),
    doc: options.doc,
    specRef: options.specRef,
    ...(options.values === undefined ? {} : { values: options.values }),
    ...(options.default === undefined ? {} : { default: options.default }),
    ...(options.range === undefined ? {} : { range: options.range }),
    caseInsensitive: options.caseInsensitive ?? false,
  };
}

export function element(
  name: string,
  fields: readonly FieldDef[],
  options: { bare?: boolean; since?: 8 } = {},
): ElementDef {
  return {
    name,
    ...(options.since === undefined ? {} : { since: options.since }),
    bare: options.bare ?? false,
    fields,
  };
}
