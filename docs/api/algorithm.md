# Algorithm: RULE_VDEMO v1

Implementable ranking spec for the demo API.

Related: [description.md](description.md), [ranking-expectations.md](ranking-expectations.md), [data-model.md](data-model.md), [architecture.md](architecture.md), [http-api.md](http-api.md).

Strategy: `id = RULE_VDEMO`, `version = 1`.

Closed-pool **filter → assess → rank**. Filter is hard eligibility on the **word’s own scope**. Assess is a single `contextFit` (tag match plus optional difficulty and frequency). Rank is that score. This is not machine learning.

## Pipeline

```text
SelectionContext
    → load closed pool
    → Filter (Word.vocabularyScope, Word.grade/term)
    → Assess (contextFit)
    → Rank (contextFit, then lemma)
    → recommendedWords = top R (R = min(eligible, max(2×count, count+10)))
    → otherWords = remaining eligible
    → visible = random sample of count from recommendedWords (order shuffled)
```

If fewer than `count` words survive the filter, return all survivors as `visible` and empty leftover pools. Do not pad with ineligible words. Preferred features never drop a candidate. Sampling lives in `api/src/services/sampler/`; it does not change scores.

---

## Stage 1: Filter

Eligibility compares the request to the **word itself**. It does **not** read `WordFeature`.

A word is eligible only if **all** of the following hold.

1. **Scope.** `Word.vocabularyScope` equals `SelectionContext.vocabularyScope` (after the `PEP` → `人教版` alias).
2. **Level range.** If `levelRange` is set, the word’s `{ grade, term }` overlaps `[from, to]`. `term: null` on the request or the word means the full school year. If `levelRange` is omitted, any grade/term is allowed.

`activity` must be `dictation`; that is request validation, not a pool loop.

---

## Stage 2: Assess (`contextFit`)

`contextFit` is overall suitability for the current `SelectionContext`. It is a mean of **active** factors (equal weights). Missing score data never makes a word ineligible.

### Tag factor (always active)

Let `P` = unique `preferredFeatureIds`, `W` = tag `featureId`s on the word.

- If `P` is empty: tagFit = 1
- Else: tagFit = `|P ∩ W| / |P|`

### Difficulty factor

Active only when `difficultyPreference` is not `mixed` (default is `mixed` → skipped).

- Prefer `feat-difficulty` score WordFeature (`value` in 0–1; higher = harder).
- Else derive a heuristic from lemma length and `syllableCount`.
- `easy` → `1 - difficulty`; `hard` → `difficulty`; `medium` → closer to 0.5 is better.

### Frequency factor

Active only when `frequencyPreference` is not `mixed` (default is `high`).

- Prefer `feat-frequency` score WordFeature (`value` in 0–1; higher = more frequent).
- If missing: 0.5 (neutral).
- `high` → `frequency`; `low` → `1 - frequency`.

`score = contextFit`. Reasons include `contextFit:…`, `tag:…`, `difficulty:…`, `frequency:…`.

Unknown preferred ids are rejected at validation (400), not scored.

---

## Stage 3: Rank

Sort by `score` descending, then `lemma` ascending. That order only defines the recommend prefix; it is not the visible list.

- `recommendedWords` = first `R` items, `R = min(eligible, max(2 × count, count + 10))`
- `otherWords` = the rest
- `visible` = uniform sample of `count` from `recommendedWords` (random membership and order)
- leftover recommended stay in `recommendedWords`
- `usedWords` = ids currently (or previously) on `visible` in this session

---

## Teacher review

Actions apply to the current `SelectionSession`.

| Action | Behavior |
| --- | --- |
| `keep` | Record `{ type: keep, wordId }`. Word stays in `visible`. |
| `remove` | Auto-fill the slot: 75% remaining `recommendedWords`, 25% remaining `otherWords`; skip `usedWords`; if the chosen pool is empty, use the other. Park the removed word in `otherWords`. Record `{ type: remove, wordId, replacementWordId }`. |
| `replace` | Teacher supplies `replacementWordId` from leftover `recommendedWords` or `otherWords`, including words already in `usedWords`. Not a word currently on `visible`. Park the outgoing word in `otherWords`. Record `{ type: replace, wordId, replacementWordId }`. |

Rules:

- Unknown `wordId` in `visible` → 404-style error for that action.
- `replace` without `replacementWordId` → 400.
- No unused leftover words on `remove` → 409; list unchanged.
- Manual replace of an unknown id → 404; list unchanged. A used id that was parked in `otherWords` is allowed.
- Duplicate keep is allowed and appends another keep action (demo does not dedupe).
- After `committed === true`, no actions.

---

## Commit

Freeze `visible` as `finalSelection`. Append a `SelectionEvent` with:

- `selectionContext` snapshot
- `strategyId` / `strategyVersion`
- `initialCandidates` captured at generate time (store on the session)
- `finalSelection` from current `visible`
- `teacherActions`
- `createdAt`

Mark the session committed.

---

## Out of scope for v1

- Machine learning or LLM re-ranking
- Persisted Assessment rows
- `examFit` / `dictationFit` / `topicFit`
- `requiredFeatureIds` (hard feature constraints)
- Using lemma length / syllable count except as a difficulty heuristic when no score exists
- Inventing words when leftover pools are empty
- Activities other than dictation
