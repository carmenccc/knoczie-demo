import type { DifficultyPreference, FrequencyPreference } from "../api/types.ts";

/** Hardcoded until the API exposes option lists. */

export const ACTIVITY_OPTIONS = ["dictation"] as const;

export const SCOPE_OPTIONS = ["PEP"] as const;

export const GRADE_OPTIONS = [3, 4, 5, 6] as const;

export const TERM_OPTIONS: { label: string; term: 1 | 2 | null }[] = [
  { label: "Full year", term: null },
  { label: "上", term: 1 },
  { label: "下", term: 2 },
];

export const DIFFICULTY_OPTIONS: DifficultyPreference[] = ["mixed", "easy", "medium", "hard"];

export const FREQUENCY_OPTIONS: FrequencyPreference[] = ["mixed", "high", "low"];

export const TAG_OPTIONS: { id: string; name: string }[] = [
  { id: "feat-changkao", name: "常考词" },
  { id: "feat-shengpi", name: "生僻词" },
  { id: "feat-writing", name: "写作词汇" },
  { id: "feat-topic-animals", name: "animals" },
  { id: "feat-topic-school", name: "school" },
  { id: "feat-topic-environment", name: "environment" },
  { id: "feat-topic-family", name: "family" },
  { id: "feat-topic-food", name: "food" },
];
