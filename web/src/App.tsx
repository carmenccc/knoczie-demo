import { useEffect, useState } from "react";
import { applyAction, commitSelection, createSelection } from "./api/wordSelectionApi.ts";
import type { SelectionAction, SelectionContext, SelectionEvent, SelectionSessionView } from "./api/types.ts";
import { Sidebar, type TaskTab } from "./components/Sidebar.tsx";
import { WorkspaceTools } from "./components/WorkspaceTools.tsx";
import type { Destination } from "./destinations.ts";
import { CommitSummary } from "./pages/CommitSummary.tsx";
import { GenerateForm } from "./pages/GenerateForm.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { PlaceholderPage } from "./pages/PlaceholderPage.tsx";
import { ReviewList } from "./pages/ReviewList.tsx";

const SIDEBAR_KEY = "knoczie-sidebar-collapsed";
const THEME_KEY = "knoczie-theme";

type ThemeName = "light" | "night";

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

function readTheme(): ThemeName {
  try {
    return localStorage.getItem(THEME_KEY) === "night" ? "night" : "light";
  } catch {
    return "light";
  }
}

function taskTabs(session: SelectionSessionView | null, event: SelectionEvent | null): TaskTab[] {
  if (!session && !event) return [];
  return [{ id: "selection", label: "Selected Dictation", icon: "selected" }];
}

export default function App() {
  const [destination, setDestination] = useState<Destination>("home");
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [theme, setTheme] = useState<ThemeName>(readTheme);
  const [session, setSession] = useState<SelectionSessionView | null>(null);
  const [event, setEvent] = useState<SelectionEvent | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The theme still changes if storage is unavailable.
    }
  }, [theme]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // The sidebar still toggles if storage is unavailable.
      }
      return next;
    });
  }

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
    <div className="app-shell">
      <Sidebar
        destination={destination}
        collapsed={collapsed}
        tasks={taskTabs(session, event)}
        onNavigate={setDestination}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="workspace">
        <WorkspaceTools
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "night" ? "light" : "night"))}
        />
        {destination === "home" ? <HomePage onNavigate={setDestination} /> : null}
        {destination === "profile" ? (
          <PlaceholderPage title="Learner Profile" message="Profile questions are not in this demo yet." />
        ) : null}
        {destination === "extract" ? (
          <PlaceholderPage
            title="Extract Vocabulary"
            message="Upload and extraction are not in this demo yet."
          />
        ) : null}
        {destination === "dictation" ? (
          <PlaceholderPage title="Dictation" message="Student dictation is not in this demo yet." />
        ) : null}
        {destination === "settings" ? (
          <PlaceholderPage title="Settings" message="Settings are not in this demo yet." />
        ) : null}
        {destination === "selection" ? (
          <main className={`selection-flow ${event || session ? "review-view" : "configure-view"}`}>
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
              <>
                <header className="configure-heading">
                  <h1>Selected Dictation</h1>
                  <p>Configure the activity, then generate a focused vocabulary list.</p>
                </header>
                <GenerateForm submitting={submitting} error={formError} onSubmit={handleCreate} />
              </>
            )}
          </main>
        ) : null}
      </div>
    </div>
  );
}
