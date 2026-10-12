# This document is for writing prompt for the current task.

Task: Write some python scripts to extract dummy data from raw dictionary data.

## Requirements

I have some raw data csv files located under C:\Workspace\Portfolio\knoczie-demo\api\data\raw\source_LinXueyuanStdio. Now I need some scripts to converse them into dummy data according to my data models.

First help me complete the requirements by analyzing the raw data csv files (scan first few rows of each file and analyze the format), together with the dummy data format and the current data models. Complete the "[please fill this]" part in the following script requirements.

**Scan notes (720 word rows, 557 translation rows):**

- `words.csv` delimiter is `>` (not comma). Header: `vc_id>vc_vocabulary>vc_phonetic_uk>vc_phonetic_us>vc_frequency>vc_difficulty>vc_acknowledge_rate>bk_id_name`
- `bk_id_name` looks like `{hexId} 人教版三年级起点{N}年级{上|下}`. 23 rows have two books joined by `|`.
- All books in this dump are 人教版, **grades 3–6 only** (no Grade 1–2).
- `vc_frequency` is already ~0–1. `vc_difficulty` is **integers 1–10**, not 0–1.
- Lemma duplicates in `words.csv`: **none**. 163 words have no row in `word_translations.csv`. Every translation lemma exists in `words.csv`.
- `word_translations.csv` is RFC comma-quoted CSV: `"word","translation"`. Senses are usually split by `;`. Sometimes the `;` is missing (`整个的adv.完全`). Sometimes several POS tags stack on one sense (`adv.prep.conj.在...之后`).

---



## Script 1 extract words.json

(1) input file: `api/data/raw/source_LinXueyuanStdio/words.csv`
(2) input format: UTF-8 text, `>`**-delimited**, header row, one lexical item per row. Columns: `vc_id`, `vc_vocabulary`, `vc_phonetic_uk`, `vc_phonetic_us`, `vc_frequency`, `vc_difficulty`, `vc_acknowledge_rate`, `bk_id_name`.
(3) map `vc_vocabulary` to data model field `lemma`
(4) map `bk_id_name` to data model fields `vocabularyScope`, `grade`, `term`. If there's more than one value separated by `|`, use the first one. How to map these values:

Parse the first segment after the hex id. Example: `82161242827b703e6acf9c72 人教版三年级起点六年级下`


| Raw fragment                  | Field             | Value                                                    |
| ----------------------------- | ----------------- | -------------------------------------------------------- |
| `人教版` (leading textbook name) | `vocabularyScope` | `"人教版"` (same string the API already aliases from `PEP`) |
| `三年级` / `四年级` / `五年级` / `六年级` | `grade`           | `3` / `4` / `5` / `6`                                    |
| `上`                           | `term`            | `1`                                                      |
| `下`                           | `term`            | `2`                                                      |


Ignore `三年级起点` (that is the textbook series start, not the word’s grade). If a row cannot be parsed, skip it and log a warning.

(5) map `vc_phonetic_uk` to data model field `phoneticSymbols`
(6) fill the data model field `source` with `LinXueyuanStdio`
(7) fill the field `syllableCount` with LLM analysis using Gemini API (API key from `GEMINI_API_KEY`, do not commit keys).  

(8) fill `createdAt` with today's date (ISO-8601 UTC date, e.g. `2026-10-07T00:00:00.000Z`)
(9) generate a logical id for `id` for now (such as `word_lemma`); comment with a `# TODO` block to refine id generation logic. Normalize spaces to `_` (`dining hall` → `word_dining_hall`).
(10) output file: `api/data/words.json`

---



## Script 2 extract word-ch-translations.json

(1) input file: `api/data/raw/source_LinXueyuanStdio/word_translations.csv`
(2) input format: UTF-8 **comma-separated**, quoted fields, header `"word","translation"`. One row per English headword. Chinese glosses in one cell; POS-tagged senses mixed with `;` and occasional missing separators.
(3) generate a simple id for `id` for now (`tr_{lemma}` with spaces → `_`); comment with a `# TODO` block to refine id generation logic
(4) map field `word` to data model field `wordLemma`
(5) map field `translation` to data model field `chTranslations`. Separate different translations that start with a part of speech acronym with a `|` character. How to do this separation:

Treat a **new sense** as starting when a POS marker appears at the beginning of the string, after `;` / `；`, or immediately after CJK text (missing semicolon).

