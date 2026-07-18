# CLAUDE.md

## Projekt

`@schroeer-haren/dsv` – TypeScript-Bibliothek zum Parsen und Erzeugen von
DSV-Dateien (Deutscher Schwimm-Verband), Formate DSV7 und DSV8.

Status: frühe Entwicklung. Es existiert bisher nur das Grundgerüst.

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
