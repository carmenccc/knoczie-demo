import { useEffect, useState } from "react";
import { applyAction, commitSelection, createSelection, getHealth } from "./api/wordSelectionApi.ts";
import type {
  HealthResponse,
  SelectionAction,
  SelectionContext,
  SelectionEvent,
  SelectionSessionView,
} from "./api/types.ts";
import { CommitSummary } from "./pages/CommitSummary.tsx";
import { GenerateForm } from "./pages/GenerateForm.tsx";
import { ReviewList } from "./pages/ReviewList.tsx";

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [session, setSession] = useState<SelectionSessionView | null>(null);
  const [event, setEvent] = useState<SelectionEvent | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((result) => {
        if (!cancelled) setHealth(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Request failed";
        setHealthError(message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAction(body: SelectionAction) {
    if (!session) return;
    setActionError(null);
    setActing(true);
    try {
      const next = await applyAction(session.id, body);
      setSession(next);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setActionError(message);
    } finally {
      setActing(false);
    }
  }

  function startOver() {
    setSession(null);
    setEvent(null);
    setActionError(null);
  }

  async function handleCommit() {
    if (!session) return;
    setActionError(null);
    setActing(true);
    try {
      const result = await commitSelection(session.id);
      setSession({ ...session, committed: true });
      setEvent(result.event);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setActionError(message);
    } finally {
      setActing(false);
    }
  }

  async function handleCreate(context: SelectionContext) {
    setFormError(null);
    setSubmitting(true);
    try {
      const created = await createSelection(context);
      setSession(created);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Vocabulary selection</h1>
      {healthError ? <p className="error">{healthError}</p> : null}
      {health ? (
        <p className="health">
          API {health.ok ? "ok" : "not ok"} — {health.strategyId} / {health.strategyVersion}
        </p>
      ) : null}
      {!health && !healthError ? <p>Checking API…</p> : null}

      {event ? (
        <CommitSummary event={event} onStartOver={startOver} />
      ) : session ? (
        <ReviewList
          session={session}
          acting={acting}
          error={actionError}
          onAction={handleAction}
          onCommit={handleCommit}
          onStartOver={startOver}
        />
      ) : (
        <GenerateForm submitting={submitting} error={formError} onSubmit={handleCreate} />
      )}
    </main>
  );
}
