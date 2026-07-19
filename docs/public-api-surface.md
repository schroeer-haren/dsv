# Öffentliche Oberfläche — Snapshot

<!-- Erzeugt von scripts/api-surface.ts. Nicht von Hand bearbeiten. -->

Diese Datei ist **generiert** und dient als Prüfsumme: Sie friert nicht nur
die Exportnamen ein, sondern auch die Member der exportierten Typen. Die von
Hand gepflegte Dokumentation der Oberfläche steht in
[`public-api.md`](./public-api.md) — dort steht, _was_ jeder Export tut; hier
steht, _woraus_ er besteht.

Jeder benannte Typ steht genau einmal und genau eine Ebene tief. Verweise auf
andere benannte Typen stehen als Name da; deren Aufbau findet sich unter ihrem
eigenen Eintrag. Member sind alphabetisch sortiert, weil ihre Reihenfolge kein
Teil des Vertrags ist. Mit `intern` markierte Typen werden nicht exportiert,
sind aber über ein Feld erreichbar und damit trotzdem Teil der Oberfläche.

Neu erzeugen mit `npm run api-surface`; `npm run api-surface:check` prüft, dass
die Datei zum Quellstand passt.

Stand: 227 Typen (davon 1 intern), 22 Werte.

## Werte

```ts
decodeDatum: (value: string) => Datum | null
decodeUhrzeit: (value: string) => number | null
decodeZeit: (value: string) => number | null
encodeDatum: (datum: Datum) => string
encodeUhrzeit: (minutesOfDay: number) => string
encodeZeit: (hundredths: number) => string
isZeroZeit: (hundredths: number) => boolean
parseDsv: (input: string) => ParseResult<DsvDocument>
parseDsvOrThrow: (input: string) => DsvDocument
parseVereinsergebnisliste: (input: string) => ParseResult<Vereinsergebnisliste>
parseVereinsmeldeliste: (input: string) => ParseResult<Vereinsmeldeliste>
parseWettkampfdefinitionsliste: (input: string) => ParseResult<Wettkampfdefinitionsliste>
parseWettkampfergebnisliste: (input: string) => ParseResult<Wettkampfergebnisliste>
projectVereinsergebnisliste: (liste: Vereinsergebnisliste) => VereinsergebnisProjectionResult
projectVereinsmeldeliste: (liste: Vereinsmeldeliste) => MeldungProjectionResult
projectWettkampfdefinitionsliste: (liste: Wettkampfdefinitionsliste) => DefinitionProjectionResult
projectWettkampfergebnisliste: (liste: Wettkampfergebnisliste) => ErgebnisProjectionResult
writeDsv: (document: DsvDocument) => string
writeVereinsergebnisliste: (records: ReadonlyArray<TypedRecord>, options?: WriteOptions) => string
writeVereinsmeldeliste: (records: ReadonlyArray<TypedRecord>, options?: WriteOptions) => string
writeWettkampfdefinitionsliste: (records: ReadonlyArray<TypedRecord>, options?: WriteOptions) => string
writeWettkampfergebnisliste: (records: ReadonlyArray<TypedRecord>, options?: WriteOptions) => string
```

## Typen

### AbschnittV7

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
einlass?: string | undefined
kampfrichtersitzung?: string | undefined
relativeAngabe?: 'J' | 'N' | undefined
```

### AbschnittV8

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
einlass?: string | undefined
kampfrichtersitzung?: string | undefined
relativeAngabe?: 'J' | 'N' | undefined
```

### AusrichterV7

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
nameDesAusrichters: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### AusrichterV8

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
nameDesAusrichters: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### AusschreibungimnetzV7

```ts
internetadresse?: string | undefined
```

### AusschreibungimnetzV8

```ts
internetadresse?: string | undefined
```

### BankverbindungV7

```ts
bic?: string | undefined
iban: string
nameDerBank?: string | undefined
```

### BankverbindungV8

```ts
bic?: string | undefined
iban: string
kontoinhaber: string
nameDerBank?: string | undefined
```

### BesonderesV7

```ts
anmerkungen: string
```

### BesonderesV8

```ts
anmerkungen: string
```

### DateiendeV7

```ts
```

### DateiendeV8

```ts
```

### Datum

```ts
readonly day: number
readonly month: number
readonly year: number
```

### DefinitionAbschnitt

```ts
readonly anfangszeit: number | null
readonly datum: Datum | null
readonly einlass: number | null
readonly kampfrichtersitzung: number | null
readonly line: number
readonly nummer: number
readonly relativeAngabe: string
readonly wettkaempfe: ReadonlyArray<DefinitionWettkampf>
```

### DefinitionPflichtzeit

```ts
readonly geschlecht: string
readonly line: number
readonly maximalJgAk: string
readonly mindestJgAk: string
readonly wertungsklasseTyp: string
readonly zeit: number | null
```

### DefinitionProjectionResult

```ts
readonly diagnostics: ReadonlyArray<Diagnostic>
readonly graph: Wettkampfdefinition
```

### DefinitionVeranstaltung

```ts
readonly bahnlaenge: string
readonly bezeichnung: string
readonly ort: string
readonly zeitmessung: string
```

### DefinitionWertung

```ts
readonly geschlecht: string
readonly id: number
readonly line: number
readonly maximalJgAk: string
readonly mindestJgAk: string
readonly name: string
readonly wertungsklasseTyp: string
```

### DefinitionWettkampf

```ts
readonly abschnittsnr: number
readonly anzahlStarter: string
readonly art: string
readonly ausuebung: string
readonly einzelstrecke: number
readonly geschlecht: string
readonly line: number
readonly nummer: number
readonly pflichtzeiten: ReadonlyArray<DefinitionPflichtzeit>
readonly qualifikationAus: { readonly nummer: number; readonly art: string; } | null
readonly technik: string
readonly wertungen: ReadonlyArray<DefinitionWertung>
readonly zuordnungBestenliste: string
```

