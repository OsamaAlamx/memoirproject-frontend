/**
 * The error taxonomy for everything that can go wrong at the API boundary.
 *
 * Every failure in `client.ts` is normalized into an `ApiError` with one of
 * three codes. Components never see a raw `TypeError`, a bare `Response`, or a
 * `ZodError` — they see an `ApiError` and can branch on `code`.
 */

/**
 * - `network`  — the request never got an answer (backend down, DNS, timeout).
 * - `http`     — the backend answered with a non-2xx status.
 * - `contract` — the backend answered successfully, but not in the shape we
 *                expect. This means the frontend and backend have drifted
 *                apart, which is a bug to fix, not a condition to handle.
 */
export type ApiErrorCode = "network" | "http" | "contract";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** HTTP status, or `null` when the request never completed. */
  readonly status: number | null;
  /** The URL that was requested, for logs. */
  readonly url: string;

  constructor(params: {
    code: ApiErrorCode;
    message: string;
    url: string;
    status?: number | null;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = "ApiError";
    this.code = params.code;
    this.status = params.status ?? null;
    this.url = params.url;
  }

  static network(url: string, cause: unknown): ApiError {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    return new ApiError({
      code: "network",
      url,
      cause,
      message: timedOut
        ? "The server took too long to respond."
        : "Could not reach the server. Check that the backend is running.",
    });
  }

  static http(url: string, status: number, detail: string): ApiError {
    return new ApiError({ code: "http", url, status, message: detail });
  }

  static contract(url: string, message: string, cause?: unknown): ApiError {
    return new ApiError({
      code: "contract",
      url,
      cause,
      message: `Unexpected response from the server: ${message}`,
    });
  }

  /** True for statuses where retrying the same request cannot help. */
  get isClientError(): boolean {
    return this.status !== null && this.status >= 400 && this.status < 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * True when the backend rejected the stored JWT (expired, invalid, revoked).
 * Callers use this to redirect to /login instead of retrying with the same token.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "http" && error.status === 401;
}

/**
 * Drops a stale JWT so the next guard/redirect sees a logged-out state.
 * Safe to call from any client component; no-op on the server.
 */
export function clearExpiredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
}

/**
 * Turns a FastAPI error body into a readable sentence.
 *
 * FastAPI raises errors in two shapes:
 *   `HTTPException(500, detail="...")`  ->  { "detail": "..." }
 *   request validation failure (422)    ->  { "detail": [{ loc, msg, type }] }
 *
 * Anything else falls back to the status text, so an unexpected error body can
 * never itself become an error.
 */
export async function readErrorDetail(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}.`;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return fallback;
  }

  if (typeof body !== "object" || body === null || !("detail" in body)) {
    return fallback;
  }

  const { detail } = body as { detail: unknown };

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        typeof item === "object" && item !== null && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : null,
      )
      .filter((msg): msg is string => Boolean(msg));

    if (messages.length > 0) return messages.join("; ");
  }

  return fallback;
}
