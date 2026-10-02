import { z } from "zod";

// Chapter proposal shapes. Entries always carry id/title/date: the backend
// applies "Untitled Entry" fallbacks server-side and instructs the LLM likewise.
export const chapterMemoryEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().nullable(),
});

export const chapterProposalSchema = z
  .object({
    chapters: z.array(
      z
        .object({
          title: z.string(),
          summary: z.string().optional(),
          memories: z.array(chapterMemoryEntrySchema),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export type ChapterProposalPayload = z.infer<typeof chapterProposalSchema>;

export const chapterRefineRequestSchema = z.object({
  current_proposal: chapterProposalSchema,
  user_prompt: z.string().min(1, "Guidance prompt is required."),
});

const envelope = z.object({ success: z.boolean().optional(), message: z.string().optional() }).passthrough();

export const chapterProposalResponseSchema = envelope.extend({ data: chapterProposalSchema }).passthrough();

export const applyChaptersResponseSchema = envelope;