### Diagnostic

```ts
readonly code: DiagnosticCode
readonly data?: Readonly<Record<string, unknown>> | undefined
readonly line: number
readonly message: string
readonly severity: Severity
```

### DiagnosticCode

```ts
= 'missing-format-element' | 'missing-dateiende-element' | 'format-not-first-element' | 'element-order-violation' | 'unknown-encoding-replacement-character' | 'unterminated-field-list' | 'unexpected-field-count' | 'unknown-element' | 'missing-required-field' | 'invalid-value' | 'invalid-enum-value' | 'cardinality-violation' | 'mutually-exclusive-elements' | 'conditional-field-required' | 'unsupported-format-version' | 'wrong-list-type' | 'dangling-reference' | 'ambiguous-reference' | 'incomplete-relay' | 'empty-input'
```

### DsvBlank

```ts
readonly eol: LineEnding
readonly kind: 'blank'
readonly line: number
readonly raw: string
```

### DsvComment

```ts
readonly eol: LineEnding
readonly kind: 'comment'
readonly line: number
readonly raw: string
```

### DsvDocument

```ts
readonly hasBom: boolean
readonly items: ReadonlyArray<DsvItem>
readonly listenart: string | null
readonly version: number | null
```

### DsvItem

```ts
= DsvRecord | DsvComment | DsvBlank
```

### DsvParseError

```ts
readonly diagnostics: ReadonlyArray<Diagnostic>
```

### DsvRecord

```ts
readonly bare: boolean
readonly comment: string | null
readonly element: string
readonly eol: LineEnding
readonly fields: ReadonlyArray<string>
readonly kind: 'element'
readonly line: number
readonly raw: string
readonly rawFields: ReadonlyArray<string>
readonly terminated: boolean
```

### DsvWriteError

```ts
readonly diagnostics: ReadonlyArray<Diagnostic>
```

### ErgebnisAbloese

```ts
readonly art: string
readonly line: number
readonly startnummer: number
readonly zeit: number | null
```

### ErgebnisAbschnitt

```ts
readonly anfangszeit: number | null
readonly datum: Datum | null
readonly kampfrichter: ReadonlyArray<ErgebnisKampfrichter>
readonly line: number
readonly nummer: number
readonly relativeAngabe: string
readonly wettkaempfe: ReadonlyArray<ErgebnisWettkampf>
```

### ErgebnisAbschnittV7

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
relativeAngabe?: 'J' | 'N' | undefined
```

### ErgebnisAbschnittV8

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
relativeAngabe?: 'J' | 'N' | undefined
```

### ErgebnisAusrichterV7

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
nameDesAusrichters: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### ErgebnisAusrichterV8

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
nameDesAusrichters: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### ErgebnisDateiendeV7

```ts
```

### ErgebnisDateiendeV8

```ts
```

### ErgebnisErzeugerV7

```ts
kontakt: string
software: string
version: string
```

### ErgebnisErzeugerV8

```ts
kontakt: string
software: string
version: string
```

### ErgebnisFormatV7

```ts
listart: string
version: string
```

### ErgebnisFormatV8

```ts
listart: string
version: string
```

### ErgebnisKampfgerichtV7

```ts
abschnittsnr: string
nameKampfrichter: string
position: 'SCH' | 'STA' | 'ZRO' | 'ZR' | 'ZNO' | 'ZN' | 'RZN' | 'SR' | 'WRO' | 'WR' | 'AUS' | 'SP' | 'PKF' | 'STO' | 'WKH' | 'ASCH' | 'SIB' | 'SAUF' | 'VER' | 'ZBV' | 'SPR'
vereinDesKampfrichters: string
```

### ErgebnisKampfgerichtV8

```ts
abschnittsnr: string
nameKampfrichter: string
position: 'SCH' | 'STA' | 'ZRO' | 'ZR' | 'ZNO' | 'ZN' | 'RZN' | 'SR' | 'WRO' | 'WR' | 'AUS' | 'SP' | 'PKF' | 'STO' | 'WKH' | 'ASCH' | 'SIB' | 'SAUF' | 'VER' | 'ZBV' | 'SPR'
vereinDesKampfrichters: string
```

### ErgebnisKampfrichter

```ts
readonly line: number
readonly name: string
readonly position: string
readonly verein: string
```

### ErgebnisPerson

```ts
readonly dsvId: string
readonly geschlecht: string
readonly jahrgang: string
readonly name: string
readonly starts: ReadonlyArray<ErgebnisStart>
readonly veranstaltungsId: number
readonly verein: string
readonly vereinskennzahl: number
```

### ErgebnisPlatzierung

```ts
readonly disqualifikationsbemerkung: string
readonly erhoehtesNachtraeglichesMeldegeld: string
readonly grundDerNichtwertung: string
readonly line: number
readonly platz: number
readonly wertungsId: number
```

### ErgebnisPnergebnisV7

```ts
altersklasse?: string | undefined
disqualifikationsbemerkung?: string | undefined
dsvId: string
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
geschlecht: 'M' | 'W' | 'D'
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
platz: string
veranstaltungsId: string
verein: string
vereinskennzahl: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisPnergebnisV8

```ts
altersklasse?: string | undefined
disqualifikationsbemerkung?: string | undefined
dsvId: string
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
geschlecht: 'M' | 'W' | 'D'
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
platz: string
veranstaltungsId: string
verein: string
vereinskennzahl: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisPnreaktionV7

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisPnreaktionV8

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisPnzwischenzeitV7

```ts
distanz: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### ErgebnisPnzwischenzeitV8

```ts
distanz: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### ErgebnisProjectionResult

```ts
readonly diagnostics: ReadonlyArray<Diagnostic>
readonly graph: Wettkampfergebnis
```

