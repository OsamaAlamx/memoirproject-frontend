"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ChapterProposalPayload } from "@/lib/api/client";

interface FeedMediaAsset {
  id: string;
  kind: string;
  playback_url?: string;
  storage_key?: string;
  caption?: string;
  transcript?: {
    display_text?: string;
    raw_text?: string;
    confidence?: number;
    language?: string;
  } | null;
}

interface FeedMemory {
  id: string;
  title?: string;
  body_text?: string;
  occurred_start?: string;
  created_at?: string;
  media_assets?: FeedMediaAsset[];
}

function resolveAssetUrl(asset?: FeedMediaAsset): string {
  if (!asset) return "";
  if (asset.playback_url) return asset.playback_url;
  if (asset.storage_key) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") || "";
    const clean = asset.storage_key.replace(/^\/+/, "");
    return base ? `${base}/storage/v1/object/public/memoir-media/${clean}` : "";
  }
  return "";
}

export function ChapterOrganizer({ memoirId }: { memoirId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState<ChapterProposalPayload | null>(null);
  const [feed, setFeed] = useState<FeedMemory[]>([]);
  const [guidanceInput, setGuidanceInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [uploadingToMem, setUploadingToMem] = useState<string | null>(null);

  // Excluded media (per memoir, per memory) — used to remove/include media in AI chapter view
  const [excludedMedia, setExcludedMedia] = useState<Record<string, string[]>>({});

  // Hydrate proposal draft + excluded media + feed
  useEffect(() => {
    if (!memoirId) return;

    const draft = localStorage.getItem(`ai_chapter_draft_${memoirId}`);
    if (draft) {
      try {
        setProposal(JSON.parse(draft));
      } catch {
        localStorage.removeItem(`ai_chapter_draft_${memoirId}`);
      }
    }

    const excluded = localStorage.getItem(`ai_excluded_media_${memoirId}`);
    if (excluded) {
      try {
        setExcludedMedia(JSON.parse(excluded));
      } catch {
        localStorage.removeItem(`ai_excluded_media_${memoirId}`);
      }
    }

    api
      .getMemoirFeed(memoirId)
      .then((data) => setFeed(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Feed load failed:", err));
  }, [memoirId]);

  const saveDraft = (data: ChapterProposalPayload) => {
    setProposal(data);
    localStorage.setItem(`ai_chapter_draft_${memoirId}`, JSON.stringify(data));
  };

  const saveExcluded = (data: Record<string, string[]>) => {
    setExcludedMedia(data);
    localStorage.setItem(`ai_excluded_media_${memoirId}`, JSON.stringify(data));
  };

  const runPipeline = async (guidance?: string) => {
    if (!memoirId) return;
    setLoading(true);
    try {
      const base = await api.proposeChapters(memoirId);
      const refined =
        guidance && guidance.trim()
          ? await api.refineChapters(memoirId, base, guidance.trim())
          : base;
      saveDraft(refined);
    } catch (err: unknown) {
      console.error("Chapter proposal error:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to organize chapters. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!memoirId || !proposal || !chatInput.trim()) return;
    setIsRefining(true);
    try {
      const data = await api.refineChapters(memoirId, proposal, chatInput.trim());
      saveDraft(data);
      setChatInput("");
    } catch (err: unknown) {
      console.error("Chapter refine error:", err);
      const msg = err instanceof Error ? err.message : "Failed to refine chapters.";
      alert(msg);
    } finally {
      setIsRefining(false);
    }
  };

  const handleApply = async () => {
    if (!memoirId || !proposal) return;
    setSaving(true);
    try {
      await api.applyChapters(memoirId, proposal);
      alert("Chapter layout and narrative successfully applied!");
      localStorage.removeItem(`ai_chapter_draft_${memoirId}`);
      localStorage.removeItem(`ai_excluded_media_${memoirId}`);
      localStorage.removeItem(`memoir_preview_${memoirId}`);
      setProposal(null);
      setExcludedMedia({});
    } catch (err: unknown) {
      console.error("Chapter apply error:", err);
      const msg = err instanceof Error ? err.message : "Failed to save chapters.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    const ok = window.confirm("Discard this AI proposal? Your draft will be permanently lost.");
    if (!ok) return;
    localStorage.removeItem(`ai_chapter_draft_${memoirId}`);
    localStorage.removeItem(`ai_excluded_media_${memoirId}`);
    localStorage.removeItem(`memoir_preview_${memoirId}`);
    setProposal(null);
    setExcludedMedia({});
  };

  const handleRename = (idx: number, newTitle: string) => {
    if (!proposal) return;
    const updated = { ...proposal };
    updated.chapters[idx].title = newTitle;
    saveDraft(updated);
  };

  const handleEditSummary = (idx: number, newSummary: string) => {
    if (!proposal) return;
    const updated = { ...proposal };
    updated.chapters[idx].summary = newSummary;
    saveDraft(updated);
  };

  const removeMemoryFromChapter = (cIdx: number, mIdx: number) => {
    if (!proposal) return;
    const updated = { ...proposal };
    updated.chapters[cIdx].memories.splice(mIdx, 1);
    saveDraft(updated);
  };

  const addMemoryToChapter = (cIdx: number, memoryId: string) => {
    if (!proposal || !memoryId) return;
    const mem = feed.find((f) => f.id === memoryId);
    if (!mem) return;
    const updated = { ...proposal };
    updated.chapters[cIdx].memories.push({
      id: mem.id,
      title: mem.title || "Untitled Entry",
      date: mem.occurred_start || null,
    });
    saveDraft(updated);
  };

  const toggleMediaExclusion = (memoryId: string, assetId: string) => {
    const current = excludedMedia[memoryId] || [];
    let next: string[];
    if (current.includes(assetId)) {
      next = current.filter((id) => id !== assetId);
    } else {
      next = [...current, assetId];
    }
    const updated = { ...excludedMedia, [memoryId]: next };
    if (next.length === 0) delete updated[memoryId];
    saveExcluded(updated);
  };

  const handleUploadNewMedia = async (
    memoryId: string,
    file: File,
    kind: "photo" | "audio",
  ) => {
    // Capture file fields immediately (do not rely on input element later)
    const filename =
      file.name || (kind === "photo" ? `photo_${Date.now()}.jpg` : `audio_${Date.now()}.webm`);
    const mimeType = file.type || (kind === "photo" ? "image/jpeg" : "audio/webm");

    setUploadingToMem(memoryId);
    try {
      const presignRes = await api.getPresignedUrl({
        memoir_id: memoirId,
        filename,
        file_type: mimeType,
        kind,
      });
      const uploadUrl = presignRes.upload_url || presignRes.signed_url || presignRes.url;
      const storageKey = presignRes.storage_key || presignRes.path;

      if (!uploadUrl || !storageKey) {
        throw new Error("Failed to get upload URL.");
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

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
        throw new Error("Failed to register media.");
      }

      await api.updateMemory(memoryId, { media_asset_ids_to_add: [metaRes.id] });

      // Refresh feed so new media shows up instantly
      const updatedFeed = await api.getMemoirFeed(memoirId);
      setFeed(Array.isArray(updatedFeed) ? updatedFeed : []);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : `Failed to upload ${kind}.`);
    } finally {
      setUploadingToMem(null);
    }
  };

  const handlePreview = () => {
    if (!proposal) return;
    localStorage.setItem(
      `memoir_preview_${memoirId}`,
      JSON.stringify({ proposal, feed, excludedMedia }),
    );
    router.push(`/final-memoir?preview=${memoirId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-memory-maroon/20 p-12 text-center shadow-xs">
        <div className="animate-spin w-8 h-8 border-2 border-memory-maroon border-t-transparent rounded-full mx-auto mb-4" />
        <h3 className="font-serif text-xl text-memory-primary mb-2">Agents are running...</h3>
        <p className="text-sm text-memory-muted">
          Reading scattered memories...
          <br />
          Synthesizing biographical narrative...
          <br />
          Organizing timeline...
        </p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="bg-white rounded-2xl border border-memory-maroon/20 p-10 shadow-xs">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-memory-light text-memory-accent border border-memory-accent rounded-full flex items-center justify-center mx-auto mb-4 font-serif text-xl">
            ✨
          </div>
          <h3 className="font-serif text-xl text-memory-primary mb-3">Self-Organizing Memoir</h3>
          <p className="text-sm text-memory-muted max-w-md mx-auto">
            Let the AI pipeline review your transcripts, dates, and scattered entries to synthesize
            a cohesive, biographical chapter layout. You retain full control to edit or chat with
            the AI before anything is published.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          <div className="bg-memory-light border border-memory-border rounded-xl p-5 flex flex-col">
            <h4 className="font-serif text-sm font-bold text-memory-primary mb-1">
              Guide Agents through Chat
            </h4>
            <p className="text-xs text-memory-muted mb-3 flex-1">
              Tell the AI how you&apos;d like the chapters shaped before it runs.
            </p>
            <input
              type="text"
              value={guidanceInput}
              onChange={(e) => setGuidanceInput(e.target.value)}
              placeholder="e.g. Group memories into 3 chapters by decade..."
              className="w-full bg-white border border-memory-border rounded-lg px-3 py-2 text-xs text-memory-primary outline-none focus:border-memory-accent mb-3"
            />
            <button
              onClick={() => runPipeline(guidanceInput)}
              disabled={loading || !guidanceInput.trim()}
              className="bg-memory-primary text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-memory-maroon transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              Generate with Guidance
            </button>
          </div>

          <div className="bg-memory-light border border-memory-border rounded-xl p-5 flex flex-col">
            <h4 className="font-serif text-sm font-bold text-memory-primary mb-1">Let the AI Decide</h4>
            <p className="text-xs text-memory-muted mb-3 flex-1">
              Automatically organize every memory into chapters, no guidance needed.
            </p>
            <button
              onClick={() => runPipeline()}
              disabled={loading}
              className="bg-memory-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-memory-maroon transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              Organize Memories
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compute unassigned memories for reassignment dropdown
  const assignedIds = new Set(proposal.chapters.flatMap((c) => c.memories.map((m) => m.id)));
  const unassignedMemories = feed.filter((f) => !assignedIds.has(f.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-memory-card p-4 rounded-xl border border-memory-border shadow-2xs">
        <div>
          <h3 className="font-serif text-lg font-bold text-memory-primary">Proposed Narrative Layout</h3>
          <p className="text-xs text-memory-muted">Review, chat with the AI to tweak, or edit manually.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="px-4 py-2 text-sm bg-memory-light text-memory-primary border border-memory-border rounded-lg font-medium hover:bg-memory-card cursor-pointer"
          >
            Preview Memoir
          </button>
          <button
            onClick={handleDiscard}
            className="px-4 py-2 text-sm text-memory-muted hover:text-memory-primary font-medium cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={handleApply}
            disabled={saving || isRefining}
            className="bg-memory-maroon text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-memory-primary shadow-sm transition cursor-pointer"
          >
            {saving ? "Applying..." : "Accept & Apply"}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {proposal.chapters.map((chapter, cIdx) => (
          <div key={cIdx} className="bg-white border border-memory-border rounded-xl overflow-hidden shadow-xs">
            {/* Title Header */}
            <div className="bg-memory-light border-b border-memory-border px-5 py-3 flex items-center gap-3">
              <span className="text-xs font-bold text-memory-accent uppercase tracking-widest">
                Chapter {cIdx + 1}
              </span>
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => handleRename(cIdx, e.target.value)}
                className="font-serif text-lg font-bold text-memory-primary bg-transparent outline-none flex-1 border-b border-dashed border-transparent hover:border-memory-border focus:border-memory-accent"
              />
            </div>

            {/* Synthesized Biography Narrative */}
            <div className="p-5 border-b border-memory-border bg-white">
              <h4 className="text-[10px] font-sans font-bold text-memory-muted uppercase tracking-wider mb-2">
                Chapter Biography Narrative
              </h4>
              <textarea
                value={chapter.summary || ""}
                onChange={(e) => handleEditSummary(cIdx, e.target.value)}
                rows={5}
                className="w-full bg-transparent font-serif text-memory-primary leading-relaxed outline-none resize-none border border-transparent hover:border-memory-border/50 focus:border-memory-accent/50 p-2 rounded-md transition-colors"
                placeholder="Synthesized story will appear here..."
              />
            </div>

            {/* Source Memories with associated media */}
            <div className="p-5 bg-memory-bg space-y-3">
              <h4 className="text-[10px] font-sans font-bold text-memory-muted uppercase tracking-wider mb-2">
                {chapter.memories.length} Included Memories
              </h4>

              {chapter.memories.length === 0 ? (
                <p className="text-sm text-memory-muted italic">No memories placed here.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chapter.memories.map((mem, mIdx) => {
                    const fullMem = feed.find((f) => f.id === mem.id);
                    const allAssets = fullMem?.media_assets || [];
                    const excludedForThis = excludedMedia[mem.id] || [];

                    const photoAssets = allAssets.filter((a) => a.kind === "photo");
                    const audioAssets = allAssets.filter((a) => a.kind === "audio");
                    const isUploading = uploadingToMem === mem.id;

                    return (
                      <div
                        key={mem.id}
                        className="bg-white border border-memory-border/50 rounded-lg p-3 relative group flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-serif text-xs text-memory-primary font-semibold line-clamp-2 flex-1">
                            {mem.title}
                          </p>
                          <button
                            onClick={() => removeMemoryFromChapter(cIdx, mIdx)}
                            className="text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer text-sm font-bold px-1 hover:text-red-600 leading-none"
                            title="Remove from chapter"
                          >
                            ×
                          </button>
                        </div>

                        {/* Media strip */}
                        <div className="flex flex-wrap gap-2 mt-1 pt-2 border-t border-stone-100">
                          {photoAssets.map((p) => {
                            const isExcluded = excludedForThis.includes(p.id);
                            const url = resolveAssetUrl(p);
                            if (!url) return null;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => toggleMediaExclusion(mem.id, p.id)}
                                className={`relative w-10 h-10 rounded overflow-hidden border cursor-pointer transition ${
                                  isExcluded
                                    ? "border-red-300 opacity-40"
                                    : "border-memory-border hover:border-memory-accent"
                                }`}
                                title={
                                  isExcluded
                                    ? "Excluded from memoir. Click to include."
                                    : "Included. Click to exclude."
                                }
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="thumb" className="w-full h-full object-cover" />
                                {isExcluded && (
                                  <div className="absolute inset-0 bg-white/30 flex items-center justify-center text-red-500 text-xs font-bold">
                                    ×
                                  </div>
                                )}
                              </button>
                            );
                          })}

                          {audioAssets.map((a) => {
                            const isExcluded = excludedForThis.includes(a.id);
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => toggleMediaExclusion(mem.id, a.id)}
                                className={`text-[10px] px-2 py-1 rounded border cursor-pointer transition h-10 ${
                                  isExcluded
                                    ? "bg-red-50 border-red-200 text-red-500 opacity-70"
                                    : "bg-amber-50 border-amber-200 text-amber-800 hover:border-memory-accent"
                                }`}
                                title={
                                  isExcluded
                                    ? "Audio excluded. Click to include."
                                    : "Audio included. Click to exclude."
                                }
                              >
                                {isExcluded ? "🚫 Audio" : "🎙️ Audio"}
                              </button>
                            );
                          })}

                          {/* Add photo */}
                          <label
                            className="relative w-10 h-10 rounded border border-dashed border-memory-accent/50 cursor-pointer flex items-center justify-center text-memory-accent hover:bg-memory-accent/10 transition"
                            title="Add new photo"
                          >
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-memory-accent border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-sm leading-none">📷</span>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadNewMedia(mem.id, file, "photo");
                                e.target.value = "";
                              }}
                            />
                          </label>

                          {/* Add audio */}
                          <label
                            className="relative w-10 h-10 rounded border border-dashed border-amber-400/60 cursor-pointer flex items-center justify-center text-amber-700 hover:bg-amber-50 transition"
                            title="Add new audio"
                          >
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-sm leading-none">🎙️</span>
                            )}
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadNewMedia(mem.id, file, "audio");
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        <span className="text-[9px] text-memory-muted font-mono mt-auto pt-1">
                          {mem.date || "Undated"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reassign unassigned memories */}
              {unassignedMemories.length > 0 && (
                <div className="pt-2">
                  <select
                    onChange={(e) => {
                      addMemoryToChapter(cIdx, e.target.value);
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="w-full text-xs bg-white border border-memory-border p-2 rounded cursor-pointer text-memory-muted"
                  >
                    <option value="" disabled>
                      + Include an unassigned memory...
                    </option>
                    {unassignedMemories.map((um) => (
                      <option key={um.id} value={um.id}>
                        {um.title || "Untitled Entry"} ({um.occurred_start || "Undated"})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Chat Interface */}
      <div className="bg-memory-card border border-memory-border p-5 rounded-xl shadow-xs sticky bottom-4">
        <h4 className="font-serif text-sm font-bold text-memory-primary mb-2">Iterate with AI</h4>
        <p className="text-xs text-memory-muted mb-3">
          Want a different tone? Prefer everything grouped into 2 chapters? Tell the editor AI.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isRefining || saving}
            placeholder="e.g. Make chapter 2 sound more formal, and merge chapter 3 & 4..."
            className="flex-1 bg-white border border-memory-border rounded-lg px-4 py-2 text-sm text-memory-primary outline-none focus:border-memory-accent"
          />
          <button
            onClick={handleRefine}
            disabled={isRefining || saving || !chatInput.trim()}
            className="bg-memory-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-memory-maroon disabled:opacity-50 transition cursor-pointer whitespace-nowrap"
          >
            {isRefining ? "Refining..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}