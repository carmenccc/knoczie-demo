# Vocabulary Selection API (version-demo)

## Purpose

The Vocabulary Selection API is the backend foundation of a teacher-oriented vocabulary selection system (Chinese elementary EFL (Grades 1-6)).

Formal specs for this demo API:

- [data-model.md](data-model.md) — entities, JSON files, session vs event
- [algorithm.md](algorithm.md) — RULE_VDEMO v1 filter / assess / rank
- [architecture.md](architecture.md) — Express layout and HTTP surface
- [progress.md](progress.md) — what is implemented vs left blank

The system is designed to help teachers generate a candidate vocabulary list for a specific learning or practice context, review the generated words, and record the final selection.

This repo slice is version-demo for stakeholder:

- generate a list from a closed word pool (for a cold start, generate an initial version of word data which will be later swapped with proper data source)
- let a teacher keep / remove / replace items (remove auto-fills from leftover pools; replace is teacher-chosen)
- and save a SelectionEvent

As for the word generation, we hope to implement a rule-based selection engine first. Historical teacher selection data can later be used to improve the selection algorithm and potentially support more advanced ranking approaches.

## Activity Flow

```text
Selection Requirements
        ↓
Candidate Generation
        ↓
Teacher Review
        ↓
Final Vocabulary List
        ↓
Selection History
```

## API Functions

The initial API should support the following operations.

### 1. Generate Vocabulary Candidates

Accept a selection request containing information about the dictation context, such as:

- vocabulary scope (string textbook id) plus optional `levelRange` (grade + term)
- activity (e.g. dictation)
- requested number of words
- preferred features for ranking (e.g. 常考词)

The API generates a ranked list of candidate words based certain strategy. An Ideal version will hope to provide both rule-ranked strategy and LLM, but the current version will look to only implement a crude version of ranking algorithm. The detailed expectations for the algorithm are documented separately in `ranking-expectations.md`.

Conceptually:

```text
Teacher request (vocabularyScope, levelRange, count, preferredFeatureIds)
      ↓
Filter closed pool → RULE_VDEMO contextFit
      ↓
visible list + recommendedWords + otherWords
```

### 2 Allow teacher to Review and Modify candidates

The teacher can review the generated vocabulary list and choose to:

- keep a word
- remove a word
- replace a word

When a word is removed, the system can provide another candidate from the available ranked pool. The system should preserve the original selection context and strategy information for the selection event.

### 3 Save Final Selection

After reviewing the candidates, the final vocabulary list can be saved.

The saved result should be associated with the selection event that produced it.

### 4 Record Selection Events

The system records information about the selection process, including:

- selection context
- selection strategy and version
- generated candidates
- final selected words
- teacher modifications
- timestamp

This historical data provides the foundation for future analysis and algorithm improvement.

## High-level System Flow

```text
Selection Request (SelectionContext, Feature tags)
       ↓
Selection Strategy (currently hardcoded as rule-based)
       ↓
Candidate Generation
       ↓
Teacher Review
       ├── Keep
       ├── Remove
       └── Replace
       ↓
Final Selection
       ↓
Selection Event
```

The current selection engine is expected to use a three-stage process:

```text
Filter
  ↓
Assess contextFit
  ↓
Rank
```

## Data Scope

The current project focuses on the vocabulary selection workflow. The current domain includes:

- Word
- Feature
- WordFeature
- VocabularyScope
- SelectionContext
- SelectionStrategy
- SelectionEvent
- Assessment

More definition on these domains are documented separately in `data-model.md`. The demo ships a closed JSON pool under `api/data/` (`source = LLM`, `sourceVersion = seed-v1`). That pool can later be replaced by a more authoritative source without changing Feature names.

## Future Direction

The initial ranking implementation is intentionally rule-based.

The expected development path is:

```text
Rule-based baseline
        ↓
Teacher selection data
        ↓
Selection pattern analysis
        ↓
Rule refinement
        ↓
More sophisticated ranking
        ↓
Potential hybrid / ML approaches
```

The purpose of collecting selection events is therefore not to introduce machine learning immediately, but to create a feedback loop that can support evidence-based improvement of the selection algorithm.

## Preferred Technology Direction

The technology stack is not finalized.

The implementation should prioritize developer familiarity, maintainability, readability, and suitability for the current project rather than introducing unnecessary infrastructure.

### Frontend

The frontend is expected to provide a simple teacher-facing vocabulary review & feedback interface. Create the project under the `web` folder.

Preferred tech stack:

- React
- TypeScript
- Vite or a similarly lightweight React setup

### Backend

The backend should be a Rest api. Create the project under the `api` folder.
Preferred tech stack:

- Node.js + TypeScript + express / ASP.NET Core + C#
- Postgresql / MongoDB

The final choice should consider:

- API development complexity
- database integration
- testing
- maintainability
- suitability for the selection logic
- developer familiarity

### Project architecture

As this project is a diploma capstone project, consider developer knowledge and experience constraints to ensure smooth maintaining experience. Consider setting up the project in a more traditional MVC architecture. Create files using these folders when applicable:

#### Backend

- models
- routes
- controllers
- middleware
- services
- data
- utils
- config

#### Frontend

- components
- context
- pages
- services
- assets
- utils