### ErgebnisReaktion

```ts
readonly art: string
readonly line: number
readonly zeit: number | null
```

### ErgebnisStabloeseV7

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisStabloeseV8

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisStaffel

```ts
readonly abloesen: ReadonlyArray<ErgebnisAbloese>
readonly endzeit: number | null
readonly line: number
readonly nummerDerMannschaft: string
readonly personen: ReadonlyArray<ErgebnisStaffelPerson>
readonly platzierungen: ReadonlyArray<ErgebnisPlatzierung>
readonly startnummerDisqualifiziert: string
readonly veranstaltungsId: number
readonly verein: string
readonly vereinskennzahl: number
readonly wettkampfart: string
readonly wettkampfnr: number
readonly zwischenzeiten: ReadonlyArray<ErgebnisStaffelZwischenzeit>
```

### ErgebnisStaffelPerson

```ts
readonly altersklasse: string
readonly dsvId: string
readonly geschlecht: string
readonly jahrgang: string
readonly line: number
readonly name: string
readonly nationalitaeten: ReadonlyArray<string>
readonly startnummer: number
```

### ErgebnisStaffelpersonV7

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisStaffelpersonV8

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisStaffelZwischenzeit

```ts
readonly distanz: number
readonly line: number
readonly startnummer: number
readonly zeit: number | null
```

### ErgebnisStart

```ts
readonly altersklasse: string
readonly dsvId: string
readonly endzeit: number | null
readonly geschlecht: string
readonly jahrgang: string
readonly line: number
readonly name: string
readonly nationalitaeten: ReadonlyArray<string>
readonly platzierungen: ReadonlyArray<ErgebnisPlatzierung>
readonly reaktionen: ReadonlyArray<ErgebnisReaktion>
readonly veranstaltungsId: number
readonly verein: string
readonly vereinskennzahl: number
readonly wettkampfart: string
readonly wettkampfnr: number
readonly zwischenzeiten: ReadonlyArray<ErgebnisZwischenzeit>
```

### ErgebnisStergebnisV7

```ts
disqualifikationsbemerkung?: string | undefined
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
nummerDerMannschaft: string
platz: string
startnummerDisqualifiziert?: string | undefined
veranstaltungsId: string
verein: string
vereinskennzahl: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisStergebnisV8

```ts
disqualifikationsbemerkung?: string | undefined
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
nummerDerMannschaft: string
platz: string
startnummerDisqualifiziert?: string | undefined
veranstaltungsId: string
verein: string
vereinskennzahl: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisStzwischenzeitV7

```ts
distanz: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### ErgebnisStzwischenzeitV8

```ts
distanz: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### ErgebnisVeranstalterV7

```ts
nameDesVeranstalters: string
```

### ErgebnisVeranstalterV8

```ts
nameDesVeranstalters: string
```

### ErgebnisVeranstaltung

```ts
readonly bahnlaenge: string
readonly bezeichnung: string
readonly ort: string
readonly zeitmessung: string
```

### ErgebnisVeranstaltungV7

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### ErgebnisVeranstaltungV8

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### ErgebnisVerein

```ts
readonly bezeichnung: string
readonly kennzahl: number
readonly landesschwimmverband: string
readonly line: number
readonly nationenkuerzel: string
```

### ErgebnisVereinV7

```ts
landesschwimmverband: string
nationenkuerzel: string
vereinsbezeichnung: string
vereinskennzahl: string
```

### ErgebnisVereinV8

```ts
landesschwimmverband: string
nationenkuerzel: string
vereinsbezeichnung: string
vereinskennzahl: string
```

### ErgebnisWertung

```ts
readonly geschlecht: string
readonly id: number
readonly line: number
readonly maximalJgAk: string
readonly mindestJgAk: string
readonly name: string
readonly wertungsklasseTyp: string
```

### ErgebnisWertungV7

```ts
geschlecht?: 'X' | 'M' | 'W' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
wertungsId: string
wertungsklasseTyp: 'JG' | 'AK'
wertungsname: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisWertungV8

```ts
geschlecht?: 'X' | 'M' | 'W' | 'D' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
wertungsId: string
wertungsklasseTyp: 'JG' | 'AK'
wertungsname: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### ErgebnisWettkampf

```ts
readonly abschnittsnr: number
readonly anzahlStarter: string
readonly art: string
readonly ausuebung: string
readonly einzelstrecke: number
readonly geschlecht: string
readonly line: number
readonly nummer: number
readonly qualifikationAus: { readonly nummer: number; readonly art: string; } | null
readonly staffeln: ReadonlyArray<ErgebnisStaffel>
readonly starts: ReadonlyArray<ErgebnisStart>
readonly technik: string
readonly wertungen: ReadonlyArray<ErgebnisWertung>
readonly zuordnungBestenliste: string
```

### ErgebnisWettkampfV7

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W' | 'D'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX'
```

### ErgebnisWettkampfV8

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'KB' | 'KR'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W' | 'D'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX'
```

### ErgebnisZwischenzeit

```ts
readonly distanz: number
readonly line: number
readonly zeit: number | null
```

### ErzeugerV7

```ts
kontakt: string
software: string
version: string
```

### ErzeugerV8

```ts
kontakt: string
software: string
version: string
```

### FormatV7

```ts
listart: string
version: string
```

### FormatV8

```ts
listart: string
version: string
```

### FormatVersion

```ts
= 7 | 8
```

### LastschriftV7

```ts
hinweis?: 'J' | 'N' | undefined
```

### LastschriftV8

```ts
hinweis?: 'J' | 'N' | undefined
```

### MeldeadresseV7

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### MeldeadresseV8

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### MeldegeldV7

```ts
betrag: string
meldegeldTyp: 'Meldegeldpauschale' | 'Einzelmeldegeld' | 'Staffelmeldegeld' | 'Wkmeldegeld' | 'Mannschaftmeldegeld'
wettkampfnr?: string | undefined
```

