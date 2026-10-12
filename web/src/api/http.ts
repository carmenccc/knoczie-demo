import type { ApiErrorBody } from "./types.ts";

function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE;
  const base = configured && configured.length > 0 ? configured : "http://localhost:3000";
  return base.replace(/\/$/, "");
}

/**
 * JSON request against the demo API.
 * Non-OK responses use the `{ error }` body when present.
 */
export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } catch {
      // Response was not JSON; keep the status message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
