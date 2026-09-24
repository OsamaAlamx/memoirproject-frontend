/**
 * @file MemoryFeedList.tsx
 * @description Dynamic feed component that renders distinct visual cards for written, audio, and photo memories,
 * with inline edit support for title, body, date, and adding/removing media assets.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";

interface MediaAsset {
  id: string;
  kind: "photo" | "audio" | "video" | "document";
  storage_key?: string;
  playback_url?: string;
  caption?: string;
  transcript?: {
    display_text?: string;
    raw_text?: string;
    confidence?: number;
    language?: string;
  } | null;
}

interface MemoryRecord {
  id: string;
  title?: string;
  body_text?: string;
  text?: string;
  occurred_start?: string;
  created_at: string;
  media_assets?: MediaAsset[];
  memory_media?: Array<{ media_asset?: MediaAsset }>;
}

/**
 * Safely resolves media URLs to prevent Next.js image parser crashes.
 */
function resolveMediaUrl(asset?: MediaAsset): string | null {
  if (!asset) return null;

  if (asset.playback_url && typeof asset.playback_url === "string") {
    if (
      asset.playback_url.startsWith("http://") ||
      asset.playback_url.startsWith("https://") ||
      asset.playback_url.startsWith("/")
    ) {
      return asset.playback_url;
    }
  }

  if (asset.storage_key && typeof asset.storage_key === "string") {
    if (
      asset.storage_key.startsWith("http://") ||
      asset.storage_key.startsWith("https://") ||
      asset.storage_key.startsWith("/")
    ) {
      return asset.storage_key;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const cleanBase = supabaseUrl.replace(/\/+$/, "");
      const cleanKey = asset.storage_key.replace(/^\/+/, "");
      return `${cleanBase}/storage/v1/object/public/memoir-media/${cleanKey}`;
    }
  }

  return null;
}

