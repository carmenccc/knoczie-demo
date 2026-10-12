import { randomUUID } from "node:crypto";
import { config } from "../config/index.js";
import type {
  CandidateSnapshot,
  DifficultyPreference,
  FrequencyPreference,
  SelectionContext,
  SelectionEvent,
  RankedCandidate,
  SelectionSession,
  TeacherAction,
  VocabularyLevel,
} from "../models/types.js";
import { rankCandidates } from "./ruleVDemoRanker.js";
import { openSelection, pickAutoReplacement, takeByWordId } from "./sampler/wordSampler.js";
import { appendEvent, loadPool } from "../store/jsonStore.js";
import { HttpError, snapshot } from "../utils/httpError.js";

const sessions = new Map<string, SelectionSession>();

function parseGrade(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    throw new HttpError(400, `${field} must be an integer from 1 to 6.`);
  }
  return n;
}

function parseTerm(value: unknown, field: string): 1 | 2 | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (n !== 1 && n !== 2) {
    throw new HttpError(400, `${field} must be 1, 2, or null.`);
  }
  return n;
}

function parseVocabularyLevel(raw: unknown, field: string): VocabularyLevel {
  if (raw == null || typeof raw !== "object") {
    throw new HttpError(400, `${field} must be an object with grade and term.`);
  }
  const obj = raw as Record<string, unknown>;
  return {
    grade: parseGrade(obj.grade, `${field}.grade`),
    term: parseTerm(obj.term, `${field}.term`),
  };
}

function levelOrder(level: VocabularyLevel, useStart: boolean): number {
  const term = level.term == null ? (useStart ? 1 : 2) : level.term;
  return (level.grade - 1) * 2 + (term - 1);
}

export function validateContext(
  body: unknown,
  knownFeatureIds: Set<string>,
  scoreFeatureIds: Set<string>,
): SelectionContext {
  if (body == null || typeof body !== "object") {
    throw new HttpError(400, "Body must be a JSON object.");
  }
  const raw = body as Record<string, unknown>;
  if ("topic" in raw) {
    throw new HttpError(400, "topic is not supported; use preferredFeatureIds.");
  }
  if ("requiredFeatureIds" in raw) {
    throw new HttpError(400, "requiredFeatureIds is not supported; use preferredFeatureIds.");
  }

  if (typeof raw.vocabularyScope !== "string" || !raw.vocabularyScope.trim()) {
    throw new HttpError(400, "vocabularyScope must be a non-empty string.");
  }
  const typeAlias: Record<string, string> = { PEP: "人教版", pep: "人教版" };
  const vocabularyScope = typeAlias[raw.vocabularyScope.trim()] ?? raw.vocabularyScope.trim();

  let levelRange: SelectionContext["levelRange"];
  if (raw.levelRange != null) {
    if (typeof raw.levelRange !== "object") {
      throw new HttpError(400, "levelRange must be an object with from and to.");
    }
    const range = raw.levelRange as Record<string, unknown>;
    const from = parseVocabularyLevel(range.from, "levelRange.from");
    const to = parseVocabularyLevel(range.to, "levelRange.to");
    if (levelOrder(from, true) > levelOrder(to, false)) {
      throw new HttpError(400, "levelRange.from must be at or before levelRange.to.");
    }
    levelRange = { from, to };
  }

  if (raw.activity !== "dictation") {
    throw new HttpError(400, "activity must be dictation.");
  }
  const count = Number(raw.count);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new HttpError(400, "count must be an integer from 1 to 50.");
  }

  const preferredFeatureIds = Array.isArray(raw.preferredFeatureIds)
    ? [...new Set(raw.preferredFeatureIds.map(String))]
    : [];
  for (const id of preferredFeatureIds) {
    if (!knownFeatureIds.has(id)) {
      throw new HttpError(400, `Unknown preferredFeatureId: ${id}`);
    }
    if (scoreFeatureIds.has(id)) {
      throw new HttpError(400, "preferredFeatureIds must be tag features, not scores.");
    }
  }

  const difficultyRaw = raw.difficultyPreference == null || raw.difficultyPreference === ""
    ? "mixed"
    : String(raw.difficultyPreference);
  const difficultyAlias: Record<string, DifficultyPreference> = { midium: "medium" };
  const difficultyPreference = (difficultyAlias[difficultyRaw] ?? difficultyRaw) as DifficultyPreference;
  if (!["easy", "medium", "mixed", "hard"].includes(difficultyPreference)) {
    throw new HttpError(400, "difficultyPreference must be easy, medium, mixed, or hard.");
  }

  const frequencyRaw = raw.frequencyPreference == null || raw.frequencyPreference === ""
    ? "high"
    : String(raw.frequencyPreference);
  if (frequencyRaw !== "high" && frequencyRaw !== "mixed" && frequencyRaw !== "low") {
    throw new HttpError(400, "frequencyPreference must be high, mixed, or low.");
  }
  const frequencyPreference = frequencyRaw as FrequencyPreference;

  return {
    vocabularyScope,
    levelRange,
    activity: "dictation",
    count,
    preferredFeatureIds,
    difficultyPreference,
    frequencyPreference,
  };
}

