# Frontend plan (next slice)

Teacher-facing dictation word-selection demo. Consume the existing API only. Contract: [../api/http-api.md](../api/http-api.md). Constraints: [AGENTS.md](AGENTS.md).

Do not start this work until the HTTP contract file is accepted. Do not change the backend.

## Activity flow (from the API)

```text
GET /api/health          → API is up
POST /api/selections     → create session, visible candidates
GET  /api/selections/:id → refresh the same view
POST /api/selections/:id/actions
        keep    → record only
        remove  → auto-fill from leftover pools
        replace → teacher picks replacementWordId from leftover pools
POST /api/selections/:id/commit → persist event, freeze session
```

Session id lives only in memory (browser state and the Node process). Refresh after an API restart is a 404, not a frontend bug.

## What the UI can show

From the public session view: lemma, score, reasons, leftover `recommendedWords` / `otherWords`, `usedWords`, `committed`.

Not on the wire: phonetic, grade, Chinese gloss, feature catalog, past events. Tag choices use the eight tag ids listed in the HTTP contract. Never send `feat-frequency` / `feat-difficulty`. Preferred tags currently do not change rank (no tag WordFeatures in the dump).

Empty `candidates` for grades 1–2 is a valid 201.

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

`http.ts` only knows how to `fetch` JSON and throw/return `{ error }`. `wordSelectionApi.ts` maps each endpoint (`getHealth`, `createSelection`, `getSelection`, `applyAction`, `commitSelection`). Do not put both layers in one `client.ts`.

`components/` is for controls reused on more than one page (header, error banner, buttons). Keep generate/review/commit-only widgets next to their page under `pages/`. Shared components are the first place to attach later styling.

API I/O stays out of UI components. No ranking/filter logic in the client.

## Pages / workflow

One SPA, **no React Router**. Three steps in React state; `sessionId` in `useState`.

1. **Generate** — selects for activity, scope, grade, term, difficulty, and frequency; a number for count; an optional tag-add section. POST create.
2. **Review** — visible list with remove / replace only. Replace opens a picker over leftover pools. Show `{ error }` from 4xx. Disable after `committed`. Keep is not shown.
3. **Done** — POST commit; show `event.id` and final lemmas.

Health ping on load so a down API is obvious.

## Tools

Vite, React, TypeScript only. `VITE_API_BASE=http://localhost:3000` (CORS is already open). **No** react-router, Zustand, TanStack Query, MUI, or Tailwind in this slice.

Trade-off: a UI kit would look nicer later; it is not needed to demo the contract or collect feedback. A single CSS file is enough for readable type, spacing, header, and a candidate table.

## Styling (later in this slice)

Readable typography, clear spacing, simple header, table/list for candidates, obvious disabled state after commit. Not a design system.

## Incremental build

1. Scaffold `web/` and prove the API client with health. Details below.
2. Generate form → POST `/api/selections`. Details below.
3. Review: remove / replace against leftover pools. Details below. No Keep control.
4. Commit + event summary; CSS polish last.

`otherWords` can be large — a plain list/picker first; search is optional later.

### Step 1 — what gets built

Goal: a Vite app that can call the API and show whether it is up. No generate form, no session, no backend changes.

1. Create `web/` with Vite React + TypeScript (`npm create vite`). No extra libraries.
2. Add `web/.env` (or `.env.example` plus local `.env`) with `VITE_API_BASE=http://localhost:3000`. Ignore local secrets if any; this value is not a secret.
3. **`src/api/types.ts`** — only types this step uses, copied from [http-api.md](../api/http-api.md):
   - `HealthResponse`: `{ ok: boolean; strategyId: string; strategyVersion: string }`
   - `ApiErrorBody`: `{ error: string }`
   Selection context, session view, and commit types wait until step 2, so this file does not hold unused contracts.
4. **`src/api/http.ts`** — one helper, e.g. `requestJson<T>(path, init?)`:
   - prefix `VITE_API_BASE`
   - `Content-Type: application/json` when there is a body
   - if the response is not ok, read `{ error }` and throw an `Error` with that message
   - otherwise return the parsed JSON as `T`
   No selection knowledge here.
5. **`src/api/wordSelectionApi.ts`** — `getHealth(): Promise<HealthResponse>` calling `GET /api/health` through `http.ts`. Other endpoint functions are added in later steps.
6. **`src/App.tsx`** — on load, call `getHealth()`. Show `ok`, `strategyId`, and `strategyVersion`, or the error message if the API is down. No router, no form.
7. Leave `src/components/` and `src/pages/` empty until a real shared or page component exists (step 2). Do not add a placeholder component just to fill the folder.
8. Minimal `styles.css` so the health line is readable. Candidate-table styling stays in step 4.

Check: with the API running, the page shows `RULE_VDEMO` / `1`. With the API stopped, it shows the fetch error, not a blank screen.

### Step 2 — what gets built

Goal: a teacher can fill a dictation context, create a session, and see the visible word list. No keep / remove / replace, no commit, no backend changes. Those stay in steps 3 and 4.

