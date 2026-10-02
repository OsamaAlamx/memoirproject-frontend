import { apiRequest } from "@/lib/api/client";
import {
  chapterProposalSchema,
  chapterRefineRequestSchema,
  chapterProposalResponseSchema,
  applyChaptersResponseSchema,
  type ChapterProposalPayload,
} from "./schemas";

export async function proposeChapters(memoirId: string) {
  const body = await apiRequest(
    `/api/memoirs/${memoirId}/chapters/propose`,
    { method: "POST" },
    chapterProposalResponseSchema,
  );
  return body.data;
}

export async function refineChapters(memoirId: string, currentProposal: ChapterProposalPayload, prompt: string) {
  const raw = chapterRefineRequestSchema.parse({ current_proposal: currentProposal, user_prompt: prompt });
  const body = await apiRequest(
    `/api/memoirs/${memoirId}/chapters/refine`,
    { method: "POST", body: JSON.stringify(raw) },
    chapterProposalResponseSchema,
  );
  return body.data;
}

export async function applyChapters(memoirId: string, payload: ChapterProposalPayload) {
  return apiRequest(
    `/api/memoirs/${memoirId}/chapters/apply`,
    { method: "POST", body: JSON.stringify({ chapters: chapterProposalSchema.parse(payload).chapters }) },
    applyChaptersResponseSchema,
  );
}
