import { z } from "zod";

import { apiRequest, type ApiRequestCaching } from "@/lib/api/client";
import {
  memorySchema,
  memoryListResponseSchema,
  presignResponseSchema,
  mediaAssetSchema,
  memoryCreateRequestSchema,
  memoryPatchRequestSchema,
  presignRequestSchema,
  mediaConfirmRequestSchema,
  type Memory,
  type MemoryCreateRequest,
  type MemoryPatchRequest,
  type PresignRequest,
  type PresignResponse,
  type MediaConfirmRequest,
  type MediaAsset,
} from "@/features/memory/schemas";

const endpoints = {
  list: (m: string) => `/memoirs/${m}/memories`,
  create: (m: string) => `/memoirs/${m}/memories`,
  get: (m: string, id: string) => `/memoirs/${m}/memories/${id}`,
  patch: (m: string, id: string) => `/memoirs/${m}/memories/${id}`,
  submit: (m: string, id: string) => `/memoirs/${m}/memories/${id}/submit`,
  remove: (m: string, id: string) => `/memoirs/${m}/memories/${id}`,
  presign: (m: string, id: string) => `/memoirs/${m}/memories/${id}/media/presign`,
  confirm: (m: string, id: string) => `/memoirs/${m}/memories/${id}/media/confirm`,
  removeMedia: (m: string, id: string, mediaId: string) => `/memoirs/${m}/memories/${id}/media/${mediaId}`,
} as const;

export async function listMemories(memoirId: string, options: ApiRequestCaching & { signal?: AbortSignal } = {}) {
  return apiRequest({ path: endpoints.list(memoirId), schema: memoryListResponseSchema, ...options });
}

export async function createMemory(memoirId: string, request: MemoryCreateRequest): Promise<Memory> {
  const body = memoryCreateRequestSchema.parse(request);
  return apiRequest({ path: endpoints.create(memoirId), method: "POST", body, schema: memorySchema });
}

export async function patchMemory(memoirId: string, memoryId: string, patch: MemoryPatchRequest): Promise<Memory> {
  const body = memoryPatchRequestSchema.parse(patch);
  return apiRequest({ path: endpoints.patch(memoirId, memoryId), method: "PATCH", body, schema: memorySchema });
}

export async function submitMemory(memoirId: string, memoryId: string): Promise<Memory> {
  return apiRequest({ path: endpoints.submit(memoirId, memoryId), method: "POST", schema: memorySchema });
}

export async function deleteMemory(memoirId: string, memoryId: string): Promise<void> {
  await apiRequest({ path: endpoints.remove(memoirId, memoryId), method: "DELETE", schema: z.unknown() });
}

export async function presignMediaUpload(memoirId: string, memoryId: string, request: PresignRequest): Promise<PresignResponse> {
  const body = presignRequestSchema.parse(request);
  return apiRequest({ path: endpoints.presign(memoirId, memoryId), method: "POST", body, schema: presignResponseSchema });
}

export async function confirmMediaUpload(memoirId: string, memoryId: string, request: MediaConfirmRequest): Promise<MediaAsset> {
  const body = mediaConfirmRequestSchema.parse(request);
  return apiRequest({ path: endpoints.confirm(memoirId, memoryId), method: "POST", body, schema: mediaAssetSchema });
}

export async function removeMedia(memoirId: string, memoryId: string, mediaAssetId: string): Promise<void> {
  await apiRequest({ path: endpoints.removeMedia(memoirId, memoryId, mediaAssetId), method: "DELETE", schema: z.unknown() });
}