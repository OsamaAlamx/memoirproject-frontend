import { z } from "zod";

// Zod twin of the backend's CommentCreate (schemas/comments.py).
export const commentCreateSchema = z.object({
  memoir_id: z.string().min(1, "Memoir ID is required."),
  memory_id: z.string().nullable().optional(),
  media_asset_id: z.string().nullable().optional(),
  parent_comment_id: z.string().nullable().optional(),
  body: z.string().min(1, "Comment text cannot be empty."),
});

export type CommentCreatePayload = z.infer<typeof commentCreateSchema>;

// Comment entity as returned by the backend. Lenient: only identifiers asserted.
export const commentEntitySchema = z
  .object({
    id: z.string(),
    memoir_id: z.string().optional(),
    memory_id: z.string().nullable().optional(),
    media_asset_id: z.string().nullable().optional(),
    parent_comment_id: z.string().nullable().optional(),
    author_participant_id: z.string().optional(),
    body: z.string().optional(),
    created_at: z.string().optional(),
    author_name: z.string().optional(),
  })
  .passthrough();

export type CommentEntity = z.infer<typeof commentEntitySchema>;

export const commentsResponseSchema = z
  .union([z.array(commentEntitySchema), z.object({ comments: z.array(commentEntitySchema) }).passthrough()])
  .transform((v) => (Array.isArray(v) ? v : v.comments || []));

export const commentResponseSchema = z
  .union([commentEntitySchema, z.object({ comment: commentEntitySchema }).passthrough()])
  .transform((v): CommentEntity => {
    const raw = v as { comment?: CommentEntity };
    return raw.comment ?? (v as CommentEntity);
  });

// Owner moderation: pending queue is a raw array; reject returns {success, data:{id}}.
export const pendingCommentsResponseSchema = z.array(commentEntitySchema);

const moderationEnvelope = z.object({ success: z.boolean().optional(), message: z.string().optional() }).passthrough();

export const deleteCommentResponseSchema = moderationEnvelope
  .extend({ data: z.object({ id: z.string() }).passthrough() })
  .passthrough();
