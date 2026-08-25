"use client";

import { presignMediaUpload, confirmMediaUpload } from "@/features/memory/api";
import type { MediaAsset, MediaKind } from "@/features/memory/schemas";

export type UploadInput = {
  memoirId: string;
  memoryId: string;
  file: Blob;
  kind: MediaKind;
  mimeType: string;
  durationMs?: number;
  caption?: string;
  originalFilename?: string;
  onProgress?: (percent: number) => void;
};

export async function uploadMedia(input: UploadInput): Promise<MediaAsset> {
  const { memoirId, memoryId, file, kind, mimeType, durationMs, caption, originalFilename } = input;

  // Clean mime type (remove ;codecs=...)
  const cleanMime = mimeType.split(";")[0].trim();

  const { upload_url, storage_key } = await presignMediaUpload(memoirId, memoryId, {
    kind,
    mime_type: cleanMime,
    byte_size: file.size,
    original_filename: originalFilename,
  });

  await putToStorage(upload_url, file, cleanMime, input.onProgress);

  return confirmMediaUpload(memoirId, memoryId, {
    storage_key,
    kind,
    mime_type: cleanMime,
    byte_size: file.size,
    duration_ms: durationMs,
    caption,
    original_filename: originalFilename,
  });
}

function putToStorage(url: string, file: Blob, mimeType: string, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mimeType);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Connection lost mid-upload. Your text remains safe."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Check your connection."));
    xhr.send(file);
  });
}