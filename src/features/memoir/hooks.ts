"use client";

import { useMutation } from "@tanstack/react-query";
import { createMemoir } from "./api";
import type { MemoirCreateRequest } from "./schemas";

export function useCreateMemoir() {
  return useMutation({
    mutationFn: (req: MemoirCreateRequest) => createMemoir(req),
  });
}