### MeldegeldV8

```ts
betrag: string
meldegeldTyp: 'Meldegeldpauschale' | 'Einzelmeldegeld' | 'Staffelmeldegeld' | 'Wkmeldegeld' | 'Mannschaftmeldegeld' | 'Teilnehmermeldegeld' | 'Abschnittspauschale'
wettkampfnr?: string | undefined
```

### MeldeschlussV7

```ts
datum: string
uhrzeit: string
```

### MeldeschlussV8

```ts
datum: string
uhrzeit: string
```

### MeldungAbschnitt

```ts
readonly anfangszeit: number | null
readonly datum: Datum | null
readonly kampfrichterEinsaetze: ReadonlyArray<MeldungKampfrichterEinsatz>
readonly line: number
readonly nummer: number
readonly relativeAngabe: string
readonly wettkaempfe: ReadonlyArray<MeldungWettkampf>
```

### MeldungAbschnittV7

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
relativeAngabe?: 'J' | 'N' | undefined
```

### MeldungAbschnittV8

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
relativeAngabe?: 'J' | 'N' | undefined
```

### MeldungAnsprechpartner

```ts
readonly email: string
readonly fax: string
readonly land: string
readonly line: number
readonly name: string
readonly ort: string
readonly plz: string
readonly strasse: string
readonly telefon: string
```

### MeldungAnsprechpartnerV7

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### MeldungAnsprechpartnerV8

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### MeldungDateiendeV7

```ts
```

### MeldungDateiendeV8

```ts
```

### MeldungErzeugerV7

```ts
kontakt: string
software: string
version: string
```

### MeldungErzeugerV8

```ts
kontakt: string
software: string
version: string
```

### MeldungFormatV7

```ts
listart: string
version: string
```

### MeldungFormatV8

```ts
listart: string
version: string
```

### MeldungHandicap

```ts
readonly dbsId: string
readonly exceptions: string
readonly ipcId: string
readonly line: number
readonly startklasse: string
readonly startklasseBrust: string
readonly startklasseLagen: string
```

### MeldungHandicapV7

```ts
dbsId?: string | undefined
exceptions?: string | undefined
ipcId?: string | undefined
startklasse: 'AB' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10' | 'S11' | 'S12' | 'S13' | 'S14'
startklasseBrust: 'AB' | 'SB1' | 'SB2' | 'SB3' | 'SB4' | 'SB5' | 'SB6' | 'SB7' | 'SB8' | 'SB9' | 'SB10' | 'SB11' | 'SB12' | 'SB13' | 'SB14'
startklasseLagen: 'AB' | 'SM1' | 'SM2' | 'SM3' | 'SM4' | 'SM5' | 'SM6' | 'SM7' | 'SM8' | 'SM9' | 'SM10' | 'SM11' | 'SM12' | 'SM13' | 'SM14'
veranstaltungsId: string
```

### MeldungHandicapV8

```ts
dbsId?: string | undefined
exceptions?: string | undefined
ipcId?: string | undefined
startklasse: 'AB' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10' | 'S11' | 'S12' | 'S13' | 'S14'
startklasseBrust: 'AB' | 'SB1' | 'SB2' | 'SB3' | 'SB4' | 'SB5' | 'SB6' | 'SB7' | 'SB8' | 'SB9' | 'SB10' | 'SB11' | 'SB12' | 'SB13' | 'SB14'
startklasseLagen: 'AB' | 'SM1' | 'SM2' | 'SM3' | 'SM4' | 'SM5' | 'SM6' | 'SM7' | 'SM8' | 'SM9' | 'SM10' | 'SM11' | 'SM12' | 'SM13' | 'SM14'
veranstaltungsId: string
```

### MeldungKampfrichter

```ts
readonly einsaetze: ReadonlyArray<MeldungKampfrichterEinsatz>
readonly geschlecht: string
readonly kampfrichtergruppe: string
readonly line: number
readonly name: string
readonly nummer: number
```

### MeldungKampfrichterEinsatz

```ts
readonly abschnittsnummer: number
readonly einsatzwunsch: string
readonly line: number
readonly nummerKampfrichter: number
```

### MeldungKariabschnittV7

```ts
abschnittsnummer: string
einsatzwunsch?: 'SCH' | 'STA' | 'ZRO' | 'ZR' | 'ZNO' | 'ZN' | 'RZN' | 'SR' | 'WRO' | 'WR' | 'AUS' | 'SP' | 'PKF' | 'STO' | 'ASCH' | 'SIB' | 'SAUF' | 'VER' | undefined
nummerKampfrichter: string
```

### MeldungKariabschnittV8

```ts
abschnittsnummer: string
einsatzwunsch?: 'SCH' | 'STA' | 'ZRO' | 'ZR' | 'ZNO' | 'ZN' | 'RZN' | 'SR' | 'WRO' | 'WR' | 'AUS' | 'SP' | 'PKF' | 'STO' | 'ASCH' | 'SIB' | 'SAUF' | 'VER' | undefined
nummerKampfrichter: string
```

### MeldungKarimeldungV7

```ts
kampfrichtergruppe: 'SCH' | 'AUS' | 'SPR' | 'WKR'
name: string
nummerKampfrichter: string
```

### MeldungKarimeldungV8

```ts
geschlecht?: 'M' | 'W' | 'D' | undefined
kampfrichtergruppe: 'SCH' | 'AUS' | 'SPR' | 'WKR'
name: string
nummerKampfrichter: string
```

### MeldungPerson

```ts
readonly altersklasse: string
readonly dsvId: string
readonly geschlecht: string
readonly handicap: MeldungHandicap | null
readonly jahrgang: string
readonly line: number
readonly name: string
readonly nationalitaeten: ReadonlyArray<string>
readonly starts: ReadonlyArray<MeldungStart>
readonly trainer: MeldungTrainer | null
readonly veranstaltungsId: number
```

