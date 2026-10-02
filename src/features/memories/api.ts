import { apiRequest } from "@/lib/api/client";
import {
  memoryCreateSchema,
  memoryUpdateSchema,
  memoirFeedResponseSchema,
  createMemoryResponseSchema,
  updateMemoryResponseSchema,
  deleteMemoryResponseSchema,
  type MemoryCreatePayload,
  type MemoryUpdatePayload,
} from "./schemas";

export async function getMemoirFeed(memoirId: string) {
  return apiRequest(`/api/memories/feed/${memoirId}`, { method: "GET" }, memoirFeedResponseSchema);
}

export async function createMemory(payload: MemoryCreatePayload) {
  return apiRequest(
    "/api/memories",
    { method: "POST", body: JSON.stringify(memoryCreateSchema.parse(payload)) },
    createMemoryResponseSchema,
  );
}

export async function updateMemory(memoryId: string, payload: MemoryUpdatePayload) {
  return apiRequest(
    `/api/memories/${memoryId}`,
    { method: "PATCH", body: JSON.stringify(memoryUpdateSchema.parse(payload)) },
    updateMemoryResponseSchema,
  );
}

export async function deleteMemory(memoryId: string) {
  return apiRequest(`/api/memories/${memoryId}`, { method: "DELETE" }, deleteMemoryResponseSchema);
}
