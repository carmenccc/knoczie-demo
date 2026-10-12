# HTTP API contract

Client-facing contract for the Vocabulary Selection demo. Implementations (including `web/`) must follow this file, not `architecture.md`.

Verified against the Express handlers in `api/src/` (routes, `selectionService`, `jsonStore`). Ranking rules live in [algorithm.md](algorithm.md). Entities live in [data-model.md](data-model.md).

## Basics

| Item | Value |
| --- | --- |
| Base URL (local) | `http://localhost:3000` |
| JSON | Request and response bodies are JSON (`Content-Type: application/json`) |
| CORS | Enabled for all origins (`cors()` with no allowlist) |
| Auth | None |
| Sessions | In-process memory. A process restart invalidates every `sel_…` id (404). |
| Strategy | `RULE_VDEMO` version `1` (also returned from health) |

Error envelope for **all** 4xx and 5xx bodies:

```json
{ "error": "human-readable message" }
```

There is no pagination, no `GET /features`, no `GET /selections` list, and no HTTP access to translations or the word pool. Clients that need tag ids should use the catalog in [Known tag Feature ids](#known-tag-feature-ids).

---

## Endpoints

### GET `/api/health`

Activity: process liveness and which ranker is wired.

**Request:** no body.

**200**

```json
{
  "ok": true,
  "strategyId": "RULE_VDEMO",
  "strategyVersion": "1"
}
```

---

### POST `/api/selections`

Activity: validate context → filter/assess/rank → sample a visible list → create an in-memory session.

**201** body is the [public session view](#public-session-view).

#### Request body (`SelectionContext`)

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `vocabularyScope` | string | yes | Non-empty. `PEP` and `pep` are stored as `人教版`. Any other string is stored as trimmed. |
| `levelRange` | object | no | If omitted, any grade/term is eligible. If present, must have `from` and `to`. |
| `levelRange.from` / `to` | object | with range | `{ "grade": 1–6 integer, "term": 1 \| 2 \| null }`. `term: null` means the full school year. `from` must be at or before `to`. |
| `activity` | string | yes | Must be `"dictation"`. |
| `count` | integer | yes | 1–50 inclusive. |
| `preferredFeatureIds` | string[] | no | Default `[]`. Unique tag Feature ids only. Unknown id or a **score** id → 400. |
| `difficultyPreference` | string | no | `easy` \| `medium` \| `mixed` \| `hard`. Default `mixed`. Alias `midium` → `medium`. |
| `frequencyPreference` | string | no | `high` \| `mixed` \| `low`. Default `high`. |

Rejected keys (400 if present): `topic`, `requiredFeatureIds`.

Example:

```json
{
  "vocabularyScope": "PEP",
  "levelRange": {
    "from": { "grade": 3, "term": null },
    "to": { "grade": 3, "term": null }
  },
  "activity": "dictation",
  "count": 10,
  "preferredFeatureIds": ["feat-changkao"],
  "difficultyPreference": "mixed",
  "frequencyPreference": "high"
}
```

The response `selectionContext.vocabularyScope` will be `人教版` when the request used `PEP`.

If fewer than `count` words survive the hard filter, `candidates` is that shorter list and leftover pools are empty. That is success (201), not an error. This corpus has grades **3–6** only.

---

### GET `/api/selections/:id`

Activity: re-read the same public session view. Buffer internals are not hidden behind a count; leftover pools are included.

**200** [public session view](#public-session-view).

**404** unknown session id (never created, or server restarted).

---

### POST `/api/selections/:id/actions`

Activity: teacher review. Mutates the session; returns the updated public view.

#### Request body

| Field | Type | Required |
| --- | --- | --- |
| `type` | `"keep"` \| `"remove"` \| `"replace"` | yes |
| `wordId` | string | yes — must be on the current `candidates` list |
| `replacementWordId` | string | **required when `type` is `replace`**; ignored for keep/remove |

| `type` | Behavior |
| --- | --- |
| `keep` | Append a keep action. Visible list unchanged. |
| `remove` | Replace that slot with one unused leftover word: 75% `recommendedWords`, 25% `otherWords`; if the chosen pool is empty, use the other. Skip ids in `usedWords`. The removed word is parked in `otherWords` and will not auto-return. |
| `replace` | Teacher-chosen swap. `replacementWordId` may be any word in leftover `recommendedWords` or `otherWords`, including ids already in `usedWords`. It must not be on the current visible list. |

**200** [public session view](#public-session-view).

---

### POST `/api/selections/:id/commit`

Activity: freeze the visible list, append a `SelectionEvent` to `api/data/selection-events.json`, mark the session committed. Further actions → 409.

**Request:** no body required.

**201**

```json
{
  "event": {
    "id": "evt_...",
    "selectionContext": {},
    "strategyId": "RULE_VDEMO",
    "strategyVersion": "1",
    "initialCandidates": [{ "wordId": "", "lemma": "", "score": 0, "reasons": [] }],
    "finalSelection": [{ "wordId": "", "lemma": "", "score": 0, "reasons": [] }],
    "teacherActions": [
      { "type": "keep", "wordId": "", "replacementWordId": null, "at": "2026-10-07T00:00:00.000Z" }
    ],
    "createdAt": "2026-10-07T00:00:00.000Z"
  }
}
```

`GET` after commit still returns the session with `"committed": true`. There is no HTTP list of events.

---

## Public session view

Returned by create (201), get (200), and actions (200).

```json
{
  "id": "sel_...",
  "strategyId": "RULE_VDEMO",
  "strategyVersion": "1",
  "selectionContext": {},
  "candidates": [{ "wordId": "", "lemma": "", "score": 0, "reasons": [] }],
  "recommendedWords": [],
  "otherWords": [],
  "usedWords": [],
  "committed": false
}
```

| Field | Meaning |
| --- | --- |
| `candidates` | Current visible list (length ≤ `count`) |
| `recommendedWords` | Leftover top-ranked pool after the initial sample |
| `otherWords` | Remaining eligible words, including words that already left the visible list (can be large) |
| `usedWords` | Ids that have appeared on visible, including removed/replaced. Blocks automatic fill only. |

**Candidate snapshot** (`candidates`, leftover pools, event lists):

| Field | Type | Notes |
| --- | --- | --- |
| `wordId` | string | e.g. `word_cat` |
| `lemma` | string | Headword |
| `score` | number | `contextFit` in 0–1 |
| `reasons` | string[] | Ranker trace (`contextFit:…`, `tag:…`, …) |

Not on this payload: phonetic, grade, term, Chinese gloss, `assessment` object, `createdAt`, `initialCandidates`, `teacherActions`.

---

## Status codes

| Status | When |
| --- | --- |
| 200 | GET health, GET session, POST actions |
| 201 | POST selections, POST commit |
| 400 | Invalid JSON body, invalid context, missing action fields, replace target already visible |
| 404 | Unknown session; `wordId` not on visible; `replacementWordId` not in leftover pools |
| 409 | Session already committed; no unused leftovers on remove |
| 500 | Unexpected server error |

Representative `error` strings (exact text from the server):

- `activity must be dictation.`
- `count must be an integer from 1 to 50.`
- `preferredFeatureIds must be tag features, not scores.`
- `Unknown preferredFeatureId: …`
- `replacementWordId is required for replace.`
- `Unknown selection session.`
- `Word is not on the visible list.`
- `No unused words left for automatic replacement.`
- `Session already committed.`

---

## Known tag Feature ids

There is no `GET /features`. For `preferredFeatureIds` the live catalog tags are:

| id | name |
| --- | --- |
| `feat-changkao` | 常考词 |
| `feat-shengpi` | 生僻词 |
| `feat-writing` | 写作词汇 |
| `feat-topic-animals` | animals |
| `feat-topic-school` | school |
| `feat-topic-environment` | environment |
| `feat-topic-family` | family |
| `feat-topic-food` | food |

Do **not** send `feat-frequency` or `feat-difficulty` (type `score` → 400).

In the current JSON dump, tag `WordFeature` rows are empty, so preferred tags validate but do not change ranking. Difficulty/frequency **scores** are present and do affect `contextFit` when those preferences are not `mixed`.

---

## Client notes

- Keep the `id` from create; later calls need it. The client cannot recover a session after refresh if the process restarted.
- `otherWords` may contain hundreds of snapshots; a picker should expect a long list.
- Chinese translations exist in `api/data/word-ch-translations.json` but are **not** exposed over HTTP.
- Ranker and sampler behavior: [algorithm.md](algorithm.md).
