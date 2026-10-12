import { requestJson } from "./http.ts";
import type {
  CommitResponse,
  HealthResponse,
  SelectionAction,
  SelectionContext,
  SelectionSessionView,
} from "./types.ts";

export function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health");
}

export function createSelection(body: SelectionContext): Promise<SelectionSessionView> {
  return requestJson<SelectionSessionView>("/api/selections", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function applyAction(sessionId: string, body: SelectionAction): Promise<SelectionSessionView> {
  return requestJson<SelectionSessionView>(`/api/selections/${sessionId}/actions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function commitSelection(sessionId: string): Promise<CommitResponse> {
  return requestJson<CommitResponse>(`/api/selections/${sessionId}/commit`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
