"use client";

import { useEffect, useState } from "react";
import {
  getSharedMemoir,
  joinSharedMemoir,
  getSharedComments,
  postSharedComment,
  getReactionSummary,
  toggleSharedReaction,
  requestReaderExport,
  getReaderExportStatus,
} from "./api";
import { downloadExportBlob } from "@/features/export";
import type { SharedMemory, GuestComment, ReaderProfile } from "./schemas";
import MemoirHero from "@/features/FinalMemoir/MemoirHero";
import ScatteredGallery from "@/features/FinalMemoir/ScatteredGallery";
import type { HeroPhoto } from "@/features/FinalMemoir";
import { env } from "@/lib/config/env";

function publicAssetUrl(storageKey?: string | null): string {
  // Bucket is private: backend playback_url (signed) is the only valid source.
  // Never construct /object/public/ (403). storage_key alone is not fetchable.
  if (!storageKey) return "";
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://") || storageKey.startsWith("/"))
    return storageKey;
  return "";
}

function memoryPhotos(mem: SharedMemory): HeroPhoto[] {
  return (mem.memory_media || [])
    .map((m) => m.media_asset)
    .filter((a) => a && a.kind === "photo")
    .map((a) => ({ id: a!.id, url: a!.playback_url || publicAssetUrl(a!.storage_key), caption: a!.caption || mem.title || "Archive photo" }))
    .filter((p) => Boolean(p.url));
}

function memoryAudios(mem: SharedMemory): { id: string; url: string; caption?: string | null }[] {
  return (mem.memory_media || [])
    .map((m) => m.media_asset)
    .filter((a) => a && a.kind === "audio")
    .map((a) => ({ id: a!.id, url: a!.playback_url || publicAssetUrl(a!.storage_key), caption: a!.caption }))
    .filter((a) => Boolean(a.url));
}

function profileKey(token: string): string {
  return `reader_profile_${token}`;
}

