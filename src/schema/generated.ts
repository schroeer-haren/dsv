// Generiert von scripts/generate-types.ts — nicht von Hand ändern.

export interface AbschnittWkdefV7 {
  /**
   * Nummer des Abschnitts, maximal zweistellig.
   *
   * @see dsv8.md:904
   */
  abschnittsnr: string;

  /**
   * Datum, an dem der Abschnitt stattfindet.
   *
   * @see dsv8.md:918
   */
  abschnittsdatum: string;

  /**
   * Uhrzeit des Einlasses.
   *
   * @see dsv8.md:922
   */
  einlass?: string;

  /**
   * Uhrzeit der Kampfrichtersitzung.
   *
   * @see dsv8.md:926
   */
  kampfrichtersitzung?: string;

  /**
   * Uhrzeit, zu der der Abschnitt beginnt.
   *
   * @see dsv8.md:928
   */
  anfangszeit: string;

  /**
   * J, wenn die Anfangszeit relativ zum Ende des Vorabschnitts zu verstehen ist. Unterlassungswert N.
   *
   * @see dsv8.md:932
   */
  relativeAngabe?: string;
}

export interface AbschnittWkdefV8 {
  /**
   * Nummer des Abschnitts, maximal zweistellig.
   *
   * @see dsv8.md:904
   */
  abschnittsnr: string;

  /**
   * Datum, an dem der Abschnitt stattfindet.
   *
   * @see dsv8.md:918
   */
  abschnittsdatum: string;

  /**
   * Uhrzeit des Einlasses.
   *
   * @see dsv8.md:922
   */
  einlass?: string;

  /**
   * Uhrzeit der Kampfrichtersitzung.
   *
   * @see dsv8.md:926
   */
  kampfrichtersitzung?: string;

  /**
   * Uhrzeit, zu der der Abschnitt beginnt.
   *
   * @see dsv8.md:928
   */
  anfangszeit: string;

  /**
   * J, wenn die Anfangszeit relativ zum Ende des Vorabschnitts zu verstehen ist. Unterlassungswert N.
   *
   * @see dsv8.md:932
   */
  relativeAngabe?: string;
}

export interface AbschnittErgebnisV7 {
  /**
   * Nummer des Abschnitts, maximal zweistellig.
   *
   * @see dsv8.md:904
   */
  abschnittsnr: string;

  /**
   * Datum, an dem der Abschnitt stattfindet.
   *
   * @see dsv8.md:918
   */
  abschnittsdatum: string;

  /**
   * Uhrzeit, zu der der Abschnitt beginnt.
   *
   * @see dsv8.md:928
   */
  anfangszeit: string;

  /**
   * J, wenn die Anfangszeit relativ zum Ende des Vorabschnitts zu verstehen ist. Unterlassungswert N.
   *
   * @see dsv8.md:932
   */
  relativeAngabe?: string;
}

export interface AbschnittErgebnisV8 {
  /**
   * Nummer des Abschnitts, maximal zweistellig.
   *
   * @see dsv8.md:904
   */
  abschnittsnr: string;

  /**
   * Datum, an dem der Abschnitt stattfindet.
   *
   * @see dsv8.md:918
   */
  abschnittsdatum: string;

  /**
   * Uhrzeit, zu der der Abschnitt beginnt.
   *
   * @see dsv8.md:928
   */
  anfangszeit: string;

  /**
   * J, wenn die Anfangszeit relativ zum Ende des Vorabschnitts zu verstehen ist. Unterlassungswert N.
   *
   * @see dsv8.md:932
   */
  relativeAngabe?: string;
}
