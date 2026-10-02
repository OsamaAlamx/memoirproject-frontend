import { z } from "zod";

// Zod twin of the backend's ShareLinkResponse (schemas/share.py).
export const shareLinkSchema = z
  .object({
    id: z.string(),
    memoir_id: z.string(),
    scope: z.string(),
    token: z.string(),
    url: z.string(),
    created_by_participant_id: z.string().nullable().optional(),
    created_at: z.string(),
    expires_at: z.string().nullable().optional(),
    revoked_at: z.string().nullable().optional(),
    open_count: z.number().optional(),
  })
  .passthrough();

export type ShareLink = z.infer<typeof shareLinkSchema>;

const envelope = z.object({ success: z.boolean().optional(), message: z.string().optional() }).passthrough();

export const shareActionResponseSchema = envelope;
export const shareLinkResponseSchema = envelope
  .extend({ data: shareLinkSchema })
  .passthrough();

export type ShareLinkResult = z.infer<typeof shareLinkResponseSchema>;

// ---- Reader (public live memoir) ----

const sharedMediaAssetSchema = z
  .object({
    id: z.string(),
    kind: z.string(),
    storage_key: z.string().nullable().optional(),
    playback_url: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
  })
  .passthrough();

const sharedMemoryMediaSchema = z
  .object({ media_asset: sharedMediaAssetSchema.nullable().optional() })
  .passthrough();

const sharedMemorySchema = z
  .object({
    id: z.string(),
    title: z.string().nullable().optional(),
    body_text: z.string().nullable().optional(),
    chapter_id: z.string().nullable().optional(),
    occurred_start: z.string().nullable().optional(),
    created_at: z.string().optional(),
    memory_media: z.array(sharedMemoryMediaSchema).optional(),
  })
  .passthrough();

const sharedChapterSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    summary: z.string().nullable().optional(),
    sort_order: z.number().optional(),
  })
  .passthrough();

export const sharedMemoirResponseSchema = envelope
  .extend({
    data: z
      .object({
        subject_name: z.string().optional(),
        description: z.string().nullable().optional(),
        subject_born_on: z.string().nullable().optional(),
        subject_died_on: z.string().nullable().optional(),
        subject_is_living: z.boolean().optional(),
        can_comment: z.boolean().optional(),
        memories: z.array(sharedMemorySchema).optional(),
        chapters: z.array(sharedChapterSchema).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type SharedMemoir = z.infer<typeof sharedMemoirResponseSchema>;
export type SharedMemory = z.infer<typeof sharedMemorySchema>;
export type SharedChapter = z.infer<typeof sharedChapterSchema>;

export const readerJoinResponseSchema = envelope
  .extend({
    data: z.object({ participant_id: z.string(), display_name: z.string(), memoir_id: z.string() }).passthrough(),
  })
  .passthrough();

export type ReaderProfile = { participant_id: string; display_name: string };

export const guestCommentSchema = z
  .object({
    id: z.string(),
    memoir_id: z.string().optional(),
    memory_id: z.string().nullable().optional(),
    parent_comment_id: z.string().nullable().optional(),
    body: z.string().optional(),
    created_at: z.string().optional(),
    author_name: z.string().optional(),
  })
  .passthrough();

export type GuestComment = z.infer<typeof guestCommentSchema>;

export const guestCommentListResponseSchema = envelope
  .extend({ data: z.array(guestCommentSchema) })
  .passthrough();

export const guestCommentResponseSchema = envelope
  .extend({ data: guestCommentSchema })
  .passthrough();

export const reactionToggleResponseSchema = envelope
  .extend({ data: z.object({ reacted: z.boolean(), count: z.number() }).passthrough() })
  .passthrough();

export const reactionSummaryResponseSchema = envelope
  .extend({
    data: z.object({ counts: z.record(z.string(), z.number()), reacted: z.array(z.string()) }).passthrough(),
  })
  .passthrough();
