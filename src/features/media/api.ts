import { apiRequest, fetchBlob } from "@/lib/api/client";
import {
  presignedUrlRequestSchema,
  mediaMetadataRequestSchema,
  presignedUrlResponseSchema,
  mediaAssetResponseSchema,
  type PresignedUrlPayload,
  type MediaMetadataPayload,
} from "./schemas";

export async function getPresignedUrl(payload: PresignedUrlPayload) {
  const body = await apiRequest(
    "/api/media/presigned-url",
    { method: "POST", body: JSON.stringify(presignedUrlRequestSchema.parse(payload)) },
    presignedUrlResponseSchema,
  );
  return body.data;
}

export async function registerMediaMetadata(payload: MediaMetadataPayload) {
  const body = await apiRequest(
    "/api/media/metadata",
    { method: "POST", body: JSON.stringify(mediaMetadataRequestSchema.parse(payload)) },
    mediaAssetResponseSchema,
  );
  return body.data;
}

/** PUT a file to a signed storage URL via the shared client (no direct fetch). */
export async function uploadFileToSignedUrl(uploadUrl: string, file: File, mimeType: string) {
  await fetchBlob(uploadUrl, { method: "PUT", headers: { "Content-Type": mimeType }, body: file });
}

/** Presign → PUT → register pipeline shared by capture and edit flows. Returns the media asset id. */
export async function uploadAndRegisterMedia(args: {
  memoirId: string;
  file: File;
  kind: "photo" | "audio" | "video";
  filename: string;
  mimeType: string;
  caption?: string;
  durationMs?: number | null;
}) {
  const presign = await getPresignedUrl({
    memoir_id: args.memoirId,
    filename: args.filename,
    file_type: args.mimeType,
    kind: args.kind,
    byte_size: args.file.size,
  });
  const uploadUrl = presign.upload_url || presign.signed_url || presign.url;
  const storageKey = presign.storage_key || presign.path;
  if (!uploadUrl || !storageKey) throw new Error("Failed to get upload URL for media.");

  await uploadFileToSignedUrl(uploadUrl, args.file, args.mimeType);

  const meta = await registerMediaMetadata({
    memoir_id: args.memoirId,
    storage_key: storageKey,
    kind: args.kind,
    mime_type: args.mimeType,
    byte_size: args.file.size,
    original_filename: args.filename,
    caption: args.caption,
    duration_ms: args.durationMs ?? null,
  });
  if (!meta?.id) throw new Error("Failed to register media metadata.");
  return meta.id as string;
}
