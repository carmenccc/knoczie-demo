# Architecture (demo API)

Backend layout for the smallest runnable Vocabulary Selection API.

Related: [description.md](description.md), [data-model.md](data-model.md), [algorithm.md](algorithm.md), **[http-api.md](http-api.md)** (HTTP contract).

Stack: **Node.js + TypeScript + Express**. Data: **JSON files** under `api/data/`. Sessions: **in-memory**.

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

The ranker must not import Express. The store must not contain scoring logic. Routes, bodies, and status codes are specified only in [http-api.md](http-api.md).

## Config

`api/src/config/index.ts`:

- `port` (default 3000; override with `PORT`)
- `strategyId` / `strategyVersion` (`RULE_VDEMO` / `1`)

JSON files are read from `api/data/` in `jsonStore` (not a config field). Recommend-pool size is `min(eligible, max(2 × count, count + 10))` in the sampler.

## What this slice leaves out

- Automated tests
- PostgreSQL
- Auth
- LLM generation of seed at runtime (seed files are checked in)
- Restart-safe sessions (memory only; restart drops unfinished reviews)
- Extra HTTP resources (`GET /features`, list events) — see [http-api.md](http-api.md)

## Later swap

`JsonStore` methods (`loadPool`, `appendEvent`) are the seam. A Postgres store would keep the same TypeScript entity types as [data-model.md](data-model.md).
