export type VocabularyScope = string;

export type VocabularyLevel = {
  grade: number;
  term: 1 | 2 | null;
};

export type LevelRange = {
  from: VocabularyLevel;
  to: VocabularyLevel;
};

export type DifficultyPreference = "easy" | "medium" | "mixed" | "hard";
export type FrequencyPreference = "high" | "mixed" | "low";

export type SelectionContext = {
  vocabularyScope: VocabularyScope;
  levelRange?: LevelRange;
  activity: string;
  count: number;
  preferredFeatureIds?: string[];
  difficultyPreference: DifficultyPreference;
  frequencyPreference: FrequencyPreference;
};

export type Word = {
  id: string;
  lemma: string;
  vocabularyScope: VocabularyScope;
  grade: number;
  term: 1 | 2 | null;
  phoneticSymbols: string;
  source: string;
  syllableCount: number;
  createdAt: string;
};

export type Feature = {
  id: string;
  name: string;
  type: string;
};

export type WordFeature = {
  id: string;
  wordId: string;
  featureId: string;
  value: string | number | null;
  vocabularyScope: VocabularyScope;
  grade?: number | null;
  term?: 1 | 2 | null;
  source: string;
  sourceVersion: string;
  createdAt: string;
};

export type WordChTranslation = {
  id: string;
  wordLemma: string;
  chTranslations: string;
};

export type SelectionStrategy = {
  id: string;
  name: string;
  version: string;
  description: string;
};

export type CandidateSnapshot = {
  wordId: string;
  lemma: string;
  score: number;
  reasons: string[];
};

export type TeacherAction = {
  type: "keep" | "remove" | "replace";
  wordId: string;
  replacementWordId: string | null;
  at: string;
};

export type Assessment = {
  wordId: string;
  contextFit: number;
  score: number;
  reasons: string[];
};

export type RankedCandidate = CandidateSnapshot & {
  assessment: Assessment;
};

export type SelectionSession = {
  id: string;
  selectionContext: SelectionContext;
  strategyId: string;
  strategyVersion: string;
  visible: RankedCandidate[];
  recommendedWords: RankedCandidate[];
  otherWords: RankedCandidate[];
  usedWords: string[];
  initialCandidates: CandidateSnapshot[];
  teacherActions: TeacherAction[];
  committed: boolean;
  createdAt: string;
};

export type SelectionEvent = {
  id: string;
  selectionContext: SelectionContext;
  strategyId: string;
  strategyVersion: string;
  initialCandidates: CandidateSnapshot[];
  finalSelection: CandidateSnapshot[];
  teacherActions: TeacherAction[];
  createdAt: string;
};

export type WordPool = {
  words: Word[];
  features: Feature[];
  wordFeatures: WordFeature[];
  wordChTranslations: WordChTranslation[];
};
