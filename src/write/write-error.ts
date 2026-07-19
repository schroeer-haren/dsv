import type { Diagnostic } from '../diagnostics/types.js';

/**
 * Fehler beim Schreiben; trägt die Diagnostics der strengen Prüfung.
 *
 * Steht in einem eigenen Modul, weil ihn ausser dem Writer auch die Codecs
 * unter `src/values` werfen. Läge er weiter in `write-typed-list.ts`, entstünde
 * ein Importzyklus: `values/zeit` → `write-typed-list` → `parse-typed-list` →
 * `validate-values` → `values/zeit`. Dieses Modul importiert nur den
 * Diagnostic-Typ und schliesst den Zyklus damit aus.
 */
export class DsvWriteError extends Error {
  constructor(readonly diagnostics: readonly Diagnostic[]) {
    const first = diagnostics[0];
    super(first === undefined ? 'DSV write failed' : `${first.code}: ${first.message}`);
    this.name = 'DsvWriteError';
  }
}
