import type { SelectionContext, SelectionEvent } from "../api/types.ts";

type CommitSummaryProps = {
  event: SelectionEvent;
  onStartOver: () => void;
};

function levelLabel(context: SelectionContext) {
  const level = context.levelRange?.from;
  if (!level) return "—";
  if (level.term === 1) return `Grade ${level.grade} 上`;
  if (level.term === 2) return `Grade ${level.grade} 下`;
  return `Grade ${level.grade}`;
}

export function CommitSummary({ event, onStartOver }: CommitSummaryProps) {
  const savedAt = new Date(event.createdAt);
  const savedLabel = Number.isNaN(savedAt.getTime()) ? event.createdAt : savedAt.toLocaleString();
  const level = levelLabel(event.selectionContext);

  return (
    <section className="review-page">
      <header className="review-heading">
        <h1>Dictation task created</h1>
      </header>
      <p className="review-context">
        Event {event.id}. Saved {savedLabel}.
      </p>
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
      {event.finalSelection.length === 0 ? <p className="review-empty">No words in this list.</p> : null}
      {event.finalSelection.length > 0 ? (
        <div className="word-table saved-table" role="table">
          <div className="word-row word-head" role="row">
            <span>Word</span>
            <span>Gloss</span>
            <span>Level</span>
            <span>Why this word</span>
          </div>
          {event.finalSelection.map((word) => (
            <div className="word-block" key={word.wordId}>
              <div className="word-row" role="row">
                <strong>{word.lemma}</strong>
                <span className="gloss">Placeholder</span>
                <span>{level}</span>
                <span className="reasons">{word.reasons.length > 0 ? word.reasons.join(", ") : "—"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="review-footer">
        <button type="button" className="review-primary" onClick={onStartOver}>
          New selection
        </button>
      </div>
    </section>
  );
}
