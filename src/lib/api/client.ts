// File: src/lib/api/client.ts

import { unstable_rethrow } from "next/navigation";
import type { ZodType, z } from "zod";

import { env } from "@/lib/config/env";
import { ApiError, readErrorDetail } from "@/lib/api/errors";

export type ApiRequestCaching = {
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
};

export type ApiRequestOptions<TSchema extends ZodType> = ApiRequestCaching & {
  path: string;
  schema: TSchema;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function getAuthToken(): Promise<string | null> {
  // Only run in browser
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Dynamically import to avoid server-side execution
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export async function apiRequest<TSchema extends ZodType>({
  path,
  schema,
  method = "GET",
  body,
  headers,
  signal,
  cache,
  next,
}: ApiRequestOptions<TSchema>): Promise<z.infer<TSchema>> {
  const url = `${env.NEXT_PUBLIC_API_BASE_URL}${path}`;

  const timeout = AbortSignal.timeout(env.NEXT_PUBLIC_API_TIMEOUT_MS);
  const combinedSignal = signal
    ? AbortSignal.any([timeout, signal])
    : timeout;

  // Get auth token if in browser
  const token = await getAuthToken();
  const authHeader: Record<string, string> = token 
    ? { Authorization: `Bearer ${token}` }
    : {};

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: combinedSignal,
      cache,
      next,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...authHeader,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    unstable_rethrow(cause);
    throw ApiError.network(url, cause);
  }

  if (!response.ok) {
    throw ApiError.http(url, response.status, await readErrorDetail(response));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw ApiError.contract(url, "the body was not valid JSON.", cause);
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"} (${issue.message})`)
      .join(", ");

    throw ApiError.contract(url, fields, result.error);
  }

  return result.data;
}