# This document is for writing prompt for the current task.

Task: revise selection creation function.

Problems: 
1. Word generation randomness
I need to change how the api generate candidate words for each selection request, with the purpose to add randomeness and replacement flexibility. Currently, the selectionServce will slice the top ranked words as visible and buffer, but that create a problem of showing the exact same words in the same order for every request that has the same context. This is foundamentally inappropriate for a dictation app.
2. Also, the buffer only contains top-ranked words which never changes, leaving no flexibility for teachers to select from other words. This is not suitable for a word selection service whose main responsibility is to collect user feedback and improve recommendation.

Solutions:
I decided to add some randomness to the candidate word generation process, and also keep all the un-selected elegible words available for replacement. From a behavior perspective, I want users to see more random recommended words, both in terms of order and choices. But at the same time, this should not sabotage the ranking of the words. And in follow-up review, teachers should be able to replace words with words outside recommendation. And since we may need to refine the randomness approach in th future, it will be good to separate the implemantation of randomness from the selectionService as much as possible, so that we can easily revisit and change the implemantation.

This should be implemented with the following design changes in the SelectionSession schema, and relevant features in selectionService.createSelection() that generate and interact with the candidate words:
(1). No changes for filter, assess, and ranking rules
(2). For filtered and ranked eligible words, change how to generate selection response. For each SelectionSession, replace the concept of buffer with two new word pools -- `recommendedWords` and `otherWords`. `recommendedWords` is for the holding the top-ranked words, and should have a size bigger than the context wordcount, because we will be taking sample from this word pool for the innitial candidate generation. The sampling should be random, expected to give different output for each generation. `otherWords` will hold all the remaining eligible words. These are for word replacement, and possibly future randomness.
(3). For each SelectionSession, also manage a new field for `usedWords`. This is used to hold ids of words that have been selected, removed, or replaced, and will later be used to check whether a word can be selected after a removal. The rule is that used words should not be selected by the system as automatic replacement.
(4). When user request to remove a word, and system randomly select an unused word as replacement, but:
    - 75% of the time, sample from remaining recommendedWords
    - 25% of the time, sample from remaining otherWords
    - never sample a word that has already been used in the current session
    - if the selected pool has no available candidates, fall back to the other pool
(5). When user manually replace a word, teachers are allowed to provide a word from both word pools (whether it's recommended), as long as the word is eligible and is not already selected.
(6). randomness related functions should be extracted into separate classes, such as in sampler/utils. For readability, comment the purpose of code when possible.

---

## Proposed changes (waiting for confirmation — no code yet)

Ranking stays as-is (`filterPool` / `assessWord` / `rankCandidates`). After rank, **drop `buffer`**. Session holds `recommendedWords`, `otherWords`, `usedWords` (ids), plus existing `visible`.

**Create (`POST /selections`)**

1. Rank all eligible words (same RULE_VDEMO).
2. Split: first `R` → `recommendedWords`, rest → `otherWords`. Proposed `R = min(eligible, max(2 × count, count + 10))` so the recommend pool is larger than `count` when the dump allows it.
3. Uniform sample `count` words **from recommended** (no replacement). Shuffle them onto `visible` so both membership and order vary. Remaining recommended stay in the pool.
4. Put those visible ids into `usedWords`.
5. If eligible ≤ `count`, show all survivors; both leftover pools empty (same “do not pad” rule).

Sampler lives in a new module (e.g. `api/src/services/sampler/wordSampler.ts`) with an injectable `Math.random` so later we can seed it. `selectionService` only calls it.

**Remove** — auto-fill: 75% remaining recommended / 25% remaining other; skip `usedWords`; if the chosen pool is empty, use the other; if both empty → **409**, list unchanged. Picked word moves onto `visible` at the same index and is added to `usedWords`. The removed word stays in `usedWords` (will not auto-return).

**Replace** — teacher supplies `replacementWordId` (this is a real API change; today replace == auto remove). Word must be in `recommendedWords` or `otherWords` and not currently on `visible`. Then same slot-swap as remove.

**HTTP:** stop returning `bufferCount`. Return leftover pool snapshots (or counts + a list on GET) so a teacher can pick a replacement. Update types, algorithm/architecture/data-model, and `smoke_api.py`.

---

## Please confirm

1. **Recommend pool size `R`.** Is `max(2×count, count+10)` OK, or do you want a fixed extra (e.g. always top `count+10`)?
Answer: I don't have a preference for this one, choose a reasonable one based on the data size (use dummy data as reference). It should be easy to re-configure it in the future.
2. **Manual replace body.** Propose `{ type: "replace", wordId, replacementWordId }`. Remove stays automatic. OK?
Answer: no preference for this. In the future we may offer search box for the teachers to select the word in UI. Pick one you think reasonable.
3. **Previously removed words.** Auto-replace never brings them back (`usedWords`). For **manual** replace, may the teacher pick a word they already removed in this session, or is “not already selected” = not in `usedWords` either?
Answer: Auto-replace never brings back usedWords. But teachers are allowed to pick a already removed word in the session, as long as they are not currently picked.
4. **GET payload.** Return full leftover `recommendedWords` / `otherWords` (id, lemma, score) so the UI can pick, or only counts until a later list endpoint： Return the full recommendedWords and otherWords candidate pools in the GET payload, using lightweight snapshots (id, lemma, score). Do not filter them by usedWordIds. The UI needs the full candidate pool for manual replacement, and a teacher should be allowed to manually select a word even if it was previously shown or removed in the current session. usedWordIds should only be used to prevent automatic sampling from immediately/repeatedly selecting previously used candidates, not as a hard exclusion rule for teacher choice. No separate list endpoint is needed for the MVP.
5. **Both pools empty** on remove: keep **409**? YES
6. **Strategy version.** Ranker unchanged; session/actions change. Bump `RULE_VDEMO` to `2`, or keep `1`? Keep 1, but remember to update the documents.

