import { apiRequest } from "@/lib/api/client";
import { contributorListSchema } from "./schemas";

export async function listContributors(memoirId: string) {
  return apiRequest({
    path: `/memoirs/${memoirId}/contributors`,
    schema: contributorListSchema,
  });
}
