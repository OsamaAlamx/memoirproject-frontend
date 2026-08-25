import { z } from "zod";

export const memoryStatusSchema = z.enum(["draft", "submitted"]);
export const mediaKindSchema = z.enum(["audio", "photo"]);
export const mediaLinkTypeSchema = z.enum(["primary", "reference"]);
export const transcodeStatusSchema = z.enum([
  "pending", "processing", "ready", "failed", "skipped",
]);

export const ALLOWED_AUDIO_MIME = [
  "audio/webm", "audio/mpeg", "audio/mp4", "audio/wav",
] as const;

export const ALLOWED_PHOTO_MIME = [
  "image/jpeg", "image/png", "image/webp",
] as const;

export const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTOS_PER_MEMORY = 5;

// Aliases for component backwards compatibility
export const ALLOWED_IMAGE_MIME = ALLOWED_PHOTO_MIME;
export const MAX_IMAGE_SIZE_BYTES = MAX_PHOTO_SIZE_BYTES;
export const MAX_IMAGES_PER_MEMORY = MAX_PHOTOS_PER_MEMORY;

// ---------- Media ----------

export const presignRequestSchema = z.object({
  kind: mediaKindSchema,
  mime_type: z.string().max(100),
  byte_size: z.number().int().positive().max(50 * 1024 * 1024),
  original_filename: z.string().max(255).optional(),
  checksum_sha256: z.string().length(64).optional(),
});

export const presignResponseSchema = z.object({
  upload_url: z.string().url(),
  storage_key: z.string(),
  expires_at: z.string(),
});

export const mediaConfirmRequestSchema = z.object({
  storage_key: z.string(),
  kind: mediaKindSchema,
  mime_type: z.string(),
  byte_size: z.number().int().positive(),
  duration_ms: z.number().int().nonnegative().nullish(),
  width_px: z.number().int().nonnegative().nullish(),
  height_px: z.number().int().nonnegative().nullish(),
  caption: z.string().max(1000).nullish(),
  original_filename: z.string().max(255).nullish(),
  checksum_sha256: z.string().length(64).nullish(),
});

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  memoir_id: z.string().uuid(),
  kind: mediaKindSchema,
  storage_key: z.string(),
  mime_type: z.string(),
  byte_size: z.number().int(),
  duration_ms: z.number().int().nullish(),
  width_px: z.number().int().nullish(),
  height_px: z.number().int().nullish(),
  caption: z.string().nullish(),
  playback_url: z.string().url(),
  position: z.number().int().nonnegative(),
  link_type: mediaLinkTypeSchema.default("primary"),
  transcription_status: transcodeStatusSchema,
  created_at: z.string(),
});

// ---------- Memory ----------

export const memoryCreateRequestSchema = z.object({
  title: z.string().trim().max(200).optional(),
  body_text: z.string().max(20_000).optional(),
  prompt_id: z.string().uuid().optional(),
});

export const memoryPatchRequestSchema = z.object({
  title: z.string().trim().max(200).optional(),
  body_text: z.string().max(20_000).optional(),
});

export const memorySchema = z.object({
  id: z.string().uuid(),
  memoir_id: z.string().uuid(),
  author_participant_id: z.string().uuid(),
  prompt_id: z.string().uuid().nullish(),
  title: z.string().nullish(),
  body_text: z.string().nullish(),
  status: memoryStatusSchema,
  media: z.array(mediaAssetSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  submitted_at: z.string().nullish(),
});

export const memoryListResponseSchema = z.object({
  memories: z.array(memorySchema),
  total: z.number().int().nonnegative(),
});

// Form Schema
export const memoryEditorSchema = z.object({
  title: z.string().trim().min(1, "Please enter a title.").max(200),
  body_text: z.string().max(20_000).default(""),
});

// ---------- Derived Types ----------
export type MediaKind = z.infer<typeof mediaKindSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type Memory = z.infer<typeof memorySchema>;
export type MemoryCreateRequest = z.input<typeof memoryCreateRequestSchema>;
export type MemoryPatchRequest = z.input<typeof memoryPatchRequestSchema>;
export type MemoryEditorValues = z.output<typeof memoryEditorSchema>;
export type PresignRequest = z.input<typeof presignRequestSchema>;
export type PresignResponse = z.output<typeof presignResponseSchema>;
export type MediaConfirmRequest = z.input<typeof mediaConfirmRequestSchema>;