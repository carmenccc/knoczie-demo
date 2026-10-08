import type {
  Assessment,
  RankedCandidate,
  SelectionContext,
  VocabularyLevel,
  Word,
  WordFeature,
  WordPool,
} from "../models/types.js";

const FEATURE_FREQUENCY = "feat-frequency";
const FEATURE_DIFFICULTY = "feat-difficulty";
const NEUTRAL = 0.5;

function featuresForWord(pool: WordPool, wordId: string) {
  return pool.wordFeatures.filter((wf) => wf.wordId === wordId);
}

/** Maps a grade+term to ordered slots (grade 1 term 1 = 0). Null term covers the full year. */
function levelStartSlot(level: VocabularyLevel): number {
  const term = level.term == null ? 1 : level.term;
  return (level.grade - 1) * 2 + (term - 1);
}

function levelEndSlot(level: VocabularyLevel): number {
  const term = level.term == null ? 2 : level.term;
  return (level.grade - 1) * 2 + (term - 1);
}

function wordOverlapsRange(word: Word, from: VocabularyLevel, to: VocabularyLevel): boolean {
  const wordStart = levelStartSlot({ grade: word.grade, term: word.term });
  const wordEnd = levelEndSlot({ grade: word.grade, term: word.term });
  const rangeStart = levelStartSlot(from);
  const rangeEnd = levelEndSlot(to);
  return wordStart <= rangeEnd && wordEnd >= rangeStart;
}

export function filterPool(pool: WordPool, context: SelectionContext): Word[] {
  return pool.words.filter((word) => {
    if (word.vocabularyScope !== context.vocabularyScope) return false;
    if (context.levelRange && !wordOverlapsRange(word, context.levelRange.from, context.levelRange.to)) {
      return false;
    }
    return true;
  });
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function numericValue(value: WordFeature["value"]): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Prefer a score measured at the word's own grade/term; otherwise any score on the word. */
function findScore(word: Word, featureId: string, wordFeatures: WordFeature[]): number | null {
  const scores = wordFeatures.filter((wf) => wf.featureId === featureId && numericValue(wf.value) != null);
  const exact = scores.find(
    (wf) => wf.grade === word.grade && (wf.term == null || wf.term === word.term || word.term == null),
  );
  const chosen = exact ?? scores[0];
  return chosen ? numericValue(chosen.value) : null;
}

/** Tag-match factor: fraction of preferred tags present. Empty preference → 1. */
function tagFit(preferred: string[], wordFeatureIds: Set<string>, reasons: string[]): number {
  if (preferred.length === 0) {
    reasons.push("tag:none");
    return 1;
  }
  let matched = 0;
  for (const id of preferred) {
    if (wordFeatureIds.has(id)) {
      matched += 1;
      reasons.push(`tag:hit:${id}`);
    } else {
      reasons.push(`tag:miss:${id}`);
    }
  }
  const fit = matched / preferred.length;
  reasons.push(`tag:${matched}/${preferred.length}`);
  return fit;
}

/**
 * Heuristic difficulty in [0, 1] from lemma length and syllable count.
 * Longer / more syllables → harder. Used only when no score WordFeature exists.
 */
function derivedDifficulty(word: Word): number {
  const lengthPart = word.lemma.replace(/\s+/g, "").length / 12;
  const syllablePart = word.syllableCount / 4;
  return clamp01((lengthPart + syllablePart) / 2);
}

/** Difficulty factor: how well the word's difficulty matches easy/hard. Mixed is omitted by the caller. */
function difficultyFit(
  word: Word,
  preference: SelectionContext["difficultyPreference"],
  wordFeatures: WordFeature[],
  reasons: string[],
): number {
  const explicit = findScore(word, FEATURE_DIFFICULTY, wordFeatures);
  let difficulty: number;
  if (explicit != null) {
    difficulty = clamp01(explicit);
    reasons.push(`difficulty:explicit:${difficulty.toFixed(2)}`);
  } else {
    difficulty = derivedDifficulty(word);
    reasons.push(`difficulty:derived:${difficulty.toFixed(2)}`);
  }

  let fit: number;
  if (preference === "easy") fit = 1 - difficulty;
  else if (preference === "hard") fit = difficulty;
  else fit = 1 - Math.abs(difficulty - 0.5) * 2;
  reasons.push(`difficulty:pref:${preference}:fit:${fit.toFixed(2)}`);
  return fit;
}

/** Frequency factor: high prefers larger scores, low prefers smaller. Missing data → 0.5. Mixed omitted by caller. */
function frequencyFit(
  word: Word,
  preference: SelectionContext["frequencyPreference"],
  wordFeatures: WordFeature[],
  reasons: string[],
): number {
  const explicit = findScore(word, FEATURE_FREQUENCY, wordFeatures);
  if (explicit == null) {
    reasons.push("frequency:missing:neutral");
    return NEUTRAL;
  }
  const frequency = clamp01(explicit);
  const fit = preference === "low" ? 1 - frequency : frequency;
  reasons.push(`frequency:${frequency.toFixed(2)}:pref:${preference}:fit:${fit.toFixed(2)}`);
  return fit;
}

/**
 * Overall suitability for the current context.
 * Active factors are weighted equally. Mixed difficulty/frequency add no factor.
 */
export function assessWord(word: Word, context: SelectionContext, pool: WordPool): Assessment {
  const wordFeatures = featuresForWord(pool, word.id);
  const wordFeatureIds = new Set(wordFeatures.map((wf) => wf.featureId));
  const preferred = [...new Set(context.preferredFeatureIds ?? [])];
  const reasons: string[] = [];

  const factors: { name: string; value: number }[] = [
    { name: "tag", value: tagFit(preferred, wordFeatureIds, reasons) },
  ];

  if (context.difficultyPreference !== "mixed") {
    factors.push({
      name: "difficulty",
      value: difficultyFit(word, context.difficultyPreference, wordFeatures, reasons),
    });
  } else {
    reasons.push("difficulty:mixed");
  }

  if (context.frequencyPreference !== "mixed") {
    factors.push({
      name: "frequency",
      value: frequencyFit(word, context.frequencyPreference, wordFeatures, reasons),
    });
  } else {
    reasons.push("frequency:mixed");
  }

  const contextFit = factors.reduce((sum, f) => sum + f.value, 0) / factors.length;
  reasons.unshift(`contextFit:${contextFit.toFixed(3)}`);

  return { wordId: word.id, contextFit, score: contextFit, reasons };
}

export function rankCandidates(pool: WordPool, context: SelectionContext): RankedCandidate[] {
  const eligible = filterPool(pool, context);
  const ranked: RankedCandidate[] = eligible.map((word) => {
    const assessment = assessWord(word, context, pool);
    return {
      wordId: word.id,
      lemma: word.lemma,
      score: assessment.score,
      reasons: assessment.reasons,
      assessment,
    };
  });

  ranked.sort((a, b) => b.score - a.score || a.lemma.localeCompare(b.lemma));
  return ranked;
}
