/**
 * Session sampling after RULE_VDEMO rank.
 * Isolated here so the 75/25 mix and recommend-pool size can change without touching ranking.
 */
import type { RankedCandidate } from "../../models/types.js";

/** Injected so tests can seed later. Default is unseeded Math.random. */
export type Rng = () => number;

const DEFAULT_RNG: Rng = Math.random;

/** Chance that auto-replace draws from remaining recommendedWords (else otherWords). */
export const AUTO_REPLACE_RECOMMENDED_P = 0.75;

/**
 * Size of the ranked prefix used as the recommend pool.
 * Larger than `count` when the eligible set allows, so the first list can vary.
 */
export function recommendedPoolSize(eligibleCount: number, count: number): number {
  if (eligibleCount <= count) return eligibleCount;
  return Math.min(eligibleCount, Math.max(2 * count, count + 10));
}

/** Fisher–Yates sample; `picked` order is random. Remaining keep leftover order. */
export function sampleWithoutReplacement<T>(
  items: T[],
  n: number,
  rng: Rng = DEFAULT_RNG,
): { picked: T[]; remaining: T[] } {
  const copy = items.slice();
  const take = Math.min(Math.max(0, n), copy.length);
  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(rng() * (copy.length - i));
    const swap = copy[i];
    copy[i] = copy[j]!;
    copy[j] = swap!;
  }
  return { picked: copy.slice(0, take), remaining: copy.slice(take) };
}

export function takeByWordId(
  pool: RankedCandidate[],
  wordId: string,
): RankedCandidate | undefined {
  const index = pool.findIndex((item) => item.wordId === wordId);
  if (index < 0) return undefined;
  const [item] = pool.splice(index, 1);
  return item;
}

export type OpenedSelection = {
  visible: RankedCandidate[];
  recommendedWords: RankedCandidate[];
  otherWords: RankedCandidate[];
  usedWords: string[];
};

/** Split ranked list, then sample `count` from the recommend prefix onto visible. */
export function openSelection(
  ranked: RankedCandidate[],
  count: number,
  rng: Rng = DEFAULT_RNG,
): OpenedSelection {
  const recSize = recommendedPoolSize(ranked.length, count);
  const recommended = ranked.slice(0, recSize);
  const otherWords = ranked.slice(recSize);

  if (ranked.length <= count) {
    return {
      visible: recommended,
      recommendedWords: [],
      otherWords: [],
      usedWords: recommended.map((item) => item.wordId),
    };
  }

  const { picked, remaining } = sampleWithoutReplacement(recommended, count, rng);
  return {
    visible: picked,
    recommendedWords: remaining,
    otherWords,
    usedWords: picked.map((item) => item.wordId),
  };
}

function unusedIn(pool: RankedCandidate[], used: Set<string>): RankedCandidate[] {
  return pool.filter((item) => !used.has(item.wordId));
}

/**
 * One unused word for auto-remove. 75% recommended / 25% other; empty side falls back.
 * Returns null only when both leftover pools have no unused words.
 */
export function pickAutoReplacement(
  recommendedWords: RankedCandidate[],
  otherWords: RankedCandidate[],
  usedWords: readonly string[],
  rng: Rng = DEFAULT_RNG,
): RankedCandidate | null {
  const used = new Set(usedWords);
  const rec = unusedIn(recommendedWords, used);
  const other = unusedIn(otherWords, used);
  if (rec.length === 0 && other.length === 0) return null;

  const preferRecommended = rng() < AUTO_REPLACE_RECOMMENDED_P;
  const primary = preferRecommended ? rec : other;
  const fallback = preferRecommended ? other : rec;
  const pool = primary.length > 0 ? primary : fallback;
  const index = Math.floor(rng() * pool.length);
  return pool[index] ?? null;
}
