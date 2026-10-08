# Architecture (demo API)

Backend layout for the smallest runnable Vocabulary Selection API.

Related: [description.md](description.md), [data-model.md](data-model.md), [algorithm.md](algorithm.md).

Stack: **Node.js + TypeScript + Express**. Data: **JSON files** under `api/data/`. Sessions: **in-memory**.

Frontend (`web/`) is out of scope for this slice.

## Folder layout

```text
api/
  package.json
  tsconfig.json
  data/                 # JSON collections
  src/
    index.ts            # Express listen
    config/
    models/             # TypeScript types
    routes/
    controllers/
    middleware/
    services/           # SelectionService + RuleVDemoRanker + sampler/
    store/              # JsonStore
    utils/
```

## Layers

```text
HTTP route
  → controller (parse request, status codes)
    → SelectionService (session lifecycle)
         → RuleVDemoRanker (pure filter / assess / rank)
         → sampler/wordSampler (recommend split + random sample + auto-replace)
         → JsonStore (read pool, append events)
```

The ranker must not import Express. The store must not contain scoring logic.

## HTTP API

Base path: `/api`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Process is up |
| POST | `/selections` | Create session; run RULE_VDEMO |
| GET | `/selections/:id` | Read session (visible + leftover pools) |
| POST | `/selections/:id/actions` | keep / remove (auto) / replace (teacher-chosen) |
| POST | `/selections/:id/commit` | Persist SelectionEvent |

### POST `/api/selections`

Body: `SelectionContext`.

201 response (shape):

```json
{
  "id": "sel_...",
  "strategyId": "RULE_VDEMO",
  "strategyVersion": "1",
  "selectionContext": {},
  "candidates": [{ "wordId": "", "lemma": "", "score": 0, "reasons": [] }],
  "recommendedWords": [],
  "otherWords": [],
  "usedWords": []
}
```

Leftover `recommendedWords` and `otherWords` are returned as snapshots so a teacher can pick a manual replacement. `usedWords` is the session id list (visible + previously removed/replaced).

### POST `/api/selections/:id/actions`

Body: `{ "type": "keep" | "remove" | "replace", "wordId": "...", "replacementWordId": "..." }`.

`replacementWordId` is required only for `replace`. `remove` auto-samples 75/25 from leftover pools.

200: updated session view (same shape as GET, without committed event id).

### POST `/api/selections/:id/commit`

201: `{ "event": SelectionEvent }`.

## Errors

| Status | When |
| --- | --- |
| 400 | Invalid context or action body |
| 404 | Unknown session, word not on the visible list, or unknown replacementWordId |
| 409 | No unused leftovers on remove, used replacementWordId, or session already committed |

## Config

`api/src/config/index.ts`:

- `port` (default 3000)
- `dataDir` (default `api/data`)
- `strategyId` / `strategyVersion`
- recommend pool size: `min(eligible, max(2 × count, count + 10))` (sampler, not env)

## What this slice leaves out

- Automated tests
- PostgreSQL
- Auth
- LLM generation of seed at runtime (seed files are checked in)
- Restart-safe sessions (memory only; restart drops unfinished reviews)

## Later swap

`JsonStore` methods (`loadPool`, `appendEvent`) are the seam. A Postgres store would keep the same TypeScript entity types as `docs/data-model.md`.
