import type { SelectionEvent } from "../api/types.ts";

type CommitSummaryProps = {
  event: SelectionEvent;
  onStartOver: () => void;
};

export function CommitSummary({ event, onStartOver }: CommitSummaryProps) {
  return (
    <section>
      <h2>Saved list</h2>
      <p>This list is saved. Remove and replace are closed.</p>
      <p>
        Event <code>{event.id}</code>
      </p>
      <p>
        Saved at <time dateTime={event.createdAt}>{event.createdAt}</time>
      </p>
      <ol className="candidate-list">
        {event.finalSelection.map((word) => (
          <li key={word.wordId}>
            <strong>{word.lemma}</strong> ({word.score.toFixed(3)})
          </li>
        ))}
      </ol>
      {event.finalSelection.length === 0 ? <p>No words in this list.</p> : null}
      <div className="page-actions">
        <button type="button" onClick={onStartOver}>
          New selection
        </button>
      </div>
    </section>
  );
}
