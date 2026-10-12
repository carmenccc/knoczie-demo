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
| [architecture.md](architecture.md) Express layout | Done |
| [http-api.md](http-api.md) HTTP contract | Done |

## API (runnable)

How to run: see [api/README.md](../../api/README.md). HTTP surface: [http-api.md](http-api.md).

| Item | Status | Notes |
| --- | --- | --- |
| Express + TypeScript bootstrap | Done | `api/src/index.ts` |
| JSON word pool | Done | Extracted `LinXueyuanStdio` files under `api/data/` |
| HTTP endpoints | Done | Specified in [http-api.md](http-api.md) |
| In-memory `SelectionSession` | Done | Lost on process restart |
| `JsonStore` load pool + append events | Done | |
| `RuleVDemoRanker` | Done | `contextFit` from tags + optional difficulty/frequency |
| `WordChTranslations` | Done | JSON collection filled; **not** exposed over HTTP |

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

1. Teacher UI — draft in [../frontend/plan_v0.md](../frontend/plan_v0.md).
2. Swap `JsonStore` for Postgres with the same types.
3. Inspect `selection-events.json` with the studio stakeholder and adjust RULE_VDEMO `contextFit` (bump version).
