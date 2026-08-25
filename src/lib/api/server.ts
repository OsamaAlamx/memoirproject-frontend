import "server-only";

import { unstable_rethrow } from "next/navigation";
import type { ZodType, z } from "zod";

import { env } from "@/lib/config/env";
import { ApiError, readErrorDetail } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

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
  retries?: number; // Number of retry attempts
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiRequestServer<TSchema extends ZodType>({
  path,
  schema,
  method = "GET",
  body,
  headers,
  signal,
  cache,
  next,
  retries = 2, // Default 2 retries
}: ApiRequestOptions<TSchema>): Promise<z.infer<TSchema>> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`;

  // Longer timeout for server-side requests (30 seconds)
  const timeoutMs = 30000;
  const timeout = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([timeout, signal])
    : timeout;

  // Get auth token from server-side Supabase client
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s...
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await sleep(backoffMs);
      }

      const response = await fetch(url, {
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

    } catch (cause) {
      unstable_rethrow(cause);
      
      lastError = cause as Error;
      
      // Don't retry on client errors (4xx) or contract mismatches
      if (cause instanceof ApiError) {
        if (cause.isClientError || cause.code === "contract") {
          throw cause;
        }
      }
      
      // If this was the last attempt, throw
      if (attempt === retries) {
        if (lastError.name === "TimeoutError") {
          throw ApiError.network(url, lastError);
        }
        throw lastError;
      }
      
      // Otherwise, loop continues for retry
    }
  }

  // Fallback (should never reach here)
  throw lastError || ApiError.network(url, new Error("Unknown error"));
}