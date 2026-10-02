import { z } from "zod";

// Zod twin of the backend's MemoirCreateRequest (schemas/memoir.py), including
// its two cross-field rules: birth <= death, and a living subject has no death date.
export const memoirCreateSchema = z
  .object({
    subject_name: z.string().min(1, "Subject name is required."),
    subject_born_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be YYYY-MM-DD.").nullish(),
    subject_died_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Death date must be YYYY-MM-DD.").nullish(),
    subject_is_living: z.boolean(),
    description: z.string().optional(),
    visibility: z.string().optional(),
    comment_policy: z.string().optional(),
    relationship: z.string().optional(),
  })
  .refine(
    (d) => !(d.subject_born_on && d.subject_died_on && d.subject_born_on > d.subject_died_on),
    { message: "Subject birth date cannot be after their death date.", path: ["subject_died_on"] },
  )
  .refine((d) => !(d.subject_is_living && d.subject_died_on != null), {
    message: "A living subject cannot have a death date.",
    path: ["subject_died_on"],
  });

export type MemoirCreatePayload = z.infer<typeof memoirCreateSchema>;

// Memoir record as returned by the backend. Lenient: only identifiers asserted.
export const memoirRecordSchema = z
  .object({
    id: z.string(),
    subject_name: z.string().optional(),
    subject_born_on: z.string().nullable().optional(),
    subject_died_on: z.string().nullable().optional(),
    subject_is_living: z.boolean().optional(),
    description: z.string().nullable().optional(),
    visibility: z.string().optional(),
    comment_policy: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export type MemoirRecord = z.infer<typeof memoirRecordSchema>;

const envelope = z.object({ success: z.boolean().optional(), message: z.string().optional() }).passthrough();

export const createMemoirResponseSchema = envelope.extend({ data: memoirRecordSchema }).passthrough();

const liveMemoirDataSchema = z
  .object({
    memoir: memoirRecordSchema.optional(),
    chapters: z.array(z.unknown()).optional(),
    memories: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const liveMemoirResponseSchema = envelope.extend({ data: liveMemoirDataSchema }).passthrough();

export const activeMemoirResponseSchema = envelope
  .extend({ data: memoirRecordSchema.nullable() })
  .passthrough();

export const memoirListResponseSchema = envelope
  .extend({ data: z.array(memoirRecordSchema) })
  .passthrough();

export const deleteMemoirResponseSchema = envelope
  .extend({ data: z.object({ id: z.string() }).passthrough() })
  .passthrough();

// PATCH /api/memoirs/{id}/publication — go-live switch.
export const publicationResponseSchema = envelope
  .extend({ data: z.object({ id: z.string(), status: z.string().nullable() }).passthrough() })
  .passthrough();

export type PublicationResult = z.infer<typeof publicationResponseSchema>;

// PATCH /api/memoirs/{id}/settings — owner publication settings.
export const memoirSettingsResponseSchema = envelope
  .extend({
    data: z
      .object({
        id: z.string(),
        status: z.string().nullable().optional(),
        comment_policy: z.string().nullable().optional(),
        visibility: z.string().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();