1. **`src/api/types.ts`** — add only the shapes this step sends and reads, from [http-api.md](../api/http-api.md):
   - `VocabularyLevel`: `{ grade: number; term: 1 | 2 | null }`
   - `SelectionContext`: scope, optional `levelRange`, `activity`, `count`, `preferredFeatureIds`, `difficultyPreference`, `frequencyPreference`
   - `CandidateSnapshot`: `{ wordId, lemma, score, reasons }`
   - `SelectionSessionView`: the public session view (`id`, strategy fields, `selectionContext`, `candidates`, `recommendedWords`, `otherWords`, `usedWords`, `committed`)
   Commit / teacher-action types wait until steps 3–4.
2. **`src/api/wordSelectionApi.ts`** — add `createSelection(body: SelectionContext): Promise<SelectionSessionView>` as `POST /api/selections` through `http.ts`. Do not add get, actions, or commit yet.
3. **`src/pages/GenerateForm.tsx`** — the form only. It does not call `fetch`. It calls `onSubmit(context)` that `App` provides. Teachers pick from options; they do not type scope, grade, term, activity, or preferences. There is no options endpoint yet, so lists live in a page-local constant (for example `src/pages/generateOptions.ts`). A later slice can replace that constant with an API call without changing the controls.

   Field order:

   Layout: fields stack vertically. Each field is its own section (`fieldset` + legend).

   Limited choices are **option boxes**, not dropdowns: activity, vocabulary scope, grade, term, difficulty, frequency. Each option is a box (a radio inside a label). The selected box is styled differently from the others. Styling stays plain.

   1. **Activity** — one box, `dictation`, already selected. Still sent as `"dictation"`.
   2. **Vocabulary scope** — one box, `PEP`, already selected. The response scope should come back as `人教版`.
   3. **Grade** — boxes `3`, `4`, `5`, `6`. Default `3`.
   4. **Term** — boxes mapped to the API: `Full year` → `term: null` (default), `上` → `1`, `下` → `2`.
   5. **Count** — the one typed field. Number input, default `10`, limited to 1–50.
   6. **Difficulty** — boxes in order `mixed`, `easy`, `medium`, `hard`. Selected default `mixed`.
   7. **Frequency** — boxes in order `mixed`, `high`, `low`. Selected default stays `high` (API default). `mixed` is the first box, not the selected one.
   8. **Tags** — last, optional. A TAG block that starts empty, with an add button. Each press appends a row whose control is a `<select>` of the eight hardcoded tag ids (`feat-changkao`, `feat-shengpi`, `feat-writing`, and the five `feat-topic-*` ids). Do not offer `feat-frequency` or `feat-difficulty`. A tag already chosen is not offered again. Each row has a remove control so a tag can be dropped. An empty TAG block sends `preferredFeatureIds: []`.

   Grade and Term are one level, not a from/to range on screen. The request sets `levelRange.from` and `levelRange.to` to that same `{ grade, term }`.

   The API still returns 400; the form shows that `error` string and keeps the current selections.
4. **`src/pages/GeneratedList.tsx`** — read-only result after a 201. Show session `id`, echoed `selectionContext.vocabularyScope` (expect `人教版` when the form sent `PEP`), and each candidate’s `lemma`, `score`, and `reasons`. Show leftover pool **counts** only (`recommendedWords.length`, `otherWords.length`). Do not render the full `otherWords` list and do not add action buttons.
5. **`src/App.tsx`** — keep the health line. Hold `session: SelectionSessionView | null`. No session: show `GenerateForm`. After create succeeds: show `GeneratedList` and a way to clear the session and return to the form (that does not call the API). Create errors stay on the form.
6. No new shared component unless the same control is used on both the form and the result. Health and form errors can stay as a `<p className="error">` for now.
7. A few lines in `styles.css` so the form and the candidate list are readable (labels, spacing). Table polish stays in step 4.

Check: submit the default form (PEP, grade 3, full year, count 10, no tags) and see 10 lemmas, scope `人教版`, and a non-zero `otherWords` count. Add one tag, submit again, and see that id in the request. A stopped API shows the fetch error on the form, not a blank page.

### Step 3 — what gets built

Goal: on the generated list, a teacher can remove a word (the API fills the slot) or replace it with a leftover word. No Keep control, no commit button, no backend changes. Commit stays in step 4.

Do not show Keep. The API still accepts `type: "keep"`, but that call does not change the visible list, so a button would look like it did nothing. Keep belongs with a later re-generate or shuffle, when a teacher needs to protect some words. This step does not send `keep`.

1. **`src/api/types.ts`** — add the action body only:
   - `SelectionAction`: `{ type: "remove" | "replace"; wordId: string; replacementWordId?: string }` (`keep` is omitted until a later slice uses it)
   Do not add `TeacherAction` or the commit event type yet. The action response is the existing `SelectionSessionView`.
