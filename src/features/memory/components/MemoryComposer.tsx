"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateMemory,
  usePatchMemory,
  useSubmitMemory,
  useUploadMedia,
} from "@/features/memory/hooks";
import {
  VoiceRecorder,
  type RecordedClip,
} from "@/features/memory/components/VoiceRecorder";
import {
  ImagePicker,
  type PickedImage,
} from "@/features/memory/components/ImagePicker";
import { clearDraft, saveDraft } from "@/features/memory/draft-store";
import { isApiError } from "@/lib/api/errors";

export function MemoryComposer({
  memoirId,
  onClose,
}: {
  memoirId: string;
  onClose: () => void;
}) {
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [audioClips, setAudioClips] = useState<RecordedClip[]>([]);
  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const create = useCreateMemory(memoirId);
  const patch = usePatchMemory(memoirId);
  const submit = useSubmitMemory(memoirId);
  const upload = useUploadMedia();

  const autosaveRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function createDraft() {
      try {
        const draft = await create.mutateAsync({});
        if (active) setMemoryId(draft.id);
      } catch (error) {
        if (active) {
          setUploadError(
            isApiError(error)
              ? error.message
              : "Could not start a memory draft. Please try again.",
          );
        }
      }
    }

    void createDraft();

    return () => {
      active = false;
    };
    // A composer creates one draft for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!memoryId) return;

    if (autosaveRef.current) {
      window.clearTimeout(autosaveRef.current);
    }

    autosaveRef.current = window.setTimeout(async () => {
      try {
        await patch.mutateAsync({
          memoryId,
          patch: { title, body_text: bodyText },
        });

        await saveDraft({
          memoirId,
          memoryId,
          title,
          body: bodyText,
          audioBlobs: audioClips.map((clip) => ({
            blob: clip.blob,
            durationMs: clip.durationMs,
            mimeType: clip.mimeType,
          })),
          imageBlobs: photos.map((photo) => ({
            blob: photo.file,
            caption: photo.caption,
            mimeType: photo.file.type,
          })),
          updatedAt: Date.now(),
        });
      } catch {
        // The server-side draft remains available even when local autosave fails.
      }
    }, 10_000);

    return () => {
      if (autosaveRef.current) {
        window.clearTimeout(autosaveRef.current);
      }
    };
  }, [audioClips, bodyText, memoirId, memoryId, patch, photos, title]);

  const hasContent = Boolean(
    title.trim() ||
      bodyText.trim() ||
      audioClips.length > 0 ||
      photos.length > 0,
  );

  async function handleSubmit() {
    if (!memoryId || !hasContent) return;

    setUploadError(null);
    setUploading(true);

    try {
      await patch.mutateAsync({
        memoryId,
        patch: { title, body_text: bodyText },
      });

      for (let i = 0; i < audioClips.length; i += 1) {
        const clip = audioClips[i];
        let extension = "webm";

        if (clip.mimeType.includes("mp4") || clip.mimeType.includes("aac")) {
          extension = "m4a";
        } else if (clip.mimeType.includes("wav")) {
          extension = "wav";
        } else if (clip.mimeType.includes("mpeg")) {
          extension = "mp3";
        }

        await upload.mutateAsync({
          memoirId,
          memoryId,
          file: clip.blob,
          kind: "audio",
          mimeType: clip.mimeType,
          durationMs: Math.max(1000, Math.round(clip.durationMs)),
          originalFilename: `voice_note_${i + 1}.${extension}`,
        });
      }

      for (const photo of photos) {
        await upload.mutateAsync({
          memoirId,
          memoryId,
          file: photo.file,
          kind: "photo",
          mimeType: photo.file.type,
          caption: photo.caption || undefined,
          originalFilename: photo.file.name,
        });
      }

      await submit.mutateAsync(memoryId);
      await clearDraft(memoryId);

      audioClips.forEach((clip) => URL.revokeObjectURL(clip.url));
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));

      onClose();
    } catch (error) {
      const message = isApiError(error)
        ? error.code === "network"
          ? "Connection lost during upload. Your text is safe. Please try again."
          : error.message
        : "Something went wrong during submission. Your text is safe. Please try again.";

      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-amber-50 shadow-2xl">
        <header className="flex items-center justify-between border-b border-amber-900/10 px-6 py-4">
          <h2 className="font-heading text-xl text-amber-950">Add memory</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close memory composer"
            className="text-amber-900/60 hover:text-amber-900"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="memory-title">Title</Label>
            <Input
              id="memory-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memory-body">Description</Label>
            <textarea
              id="memory-body"
              value={bodyText}
              onChange={(event) => setBodyText(event.target.value)}
              placeholder="Write something about this memory"
              className="min-h-32 w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-sm text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-900/20"
            />
          </div>

          <div className="space-y-2">
            <Label>Add voice note</Label>
            <VoiceRecorder
              onSave={(clip) => setAudioClips((previous) => [...previous, clip])}
            />

            {audioClips.length > 0 && (
              <ul className="space-y-2 pt-2">
                {audioClips.map((clip, index) => (
                  <li
                    key={`${clip.url}-${index}`}
                    className="flex flex-col gap-2 rounded-xl bg-amber-900/10 p-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="size-4 text-amber-900" />
                      <span className="font-medium">
                        Voice Note {index + 1} ({Math.round(clip.durationMs / 1000)}s)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <audio controls src={clip.url} className="h-8 w-48" />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(clip.url);
                          setAudioClips((previous) =>
                            previous.filter((_, itemIndex) => itemIndex !== index),
                          );
                        }}
                        aria-label={`Remove voice note ${index + 1}`}
                        className="rounded-full bg-red-100 p-1.5 text-red-700 hover:bg-red-200"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label>Add photograph</Label>
            <ImagePicker images={photos} onChange={setPhotos} />
          </div>

          {uploadError && (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {uploadError}
            </div>
          )}
        </div>

        <footer className="border-t border-amber-900/10 bg-amber-50 px-6 py-4">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || !hasContent || !memoryId}
            className="w-full bg-[#65402A] hover:bg-amber-950"
            size="lg"
          >
            {uploading ? (
              "Submitting memory…"
            ) : (
              <>
                <Save className="mr-2 size-4" /> Submit memory
              </>
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
}
