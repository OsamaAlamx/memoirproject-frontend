import { z } from "zod";

// Zod twin of the backend's MemoryCreateRequest (schemas/memory.py).
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.")
  .nullable()
  .optional();

export const memoryCreateSchema = z.object({
  memoir_id: z.uuid("Memoir ID must be a valid UUID."),
  title: z.string().max(255).optional(),
  body_text: z.string().max(10000).nullable().optional(),
  status: z.enum(["draft", "saved"]).optional(),
  occurred_start: dateString,
  occurred_end: dateString,
  occurred_precision: z.enum(["day", "month", "year", "decade"]).nullable().optional(),
  date_source: z.enum(["owner", "contributor", "ai"]).nullable().optional(),
  media_asset_ids: z.array(z.uuid()).optional(),
});

export type MemoryCreatePayload = z.infer<typeof memoryCreateSchema>;

// Zod twin of the backend's MemoryUpdateRequest (schemas/memory.py).
export const memoryUpdateSchema = z.object({
  title: z.string().max(255).optional(),
  body_text: z.string().max(10000).optional(),
  occurred_start: z.string().nullable().optional(),
  media_asset_ids_to_add: z.array(z.uuid()).optional(),
  media_asset_ids_to_remove: z.array(z.uuid()).optional(),
});

export type MemoryUpdatePayload = z.infer<typeof memoryUpdateSchema>;

// Media asset as embedded in feed/memory records. Lenient: only identifiers asserted.
export const mediaAssetSchema = z
  .object({
    id: z.string(),
    kind: z.string(),
    storage_key: z.string().nullable().optional(),
    playback_url: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
    transcript: z
      .object({
        display_text: z.string().nullable().optional(),
        raw_text: z.string().nullable().optional(),
        confidence: z.number().nullable().optional(),
        language: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export type MediaAsset = z.infer<typeof mediaAssetSchema>;

// Feed/memory records as returned by the backend. Lenient: only identifiers asserted.
export const memoryRecordSchema = z
  .object({
    id: z.string(),
    title: z.string().nullable().optional(),
    body_text: z.string().nullable().optional(),
    occurred_start: z.string().nullable().optional(),
    created_at: z.string().optional(),
    media_assets: z.array(mediaAssetSchema).optional(),
    memory_media: z
      .array(z.object({ media_asset: mediaAssetSchema.optional() }).passthrough())
      .optional(),
  })
  .passthrough();

export type MemoryFeedItem = z.infer<typeof memoryRecordSchema>;

const envelope = z.object({ success: z.boolean().optional(), message: z.string().optional() }).passthrough();

export const memoirFeedResponseSchema = z
  .union([
    envelope.extend({ data: z.array(memoryRecordSchema) }).passthrough(),
    z.array(memoryRecordSchema),
  ])
  .transform((v) => (Array.isArray(v) ? v : v.data));

export const createMemoryResponseSchema = envelope.extend({ data: memoryRecordSchema }).passthrough();

export const updateMemoryResponseSchema = z
  .union([envelope.extend({ data: memoryRecordSchema }).passthrough(), memoryRecordSchema])
  .transform((v): z.infer<typeof memoryRecordSchema> => {
    const raw = v as { data?: z.infer<typeof memoryRecordSchema> };
    return raw.data ?? (v as z.infer<typeof memoryRecordSchema>);
  });

export const deleteMemoryResponseSchema = envelope;