2. **`src/api/wordSelectionApi.ts`** — add `applyAction(sessionId, body)` as `POST /api/selections/:id/actions` through `http.ts`. Do not add commit.
3. **Rename `src/pages/GeneratedList.tsx` to `src/pages/ReviewList.tsx`.** Same header as now (session id, scope, pool counts, tags) plus actions on each candidate. The page does not call `fetch`. It calls `onAction(body)` that `App` provides.
   - **Remove** — sends `{ type: "remove", wordId }`. The API picks the replacement (75% leftover recommended, 25% other). Replace the whole session with the response. The removed lemma leaves and a new one appears. Do not choose the replacement in the client.
   - **Replace** — one row open at a time. Under that row:
     - Leftover `recommendedWords` as option boxes (same radio-in-a-box pattern as the generate form). This set is small.
     - Leftover `otherWords` as one `<select>`, because that list can be over a hundred words. Search stays out of this step.
     - A confirm control sends `{ type: "replace", wordId, replacementWordId }`. Confirm stays disabled until a leftover word is chosen.
   The picker offers `recommendedWords` and `otherWords` from the latest response. Those pools exclude the current visible list. `otherWords` also includes words that already left the list, so a teacher can choose them again. Automatic remove still skips `usedWords`.
4. **`src/App.tsx`** — on a successful action, replace `session` with the returned view. On failure, leave the list as it is and show the API `error` string on the review page (including 409 when nothing is left to auto-fill). Disable the row buttons while a request is in flight. “New selection” still only clears local state.
5. A few lines in `styles.css` for the row buttons and the open replace section. No new shared component.

Check: generate a grade-3 list and confirm there is no Keep control. Remove a word and see a different lemma in that slot and a smaller leftover count. Replace a word with one chosen from recommended and see that lemma on the list. If a remove comes back 409, the previous list stays and the error text is visible.

### Step 4 — what gets built

Goal: a teacher can freeze the current visible list. The done screen shows the saved event id and those lemmas. Then a light CSS pass on the screens that already exist. No Keep control, no backend changes, no new libraries.

Commit is `POST /api/selections/:id/commit` with a JSON body `{}`. Success is **201** `{ event }`. The event is not the session view. There is no event-list endpoint, so the done screen can only show this response.

1. **`src/api/types.ts`** — add the commit response only, from [http-api.md](../api/http-api.md):
   - `TeacherAction`: `{ type: "keep" | "remove" | "replace"; wordId: string; replacementWordId: string | null; at: string }`
   - `SelectionEvent`: `id`, `selectionContext`, `strategyId`, `strategyVersion`, `initialCandidates`, `finalSelection`, `teacherActions`, `createdAt`. Candidate lists reuse `CandidateSnapshot`.
   - `CommitResponse`: `{ event: SelectionEvent }`
   Do not add a keep action to `SelectionAction`. This step still does not send `keep`.
2. **`src/api/wordSelectionApi.ts`** — add `commitSelection(sessionId): Promise<CommitResponse>` as `POST /api/selections/:id/commit` with body `{}` through `http.ts`. Do not add `getSelection`. The 201 body is enough.
3. **`src/pages/ReviewList.tsx`** — add one **Commit list** button under the candidate list, beside **New selection**. It calls `onCommit()` that `App` provides. No request inside the page. Disable it, and the row buttons, while a request is in flight. An empty visible list can still be committed. Do not add Keep.
4. **`src/pages/CommitSummary.tsx`** — the done screen. It does not call `fetch`. `App` passes the `SelectionEvent`.
   - Show `event.id` (it starts with `evt_`) and `createdAt`.
   - Show `finalSelection` in order: each row is the lemma and its score. This is the list that was visible when the teacher committed.
   - Omit `reasons`, `initialCandidates`, and `teacherActions`. Reasons are the ranker trace. Actions store word ids, and this UI never sends keep, so that log is not the summary.
   - One line that the list is saved and remove / replace are closed.
   - **New selection** clears local state and returns to the form. It does not call the API and does not undo the saved event.
5. **`src/App.tsx`** — hold `event: SelectionEvent | null`. Review stays up until commit succeeds. On 201, store `event` and show `CommitSummary` instead of `ReviewList`. Also mark the local session `committed: true`. On failure, stay on the review list and show the API `error` string (404 if the session is gone, 409 `Session already committed.`). **New selection** clears both `session` and `event`.
6. **CSS polish last**, in the same `styles.css`, after the commit flow works. Keep the current option boxes and ordered list. Do not switch the list to an HTML table and do not add a shared component.
   - Slightly clearer page spacing and a done heading.
   - The saved list should be as easy to scan as the review list.
   - Buttons that are disabled (in-flight request, or after leaving review) should look disabled.

Check: generate a grade-3 list, change it once with remove or replace, then commit. The done screen shows an `evt_` id and the same lemmas that were on the review list, in the same order. **New selection** returns to the form. Commit with no edits still succeeds. The done screen has no second commit button. If the API is stopped, the error stays on the review page and the list does not change.