function CommentThread({
  token,
  profile,
  memoryId,
  canComment,
  reactionCounts,
  reactedIds,
  onToggleReaction,
}: {
  token: string;
  profile: ReaderProfile;
  memoryId: string;
  canComment: boolean;
  reactionCounts: Record<string, number>;
  reactedIds: string[];
  onToggleReaction: (commentId: string) => void;
}) {
  const [comments, setComments] = useState<GuestComment[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setComments(await getSharedComments(token, memoryId));
      } catch {
        // Comments stay empty rather than breaking the memoir view.
      }
    }
    load();
  }, [token, memoryId]);

  const post = async (body: string, parentId?: string) => {
    const text = body.trim();
    if (!text || posting) return;
    setPosting(true);
    setNotice(null);
    try {
      await postSharedComment(token, {
        participant_id: profile.participant_id,
        memory_id: memoryId,
        parent_comment_id: parentId,
        body: text,
      });
      setNotice("Sent — your comment appears once the owner approves it.");
      setInput("");
      setReplyInput("");
      setReplyTo(null);
    } catch {
      setNotice("Could not send your comment. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesFor = (id: string) => comments.filter((c) => c.parent_comment_id === id);

  return (
    <div className="mt-6 border-t border-stone-200/70 pt-4">
      <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-stone-500 font-semibold mb-3">
        Comments {topLevel.length > 0 && `(${topLevel.length})`}
      </p>
      <div className="space-y-4">
        {topLevel.map((c) => (
          <div key={c.id}>
            <p className="font-serif text-[15px] text-stone-800 italic leading-relaxed">“{c.body}”</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[10px] font-sans font-semibold text-stone-400 uppercase tracking-wider">
                {c.author_name || "Reader"}
              </span>
              <button
                type="button"
                onClick={() => onToggleReaction(c.id)}
                className="text-xs text-memory-maroon cursor-pointer"
                aria-label="React to comment"
              >
                {reactedIds.includes(c.id) ? "♥" : "♡"} {reactionCounts[c.id] ?? 0}
              </button>
              {canComment && (
                <button
                  type="button"
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  className="text-[11px] text-memory-maroon underline underline-offset-2 cursor-pointer"
                >
                  Reply
                </button>
              )}
            </div>
            <div className="ml-4 mt-2 space-y-2 border-l-2 border-stone-200 pl-3">
              {repliesFor(c.id).map((r) => (
                <div key={r.id}>
                  <p className="font-serif text-[14px] text-stone-700 italic leading-relaxed">“{r.body}”</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] font-sans font-semibold text-stone-400 uppercase tracking-wider">
                      {r.author_name || "Reader"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleReaction(r.id)}
                      className="text-xs text-memory-maroon cursor-pointer"
                      aria-label="React to reply"
                    >
                      {reactedIds.includes(r.id) ? "♥" : "♡"} {reactionCounts[r.id] ?? 0}
                    </button>
                  </div>
                </div>
              ))}
              {replyTo === c.id && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder={`Reply as ${profile.display_name}...`}
                    className="flex-1 bg-white border border-stone-200 rounded px-3 py-1.5 text-sm font-serif text-stone-800 outline-none focus:border-memory-maroon"
                  />
                  <button
                    type="button"
                    disabled={posting || !replyInput.trim()}
                    onClick={() => post(replyInput, c.id)}
                    className="px-3 py-1.5 bg-memory-maroon text-white text-xs rounded cursor-pointer disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {canComment ? (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Comment as ${profile.display_name}...`}
            className="flex-1 bg-white border border-stone-200 rounded px-3 py-2 text-sm font-serif text-stone-800 outline-none focus:border-memory-maroon"
          />
          <button
            type="button"
            disabled={posting || !input.trim()}
            onClick={() => post(input)}
            className="px-4 py-2 bg-memory-maroon text-white text-xs font-medium rounded cursor-pointer disabled:opacity-50"
          >
            {posting ? "Sending..." : "Comment"}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs font-serif italic text-stone-400">Comments are closed on this memoir.</p>
      )}
      {notice && <p className="mt-2 text-xs font-serif italic text-stone-500">{notice}</p>}
    </div>
  );
}

export default function ReaderView({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [years, setYears] = useState("");
  const [canComment, setCanComment] = useState(false);
  const [chapters, setChapters] = useState<{ id: string; title: string; summary?: string | null; memories: SharedMemory[] }[]>([]);
  const [heroPhotos, setHeroPhotos] = useState<HeroPhoto[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [profile, setProfile] = useState<ReaderProfile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [reactedIds, setReactedIds] = useState<string[]>([]);
  const [reactionNotice, setReactionNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const raw = localStorage.getItem(profileKey(token));
        if (raw) {
          try {
            setProfile(JSON.parse(raw) as ReaderProfile);
          } catch {
            localStorage.removeItem(profileKey(token));
          }
        }
      } catch {
        // Private mode: gate shows every visit.
      }
      try {
        const data = await getSharedMemoir(token);
        setSubjectName(data.subject_name || "A loved one");
        setDescription(data.description || "");
        const born = data.subject_born_on ? data.subject_born_on.substring(0, 4) : "";
        const died = data.subject_died_on
          ? data.subject_died_on.substring(0, 4)
          : data.subject_is_living
            ? "Present"
            : "";
        setYears([born, died].filter(Boolean).join(" — "));
        setCanComment(data.can_comment === true);
        const memories = data.memories || [];
        const orderedChapters = [...(data.chapters || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const groups = orderedChapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          summary: ch.summary,
          memories: memories.filter((m) => m.chapter_id === ch.id),
        }));
        const assigned = new Set(groups.flatMap((g) => g.memories.map((m) => m.id)));
        const unassigned = memories.filter((m) => !assigned.has(m.id));
        if (unassigned.length > 0) {
          groups.push({ id: "unassigned", title: "Memoir Reflections", summary: null, memories: unassigned });
        }
        setChapters(groups.filter((g) => g.memories.length > 0));
        setHeroPhotos(groups.flatMap((g) => g.memories.flatMap(memoryPhotos)).slice(0, 8));
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  const handleJoin = async () => {    const name = nameInput.trim();
    if (!name || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await joinSharedMemoir(token, name);
      const next = { participant_id: res.participant_id, display_name: res.display_name };
      setProfile(next);
      try {
        localStorage.setItem(profileKey(token), JSON.stringify(next));
      } catch {
        // Name gate simply shows again next visit.
      }
    } catch {
      setJoinError("Could not join. Check the link and try again.");
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    async function loadReactions() {
      if (!profile) return;
      try {
        const summary = await getReactionSummary(token, profile.participant_id);
        setReactionCounts(summary.counts || {});
        setReactedIds(summary.reacted || []);
      } catch {
        // Hearts stay at zero rather than breaking the view.
      }
    }
    loadReactions();
  }, [token, profile]);

  const toggleReaction = async (target: { memory_id?: string; comment_id?: string }) => {
    if (!profile) return;
    setReactionNotice(null);
    try {
      const res = await toggleSharedReaction(token, { participant_id: profile.participant_id, ...target });
      const id = target.memory_id || target.comment_id || "";
      setReactionCounts((prev) => ({ ...prev, [id]: res.count }));
      setReactedIds((prev) => (res.reacted ? [...prev, id] : prev.filter((x) => x !== id)));
    } catch (err) {
      setReactionNotice(err instanceof Error ? err.message : "Reactions are unavailable right now.");
    }
  };

  const handleExportPdf = async () => {
    if (!profile || exporting) return;
    setExporting(true);
    setExportNotice("Preparing your PDF (images + text only)...");
    try {
      await requestReaderExport(token, profile.participant_id);
      let attempts = 0;
      const maxAttempts = 15;
      const timer = setInterval(async () => {
        attempts++;
        try {
          const status = await getReaderExportStatus(token);
          if (status.status === "ready" && status.download_url) {
            clearInterval(timer);
            const blobUrl = await downloadExportBlob(status.download_url);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `${subjectName ? subjectName.toLowerCase().replace(/\s+/g, "-") : "live-memoir"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            setExportNotice("PDF downloaded. Check your downloads folder.");
            setExporting(false);
          } else if (status.status === "failed") {
            clearInterval(timer);
            setExportNotice(`Export failed: ${status.error_message || "Unknown error"}`);
            setExporting(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(timer);
            setExportNotice("Export timed out. Please try again.");
            setExporting(false);
          }
        } catch (pollErr) {
          console.error("Reader export polling error:", pollErr);
        }
      }, 2000);
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : "Could not start the export.");
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-serif italic text-stone-400">
        Opening the memoir...
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-3xl text-memory-maroon mb-3">This link is no longer available</h1>
          <p className="font-serif italic text-stone-500">It may have expired, been revoked, or the memoir taken down.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded p-8 text-center shadow-sm">
          <p className="text-[10px] font-sans uppercase tracking-[0.25em] text-stone-400 mb-3">A shared memoir</p>
          <h1 className="font-serif text-3xl italic text-memory-maroon mb-2">{subjectName}&apos;s Story</h1>
          <p className="font-serif italic text-stone-500 text-sm mb-6">Enter your name to step inside.</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Your name"
            maxLength={100}
            className="w-full bg-[#FAF9F6] border border-stone-200 rounded px-4 py-2.5 font-serif text-stone-800 outline-none focus:border-memory-maroon mb-3 text-center"
          />
          {joinError && <p className="text-xs text-red-600 mb-3">{joinError}</p>}
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !nameInput.trim()}
            className="w-full py-2.5 bg-memory-maroon text-white text-sm font-medium rounded cursor-pointer disabled:opacity-50"
          >
            {joining ? "Joining..." : "View memoir"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-serif text-stone-900">
      <MemoirHero
        onOpenGallery={() => setShowGallery(true)}
        subjectName={subjectName}
        description={description || "A preserved record of personal stories and reflections."}
        dob={years.split(" — ")[0] || ""}
        dod={years.split(" — ")[1] || ""}
        heroPhotos={heroPhotos}
      />

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-8">
        <p className="text-center text-sm italic text-stone-500 mb-4">
          Reading as <span className="font-semibold text-memory-maroon">{profile.display_name}</span>
        </p>
        <div className="flex flex-col items-center gap-2 mb-10">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-5 py-2 bg-memory-maroon text-white text-xs font-medium rounded cursor-pointer disabled:opacity-50"
          >
            {exporting ? "Preparing PDF..." : "Export PDF (images + text)"}
          </button>
          {exportNotice && <p className="text-xs italic text-stone-500">{exportNotice}</p>}
        </div>
        {reactionNotice && (
          <p className="text-center text-xs italic text-stone-400 mb-6">{reactionNotice}</p>
        )}

        {chapters.map((chapter, idx) => (
          <section key={chapter.id} className="mb-12">
            <div className="w-full h-[2px] bg-stone-800 mb-3" />
            <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-1">Chapter {idx + 1}</p>
            <h2 className="text-3xl md:text-4xl text-stone-900 mb-2 leading-tight">{chapter.title}</h2>
            {chapter.summary && (
              <div className="text-[15px] text-stone-700 mb-6 leading-relaxed bg-stone-50/60 p-4 rounded-sm border-l-2 border-memory-maroon/40 whitespace-pre-line">
                {chapter.summary}
              </div>
            )}

            {chapter.memories.map((mem) => {
              const photos = memoryPhotos(mem);
              const audios = memoryAudios(mem);
              return (
                <article key={mem.id} className="mb-8">
                  <div className="flex items-baseline justify-between gap-3">
                    {mem.title && <h3 className="text-xl text-stone-900 mb-2">{mem.title}</h3>}
                    <button
                      type="button"
                      onClick={() => toggleReaction({ memory_id: mem.id })}
                      className="text-sm text-memory-maroon cursor-pointer shrink-0"
                      aria-label="Remember this too"
                    >
                      {reactedIds.includes(mem.id) ? "♥" : "♡"} {reactionCounts[mem.id] ?? 0}
                    </button>
                  </div>
                  {mem.body_text && <p className="text-[15px] text-stone-700 leading-relaxed whitespace-pre-line">{mem.body_text}</p>}
                  {photos.length > 0 && (
                    <div className="flex overflow-x-auto gap-4 py-2 pb-4 mt-4">
                      {photos.map((img) => (
                        <figure key={img.id} className="shrink-0 w-72 bg-white p-2 border border-stone-200 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.caption} className="w-full aspect-[4/3] object-cover" />
                          {img.caption && (
                            <figcaption className="pt-2 pb-1 text-[11px] italic text-stone-600 text-center truncate px-2">
                              {img.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  )}
                  {audios.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {audios.map((a) => (
                        <div key={a.id} className="bg-[#f5f3ef] border border-stone-200 rounded-sm p-3">
                          <p className="text-[11px] text-stone-600 mb-2 truncate">{a.caption || "Audio Recording"}</p>
                          <audio controls src={a.url} className="w-full h-8 opacity-80" />
                        </div>
                      ))}
                    </div>
                  )}
                  <CommentThread
                    token={token}
                    profile={profile}
                    memoryId={mem.id}
                    canComment={canComment}
                    reactionCounts={reactionCounts}
                    reactedIds={reactedIds}
                    onToggleReaction={(commentId) => toggleReaction({ comment_id: commentId })}
                  />
                </article>
              );
            })}
          </section>
        ))}
      </div>

      {showGallery && <ScatteredGallery heroPhotos={heroPhotos} onClose={() => setShowGallery(false)} />}
    </div>
  );
}
