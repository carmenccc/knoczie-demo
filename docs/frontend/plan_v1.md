# Frontend plan (next slice)

Redesign teacher-facing dictation word-selection frontend in current project (under web folder). Consume the existing API only. Contract: [../api/http-api.md](../api/http-api.md). Constraints: [AGENTS.md]. 

## App design
This work-selection app is a feature of a language learning app. Even though we only have this function working, I would like to build a basic navigatable frontend for the entire app, so we have a decent demo, and have an entry point for this feature. Check these other documents for building out the framework of the app: 
Product Brief: [PRODUCT_BRIEF.md](../frontend/PRODUCT_BRIEF.md). Design: [APP_DESIGN.md](../frontend/APP_DESIGN.md).

## Main Activity Flow (from the API)

```text
GET /api/health          → API is up
POST /api/selections     → create session, visible candidates
GET  /api/selections/:id → refresh the same view
POST /api/selections/:id/actions
        remove  → auto-fill from leftover pools
        replace → teacher picks replacementWordId from leftover pools
POST /api/selections/:id/commit → persist event, freeze session
```

Session id lives only in memory (browser state and the Node process). Refresh after an API restart is a 404, not a frontend bug.

## What the UI can show about a vocabulary candidate

From the public session view: lemma, grade, reasons, leftover `recommendedWords` / `otherWords`, `usedWords`, `committed`.

Without available data but can be shown using place-holder text: Chinese gloss, feature catalog. Tag choices use the eight tag ids listed in the HTTP contract. Never send `feat-frequency` / `feat-difficulty`. Preferred tags currently do not change rank (no tag WordFeatures in the dump).

Don't change important behavior in the Main Activity Flow, only add placeholder data when the elements are behavior is new and data is not available.

## Project structure

```text
web/                          # Vite + React + TypeScript
  src/api/http.ts             # generic request helper (base URL, JSON, error envelope)
  src/api/wordSelectionApi.ts # typed selection/health calls from http-api.md
  src/api/types.ts            # request/response shapes from http-api.md
  src/components/             # reusable UI shared across pages (later styling hooks here)
  src/pages/                  # page screens and page-specific components
  src/App.tsx                 # step: form | review | done
  src/styles.css              # one demo stylesheet
```
Not exhaustive, modifiable as long as it follows conventions. The principle is try to break code into files with clear responsibility to follow best code practice. For example:

- `http.ts` only knows how to `fetch` JSON and throw/return `{ error }`. `wordSelectionApi.ts` maps each endpoint (`getHealth`, `createSelection`, `getSelection`, `applyAction`, `commitSelection`). Do not put both layers in one `client.ts`.
- `components/` is for controls reused on more than one page (header, error banner, buttons). Keep generate/review/commit-only widgets next to their page under `pages/`. Shared components are the first place to attach later styling.
- API I/O stays out of UI components. No ranking/filter logic in the client.

## Tools

Vite, React, TypeScript. `VITE_API_BASE=http://localhost:3000` (CORS is already open). Use UI component library where you see clear benefits.
