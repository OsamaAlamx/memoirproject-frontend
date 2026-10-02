import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import { ApiError, clearExpiredSession, readErrorDetail } from "./errors";
import { env } from "@/lib/config/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

/** Auth endpoints must never trigger session cleanup — a 401 there means bad credentials, not an expired session. */
function isAuthEndpoint(endpoint: string): boolean {
  return endpoint.startsWith("/api/auth/");
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") || localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("API request timed out.", "TimeoutError")),
    env.NEXT_PUBLIC_API_TIMEOUT_MS,
  );
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generic transport for all feature API calls.
 *
 * Owns the base URL, auth headers, HTTP error parsing, and response validation —
 * and nothing else. Endpoint paths and their Zod schemas live in
 * `features/<name>/api.ts` + `features/<name>/schemas.ts`, one function per endpoint.
 * Callers must import from a feature barrel (`@/features/<name>`), never from here.
 */
export async function apiRequest<T extends z.ZodTypeAny>(
  endpoint: string,
  options: RequestInit,
  schema: T,
): Promise<z.output<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  let res: Response;
  try {
    res = await apiFetch(endpoint, options);
  } catch (err) {
    unstable_rethrow(err);
    throw ApiError.network(url, err);
  }
  if (!res.ok) {
    // Expired/invalid JWT: drop it now so guards see a logged-out state.
    // Callers redirect to /login; the transport itself never navigates
    // (login/signup surface their own 401s as form errors).
    if (res.status === 401 && !isAuthEndpoint(endpoint)) {
      clearExpiredSession();
    }
    throw ApiError.http(url, res.status, await readErrorDetail(res));
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    unstable_rethrow(err);
    throw ApiError.contract(url, "response is not valid JSON.", err);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.contract(url, parsed.error.message, parsed.error);
  }
  return parsed.data;
}

/**
 * Binary transfer helper (presigned PUTs, blob downloads). The only other
 * fetch in the app besides apiRequest — features must use this, never fetch.
 */
export async function fetchBlob(input: string, init?: RequestInit): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err) {
    unstable_rethrow(err);
    throw ApiError.network(input, err);
  }
  if (!res.ok) {
    throw ApiError.http(input, res.status, await readErrorDetail(res));
  }
  return res.blob();
}