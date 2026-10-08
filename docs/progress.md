# Implementation progress

Tracks the **backend API demo** against the formal specs. Automated tests are intentionally out of scope.

## Documentation

| Item | Status |
| --- | --- |
| [description.md](description.md) product slice | Done (pre-existing, cross-linked) |
| [domain-models.md](domain-models.md) conceptual domain | Done (pre-existing) |
| [ranking-expectations.md](ranking-expectations.md) ranking intent | Done (pre-existing) |
| [data-model.md](data-model.md) formal entities + JSON map | Done |
| [algorithm.md](algorithm.md) RULE_VDEMO v1 | Done |
| [architecture.md](architecture.md) Express + JSON | Done |

## API (runnable)

How to run: see [api/README.md](../api/README.md).

| Item | Status | Notes |
| --- | --- | --- |
| Express + TypeScript bootstrap | Done | `api/src/index.ts` |
| JSON seed pool (LLM-labelled, `source=LLM`) | Done | `npm run seed` writes `api/data/*.json` |
| `GET /api/health` | Done | |
| `POST /api/selections` | Done | Hard filter vocabularyScope + levelRange; rank by contextFit; `PEP` aliases `人教版` |
| `GET /api/selections/:id` | Done | Visible list plus leftover `recommendedWords` / `otherWords` |
| `POST /api/selections/:id/actions` | Done | keep / remove / replace |
| `POST /api/selections/:id/commit` | Done | Appends `selection-events.json` |
| In-memory `SelectionSession` | Done | Lost on process restart |
| `JsonStore` load pool + append events | Done | |
| `RuleVDemoRanker` | Done | `contextFit` from tags + optional difficulty/frequency |
| `WordChTranslations` | Done | JSON collection; empty seed for now |

## Left blank / not in this demo

| Item | Status | Why |
| --- | --- | --- |
| Automated tests | Skipped | Fast stakeholder demo |
| PostgreSQL | Not started | JSON files first |
| Auth | Not started | Single local demo |
| Frontend `web/` | Not started | Backend-only slice |
| Restart-safe sessions | Not started | Memory map is enough for a live demo |
| Runtime LLM seed generation | Not started | Static seed files instead |
| Activities other than `dictation` | Not started | Spec v1 |
| Extra HTTP resources (`GET /features`, list events) | Not started | Not required to generate → edit → save |
| `middleware/` folder usage | Empty | Error handler lives in the controller file |

## Suggested next slices (not started)

1. Tiny teacher UI that calls the four selection endpoints.
2. Swap `JsonStore` for Postgres with the same types.
3. Inspect `selection-events.json` with the studio stakeholder and adjust RULE_VDEMO `contextFit` (bump version).
