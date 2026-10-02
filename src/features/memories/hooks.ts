// cspell:disable

/**
 * @file hooks.ts
 * @description Client data path for the memories feature: draft states,
 * secure audio/photo media upload pipelines, memory submission,
 * and strict resource cleanup to prevent memory leaks.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { createMemory } from "./api";
import { uploadAndRegisterMedia } from "@/features/media";
import { useLocalStorageDraft } from "@/hooks/useLocalStorageDraft";

export interface CapturePhoto {
  id: string;
  file: File;
  caption: string;
}

export interface AudioClip {
  id: string;
  blob: Blob;
  url: string;
}

function newCaptureId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useCaptureMemory(memoirId: string, onSuccess?: () => void) {
  const [draft, setDraft] = useLocalStorageDraft(`memory_draft_${memoirId}`, {
    title: "",
    body_text: "",
    occurred_start: new Date().toISOString().split("T")[0],
  });

  const [photos, setPhotos] = useState<CapturePhoto[]>([]);

  const [recording, setRecording] = useState<boolean>(false);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /**
   * Cleans up active media stream tracks to release microphone hardware and memory.
   */
  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  /**
   * Drops one audio clip and revokes its object URL to prevent browser memory leaks.
   */
  const removeAudioClip = (id: string) => {
    setAudioClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip) URL.revokeObjectURL(clip.url);
      return prev.filter((c) => c.id !== id);
    });
  };

  const clearAudioClips = () => {
    setAudioClips((prev) => {
      prev.forEach((c) => URL.revokeObjectURL(c.url));
      return [];
    });
  };

  /**
   * Component unmount cleanup guard against memory leaks and lingering media streams.
   */
  useEffect(() => {
    return () => {
      stopMediaStream();
      setAudioClips((prev) => {
        prev.forEach((c) => URL.revokeObjectURL(c.url));
        return prev;
      });
    };
  }, []);

  /**
   * Requests microphone permissions and initializes recording. Each completed
   * take is appended to audioClips so entries can hold multiple recordings.
   */
  const startRecording = async () => {
    // Ensure prior stream is completely terminated before starting a new one
    stopMediaStream();

    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioClips((prev) => [...prev, { id: newCaptureId(), blob, url }]);

        // Terminate stream tracks immediately once recording stops
        stopMediaStream();
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  };

  /**
   * Halts active media recording streams.
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const addPhotos = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setPhotos((prev) => [...prev, ...list.map((file) => ({ id: newCaptureId(), file, caption: "" }))]);
  };

  const setPhotoCaption = (id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const resolveMemoirId = (): string => {
    // 1. Direct prop takes precedence
    if (memoirId) {
      return memoirId;
    }

    // 2. Fallback to localStorage if prop is empty
    if (typeof window !== "undefined") {
      try {
        const savedMemoir = localStorage.getItem("active_memoir");
        if (savedMemoir) {
          const parsed = JSON.parse(savedMemoir);
          if (parsed && parsed.data && typeof parsed.data.id === "string") {
            return parsed.data.id;
          }
          if (parsed && typeof parsed.id === "string") {
            return parsed.id;
          }
        }
      } catch (err) {
        console.error("Failed to parse active memoir from localStorage", err);
      }
    }

    return "";
  };

  /**
   * Handles form submission, orchestrates file uploads, and saves the final memory entry.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const currentMemoirId = resolveMemoirId();
    if (!currentMemoirId) {
      setError("No active memoir found. Please restart your session.");
      setLoading(false);
      return;
    }

    try {
      const mediaAssetIds: string[] = [];

      // 1. Photo Upload Pipeline (supports multiple images)
      for (const photo of photos) {
        const photoId = await uploadAndRegisterMedia({
          memoirId: currentMemoirId,
          file: photo.file,
          kind: "photo",
          filename: photo.file.name,
          mimeType: photo.file.type,
          caption: photo.caption,
          durationMs: null,
        });
        mediaAssetIds.push(photoId);
      }

      // 2. Audio Upload Pipeline (supports multiple voice recordings)
      for (const clip of audioClips) {
        const audioFileName = `voice_memo_${Date.now()}_${clip.id}.webm`;
        const audioId = await uploadAndRegisterMedia({
          memoirId: currentMemoirId,
          file: new File([clip.blob], audioFileName, { type: "audio/webm" }),
          kind: "audio",
          filename: audioFileName,
          mimeType: "audio/webm",
          caption: "Voice recording",
          durationMs: 5000,
        });
        mediaAssetIds.push(audioId);
      }

      const hasDate = Boolean(draft.occurred_start);

      await createMemory({
        memoir_id: currentMemoirId,
        title: draft.title,
        body_text: draft.body_text,
        status: "draft",
        occurred_start: hasDate ? draft.occurred_start : null,
        occurred_end: hasDate ? draft.occurred_start : null,
        occurred_precision: hasDate ? "day" : null,
        date_source: hasDate ? "owner" : null,
        media_asset_ids: mediaAssetIds,
      });

      // Cleanup form state and release active resources upon success
      localStorage.removeItem(`memory_draft_${currentMemoirId}`);
      setDraft({
        title: "",
        body_text: "",
        occurred_start: new Date().toISOString().split("T")[0],
      });
      setPhotos([]);
      clearAudioClips();

      setSuccessMsg("Memory successfully captured!");
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save memory.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    draft,
    setDraft,
    photos,
    addPhotos,
    setPhotoCaption,
    removePhoto,
    recording,
    audioClips,
    removeAudioClip,
    loading,
    error,
    successMsg,
    startRecording,
    stopRecording,
    handleSubmit,
  };
}