export default function MemoryFeedList({
  memoirId,
  onCountChange,
}: {
  memoirId: string;
  onCountChange?: (count: number) => void;
}) {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    title: string;
    body_text: string;
    occurred_start: string;
  }>({ title: "", body_text: "", occurred_start: "" });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Media Editing State
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [newMediaFiles, setNewMediaFiles] = useState<{ file: File; kind: "photo" | "audio" }[]>([]);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMemoirFeed(memoirId);
      const list = Array.isArray(data) ? data : [];
      setMemories(list);
      onCountChange?.(list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed.");
    } finally {
      setLoading(false);
    }
  }, [memoirId, onCountChange]);

  useEffect(() => {
    if (memoirId) loadFeed();
  }, [loadFeed, memoirId]);

  const handleDelete = async (memoryId: string) => {
    const ok = window.confirm("Delete this memory? This cannot be undone.");
    if (!ok) return;

    try {
      await api.deleteMemory(memoryId);
      const next = memories.filter((m) => m.id !== memoryId);
      setMemories(next);
      onCountChange?.(next.length);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete memory.");
    }
  };

  const startEdit = (mem: MemoryRecord) => {
    setEditingId(mem.id);
    setEditData({
      title: mem.title || "",
      body_text: mem.body_text || mem.text || "",
      occurred_start: mem.occurred_start ? mem.occurred_start.split("T")[0] : "",
    });
    setRemovedMediaIds([]);
    setNewMediaFiles([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ title: "", body_text: "", occurred_start: "" });
    setRemovedMediaIds([]);
    setNewMediaFiles([]);
  };

  // Helper to upload newly attached media during edits
  const uploadNewMediaAsset = async (file: File, kind: "photo" | "audio") => {
    const filename = file.name || (kind === "photo" ? `photo_${Date.now()}.jpg` : `audio_${Date.now()}.webm`);
    const mimeType = file.type || (kind === "photo" ? "image/jpeg" : "audio/webm");

    const presignRes = await api.getPresignedUrl({
      memoir_id: memoirId,
      filename,
      file_type: mimeType,
      kind,
    });
    const uploadUrl = presignRes.upload_url || presignRes.signed_url || presignRes.url;
    const storageKey = presignRes.storage_key || presignRes.path;

    if (!uploadUrl || !storageKey) {
      throw new Error("Failed to get upload URL for media.");
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: file,
    });
    if (!uploadRes.ok) throw new Error("Media upload failed");

    const metaRes = await api.registerMediaMetadata({
      memoir_id: memoirId,
      storage_key: storageKey,
      kind,
      mime_type: mimeType,
      byte_size: file.size,
      original_filename: filename,
      duration_ms: kind === "audio" ? 5000 : null,
    });

    if (!metaRes?.id) {
      throw new Error("Failed to register media metadata.");
    }
    return metaRes.id as string;
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    try {
      const addedIds: string[] = [];
      // Upload any new files strictly first
      for (const m of newMediaFiles) {
        if (!m.file) continue;
        const newId = await uploadNewMediaAsset(m.file, m.kind);
        addedIds.push(newId);
      }

      const payload = {
        title: editData.title,
        body_text: editData.body_text,
        occurred_start: editData.occurred_start || null,
        media_asset_ids_to_remove: removedMediaIds,
        media_asset_ids_to_add: addedIds,
      };

      await api.updateMemory(editingId, payload);
      await loadFeed(); // Reload everything to grab the new media objects/urls naturally
      cancelEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update memory.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddMediaFile = (file: File | undefined, kind: "photo" | "audio") => {
    // Capture File reference BEFORE clearing the input value
    if (!file) return;
    setNewMediaFiles((prev) => [...prev, { file, kind }]);
  };

  if (loading) {
    return <div className="text-center py-12 text-memory-muted text-sm">Loading precious memories...</div>;
  }

  // Gracefully handles initial load issues by adding a manual reconnect button
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs text-center border border-red-100 flex flex-col items-center justify-center space-y-3">
        <p>{error}</p>
        <button
          onClick={loadFeed}
          className="px-4 py-1.5 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 font-semibold cursor-pointer shadow-xs transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-memory-maroon/20 p-8">
        <p className="font-serif text-memory-primary text-lg mb-2">No memories shared yet</p>
        <p className="text-xs text-memory-muted">
          Be the first to add a story, voice note, or photo to this memoir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      {memories.map((memory) => {
        const mediaItems =
          memory.media_assets ||
          memory.memory_media?.map((j) => j.media_asset).filter((m): m is MediaAsset => Boolean(m)) ||
          [];
        const audioAsset = mediaItems.find((m) => m.kind === "audio");
        const photoAsset = mediaItems.find((m) => m.kind === "photo");

        const isAudioMemory = Boolean(audioAsset);
        const isPhotoMemory = Boolean(photoAsset);

        const photoUrl = resolveMediaUrl(photoAsset);
        const audioUrl = resolveMediaUrl(audioAsset);

        const dateFormatted = memory.occurred_start
          ? new Date(memory.occurred_start).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : new Date(memory.created_at).toLocaleDateString();

        const resolvedText = memory.body_text || memory.text || "";
        const isEditing = editingId === memory.id;

        return (
          <div key={memory.id} className="relative w-full">
            <div className="absolute inset-x-2 top-2 bottom-1 rounded-sm border border-memory-maroon/20 bg-memory-maroon/5" />

            <div className="relative z-10 bg-white p-6 md:p-8 rounded-2xl border border-memory-maroon/20 shadow-xs space-y-4">
              {/* Meta Header */}
              <div className="flex items-center justify-between border-b border-memory-maroon/10 pb-3">
                <span className="text-[10px] uppercase tracking-widest text-memory-muted font-mono">
                  {dateFormatted}
                </span>

                <div className="flex items-center gap-3">
                  {isAudioMemory && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      🎙️ Voice Recording
                    </span>
                  )}
                  {isPhotoMemory && !isAudioMemory && (
                    <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                      📷 Photo Memory
                    </span>
                  )}
                  {!isAudioMemory && !isPhotoMemory && (
                    <span className="text-[10px] bg-memory-maroon/10 text-memory-maroon px-2 py-0.5 rounded-full font-medium">
                      ✍️ Written Story
                    </span>
                  )}

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(memory)}
                      className="text-[10px] text-memory-muted hover:text-memory-primary transition-colors cursor-pointer font-medium uppercase tracking-wide"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(memory.id)}
                    className="text-[10px] text-memory-muted hover:text-red-600 transition-colors cursor-pointer font-medium uppercase tracking-wide"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Title & Body Text (or Edit Form) */}
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    placeholder="Memory title"
                    className="w-full bg-memory-light border border-memory-border rounded-lg px-3 py-2 text-sm text-memory-primary font-serif font-bold outline-none focus:border-memory-accent"
                  />
                  <input
                    type="date"
                    value={editData.occurred_start}
                    onChange={(e) => setEditData({ ...editData, occurred_start: e.target.value })}
                    className="w-full bg-memory-light border border-memory-border rounded-lg px-3 py-2 text-xs text-memory-muted outline-none focus:border-memory-accent"
                  />
                  <textarea
                    rows={5}
                    value={editData.body_text}
                    onChange={(e) => setEditData({ ...editData, body_text: e.target.value })}
                    placeholder="Write your memory..."
                    className="w-full bg-memory-light border border-memory-border rounded-lg px-3 py-2 text-sm text-memory-primary font-serif leading-relaxed outline-none focus:border-memory-accent resize-none"
                  />

                  {/* MEDIA EDIT CONTROLS */}
                  <div className="border-t border-memory-border pt-3">
                    <p className="text-xs font-semibold text-memory-primary mb-2">Manage Media</p>

                    {/* Display active media to remove */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {mediaItems
                        .filter((m) => !removedMediaIds.includes(m.id))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="relative bg-memory-bg border border-memory-border p-1.5 px-3 rounded flex items-center gap-2"
                          >
                            <span className="text-xs text-memory-muted">
                              {m.kind === "photo" ? "📷 Photo" : "🎙️ Audio"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRemovedMediaIds((prev) => [...prev, m.id])}
                              className="text-red-400 hover:text-red-600 font-bold cursor-pointer text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}

                      {/* Display newly staged files */}
                      {newMediaFiles.map((m, idx) => (
                        <div
                          key={idx}
                          className="relative bg-blue-50 border border-blue-200 p-1.5 px-3 rounded flex items-center gap-2"
                        >
                          <span className="text-xs text-blue-700">
                            New {m.kind}
                            {m.file?.name ? `: ${m.file.name.slice(0, 18)}` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setNewMediaFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600 font-bold cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Quick Add Actions — capture File BEFORE clearing input */}
                    <div className="flex gap-2">
                      <label className="text-xs bg-memory-light border border-memory-border px-3 py-1.5 rounded cursor-pointer hover:bg-memory-card text-memory-primary font-medium transition">
                        + Add Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleAddMediaFile(file, "photo");
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <label className="text-xs bg-memory-light border border-memory-border px-3 py-1.5 rounded cursor-pointer hover:bg-memory-card text-memory-primary font-medium transition">
                        + Add Audio
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleAddMediaFile(file, "audio");
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      className="border border-memory-border text-xs px-3 py-1.5 rounded cursor-pointer text-memory-muted hover:text-memory-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="bg-memory-primary text-white text-xs px-3 py-1.5 rounded hover:bg-memory-maroon cursor-pointer disabled:opacity-60"
                    >
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {memory.title && (
                    <h3 className="font-serif font-bold text-lg text-memory-primary mb-2">
                      {memory.title}
                    </h3>
                  )}
                  {resolvedText && (
                    <p className="font-serif text-sm text-memory-primary/90 leading-relaxed whitespace-pre-line">
                      {resolvedText}
                    </p>
                  )}
                </div>
              )}

              {/* PHOTO MEMORY VISUAL */}
              {photoAsset && photoUrl && !isEditing && (
                <div className="mt-4 pt-4 border-t border-memory-maroon/10 text-center">
                  <div className="rounded-xl overflow-hidden relative w-full h-72 max-w-md mx-auto border border-memory-maroon/15 bg-memory-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt={photoAsset.caption || memory.title || "Memory photo"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  {photoAsset.caption && (
                    <p className="text-xs italic text-memory-muted mt-2">{photoAsset.caption}</p>
                  )}
                </div>
              )}

              {/* AUDIO MEMORY VISUAL & TRANSCRIPT */}
              {audioAsset && audioUrl && !isEditing && (
                <div className="mt-4 pt-4 border-t border-memory-maroon/10 bg-memory-light p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-4">
                    <audio
                      id={`audio-player-${memory.id}`}
                      src={audioUrl}
                      onEnded={() => setPlayingAudioId(null)}
                      preload="metadata"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const audioEl = document.getElementById(
                          `audio-player-${memory.id}`,
                        ) as HTMLAudioElement;
                        if (!audioEl) return;

                        if (playingAudioId === memory.id) {
                          audioEl.pause();
                          setPlayingAudioId(null);
                        } else {
                          document.querySelectorAll("audio").forEach((el) => el.pause());
                          audioEl.play();
                          setPlayingAudioId(memory.id);
                        }
                      }}
                      className="w-10 h-10 rounded-full bg-memory-primary text-memory-light flex items-center justify-center hover:bg-memory-maroon transition shadow-sm cursor-pointer shrink-0"
                      aria-label="Play audio note"
                    >
                      <span className="text-xs font-bold">
                        {playingAudioId === memory.id ? "❚❚" : "▶"}
                      </span>
                    </button>

                    <div className="flex-1 w-full space-y-1">
                      <div className="flex justify-between text-[11px] text-memory-muted font-mono">
                        <span>
                          {playingAudioId === memory.id
                            ? "Playing voice recording..."
                            : "Voice Note Recording"}
                        </span>
                        <span>AssemblyAI Audio</span>
                      </div>
                      <audio controls src={audioUrl} className="w-full h-8 mt-1 opacity-90" />
                    </div>
                  </div>

                  {/* AI TRANSCRIPTION DISPLAY BOX */}
                  <div className="bg-white/80 border border-memory-maroon/10 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-memory-accent">
                        ✨ AI Transcript (AssemblyAI)
                      </span>
                      {audioAsset.transcript?.confidence && (
                        <span className="text-[10px] text-memory-muted font-mono">
                          Confidence: {Math.round(audioAsset.transcript.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    <p className="font-serif text-xs text-memory-primary/90 italic leading-relaxed">
                      {audioAsset.transcript?.display_text || "Transcript not available yet."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}