POS markers (case-insensitive): `n.` `v.` `vt.` `vi.` `adj.` `adv.` `prep.` `conj.` `pron.` `num.` `art.` `int.` `aux.` `phr.`

Keep **stacked** markers on the same sense together: `adv.prep.conj.在...之后` stays one chunk (do not insert `|` between consecutive POS tags).

Then join chunks with `|` and strip extra spaces. Example:

`adj.上面的,上述的;adv.在上面;prep.在...上方` → `adj.上面的,上述的|adv.在上面|prep.在...上方`

(6) output file: `api/data/word-ch-translations.json`

Lemmas with no translation row: omit from this file (do not invent glosses).

---



## Script 3 extract features.json and word-features.json

(1) **features.json** (catalog, overwrite with a stable list):


| id                | name       | type    |
| ----------------- | ---------- | ------- |
| `feat-frequency`  | frequency  | `score` |
| `feat-difficulty` | difficulty | `score` |


Do **not** invent 常考词 / topic tags from this CSV (those columns do not exist). Optional: keep the existing tag Feature rows from the current `features.json` so the ranker’s `preferredFeatureIds` still has known tag ids, even if almost no WordFeature tags are produced. **Decision confirmed** (use suggestions).

(2) **word-features.json** (one score row per word per measurement):

From `words.csv`, for each word that Script 1 emits:

- `feat-frequency`: `value` = float `vc_frequency` (already ~0–1). `grade`/`term`/`vocabularyScope` copied from the Word row. `source` = `LinXueyuanStdio`, `sourceVersion` = `raw-v1`, `createdAt` = same stamp as Script 1.
- `feat-difficulty`: `value` = `vc_difficulty / 10` so it sits in 0–1 like the current ranker (`clamp01`). Raw integers 1–10 must not be stored as-is (every value ≥ 1 would collapse to 1.0 in ranking).

`id` provisional: `wf_{wordId}_{featureId}`. `# TODO` to refine.

(3) output files: `api/data/features.json`, `api/data/word-features.json`

Do not rewrite `selection-strategies.json` or `selection-events.json`.

---



## Suggested script layout (when building)

- `api/scripts/extract_words.py`
- `api/scripts/extract_translations.py`
- `api/scripts/extract_features.py`
- Shared helpers in `api/scripts/raw_linxueyuan.py` (CSV read, `bk_id_name` parse, POS split)

Run from `api/`: `python scripts/extract_words.py` etc. UTF-8 JSON, indent 2, `ensure_ascii=False`.

---



## Suggestions (accepted all)

1. `vocabularyScope` **=** `"人教版"` not the full string `人教版三年级起点`. Matches the live API (`PEP` → `人教版`).
2. `三年级起点` **is not grade 3.** Grade comes only from `{N}年级` after that phrase.
3. **Difficulty must be scaled to 0–1** (`/10`) or the Assess stage will treat almost every word as max difficulty. Alternative: change the ranker later; for this task, scale in the extractor.
4. `syllableCount` **stub:** `0` + TODO is honest; a tiny vowel-count heuristic is nicer for `easy` difficulty ranking before Gemini exists. Prefer stub `0` unless you want the heuristic.
5. **Duplicate books (**`|`**):** first book only, as you specified. The other listing is dropped (23 rows).
6. **Script 3 tags:** recommend **keeping existing tag Feature definitions** in `features.json`, and emitting **only frequency/difficulty WordFeatures** from this source. Tag WordFeatures stay empty until another source exists. `preferredFeatureIds` will still validate, but tagFit will be 0 hits until tags are filled.
7. `vc_acknowledge_rate`**:** unused. Do not add a Feature unless you want a third score.
8. `vc_phonetic_us`**:** unused (UK only, per your map). Can be documented as dropped.
9. **Word ↔ translation coverage:** 163 words will have no `WordChTranslations` row. API ranking does not need translations today.
10. **Do not keep the old LLM seed words** after a successful extract (720 rows replace 64). Confirm overwrite of `words.json` / `word-features.json`.
11. **Python** as you asked; the existing Node `generate-seed.mjs` can stay unused or be left as a fallback seed, not mixed into these extractors.
12. **Gemini:** one later hook in Script 1 only; Scripts 2–3 need no LLM.

Please mark which suggestions you accept, then the scripts can be built.