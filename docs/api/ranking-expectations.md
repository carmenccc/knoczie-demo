This document defines how the current data model is expected to participate in the vocabulary selection algorithm.

The demo version algorithm is a intentionally simple and interpretable. It should also avoid complicated math or abstractions considering developer knowledge limitation.

The expected MVP pipeline is: Candidate Pool -> Filter -> Assess -> Top-N Candidates

# RULE_VDEMO

Strategy id: RULE_VDEMO / version 1.

The expected MVP pipeline is: SelectionContext -> Candidate Pool -> Filter -> Assess -> Top-N Candidates

## Stage 1: Filter

The Filter stage determines whether a Word is eligible to participate in ranking. The purpose of filtering is to apply **hard constraints**, rather than to determine how desirable a word is.

Typical filtering information comes from:

- Word (`vocabularyScope`, `grade`, `term`)
- SelectionContext.vocabularyScope and levelRange

`WordFeature` is **not** a hard-filter input in v1.

## Stage 2: Assess

The Assessment stage evaluates how well each remaining Word fits the current SelectionContext.

Unlike filtering, Assessment should produce a degree of suitability rather than a simple yes/no result.

Conceptually:

```text
Word
  +
WordFeature (tags and scores)
  +
SelectionContext (preferred tags, difficultyPreference, frequencyPreference)
  ↓
contextFit
```

For example:

```text
contextFit = 0.5
```

v1 `contextFit` is the mean of active factors: tag match, plus difficulty and/or frequency when those preferences are not `mixed`.

The important principle is:

> Features provide information. The assessment logic determines how that information should be interpreted in the current context.

A preferred Feature such as 常考词 raises `contextFit`; it does not make other words ineligible.

## Stage 3: Rank

The Rank stage orders the assessed candidates. v1 uses:

```text
score = contextFit
```

The highest-ranked candidates become the initial vocabulary list. If fewer than `count` words passed the filter, return all of them.

## How the Data Model Participates

The main data models have different responsibilities in the algorithm.

| Data Model          | Role in Selection                                                            |
| ------------------- | ---------------------------------------------------------------------------- |
| `Word`              | Identity, `vocabularyScope`, `grade`/`term`, and stable lexical properties   |
| `Feature`           | Defines reusable information that can describe words                         |
| `WordFeature`       | Tags and score measurements used in `contextFit` (not eligibility)           |
| `VocabularyScope`   | Defines the vocabulary domain to which data or the current selection applies |
| `SelectionContext`  | Defines the requirements of the current selection task                       |
| `SelectionStrategy` | Defines which filtering, assessment, and ranking logic is used               |
| `Assessment`        | Represents the calculated evaluation of a Word under the current Context     |
| `SelectionEvent`    | Records what happened after the selection process                            |

## Selection Strategy Versioning

The selection algorithm should be versioned. The SelectionEvent should preserve the strategy/version used to generate the selection. The system can later compare teacher interaction patterns between strategy versions without confusing the results with changes to the underlying data.

## Teacher Review as Feedback

The algorithm does not assume that the initial ranking is the final answer.

The intended workflow is to use teacher's actions to identify patterns and improve algorithm, such as:

- Certain words are frequently retained / removed under certain feature
- Certain types of words are frequently replaced under certain context
- Certain contexts produce different selection behavior

---

# Demo Algorithm Boundary

The first demonstration implementation does not need machine learning or LLM-based re-ranking. The purpose of the demo is to establish a clear and inspectable selection pipeline.

A reasonable baseline is:

1. Start with a closed candidate pool
2. Apply hard filters on Word.vocabularyScope and Word grade/term
3. Calculate contextFit from preferredFeatureIds
4. Sort candidates by contextFit
5. Return top-N candidates (or all eligible if fewer than N)
6. Keep additional ranked candidates as replacement candidates

# Future Algorithm Development

The expected development path is:

```text
Rule-based baseline
        ↓
Teacher interaction data
        ↓
Pattern analysis
        ↓
Rule refinement
        ↓
Improved assessment
        ↓
Improved ranking
        ↓
Hybrid strategies
        ↓
Potential ML ranking
```
