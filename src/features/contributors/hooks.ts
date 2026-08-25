"use client";

import { useQuery } from "@tanstack/react-query";

import { listContributors } from "./api";

export const contributorKeys = {
  all: ["contributors"] as const,
  list: (memoirId: string) => [...contributorKeys.all, memoirId] as const,
};

export function useContributorsQuery(memoirId: string) {
  return useQuery({
    queryKey: contributorKeys.list(memoirId),
    queryFn: () => listContributors(memoirId),
    enabled: Boolean(memoirId),
  });
}