### MeldungPnmeldungV7

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
nummerTrainer?: string | undefined
veranstaltungsId: string
```

### MeldungPnmeldungV8

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
nummerTrainer?: string | undefined
veranstaltungsId: string
```

### MeldungProjectionResult

```ts
readonly diagnostics: ReadonlyArray<Diagnostic>
readonly graph: Vereinsmeldung
```

### MeldungStaffel

```ts
readonly line: number
readonly maximalJgAk: string
readonly mindestJgAk: string
readonly name: string
readonly nummerDerMannschaft: string
readonly personen: ReadonlyArray<MeldungStaffelPerson>
readonly starts: ReadonlyArray<MeldungStart>
readonly veranstaltungsId: number
readonly wertungsklasseTyp: string
```

### MeldungStaffelPerson

```ts
readonly line: number
readonly startnummer: number
readonly veranstaltungsId: number
readonly wettkampfnr: number
```

### MeldungStaffelpersonV7

```ts
startnummer: string
veranstaltungsId: string
veranstaltungsIdStaffel: string
wettkampfnummer: string
```

### MeldungStaffelpersonV8

```ts
startnummer: string
veranstaltungsId: string
veranstaltungsIdStaffel: string
wettkampfnummer: string
```

### MeldungStart

```ts
readonly line: number
readonly meldezeit: number | null
readonly wettkampfart: string
readonly wettkampfnr: number
```

### MeldungStartpnV7

```ts
meldezeit?: string | undefined
veranstaltungsId: string
wettkampfnummer: string
```

### MeldungStartpnV8

```ts
meldezeit?: string | undefined
veranstaltungsId: string
wettkampfnummer: string
```

### MeldungStartstV7

```ts
meldezeit?: string | undefined
veranstaltungsIdStaffel: string
wettkampfnummer: string
```

### MeldungStartstV8

```ts
meldezeit?: string | undefined
veranstaltungsIdStaffel: string
wettkampfnummer: string
```

### MeldungStmeldungV7

```ts
maximalJgAk?: string | undefined
mindestJgAk: string
nameDerStaffel?: string | undefined
nummerDerMannschaft: string
veranstaltungsIdStaffel: string
wertungsklasseTyp: 'JG' | 'AK'
```

### MeldungStmeldungV8

```ts
maximalJgAk?: string | undefined
mindestJgAk: string
nameDerStaffel?: string | undefined
nummerDerMannschaft: string
veranstaltungsIdStaffel: string
wertungsklasseTyp: 'JG' | 'AK'
```

### MeldungTrainer

```ts
readonly geschlecht: string
readonly line: number
readonly name: string
readonly nummer: number
```

### MeldungTrainerV7

```ts
name: string
nummerTrainer: string
```

### MeldungTrainerV8

```ts
geschlecht?: 'M' | 'W' | 'D' | undefined
name: string
nummerTrainer: string
```

### MeldungVeranstaltung

```ts
readonly bahnlaenge: string
readonly bezeichnung: string
readonly ort: string
readonly zeitmessung: string
```

### MeldungVeranstaltungV7

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### MeldungVeranstaltungV8

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### MeldungVerein

```ts
readonly bezeichnung: string
readonly kennzahl: number
readonly landesschwimmverband: string
readonly lastschrift: string
readonly line: number
readonly nationenkuerzel: string
```

### MeldungVereinV7

```ts
landesschwimmverband: string
nationenkuerzel: string
vereinsbezeichnung: string
vereinskennzahl: string
```

### MeldungVereinV8

```ts
landesschwimmverband: string
lastschrift?: 'J' | 'N' | undefined
nationenkuerzel: string
vereinsbezeichnung: string
vereinskennzahl: string
```

### MeldungWettkampf

```ts
readonly abschnittsnr: number
readonly anzahlStarter: string
readonly art: string
readonly ausuebung: string
readonly einzelstrecke: number
readonly geschlecht: string
readonly line: number
readonly nummer: number
readonly qualifikationAus: { readonly nummer: number; readonly art: string; } | null
readonly staffelStarts: ReadonlyArray<MeldungStart>
readonly starts: ReadonlyArray<MeldungStart>
readonly technik: string
```

### MeldungWettkampfV7

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### MeldungWettkampfV8

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'KB' | 'KR'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W' | 'D'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### NachweisV7

```ts
bahnlaenge: '25' | '50' | 'FW' | 'AL'
nachweisBis?: string | undefined
nachweisVon: string
```

### NachweisV8

```ts
bahnlaenge: '25' | '50' | 'FW' | 'AL'
nachweisBis?: string | undefined
nachweisVon: string
```

### ParseResult

```ts
readonly diagnostics: ReadonlyArray<Diagnostic>
readonly document: T
readonly ok: boolean
```

### PflichtzeitV7

```ts
geschlecht?: 'M' | 'W' | 'D' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
pflichtzeit: string
wertungsklasseTyp: 'JG' | 'AK'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### PflichtzeitV8

```ts
geschlecht?: 'M' | 'W' | 'D' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
pflichtzeit: string
wertungsklasseTyp: 'JG' | 'AK'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### Severity

```ts
= 'fatal' | 'error' | 'warning' | 'info'
```

### TypedList

```ts
readonly __listenart?: TListenart | undefined
readonly document: DsvDocument
readonly listenart: string
readonly records: ReadonlyArray<TypedRecord>
readonly version: FormatVersion
```

### TypedRecord

```ts
readonly element: string
readonly line: number
readonly values: Readonly<Record<string, string>>
```

### VeranstalterV7

```ts
nameDesVeranstalters: string
```

### VeranstalterV8

```ts
nameDesVeranstalters: string
```

