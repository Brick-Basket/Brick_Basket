/**
 * REST client foundation — added in the post-Part-20 stabilization pass
 * (Phase 21). This is infrastructure only: a shared `fetch()` wrapper that
 * a future `*.rest-adapter.ts` (the swap-in replacement for a
 * `Mock*Adapter`, per `docs/API_INTEGRATION_GUIDE.md`) can use instead of
 * hand-rolling request/response/error handling 25+ times over. **No real
 * `*.rest-adapter.ts` exists yet in this build** — there is still no
 * backend to point at (`NEXT_PUBLIC_API_BASE_URL` remains an unset
 * placeholder, per `docs/ENVIRONMENT_VARIABLES.md`) — so nothing in the app
 * imports this file today. It exists so the *next* session that starts
 * writing real REST adapters doesn't have to invent this layer from
 * scratch, and so every REST adapter that does get written handles errors
 * the same way instead of each reinventing its own convention.
 *
 * **Why this shape, specifically**:
 * - `docs/ERROR_HANDLING.md` documents that every mock adapter today fails
 *   with a plain `throw new Error("human-readable message")`, and that no
 *   component anywhere branches on a status code — every catch block just
 *   displays `.message`. `apiRequest` below preserves that exact contract:
 *   a non-2xx response is thrown as an `Error` whose `.message` is the
 *   server's own `{ message: string }` body (the `ErrorResponse` schema
 *   already used throughout `docs/openapi.yaml`), so existing hooks and
 *   components need zero changes when a real `RestXAdapter` starts using
 *   this helper.
 * - `ApiError` (not a plain `Error`) is what's actually thrown, carrying
 *   the numeric `status` and parsed `body` alongside `.message` — additive,
 *   not a departure from the convention above. `docs/ERROR_HANDLING.md`
 *   itself names this as "the right place to add that branching" (e.g. a
 *   `401` triggering forced logout) without changing any presentation
 *   component, since `ErrorState`/the inline-banner pattern only ever see
 *   the final message string. A `*.rest-adapter.ts` method that wants that
 *   branching can check `error instanceof ApiError && error.status === 401`;
 *   one that doesn't care can ignore it completely and get the exact
 *   pre-existing behavior.
 * - `credentials: "include"` is set unconditionally, matching the
 *   httpOnly-cookie auth option `docs/FRONTEND_BACKEND_HANDOFF.md` names as
 *   one of the two live wiring choices — harmless (a no-op) if the eventual
 *   backend uses a bearer-JWT header instead, the other option that same
 *   doc names.
 *
 * **FRONTEND IMPLEMENTATION DECISION, not owner- or backend-confirmed**:
 * the exact error-body shape (`{ message: string }`), the choice of
 * cookie-based credentials over a bearer-token header by default, and
 * whether the three pure-aggregate adapters (`CostToComplete`/
 * `Notifications`/`OpsMetrics`, see `docs/API_INTEGRATION_GUIDE.md`) end up
 * calling this same helper or a dedicated aggregate endpoint are all still
 * open — see `docs/OPEN_QUESTIONS.md`.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Thrown by every `apiRequest` failure — a real `Error` (so `.message` keeps working everywhere unchanged), plus the numeric status and parsed body for a caller that wants to branch on them. */
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiQueryValue = string | number | boolean | undefined | null;

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  /** Plain object → JSON.stringify'd automatically. A string/FormData/Blob passes through untouched. Omit for a bodiless request (GET/DELETE). */
  body?: unknown;
  /** Appended as a query string. A key with an undefined/null/empty-string value is omitted entirely, rather than serialized as "undefined"/"null" — the same "absent means no filter" convention every mock adapter's own list params already follow. */
  query?: Record<string, ApiQueryValue>;
  /** Deliberately narrowed to a plain object (unlike RequestInit's own `HeadersInit`, which also allows a `Headers` instance or a tuple array) — simpler to merge with the Content-Type this function may add on top. */
  headers?: Record<string, string>;
}

/** Exported for its own unit test — see `http-client.test.ts`. Never produces a leading "?" for an empty/all-omitted query. */
export function buildQueryString(query: Record<string, ApiQueryValue> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Core request function — every method on `httpClient` below is a thin, differently-shaped call into this. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options;
  const url = `${API_BASE_URL}${path}${buildQueryString(query)}`;
  const isPlainObjectBody = body !== undefined && isJsonRecord(body);
  const isArrayBody = Array.isArray(body);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      credentials: "include",
      headers: {
        ...(isPlainObjectBody || isArrayBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: isPlainObjectBody || isArrayBody ? JSON.stringify(body) : (body as BodyInit | undefined),
    });
  } catch (networkError) {
    // fetch() itself only rejects on a network-level failure (offline, DNS,
    // a CORS preflight rejection) — never on a non-2xx response, which is
    // handled below instead. Status 0 signals "never reached the server"
    // to a caller branching on ApiError.status, distinct from any real
    // HTTP status code.
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0, networkError);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  let parsed: unknown = null;
  if (contentType.includes("application/json")) {
    parsed = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const message =
      isJsonRecord(parsed) && typeof parsed.message === "string" ? parsed.message : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
}

/** Convenience wrappers — what a `*.rest-adapter.ts` method actually calls. */
export const httpClient = {
  get: <T>(path: string, query?: Record<string, ApiQueryValue>) => apiRequest<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
