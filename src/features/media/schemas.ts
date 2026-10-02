import { z } from "zod";

// Zod twin of the backend's PresignedUrlRequest (schemas/media.py), including the
// filename traversal guard. Note: the wire field is `file_type` (validation alias).
export const presignedUrlRequestSchema = z.object({
  memoir_id: z.uuid("Memoir ID must be a valid UUID."),
  filename: z
    .string()
    .min(1, "Filename is required.")
    .refine((v) => v === v.trim().split("/").pop()?.split("\\").pop() && !v.includes(".."), {
      message: "Invalid or unsafe filename provided.",
    }),
  file_type: z.string().min(1, "MIME type is required."),
  kind: z.enum(["photo", "audio", "video"], "Media kind must be photo, audio, or video."),
  byte_size: z.number().gt(0).max(52428576, "File too large."),
});

export type PresignedUrlPayload = z.infer<typeof presignedUrlRequestSchema>;

// Zod twin of the backend's MediaMetadataRequest (schemas/media.py).
export const mediaMetadataRequestSchema = z.object({
  memoir_id: z.uuid("Memoir ID must be a valid UUID."),
  storage_key: z.string().min(1, "Storage key is required."),
  kind: z.enum(["photo", "audio", "video"], "Media kind must be photo, audio, or video."),
  mime_type: z.string().min(1, "MIME type is required."),
  byte_size: z.number().gt(0, "Byte size must be positive."),
  original_filename: z.string().optional(),
  caption: z.string().max(1000).optional(),
  width_px: z.number().optional(),
  height_px: z.number().optional(),
  duration_ms: z.number().nullable().optional(),
});

export type MediaMetadataPayload = z.infer<typeof mediaMetadataRequestSchema>;

const envelope = z.object({ success: z.boolean().optional(), message: z.string().optional() }).passthrough();

export const presignedUrlResponseSchema = envelope
  .extend({
    data: z
      .object({
        storage_key: z.string(),
        upload_url: z.string().optional(),
        signed_url: z.string().optional(),
        url: z.string().optional(),
        path: z.string().optional(),
        token: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const mediaAssetResponseSchema = envelope
  .extend({
    data: z.object({ id: z.string() }).passthrough(),
  })
  .passthrough();