### VeranstaltungsortV7

```ts
email?: string | undefined
fax?: string | undefined
land: string
nameSchwimmhalle: string
ort: string
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### VeranstaltungsortV8

```ts
email?: string | undefined
fax?: string | undefined
land: string
nameSchwimmhalle: string
ort: string
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### VeranstaltungV7

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### VeranstaltungV8

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### Vereinsergebnis

```ts
readonly abschnittByNummer: ReadonlyMap<number, VereinsergebnisAbschnitt>
readonly abschnitte: ReadonlyArray<VereinsergebnisAbschnitt>
readonly personById: ReadonlyMap<number, VereinsergebnisPerson>
readonly personen: ReadonlyArray<VereinsergebnisPerson>
readonly staffelById: ReadonlyMap<number, VereinsergebnisStaffel>
readonly staffelStartByKey: ReadonlyMap<string, VereinsergebnisStaffelStart>
readonly staffeln: ReadonlyArray<VereinsergebnisStaffel>
readonly startByKey: ReadonlyMap<string, VereinsergebnisStart>
readonly veranstaltung: VereinsergebnisVeranstaltung
readonly verein: VereinsergebnisVerein | null
readonly wertungById: ReadonlyMap<number, VereinsergebnisWertung>
readonly wettkaempfeOhneAbschnitt: ReadonlyArray<VereinsergebnisWettkampf>
readonly wettkampfByKey: ReadonlyMap<string, VereinsergebnisWettkampf>
```

### VereinsergebnisAbloese

```ts
readonly art: string
readonly line: number
readonly startnummer: number
readonly zeit: number | null
```

### VereinsergebnisAbschnitt

```ts
readonly anfangszeit: number | null
readonly datum: Datum | null
readonly kampfrichter: ReadonlyArray<VereinsergebnisKampfrichter>
readonly line: number
readonly nummer: number
readonly relativeAngabe: string
readonly wettkaempfe: ReadonlyArray<VereinsergebnisWettkampf>
```

### VereinsergebnisAbschnittV7

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
relativeAngabe?: 'J' | 'N' | undefined
```

### VereinsergebnisAbschnittV8

```ts
abschnittsdatum: string
abschnittsnr: string
anfangszeit: string
relativeAngabe?: 'J' | 'N' | undefined
```

### VereinsergebnisAusrichterV7

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
nameDesAusrichters: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### VereinsergebnisAusrichterV8

```ts
email: string
fax?: string | undefined
land?: string | undefined
name: string
nameDesAusrichters: string
ort?: string | undefined
plz?: string | undefined
strasse?: string | undefined
telefon?: string | undefined
```

### VereinsergebnisDateiendeV7

```ts
```

### VereinsergebnisDateiendeV8

```ts
```

### VereinsergebnisErzeugerV7

```ts
kontakt: string
software: string
version: string
```

### VereinsergebnisErzeugerV8

```ts
kontakt: string
software: string
version: string
```

### VereinsergebnisFormatV7

```ts
listart: string
version: string
```

### VereinsergebnisFormatV8

```ts
listart: string
version: string
```

### VereinsergebnisKampfgerichtV7

```ts
abschnittsnr: string
nameKampfrichter: string
position: 'SCH' | 'STA' | 'ZRO' | 'ZR' | 'ZNO' | 'ZN' | 'RZN' | 'SR' | 'WRO' | 'WR' | 'AUS' | 'SP' | 'PKF' | 'STO' | 'WKH' | 'ASCH' | 'SIB' | 'SAUF' | 'VER' | 'ZBV' | 'SPR'
vereinDesKampfrichters: string
```

### VereinsergebnisKampfgerichtV8

```ts
abschnittsnr: string
nameKampfrichter: string
position: 'SCH' | 'STA' | 'ZRO' | 'ZR' | 'ZNO' | 'ZN' | 'RZN' | 'SR' | 'WRO' | 'WR' | 'AUS' | 'SP' | 'PKF' | 'STO' | 'WKH' | 'ASCH' | 'SIB' | 'SAUF' | 'VER' | 'ZBV' | 'SPR'
vereinDesKampfrichters: string
```

### VereinsergebnisKampfrichter

```ts
readonly line: number
readonly name: string
readonly position: string
readonly verein: string
```

### Vereinsergebnisliste

```ts
readonly __listenart?: 'Vereinsergebnisliste' | undefined
readonly document: DsvDocument
readonly listenart: string
readonly records: ReadonlyArray<TypedRecord>
readonly version: FormatVersion
```

### VereinsergebnisPerson

```ts
readonly altersklasse: string
readonly dsvId: string
readonly geschlecht: string
readonly jahrgang: string
readonly line: number
readonly name: string
readonly nationalitaeten: ReadonlyArray<string>
readonly starts: ReadonlyArray<VereinsergebnisStart>
readonly veranstaltungsId: number
```

### VereinsergebnisPersonenergebnisV7

```ts
disqualifikationsbemerkung?: string | undefined
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
platz: string
veranstaltungsId: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisPersonenergebnisV8

```ts
disqualifikationsbemerkung?: string | undefined
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
platz: string
veranstaltungsId: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisPersonV7

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
veranstaltungsId: string
```

### VereinsergebnisPersonV8

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
veranstaltungsId: string
```

### VereinsergebnisPlatzierung

```ts
readonly disqualifikationsbemerkung: string
readonly erhoehtesNachtraeglichesMeldegeld: string
readonly grundDerNichtwertung: string
readonly line: number
readonly platz: number
readonly wertungsId: number
```

### VereinsergebnisPnreaktionV7

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisPnreaktionV8

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisPnzwischenzeitV7

```ts
distanz: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### VereinsergebnisPnzwischenzeitV8

