# Tooling: Playwright CLI

Stand: 2026-02-11

## Ziel

`playwright-cli` wird in diesem Projekt für agentische UI-Arbeit genutzt:

- reale Browser-Interaktion gegen lokale oder externe Seiten
- reproduzierbare Snapshots/Screenshots für Design-Reviews
- schrittweiser Ausbau der Website mit messbaren Artefakten

## Installation (verifiziert)

```bash
npm install -g @playwright/cli@latest
playwright-cli --version
```

Im Workspace wurden Skills installiert:

```bash
playwright-cli install --skills
```

Ergebnis:

- `.claude/skills/playwright-cli/SKILL.md`
- `.claude/skills/playwright-cli/references/*`

## Gelesene Doku-Basis

- NPM/README von `@playwright/cli` (Install, Demo, Commands, Sessions)
- `.claude/skills/playwright-cli/SKILL.md`
- `.claude/skills/playwright-cli/references/session-management.md`
- `.claude/skills/playwright-cli/references/tracing.md`

## Verifizierte Demo

Demo-Ziel: TodoMVC-Flow automatisiert ausführen und Artefakt erzeugen.

```bash
playwright-cli -s=fintech-demo open https://demo.playwright.dev/todomvc
playwright-cli -s=fintech-demo snapshot
playwright-cli -s=fintech-demo type "Buy groceries"
playwright-cli -s=fintech-demo press Enter
playwright-cli -s=fintech-demo type "Water flowers"
playwright-cli -s=fintech-demo press Enter
playwright-cli -s=fintech-demo snapshot
playwright-cli -s=fintech-demo check e21
playwright-cli -s=fintech-demo screenshot --filename=output/playwright/playwright-cli-todomvc-demo.png
playwright-cli -s=fintech-demo close
```

Artefakt:

- `output/playwright/playwright-cli-todomvc-demo.png`

## Standard-Workflow für diese Website

1. Local server starten (`npm run dev -- --port 3000` oder gewählter Port).
2. Seite öffnen:
   - `playwright-cli -s=fintech-site open http://127.0.0.1:3000/en`
3. Snapshot ziehen:
   - `playwright-cli -s=fintech-site snapshot`
4. Interaktionen über aktuelle `ref`-IDs aus Snapshot fahren.
5. Nach Navigation/UI-Änderung erneut `snapshot`.
6. Review-Artefakte in `output/playwright/` schreiben.
7. Session sauber schließen:
   - `playwright-cli -s=fintech-site close`

## Regeln für den Ausbau

- Immer mit benannten Sessions arbeiten (`-s=fintech-<scope>`).
- Keine neuen Top-Level-Ordner für Artefakte; nur `output/playwright/`.
- Bei instabilen Flows `tracing-start`/`tracing-stop` für Debug.
- Nach jedem Ausbau-Schritt Screenshot + Status-Update in `STATUS.md`.

## Nützliche Diagnose-Befehle

```bash
playwright-cli list
playwright-cli close-all
playwright-cli kill-all
```

Wenn `ref`-IDs nicht mehr gültig sind: sofort neues `snapshot` erzeugen.
