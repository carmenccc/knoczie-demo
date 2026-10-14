import { useState } from "react";
import type { SelectionAction, SelectionContext, SelectionSessionView } from "../api/types.ts";
import { Icon } from "../components/Icon.tsx";

type ReviewListProps = {
  session: SelectionSessionView;
  acting: boolean;
  error: string | null;
  onAction: (body: SelectionAction) => void;
  onCommit: () => void;
  onStartOver: () => void;
};

function contextLine(context: SelectionContext, count: number) {
  const level = context.levelRange?.from;
  const term = level?.term === 1 ? "上" : level?.term === 2 ? "下" : "full year";
  const grade = level ? `grade ${level.grade}, ${term}` : "level not set";
  const words = count === 1 ? "1 word" : `${count} words`;
  return `${context.vocabularyScope}, ${grade}, ${words}`;
}

function levelLabel(context: SelectionContext) {
  const level = context.levelRange?.from;
  if (!level) return "—";
  if (level.term === 1) return `Grade ${level.grade} 上`;
  if (level.term === 2) return `Grade ${level.grade} 下`;
  return `Grade ${level.grade}`;
}

export function ReviewList({ session, acting, error, onAction, onCommit, onStartOver }: ReviewListProps) {
  const [openWordId, setOpenWordId] = useState<string | null>(null);
  const [replacementWordId, setReplacementWordId] = useState("");
  const replaceId = session.candidates.some((candidate) => candidate.wordId === openWordId) ? openWordId : null;
  const otherIds = new Set(session.otherWords.map((word) => word.wordId));
  const level = levelLabel(session.selectionContext);

  function toggleReplace(wordId: string) {
    if (replaceId === wordId) {
      setOpenWordId(null);
      setReplacementWordId("");
      return;
    }
    setOpenWordId(wordId);
    setReplacementWordId("");
  }

  return (
    <section className="review-page">
      <header className="review-heading">
        <h1>Recommended vocabulary</h1>
      </header>
      <p className="review-context">{contextLine(session.selectionContext, session.candidates.length)}</p>
      <div className="learner-strip">
        <span className="learner-badge" aria-hidden="true">
          SL
        </span>
        <div>
          <small>Learner</small>
          <strong>Sample learner</strong>
        </div>
        <span className="learner-pill">Placeholder profile</span>
      </div>
      {error ? <p className="error review-error">{error}</p> : null}
      {session.candidates.length === 0 ? <p className="review-empty">No words matched this grade and term.</p> : null}
      {session.candidates.length > 0 ? (
        <div className="word-table" role="table">
          <div className="word-row word-head" role="row">
            <span>Word</span>
            <span>Gloss</span>
            <span>Level</span>
            <span>Why this word</span>
            <span>Actions</span>
          </div>
          {session.candidates.map((candidate) => {
            const open = replaceId === candidate.wordId;
            return (
              <div className={`word-block ${open ? "is-open" : ""}`} key={candidate.wordId}>
                <div className="word-row" role="row">
                  <strong>{candidate.lemma}</strong>
                  <span className="gloss">Placeholder</span>
                  <span>{level}</span>
                  <span className="reasons">{candidate.reasons.length > 0 ? candidate.reasons.join(", ") : "—"}</span>
                  <span className="row-actions">
                    <button type="button" disabled={acting} onClick={() => toggleReplace(candidate.wordId)}>
                      {open ? "Cancel" : "Replace"}
                    </button>
                    <button
                      type="button"
                      className="remove-action"
                      disabled={acting}
                      onClick={() => onAction({ type: "remove", wordId: candidate.wordId })}
                    >
                      Remove
                    </button>
                  </span>
                </div>
                {open ? (
                  <div className="replace-panel">
                    <p className="hint">Recommended</p>
                    {session.recommendedWords.length === 0 ? <p className="hint">None left.</p> : null}
                    <div className="chip-row">
                      {session.recommendedWords.map((word) => {
                        const selected = replacementWordId === word.wordId;
                        return (
                          <label key={word.wordId} className={`chip ${selected ? "chip-selected" : ""}`}>
                            <input
                              type="radio"
                              name={`replace-${candidate.wordId}`}
                              value={word.wordId}
                              checked={selected}
                              onChange={() => setReplacementWordId(word.wordId)}
                            />
                            {word.lemma}
                            {selected ? <Icon name="check" size={14} /> : null}
                          </label>
                        );
                      })}
                    </div>
                    {session.otherWords.length > 0 ? (
                      <label className="other-pick">
                        Other words
                        <select
                          value={otherIds.has(replacementWordId) ? replacementWordId : ""}
                          onChange={(event) => setReplacementWordId(event.target.value)}
                        >
                          <option value="">Choose a word</option>
                          {session.otherWords.map((word) => (
                            <option key={word.wordId} value={word.wordId}>
                              {word.lemma}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <button
                      type="button"
                      className="use-word"
                      disabled={acting || replacementWordId === ""}
                      onClick={() =>
                        onAction({
                          type: "replace",
                          wordId: candidate.wordId,
                          replacementWordId,
                        })
                      }
                    >
                      Use this word
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="review-footer">
        <button type="button" className="review-discard" onClick={onStartOver} disabled={acting}>
          Discard
        </button>
        <button type="button" className="review-primary" onClick={onCommit} disabled={acting || session.candidates.length === 0}>
          Create Dictation Task
        </button>
      </div>
    </section>
  );
}
