"use client";

import { useMutation , useQueryClient } from "@tanstack/react-query";
import { createMemoir } from "./api";
import { publishMemoir } from "./api";
import type { MemoirCreateRequest } from "./schemas";

export function useCreateMemoir() {
  return useMutation({
    mutationFn: (req: MemoirCreateRequest) => createMemoir(req),
  });
}

export function usePublishMemoir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishMemoir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memoirs"] });
    },
  });
}
