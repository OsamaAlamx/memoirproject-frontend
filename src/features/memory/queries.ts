import "server-only";

import { apiRequestServer } from "@/lib/api/server";
import { memoryListResponseSchema } from "./schemas";

export async function getMemories(memoirId: string) {
  return apiRequestServer({
    path: `/memoirs/${memoirId}/memories`,
    schema: memoryListResponseSchema,
    cache: "no-store",
  });
}