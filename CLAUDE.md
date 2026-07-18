# CLAUDE.md

## Projekt

`@schroeer-haren/dsv` – TypeScript-Bibliothek zum Parsen und Erzeugen von
DSV-Dateien (Deutscher Schwimm-Verband), Formate DSV7 und DSV8.

Status: frühe Entwicklung. Es existiert bisher nur das Grundgerüst.

## Spezifikationen

Die offiziellen DSV-Standards liegen als PDF in `spec/`. Der Ordner ist
**gitignored** (die PDFs gehören dem DSV und werden nicht mitverteilt) und muss
nach dem Klonen einmalig befüllt werden:

```bash
mkdir -p spec
curl -L -o spec/dsv7.pdf "https://www.dsv.de/download-file?file_code=b991de636e&file_id=1258"
curl -L -o spec/dsv8.pdf "https://www.dsv.de/download-file?file_code=9fbdf74a1f&file_id=10922"

# Markdown-Fassungen zum Durchsuchen erzeugen (markitdown, via pipx/uv installierbar)
markitdown spec/dsv7.pdf -o spec/dsv7.md
markitdown spec/dsv8.pdf -o spec/dsv8.md
```

- **DSV7** – „DSV Standard", Stand 31.08.2022, gültig ab 01.01.2023, 50 Seiten
  – `spec/dsv7.pdf`, als Markdown `spec/dsv7.md`
- **DSV8** – „DSV Standard", Stand 14.03.2026, gültig ab 01.08.2026, 52 Seiten
  – `spec/dsv8.pdf`, als Markdown `spec/dsv8.md`

Für Recherche im Alltag die `.md`-Fassungen nutzen – die sind direkt mit Read
und Grep durchsuchbar. Bei Tabellen und exakter Feldreihenfolge im Zweifel
gegen das PDF gegenprüfen: die Konvertierung glättet manche Layout-Tabellen.

Übergangsfrist: DSV7 darf noch bis 31.12.2026 genutzt werden, ab 01.01.2027 gilt
ausschließlich DSV8. Die Bibliothek muss daher beide Formate lesen und schreiben
können.

Beide PDFs sind auf der DSV-Seite unter
[Service → Formulare → Schwimmen](https://www.dsv.de/de/service/formulare/schwimmen/)
verlinkt (Abschnitt „DSV-Standard zur Datenübermittlung"). Falls die
`file_id`-Links irgendwann brechen, dort die aktuellen Downloads suchen.

Nachschlagen, z. B.:

```bash
grep -n -A20 "Wettkampfdefinitionsliste" spec/dsv8.md
diff spec/dsv7.md spec/dsv8.md | less   # Unterschiede zwischen den Formaten
```

## Stack

- TypeScript (strict), ESM als Quellformat
- Build: `tsup` → `dist/` mit ESM + CJS + Type-Declarations
- Tests: `vitest`
- Node >= 18

## Befehle

```bash
npm run build       # tsup → dist/
npm run lint        # eslint .
npm run lint:fix    # eslint . --fix
npm run format      # prettier --write .
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run check       # lint + typecheck + test
```

CI (`.github/workflows/ci.yml`) führt Build, Lint, Typecheck und Test bei jedem
Push und Pull-Request auf `main` aus.

## Konventionen

- **Code, Bezeichner und öffentliche API auf Englisch**; Doc-Kommentare und
  README auf Deutsch. DSV-Fachbegriffe (z. B. `Wettkampfdefinitionsliste`)
  bleiben in ihrer Originalform.
- Deutsche Texte immer mit korrekten Umlauten (ä, ö, ü, ß) – keine
  ASCII-Ersatzschreibweisen.
- Relative Imports mit `.js`-Endung schreiben (ESM/`verbatimModuleSyntax`).
- Neue öffentliche Funktionen brauchen einen Test in `test/`.
- Vor dem Commit: `npm run typecheck && npm test`.

## Commits

**Conventional Commits**, Betreffzeile auf Englisch, Imperativ, klein
geschrieben, ohne Punkt am Ende.

```
feat: add DSV7 competition list parser
fix: handle trailing separator in empty lines
chore: bump vitest to 2.1.8
docs: describe DSV8 roadmap
test: cover parseLine edge cases
```

Übliche Typen: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`.
Breaking Changes mit `!` markieren (`feat!: ...`) und im Body als
`BREAKING CHANGE:` beschreiben.

## Versionierung & Release

SemVer. Solange `0.x`: Breaking Changes erhöhen die Minor-Version.

Releases laufen über GitHub Actions, **nicht** über lokales `npm publish`:

1. Sicherstellen, dass `main` grün ist (`npm run check`).
2. GitHub-Release mit Tag `vX.Y.Z` anlegen:
   ```bash
   gh release create v0.1.0 --title v0.1.0 --generate-notes
   ```
3. Der `Release`-Workflow (`.github/workflows/release.yml`) setzt die Version aus
   dem Tag (`npm version --no-git-tag-version`), baut, prüft und veröffentlicht
   via **npm Trusted Publishing (OIDC)** mit Provenance.

Die `version` in der `package.json` wird also **nicht** manuell hochgezählt und
nicht committet – der Tag ist die Quelle der Wahrheit. Es gibt kein npm-Token im
Repository; die Vertrauensbeziehung ist auf npmjs.com für Workflow `release.yml`
hinterlegt.