function publicView(session: SelectionSession) {
  return {
    id: session.id,
    strategyId: session.strategyId,
    strategyVersion: session.strategyVersion,
    selectionContext: session.selectionContext,
    candidates: session.visible.map(snapshot),
    recommendedWords: session.recommendedWords.map(snapshot),
    otherWords: session.otherWords.map(snapshot),
    usedWords: session.usedWords,
    committed: session.committed,
  };
}

function markUsed(session: SelectionSession, wordId: string) {
  if (!session.usedWords.includes(wordId)) session.usedWords.push(wordId);
}

export function createSelection(body: unknown) {
  const pool = loadPool();
  const knownFeatureIds = new Set(pool.features.map((f) => f.id));
  const scoreFeatureIds = new Set(
    pool.features.filter((f) => f.type === "score").map((f) => f.id),
  );
  const selectionContext = validateContext(body, knownFeatureIds, scoreFeatureIds);
  const ranked = rankCandidates(pool, selectionContext);
  const opened = openSelection(ranked, selectionContext.count);
  const createdAt = new Date().toISOString();
  const initialCandidates: CandidateSnapshot[] = opened.visible.map(snapshot);

  const session: SelectionSession = {
    id: `sel_${randomUUID()}`,
    selectionContext,
    strategyId: config.strategyId,
    strategyVersion: config.strategyVersion,
    visible: opened.visible,
    recommendedWords: opened.recommendedWords,
    otherWords: opened.otherWords,
    usedWords: opened.usedWords,
    initialCandidates,
    teacherActions: [],
    committed: false,
    createdAt,
  };
  sessions.set(session.id, session);
  return publicView(session);
}

export function getSelection(id: string) {
  const session = sessions.get(id);
  if (!session) throw new HttpError(404, "Unknown selection session.");
  return publicView(session);
}

function takeReplacementFromPools(session: SelectionSession, replacementWordId: string) {
  if (session.visible.some((item) => item.wordId === replacementWordId)) {
    throw new HttpError(400, "replacementWordId is already on the visible list.");
  }
  const next =
    takeByWordId(session.recommendedWords, replacementWordId) ??
    takeByWordId(session.otherWords, replacementWordId);
  if (!next) {
    throw new HttpError(404, "replacementWordId is not in the leftover pools.");
  }
  return next;
}

/** Keep a word that left the visible list so a teacher can choose it again. Auto-fill still skips usedWords. */
function parkLeavingWord(session: SelectionSession, leaving: RankedCandidate) {
  const parked =
    session.otherWords.some((item) => item.wordId === leaving.wordId) ||
    session.recommendedWords.some((item) => item.wordId === leaving.wordId);
  if (!parked) session.otherWords.push(leaving);
}

export function applyAction(id: string, body: unknown) {
  const session = sessions.get(id);
  if (!session) throw new HttpError(404, "Unknown selection session.");
  if (session.committed) throw new HttpError(409, "Session already committed.");
  if (body == null || typeof body !== "object") {
    throw new HttpError(400, "Body must be a JSON object.");
  }
  const raw = body as Record<string, unknown>;
  const type = raw.type;
  const wordId = typeof raw.wordId === "string" ? raw.wordId : "";
  if (type !== "keep" && type !== "remove" && type !== "replace") {
    throw new HttpError(400, "type must be keep, remove, or replace.");
  }
  if (!wordId) throw new HttpError(400, "wordId is required.");

  const index = session.visible.findIndex((c) => c.wordId === wordId);
  if (index < 0) throw new HttpError(404, "Word is not on the visible list.");

  const at = new Date().toISOString();
  const action: TeacherAction = { type, wordId, replacementWordId: null, at };

  if (type === "keep") {
    session.teacherActions.push(action);
    return publicView(session);
  }

  let next;
  if (type === "replace") {
    const replacementWordId =
      typeof raw.replacementWordId === "string" ? raw.replacementWordId : "";
    if (!replacementWordId) {
      throw new HttpError(400, "replacementWordId is required for replace.");
    }
    next = takeReplacementFromPools(session, replacementWordId);
  } else {
    const picked = pickAutoReplacement(
      session.recommendedWords,
      session.otherWords,
      session.usedWords,
    );
    if (!picked) {
      throw new HttpError(409, "No unused words left for automatic replacement.");
    }
    next =
      takeByWordId(session.recommendedWords, picked.wordId) ??
      takeByWordId(session.otherWords, picked.wordId);
    if (!next) {
      throw new HttpError(409, "No unused words left for automatic replacement.");
    }
  }

  parkLeavingWord(session, session.visible[index]!);
  markUsed(session, wordId);
  markUsed(session, next.wordId);
  action.replacementWordId = next.wordId;
  session.visible.splice(index, 1, next);
  session.teacherActions.push(action);
  return publicView(session);
}

export function commitSelection(id: string) {
  const session = sessions.get(id);
  if (!session) throw new HttpError(404, "Unknown selection session.");
  if (session.committed) throw new HttpError(409, "Session already committed.");

  const event: SelectionEvent = {
    id: `evt_${randomUUID()}`,
    selectionContext: session.selectionContext,
    strategyId: session.strategyId,
    strategyVersion: session.strategyVersion,
    initialCandidates: session.initialCandidates,
    finalSelection: session.visible.map(snapshot),
    teacherActions: session.teacherActions,
    createdAt: new Date().toISOString(),
  };

  appendEvent(event);
  session.committed = true;
  return event;
}
