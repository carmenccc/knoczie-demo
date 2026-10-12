export type HealthResponse = {
  ok: boolean;
  strategyId: string;
  strategyVersion: string;
};

export type ApiErrorBody = {
  error: string;
};

export type VocabularyLevel = {
  grade: number;
  term: 1 | 2 | null;
};

export type DifficultyPreference = "easy" | "medium" | "mixed" | "hard";
export type FrequencyPreference = "high" | "mixed" | "low";

export type SelectionContext = {
  vocabularyScope: string;
  levelRange?: {
    from: VocabularyLevel;
    to: VocabularyLevel;
  };
  activity: string;
  count: number;
  preferredFeatureIds?: string[];
  difficultyPreference: DifficultyPreference;
  frequencyPreference: FrequencyPreference;
};

export type CandidateSnapshot = {
  wordId: string;
  lemma: string;
  score: number;
  reasons: string[];
};

export type SelectionAction = {
  type: "remove" | "replace";
  wordId: string;
  replacementWordId?: string;
};

export type TeacherAction = {
  type: "keep" | "remove" | "replace";
  wordId: string;
  replacementWordId: string | null;
  at: string;
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

export type CommitResponse = {
  event: SelectionEvent;
};

export type SelectionSessionView = {
  id: string;
  strategyId: string;
  strategyVersion: string;
  selectionContext: SelectionContext;
  candidates: CandidateSnapshot[];
  recommendedWords: CandidateSnapshot[];
  otherWords: CandidateSnapshot[];
  usedWords: string[];
  committed: boolean;
};