```ts
distanz: string
veranstaltungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### VereinsergebnisProjectionResult

```ts
readonly diagnostics: ReadonlyArray<Diagnostic>
readonly graph: Vereinsergebnis
```

### VereinsergebnisReaktion

```ts
readonly art: string
readonly line: number
readonly zeit: number | null
```

### VereinsergebnisStabloeseV7

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisStabloeseV8

```ts
art?: '+' | '-' | undefined
reaktionszeit: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisStaffel

```ts
readonly besetzungen: ReadonlyArray<VereinsergebnisStaffelBesetzung>
readonly line: number
readonly maximalJgAk: string
readonly mindestJgAk: string
readonly nummerDerMannschaft: string
readonly starts: ReadonlyArray<VereinsergebnisStaffelStart>
readonly veranstaltungsId: number
readonly wertungsklasseTyp: string
```

### VereinsergebnisStaffelBesetzung (intern)

```ts
readonly personen: ReadonlyArray<VereinsergebnisStaffelPerson>
readonly wettkampfart: string
readonly wettkampfnr: number
readonly zwischenzeiten: ReadonlyArray<VereinsergebnisStaffelZwischenzeit>
```

### VereinsergebnisStaffelergebnisV7

```ts
disqualifikationsbemerkung?: string | undefined
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
platz: string
startnummerDisqualifiziert?: string | undefined
veranstaltungsIdStaffel: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisStaffelergebnisV8

```ts
disqualifikationsbemerkung?: string | undefined
endzeit: string
erhoehtesNachtraeglichesMeldegeld?: 'N' | 'F' | 'E' | undefined
grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU' | undefined
platz: string
startnummerDisqualifiziert?: string | undefined
veranstaltungsIdStaffel: string
wertungsId: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisStaffelPerson

```ts
readonly altersklasse: string
readonly dsvId: string
readonly geschlecht: string
readonly jahrgang: string
readonly line: number
readonly name: string
readonly nationalitaeten: ReadonlyArray<string>
readonly startnummer: number
```

### VereinsergebnisStaffelpersonV7

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisStaffelpersonV8

```ts
altersklasse?: string | undefined
dsvId: string
geschlecht: 'M' | 'W' | 'D'
jahrgang: string
name: string
nationalitaet1?: string | undefined
nationalitaet2?: string | undefined
nationalitaet3?: string | undefined
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisStaffelPlatzierung

```ts
readonly disqualifikationsbemerkung: string
readonly erhoehtesNachtraeglichesMeldegeld: string
readonly grundDerNichtwertung: string
readonly line: number
readonly platz: number
readonly startnummerDisqualifiziert: string
readonly wertungsId: number
```

### VereinsergebnisStaffelStart

```ts
readonly abloesen: ReadonlyArray<VereinsergebnisAbloese>
readonly endzeit: number | null
readonly line: number
readonly personen: ReadonlyArray<VereinsergebnisStaffelPerson>
readonly platzierungen: ReadonlyArray<VereinsergebnisStaffelPlatzierung>
readonly veranstaltungsId: number
readonly wettkampfart: string
readonly wettkampfnr: number
readonly zwischenzeiten: ReadonlyArray<VereinsergebnisStaffelZwischenzeit>
```

### VereinsergebnisStaffelV7

```ts
maximalJgAk?: string | undefined
mindestJgAk: string
nummerDerMannschaft: string
veranstaltungsIdStaffel: string
wertungsklasseTyp: 'JG' | 'AK'
```

### VereinsergebnisStaffelV8

```ts
maximalJgAk?: string | undefined
mindestJgAk: string
nummerDerMannschaft: string
veranstaltungsIdStaffel: string
wertungsklasseTyp: 'JG' | 'AK'
```

### VereinsergebnisStaffelZwischenzeit

```ts
readonly distanz: number
readonly line: number
readonly startnummer: number
readonly zeit: number | null
```

### VereinsergebnisStart

```ts
readonly endzeit: number | null
readonly line: number
readonly platzierungen: ReadonlyArray<VereinsergebnisPlatzierung>
readonly reaktionen: ReadonlyArray<VereinsergebnisReaktion>
readonly veranstaltungsId: number
readonly wettkampfart: string
readonly wettkampfnr: number
readonly zwischenzeiten: ReadonlyArray<VereinsergebnisZwischenzeit>
```

### VereinsergebnisStzwischenzeitV7

```ts
distanz: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### VereinsergebnisStzwischenzeitV8

```ts
distanz: string
startnummer: string
veranstaltungsIdStaffel: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zwischenzeit: string
```

### VereinsergebnisVeranstalterV7

```ts
nameDesVeranstalters: string
```

### VereinsergebnisVeranstalterV8

```ts
nameDesVeranstalters: string
```

### VereinsergebnisVeranstaltung

```ts
readonly bahnlaenge: string
readonly bezeichnung: string
readonly ort: string
readonly zeitmessung: string
```

### VereinsergebnisVeranstaltungV7

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### VereinsergebnisVeranstaltungV8

```ts
bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
veranstaltungsbezeichnung: string
veranstaltungsort: string
zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH'
```

### VereinsergebnisVerein

```ts
readonly bezeichnung: string
readonly kennzahl: number
readonly landesschwimmverband: string
readonly line: number
readonly nationenkuerzel: string
```

### VereinsergebnisVereinV7

```ts
landesschwimmverband: string
nationenkuerzel: string
vereinsbezeichnung: string
vereinskennzahl: string
```

### VereinsergebnisVereinV8

```ts
landesschwimmverband: string
nationenkuerzel: string
vereinsbezeichnung: string
vereinskennzahl: string
```

### VereinsergebnisWertung

```ts
readonly geschlecht: string
readonly id: number
readonly line: number
readonly maximalJgAk: string
readonly mindestJgAk: string
readonly name: string
readonly wertungsklasseTyp: string
```

### VereinsergebnisWertungV7

