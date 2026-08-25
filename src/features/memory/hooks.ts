"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMemory, patchMemory, submitMemory as submitMemoryApi,
  deleteMemory, listMemories, removeMedia,
} from "@/features/memory/api";
import { uploadMedia, type UploadInput } from "@/features/memory/uploader";
import type { MemoryCreateRequest, MemoryPatchRequest } from "@/features/memory/schemas";

export const memoryKeys = {
  all: ["memory"] as const,
  list: (memoirId: string) => [...memoryKeys.all, "list", memoirId] as const,
  detail: (memoirId: string, memoryId: string) => [...memoryKeys.all, "detail", memoirId, memoryId] as const,
};

export function useMemoriesQuery(memoirId: string) {
  return useQuery({
    queryKey: memoryKeys.list(memoirId),
    queryFn: () => listMemories(memoirId),
    enabled: Boolean(memoirId),
  });
}

export function useCreateMemory(memoirId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: MemoryCreateRequest) => createMemory(memoirId, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.list(memoirId) }),
  });
}

export function usePatchMemory(memoirId: string) {
  return useMutation({
    mutationFn: (v: { memoryId: string; patch: MemoryPatchRequest }) => patchMemory(memoirId, v.memoryId, v.patch),
  });
}

export function useSubmitMemory(memoirId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: string) => submitMemoryApi(memoirId, memoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.list(memoirId) }),
  });
}

export function useDeleteMemory(memoirId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: string) => deleteMemory(memoirId, memoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.list(memoirId) }),
  });
}

export function useUploadMedia() {
  return useMutation({
    mutationFn: (input: UploadInput) => uploadMedia(input),
  });
}

export function useRemoveMedia(memoirId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { memoryId: string; mediaAssetId: string }) => removeMedia(memoirId, v.memoryId, v.mediaAssetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.list(memoirId) }),
  });
}