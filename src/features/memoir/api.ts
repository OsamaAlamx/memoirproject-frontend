import { apiRequest, type ApiRequestCaching } from "@/lib/api/client";
import {
  memoirSchema,
  memoirCreateRequestSchema,
  type Memoir,
  type MemoirCreateRequest,
} from "./schemas";

export async function createMemoir(request: MemoirCreateRequest): Promise<Memoir> {
  const body = memoirCreateRequestSchema.parse(request);
  return apiRequest({
    path: "/memoirs",
    method: "POST",
    body,
    schema: memoirSchema,
  });
}

export async function fetchMemoir(
  id: string,
  options: ApiRequestCaching = {}
): Promise<Memoir> {
  return apiRequest({
    path: `/memoirs/${id}`,
    schema: memoirSchema,
    ...options,
  });
}