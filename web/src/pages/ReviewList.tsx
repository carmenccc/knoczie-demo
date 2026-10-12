import { useEffect, useState } from "react";
import type { SelectionAction, SelectionSessionView } from "../api/types.ts";

type ReviewListProps = {
  session: SelectionSessionView;
  acting: boolean;
  error: string | null;
  onAction: (body: SelectionAction) => void;
  onCommit: () => void;
  onStartOver: () => void;
};

export function ReviewList({ session, acting, error, onAction, onCommit, onStartOver }: ReviewListProps) {
  const tags = session.selectionContext.preferredFeatureIds ?? [];
  const [openWordId, setOpenWordId] = useState<string | null>(null);
  const [replacementWordId, setReplacementWordId] = useState("");

  useEffect(() => {
    if (openWordId && !session.candidates.some((candidate) => candidate.wordId === openWordId)) {
      setOpenWordId(null);
      setReplacementWordId("");
    }
  }, [session, openWordId]);

  function toggleReplace(wordId: string) {
    if (openWordId === wordId) {
      setOpenWordId(null);
      setReplacementWordId("");
      return;
    }
    setOpenWordId(wordId);
    setReplacementWordId("");
  }

  const otherIds = new Set(session.otherWords.map((word) => word.wordId));

  return (
    <section>
      <p>
        Session <code>{session.id}</code>
      </p>
      <p>Scope {session.selectionContext.vocabularyScope}</p>
      <p>
        Recommended left {session.recommendedWords.length}, other words {session.otherWords.length}
      </p>
      <p>Tags {tags.length === 0 ? "none" : tags.join(", ")}</p>
      {error ? <p className="error">{error}</p> : null}
      <ol className="candidate-list">
        {session.candidates.map((candidate) => {
          const open = openWordId === candidate.wordId;
          return (
            <li key={candidate.wordId}>
              <strong>{candidate.lemma}</strong> ({candidate.score.toFixed(3)})
              <div className="reasons">{candidate.reasons.join(" ")}</div>
              <div className="row-actions">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => onAction({ type: "remove", wordId: candidate.wordId })}
                >
                  Remove
                </button>
                <button type="button" disabled={acting} onClick={() => toggleReplace(candidate.wordId)}>
                  {open ? "Cancel replace" : "Replace"}
                </button>
              </div>
              {open ? (
                <div className="replace-panel">
                  <p className="hint">Recommended</p>
                  {session.recommendedWords.length === 0 ? <p className="hint">None left.</p> : null}
                  <div className="option-row">
                    {session.recommendedWords.map((word) => (
                      <label key={word.wordId} className="option-box">
                        <input
                          type="radio"
                          name={`replace-${candidate.wordId}`}
                          value={word.wordId}
                          checked={replacementWordId === word.wordId}
                          onChange={() => setReplacementWordId(word.wordId)}
                        />
                        {word.lemma}
                      </label>
                    ))}
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
            </li>
          );
        })}
      </ol>
      {session.candidates.length === 0 ? <p>No words matched this grade and term.</p> : null}
      <div className="page-actions">
        <button type="button" onClick={onCommit} disabled={acting}>
          Commit list
        </button>
        <button type="button" onClick={onStartOver} disabled={acting}>
          New selection
        </button>
      </div>
    </section>
  );
}
