import type { ElementDef } from './types.js';

/** Ein Element einer Liste zusammen mit seiner erlaubten Häufigkeit. */
export interface ElementOccurrence {
  readonly def: ElementDef;
  /** Mindestanzahl; `0` bedeutet, das Element ist optional. */
  readonly min: number;
  /** Höchstanzahl; `null` bedeutet unbegrenzt. */
  readonly max: number | null;
}

/** Bündelt die Elemente einer Listenart mit ihren Kardinalitäten. */
export interface ListSchema {
  readonly listenart: string;
  /** Elemente in der Reihenfolge der Spezifikation. */
  readonly elements: readonly ElementOccurrence[];
  /** Sucht ein Element case-insensitiv; `undefined`, wenn es nicht zur Liste gehört. */
  find(name: string): ElementOccurrence | undefined;
}

export function occurrence(
  def: ElementDef,
  cardinality: { min: number; max: number | null },
): ElementOccurrence {
  return { def, min: cardinality.min, max: cardinality.max };
}

export function listSchema(listenart: string, elements: readonly ElementOccurrence[]): ListSchema {
  // Echte Dateien schreiben Elementnamen gross, die Spezifikation gemischt —
  // daher eine Map mit hochgestellten Schlüsseln statt linearer Suche.
  const byName = new Map<string, ElementOccurrence>(
    elements.map((e) => [e.def.name.toUpperCase(), e]),
  );

  return {
    listenart,
    elements,
    find(name: string): ElementOccurrence | undefined {
      return byName.get(name.toUpperCase());
    },
  };
}
