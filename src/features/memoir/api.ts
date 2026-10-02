import { apiRequest } from "@/lib/api/client";
import {
  memoirCreateSchema,
  createMemoirResponseSchema,
  liveMemoirResponseSchema,
  activeMemoirResponseSchema,
  memoirListResponseSchema,
  deleteMemoirResponseSchema,
  publicationResponseSchema,
  memoirSettingsResponseSchema,
  type MemoirCreatePayload,
  type MemoirRecord,
} from "./schemas";

export async function createMemoir(payload: MemoirCreatePayload) {
  return apiRequest(
    "/api/memoirs/",
    { method: "POST", body: JSON.stringify(memoirCreateSchema.parse(payload)) },
    createMemoirResponseSchema,
  );
}

export async function getLiveMemoir(memoirId: string) {
  const body = await apiRequest(`/api/memoirs/${memoirId}/live`, { method: "GET" }, liveMemoirResponseSchema);
  return body.data;
}

export async function getUserActiveMemoir() {
  const body = await apiRequest("/api/memoirs/user/active", { method: "GET" }, activeMemoirResponseSchema);
  return body.data;
}

export async function listMemoirs(): Promise<MemoirRecord[]> {
  const body = await apiRequest("/api/memoirs/", { method: "GET" }, memoirListResponseSchema);
  return body.data;
}

export async function deleteMemoir(memoirId: string) {
  const body = await apiRequest(
    `/api/memoirs/${memoirId}`,
    { method: "DELETE" },
    deleteMemoirResponseSchema,
  );
  return body.data;
}

export async function setMemoirPublication(memoirId: string, publish: boolean) {
  const body = await apiRequest(
    `/api/memoirs/${memoirId}/publication`,
    { method: "PATCH", body: JSON.stringify({ publish }) },
    publicationResponseSchema,
  );
  return body.data;
}

export async function setMemoirSettings(memoirId: string, settings: { comment_policy?: string }) {
  const body = await apiRequest(
    `/api/memoirs/${memoirId}/settings`,
    { method: "PATCH", body: JSON.stringify(settings) },
    memoirSettingsResponseSchema,
  );
  return body.data;
}