```ts
geschlecht?: 'X' | 'M' | 'W' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
wertungsId: string
wertungsklasseTyp: 'JG' | 'AK'
wertungsname: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisWertungV8

```ts
geschlecht?: 'X' | 'M' | 'W' | 'D' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
wertungsId: string
wertungsklasseTyp: 'JG' | 'AK'
wertungsname: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### VereinsergebnisWettkampf

```ts
readonly abschnittsnr: number
readonly anzahlStarter: string
readonly art: string
readonly ausuebung: string
readonly einzelstrecke: number
readonly geschlecht: string
readonly line: number
readonly nummer: number
readonly qualifikationAus: { readonly nummer: number; readonly art: string; } | null
readonly staffelStarts: ReadonlyArray<VereinsergebnisStaffelStart>
readonly starts: ReadonlyArray<VereinsergebnisStart>
readonly technik: string
readonly wertungen: ReadonlyArray<VereinsergebnisWertung>
readonly zuordnungBestenliste: string
```

### VereinsergebnisWettkampfV7

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX'
```

### VereinsergebnisWettkampfV8

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'KB' | 'KR'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W' | 'D'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX'
```

### VereinsergebnisZwischenzeit

```ts
readonly distanz: number
readonly line: number
readonly zeit: number | null
```

### Vereinsmeldeliste

```ts
readonly __listenart?: 'Vereinsmeldeliste' | undefined
readonly document: DsvDocument
readonly listenart: string
readonly records: ReadonlyArray<TypedRecord>
readonly version: FormatVersion
```

### Vereinsmeldung

```ts
readonly abschnittByNummer: ReadonlyMap<number, MeldungAbschnitt>
readonly abschnitte: ReadonlyArray<MeldungAbschnitt>
readonly ansprechpartner: MeldungAnsprechpartner | null
readonly kampfrichter: ReadonlyArray<MeldungKampfrichter>
readonly kampfrichterByNummer: ReadonlyMap<number, MeldungKampfrichter>
readonly personById: ReadonlyMap<number, MeldungPerson>
readonly personen: ReadonlyArray<MeldungPerson>
readonly staffelById: ReadonlyMap<number, MeldungStaffel>
readonly staffeln: ReadonlyArray<MeldungStaffel>
readonly trainer: ReadonlyArray<MeldungTrainer>
readonly trainerByNummer: ReadonlyMap<number, MeldungTrainer>
readonly veranstaltung: MeldungVeranstaltung
readonly verein: MeldungVerein | null
readonly wettkaempfeOhneAbschnitt: ReadonlyArray<MeldungWettkampf>
readonly wettkampfByKey: ReadonlyMap<string, MeldungWettkampf>
```

### WertungV7

```ts
geschlecht?: 'X' | 'M' | 'W' | 'D' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
wertungsId: string
wertungsklasseTyp: 'JG' | 'AK'
wertungsname: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### WertungV8

```ts
geschlecht?: 'X' | 'M' | 'W' | 'D' | undefined
maximalJgAk?: string | undefined
mindestJgAk: string
wertungsId: string
wertungsklasseTyp: 'JG' | 'AK'
wertungsname: string
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
```

### Wettkampfdefinition

```ts
readonly abschnittByNummer: ReadonlyMap<number, DefinitionAbschnitt>
readonly abschnitte: ReadonlyArray<DefinitionAbschnitt>
readonly veranstaltung: DefinitionVeranstaltung
readonly wertungById: ReadonlyMap<number, DefinitionWertung>
readonly wettkaempfeOhneAbschnitt: ReadonlyArray<DefinitionWettkampf>
readonly wettkampfByKey: ReadonlyMap<string, DefinitionWettkampf>
```

### Wettkampfdefinitionsliste

```ts
readonly __listenart?: 'Wettkampfdefinitionsliste' | undefined
readonly document: DsvDocument
readonly listenart: string
readonly records: ReadonlyArray<TypedRecord>
readonly version: FormatVersion
```

### Wettkampfergebnis

```ts
readonly abschnittByNummer: ReadonlyMap<number, ErgebnisAbschnitt>
readonly abschnitte: ReadonlyArray<ErgebnisAbschnitt>
readonly personById: ReadonlyMap<number, ErgebnisPerson>
readonly staffelByKey: ReadonlyMap<string, ErgebnisStaffel>
readonly startByKey: ReadonlyMap<string, ErgebnisStart>
readonly veranstaltung: ErgebnisVeranstaltung
readonly vereinByKennzahl: ReadonlyMap<number, ErgebnisVerein>
readonly vereine: ReadonlyArray<ErgebnisVerein>
readonly wertungById: ReadonlyMap<number, ErgebnisWertung>
readonly wettkaempfeOhneAbschnitt: ReadonlyArray<ErgebnisWettkampf>
readonly wettkampfByKey: ReadonlyMap<string, ErgebnisWettkampf>
```

### Wettkampfergebnisliste

```ts
readonly __listenart?: 'Wettkampfergebnisliste' | undefined
readonly document: DsvDocument
readonly listenart: string
readonly records: ReadonlyArray<TypedRecord>
readonly version: FormatVersion
```

### WettkampfV7

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX'
```

### WettkampfV8

```ts
abschnittsnr: string
anzahlStarter?: string | undefined
ausuebung: 'X' | 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'KB' | 'KR'
einzelstrecke: string
geschlecht: 'X' | 'M' | 'W' | 'D'
qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | undefined
qualifikationswettkampfnr?: string | undefined
technik: 'X' | 'F' | 'R' | 'B' | 'S' | 'L'
wettkampfart: 'N' | 'V' | 'Z' | 'F' | 'E' | 'A'
wettkampfnr: string
zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX'
```

### WriteOptions

```ts
readonly eol?: '\r\n' | '\n' | undefined
readonly version?: FormatVersion | undefined
```
