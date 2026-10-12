# Purpose

This document conceptually defines the data models that the vocabulary selection system needs to persist and the relationships between those data entities.

The current model is intentionally concrete for this demo app. It does not attempt to create a generalized educational ontology or a universal abstraction for every possible learning scenario.

The current persisted domain consists of:

```text
Word
Feature
WordFeature
VocabularyScope
SelectionContext
SelectionStrategy
SelectionEvent
```

`Assessment` can also used by the system, but has a different persistence role. Runtime assessments are calculated during selection, while assessments produced from LLM analysis may be persisted as analysis results.

# Domains

## Word

`Word` represents the lexical item itself.

Example conceptual fields:

```text
Word
----
id
lemma
vocabularyScope
grade
term
phoneticSymbols
source
syllableCount
...
```

Word should contain relatively stable properties of the lexical item, including its **own scope** (`vocabularyScope` + `grade` + `term`).

It should not directly contain context-dependent concepts such as:

- recommended
- suitable
- difficult
- contextFit

Those are determined by the selection process.

## Feature

`Feature` represents a reusable type of information that can be associated with a word.

The demo primarily uses tag-like Features.

Examples:

```text
常考词
生僻词
写作词汇
```

Conceptually:

```text
Feature
-------
id
name
type
```

The current Feature types are:

```text
tag
score
```

Feature is a definition. It does not by itself state that a particular word has that feature.

That association is represented by `WordFeature`.

## WordFeature

`WordFeature` represents a specific Feature associated with a specific Word.

Conceptually:

```text
WordFeature
-----------
id
wordId
featureId
value
vocabularyScope
source
sourceVersion
...
```

For example:

```text
Word:
    forest

Feature:
    常考词

WordFeature:
    forest → 常考词
    vocabularyScope = 人教版
    source = LLM
```

This allows:

```text
One Word
    ↓
many WordFeatures

One Feature
    ↓
many WordFeatures
```

Therefore:

```text
Word ↔ Feature
     M : N
```

through `WordFeature`.

---

## VocabularyScope

`VocabularyScope` describes the vocabulary domain to which vocabulary data or a selection task belongs.

The current model is intentionally simple:

```text
VocabularyScope = string   (e.g. 人教版)

VocabularyLevel
---------------
grade
term   (1 | 2 | null)
```

Example request range:

```json
{
  "from": { "grade": 3, "term": 1 },
  "to": { "grade": 5, "term": null }
}
```

`term: null` means the full school year.

The current system does not attempt to create a generalized `Scope` framework.

`VocabularyScope` is a concrete domain concept introduced because the current business requirement needs to distinguish different vocabulary domains.

---

# 6. SelectionContext

`SelectionContext` represents the current task, describes the requirements of one vocabulary selection operation.

Typical information includes:

```text
SelectionContext
----------------
vocabularyScope
activity
count
...
```

Example:

```json
{
  "vocabularyScope": "人教版",
  "levelRange": {
    "from": { "grade": 3, "term": null },
    "to": { "grade": 3, "term": null }
  },
  "activity": "dictation",
  "preferredFeatureIds": ["feat-topic-environment"],
  "count": 10
}
```

## SelectionStrategy

`SelectionStrategy` identifies the algorithmic approach used to generate and rank candidates.

The purpose of storing the strategy and version is traceability. A SelectionEvent should be able to identify which strategy generated its candidates.

The strategy should be versioned.

Example:

```text
SelectionStrategy
-----------------
id
name
version
description
...
```

An initial strategy might be:

```text
RULE_VDEMO
```

Future strategies may include:

```text
RULE_V2
LLM
HYBRID
ML_RANKER
```

---

## Assessment

Assessment is a calculated evaluation of a Word under a particular selection context.

Conceptually:

```text
Word
  +
Features
  +
SelectionContext
  +
SelectionStrategy
  ↓
Assessment
```

For example:

```text
Word:
    beautiful

Context:
    Grade 3 + dictation

Assessment:
    contextFit = 0.72
```

Assessment is context-dependent and therefore should not be treated as a permanent property of a Word.

### Runtime Assessment

During normal selection, assessment is calculated by the selection algorithm.

It can remain an in-memory result:

```text
assess(word, context)
        ↓
assessment
```

### LLM Assessment

The system may also use an LLM during cold-start or data enrichment to analyze words.

Those LLM-generated assessment results may be persisted because they can represent useful external analysis that would otherwise need to be regenerated.

Such persisted results should retain their provenance, including information such as:

```text
source
sourceVersion
model
createdAt
```

The persisted LLM assessment should therefore be treated as **source-backed analysis data**, not as an immutable truth about the word.

---

## SelectionEvent

`SelectionEvent` represents one historical vocabulary selection operation.

Conceptually:

```text
SelectionEvent
--------------
id
selectionContext
selectionStrategy
candidates
finalSelection
teacherActions
createdAt
...
```

A SelectionEvent should allow the system to reconstruct the important parts of what happened during a selection.

For example:

```text
Context:
    人教版 grades 3–3
    dictation
    preferred: 常考词

Strategy:
    RULE_VDEMO

Candidates:
    forest
    pollution
    recycle
    ...

Teacher actions:
    forest → kept
    pollution → removed
    recycle → kept

Final selection:
    ...
```

SelectionEvent is important because teacher interaction becomes historical evidence that can later be analyzed.

---

# Data Provenance

Vocabulary information may originate from different sources. This is particularly important during the project's cold-start phase, because possible sources include:

- Textbook data
- Corpus data
- Dictionary data
- Teacher-provided data
- Institutional data
- LLM-generated data

The system should preserve basic provenance for externally sourced information. The purpose is to distinguish:

- What the system knows
- Where that information came from

# Cold Start and Data Source Replacement

The system may initially lack reliable Feature data.

For the prototype, an LLM can therefore be used to generate provisional vocabulary analysis.

For example:

```text
Word List
    ↓
LLM Analysis
    ↓
WordFeature / Assessment
    ↓
Selection Algorithm
```

This data should be treated as provisional and should retain its source information.

The long-term strategy is:

```text
LLM / provisional source
        ↓
Prototype
        ↓
More authoritative data source
        ↓
Replace or supplement provisional data
```

The semantic definition of a Feature should remain independent from its source.

For example:

```text
Feature:
    常考词
```

may initially be populated by:

```text
source = LLM
```

and later by:

```text
source = textbook/corpus/institutional data
```

The Feature concept itself does not need to change simply because the data source changes.

This separation allows the system to evolve from a cold-start prototype toward more reliable data without redesigning the entire domain model.
