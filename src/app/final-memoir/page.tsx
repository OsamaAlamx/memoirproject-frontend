// src/app/final-memoir/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useExportMemoir } from "@/features/export";
import { useLiveMemoir } from "@/features/memoir";
import { getComments, createComment } from "@/features/comments";
import type { CommentEntity } from "@/features/comments";

import {
  MemoirHeader,
  MemoirHero,
  MemoirActionBar,
  MemoryCard,
  ChapterTimelineSidebar,
  ScatteredGallery,
  mockHeroPhotos,
  mockMemories,
} from "@/features/FinalMemoir";
import type { MemoryItem, HeroPhoto, MemoryImage, MemoryAudio } from "@/features/FinalMemoir";
import { env } from "@/lib/config/env";

interface ReplyItem {
  id: string;
  author: string;
  text: string;
  time: string;
}

interface CommentItem {
  id: string;
  author: string;
  text: string;
  time: string;
  replies?: ReplyItem[];
}

interface ApiMediaAsset {
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

interface ApiMemoryRecord {
  id: string;
  title?: string;
  body_text?: string;
  occurred_start?: string;
  created_at: string;
  chapter_id?: string;
  media_assets?: ApiMediaAsset[];
  author_participant_id?: string;
}

interface ApiChapterRecord {
  id: string;
  title: string;
  summary?: string;
  sort_order?: number;
}

function chapterAnchorId(name: string): string {
  return `chapter-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function resolvePhotoUrl(asset: ApiMediaAsset): string {
  // Bucket is private: only backend-signed playback_url works. Never guess public.
  if (asset.playback_url) return asset.playback_url;
  if (asset.storage_key && /^(https?:\/\/|\/)/.test(asset.storage_key)) return asset.storage_key;
  return "";
}

export default function FinalMemoirPage() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [showScatteredView, setShowScatteredView] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [pdfFileName, setPdfFileName] = useState("my-family-memoir");
  const [isTurningPage] = useState(false);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [liveMemories, setLiveMemories] = useState<MemoryItem[]>([]);
  const [livePhotos, setLivePhotos] = useState<HeroPhoto[]>([]);
  const [liveChaptersList, setLiveChaptersList] = useState<string[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

  const [memoirId, setMemoirId] = useState<string>("");
  const [subjectName, setSubjectName] = useState<string>("Nadia");
  const [memoirDescription, setMemoirDescription] = useState<string>(
    "She gave everyone a second chance and made the world warmer.",
  );
  const [dob, setDob] = useState<string>("1947");
  const [dod, setDod] = useState<string>("2024");

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // ------- Initial memoir hydration (preview mode OR live data) -------
  /* eslint-disable react-hooks/set-state-in-effect -- hydrates client-only URL/localStorage into view state on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const previewId = urlParams.get("preview");

    if (previewId) {
      const previewRaw = localStorage.getItem(`memoir_preview_${previewId}`);
      if (previewRaw) {
        try {
          const { proposal, feed, excludedMedia } = JSON.parse(previewRaw);
          setIsPreviewMode(true);
          setMemoirId(previewId);

          // Try to hydrate subject data from active_memoir storage
          const savedMemoir = localStorage.getItem("active_memoir");
          if (savedMemoir) {
            const parsed = JSON.parse(savedMemoir);
            const obj = parsed.data || parsed;
            if (obj.subject_name) setSubjectName(obj.subject_name);
            if (obj.description) setMemoirDescription(obj.description);
            if (obj.subject_born_on) setDob(obj.subject_born_on.substring(0, 4));
            if (obj.subject_died_on) setDod(obj.subject_died_on.substring(0, 4));
            else if (obj.subject_is_living) setDod("Present");
          }

          const chapterOrderList: string[] = proposal.chapters.map((c: { title: string }) => c.title);
          setLiveChaptersList(chapterOrderList);

          const photosExtracted: HeroPhoto[] = [];
          const mapped: MemoryItem[] = [];

          proposal.chapters.forEach((ch: { title: string; summary?: string; memories: { id: string }[] }) => {
            ch.memories.forEach((memRef) => {
              const rawMem: ApiMemoryRecord | undefined = feed.find(
                (f: ApiMemoryRecord) => f.id === memRef.id,
              );
              if (!rawMem) return;

              const excludedIds: string[] = (excludedMedia && excludedMedia[rawMem.id]) || [];

              const allAssets = rawMem.media_assets || [];
              const visibleAssets = allAssets.filter((a) => !excludedIds.includes(a.id));

              const photoAssets = visibleAssets.filter((a) => a.kind === "photo");
              const audioAssets = visibleAssets.filter((a) => a.kind === "audio");

              const images: MemoryImage[] = photoAssets
                .map((a) => ({
                  id: a.id,
                  url: resolvePhotoUrl(a),
                  caption: a.caption || rawMem.title || "Archive photo",
                }))
                .filter((i) => Boolean(i.url));

              const audioClips: MemoryAudio[] = audioAssets
                .map((a) => ({
                  id: a.id,
                  url: resolvePhotoUrl(a),
                  caption: a.caption,
                  transcript: a.transcript ?? null,
                }))
                .filter((a) => Boolean(a.url));

              images.forEach((img) => photosExtracted.push({ ...img, caption: img.caption ?? "Archive photo" }));

              const formattedDate = rawMem.occurred_start
                ? new Date(rawMem.occurred_start).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : new Date(rawMem.created_at).toLocaleDateString();

              mapped.push({
                id: rawMem.id,
                author: "Family Member",
                title: rawMem.title || "Memory Entry",
                text: rawMem.body_text || "",
                reactionsCount: 0,
                imageUrl: images[0]?.url,
                imageCaption: photoAssets[0]?.caption,
                images: images.length ? images : undefined,
                audioClips: audioClips.length ? audioClips : undefined,
                chapter: ch.title,
                chapterSubtitle: ch.summary,
                date: formattedDate,
              });
            });
          });

          setLiveMemories(mapped);
          if (photosExtracted.length > 0) setLivePhotos(photosExtracted);

          setLoadingFeed(false);
          return; // stop; skip live fetch in preview mode
        } catch (err) {
          console.error("Failed to parse preview payload:", err);
          setLoadingFeed(false);
        }
      }
    }

    // Normal (non-preview) memoir hydration path
    try {
      const savedMemoir = localStorage.getItem("active_memoir");
      if (savedMemoir) {
        const parsed = JSON.parse(savedMemoir);
        const obj = parsed.data || parsed;
        if (obj.id) setMemoirId(obj.id);
        if (obj.subject_name) {
          setSubjectName(obj.subject_name);
          setPdfFileName(`${obj.subject_name.toLowerCase().replace(/\s+/g, "-")}-story`);
        }
        if (obj.description) setMemoirDescription(obj.description);
        if (obj.subject_born_on) setDob(obj.subject_born_on.substring(0, 4));
        if (obj.subject_died_on) setDod(obj.subject_died_on.substring(0, 4));
        else if (obj.subject_is_living) setDod("Present");
      }
    } catch (err) {
      console.error("Failed to parse active memoir", err);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ------- Live memoir hydration (client path: hooks.ts -> api.ts -> lib/api/client.ts) -------
  const liveQuery = useLiveMemoir(!memoirId || isPreviewMode ? null : memoirId);

  /* eslint-disable react-hooks/set-state-in-effect -- maps fetched live data into view state */
  useEffect(() => {
    if (!memoirId || isPreviewMode) {
      if (!memoirId) setLoadingFeed(false);
      return;
    }
    if (liveQuery.error) {
      console.error("Failed to fetch live memoir details:", liveQuery.error);
      setLoadingFeed(false);
      return;
    }
    if (liveQuery.loading || !liveQuery.liveData) {
      setLoadingFeed(true);
      return;
    }
    try {
      const liveData = liveQuery.liveData as {
          memoir?: {
            subject_name?: string;
            description?: string;
            subject_born_on?: string;
            subject_died_on?: string;
            subject_is_living?: boolean;
          };
          memories?: ApiMemoryRecord[];
          chapters?: ApiChapterRecord[];
        };

        if (liveData.memoir) {
          const m = liveData.memoir;
          if (m.subject_name) setSubjectName(m.subject_name);
          if (m.description) setMemoirDescription(m.description);
          if (m.subject_born_on) setDob(m.subject_born_on.substring(0, 4));
          if (m.subject_died_on) setDod(m.subject_died_on.substring(0, 4));
          else if (m.subject_is_living) setDod("Present");
        }

        const memoriesData: ApiMemoryRecord[] = liveData.memories || [];
        const chaptersData: ApiChapterRecord[] = liveData.chapters || [];

        const chapterMap: Record<string, { title: string; summary: string }> = {};
        const chapterOrderList: string[] = [];
        chaptersData.forEach((ch) => {
          chapterMap[ch.id] = {
            title: ch.title,
            summary: ch.summary || "Stories and preserved moments.",
          };
          chapterOrderList.push(ch.title);
        });
        setLiveChaptersList(chapterOrderList);

        if (Array.isArray(memoriesData) && memoriesData.length > 0) {
          const photosExtracted: HeroPhoto[] = [];

          // Soft-hide filter chosen in AI Organizer (preview uses the same).
          // Feed memories always keep their full media; only memoir views hide these.
          let liveExcluded: Record<string, string[]> = {};
          try {
            const raw = localStorage.getItem(`ai_excluded_media_${memoirId}`);
            if (raw) liveExcluded = JSON.parse(raw) as Record<string, string[]>;
          } catch {
            liveExcluded = {};
          }

          const mapped: MemoryItem[] = memoriesData.map((record) => {
            const excludedIds: string[] = liveExcluded[record.id] || [];
            const photoAssets = (record.media_assets?.filter((m) => m.kind === "photo") || []).filter(
              (m) => !excludedIds.includes(m.id),
            );
            const audioAssets = (record.media_assets?.filter((m) => m.kind === "audio") || []).filter(
              (m) => !excludedIds.includes(m.id),
            );

            const images: MemoryImage[] = photoAssets
              .map((asset) => ({
                id: asset.id,
                url: resolvePhotoUrl(asset),
                caption: asset.caption || record.title || "Archive photo",
              }))
              .filter((img) => Boolean(img.url));

            const audioClips: MemoryAudio[] = audioAssets
              .map((asset) => ({
                id: asset.id,
                url: resolvePhotoUrl(asset),
                caption: asset.caption,
                transcript: asset.transcript ?? null,
              }))
              .filter((a) => Boolean(a.url));

            const firstPhoto = photoAssets[0];
            const photoUrl = images[0]?.url || "";

            images.forEach((img) => photosExtracted.push({ ...img, caption: img.caption ?? "Archive photo" }));

            const formattedDate = record.occurred_start
              ? new Date(record.occurred_start).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : new Date(record.created_at).toLocaleDateString();

            const assignedChapterInfo =
              record.chapter_id && chapterMap[record.chapter_id]
                ? chapterMap[record.chapter_id]
                : { title: "Memoir Reflections", summary: "Stories and preserved moments." };

            return {
              id: record.id,
              author: "Family Member",
              title: record.title || "Memory Entry",
              text: record.body_text || "",
              reactionsCount: 0,
              imageUrl: photoUrl || undefined,
              imageCaption: firstPhoto?.caption,
              images: images.length > 0 ? images : undefined,
              audioClips: audioClips.length > 0 ? audioClips : undefined,
              chapter: assignedChapterInfo.title,
              chapterSubtitle: assignedChapterInfo.summary,
              date: formattedDate,
            };
          });

          setLiveMemories(mapped);
          if (photosExtracted.length > 0) setLivePhotos(photosExtracted);
        }
        setLoadingFeed(false);
    } catch (err) {
      console.error("Failed to fetch live memoir details:", err);
    }
  }, [liveQuery.liveData, liveQuery.loading, liveQuery.error, isPreviewMode, memoirId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const activeMemories = liveMemories.length > 0 ? liveMemories : mockMemories;
  const activeHeroPhotos = livePhotos.length > 0 ? livePhotos : mockHeroPhotos;

  const [reactions, setReactions] = useState<Record<string, { count: number; reacted: boolean }>>({});

  /* eslint-disable react-hooks/set-state-in-effect -- seeds per-memory reaction state when the feed changes */
  useEffect(() => {
    const initial: Record<string, { count: number; reacted: boolean }> = {};
    activeMemories.forEach((m) => {
      initial[m.id] = { count: m.reactionsCount || 0, reacted: false };
    });
    setReactions(initial);
  }, [activeMemories]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { triggerExport, isExporting } = useExportMemoir(memoirId);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isValidUuid = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const formatCommentsToTree = (entities: CommentEntity[]): CommentItem[] => {
    const commentMap = new Map<string, CommentItem>();
    const rootComments: CommentItem[] = [];

    entities.forEach((entity) => {
      const item: CommentItem = {
        id: entity.id,
        author: entity.author_name || "Participant",
        text: entity.body ?? "",
        time: entity.created_at
          ? new Date(entity.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        replies: [],
      };
      commentMap.set(entity.id, item);
    });

    entities.forEach((entity) => {
      const item = commentMap.get(entity.id);
      if (!item) return;

      if (entity.parent_comment_id && commentMap.has(entity.parent_comment_id)) {
        const parent = commentMap.get(entity.parent_comment_id);
        if (parent && parent.replies) {
          parent.replies.push({
            id: item.id,
            author: item.author,
            text: item.text,
            time: item.time,
          });
        }
      } else {
        rootComments.push(item);
      }
    });

    return rootComments;
  };

  useEffect(() => {
    if (openCommentsId && !commentsMap[openCommentsId]) {
      if (!isValidUuid(openCommentsId)) return;

      getComments(openCommentsId)
        .then((data: CommentEntity[]) => {
          const formatted = formatCommentsToTree(data);
          setCommentsMap((prev) => ({ ...prev, [openCommentsId]: formatted }));
        })
        .catch((err) => console.error("Failed to load comments:", err));
    }
  }, [openCommentsId, commentsMap]);

  const handleToggleReaction = (id: string) => {
    setReactions((prev) => {
      const current = prev[id] || { count: 0, reacted: false };
      const nextReacted = !current.reacted;
      return {
        ...prev,
        [id]: { count: nextReacted ? current.count + 1 : current.count - 1, reacted: nextReacted },
      };
    });
  };

  const handlePostComment = async (id: string) => {
    const text = commentInputs[id];
    if (!text || !text.trim()) return;

    if (!isValidUuid(id)) {
      const fallbackComment: CommentItem = {
        id: Date.now().toString(),
        author: "You",
        text: text.trim(),
        time: "Just now",
        replies: [],
      };
      setCommentsMap((prev) => ({ ...prev, [id]: [...(prev[id] || []), fallbackComment] }));
      setCommentInputs((prev) => ({ ...prev, [id]: "" }));
      return;
    }

    try {
      const newComment = await createComment({
        memoir_id: memoirId || "active-memoir-id",
        memory_id: id,
        body: text.trim(),
      });

      const formattedComment: CommentItem = {
        id: newComment.id,
        author: newComment.author_name || "You",
        text: newComment.body ?? "",
        time: newComment.created_at
          ? new Date(newComment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now",
        replies: [],
      };

      setCommentsMap((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), formattedComment],
      }));
      setCommentInputs((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Could not post comment. Please ensure you are logged in and authorized.");
    }
  };

  const handlePostReply = async (memoryId: string, commentId: string, replyText: string) => {
    if (!replyText || !replyText.trim()) return;

    if (!isValidUuid(memoryId)) {
      setCommentsMap((prev) => {
        const memoryComments = prev[memoryId] || [];
        const updated = memoryComments.map((c) => {
          if (c.id === commentId) {
            const replyItem: ReplyItem = {
              id: Date.now().toString(),
              author: "You",
              text: replyText.trim(),
              time: "Just now",
            };
            return { ...c, replies: [...(c.replies || []), replyItem] };
          }
          return c;
        });
        return { ...prev, [memoryId]: updated };
      });
      return;
    }

    try {
      const newReply = await createComment({
        memoir_id: memoirId || "active-memoir-id",
        memory_id: memoryId,
        parent_comment_id: commentId,
        body: replyText.trim(),
      });

      setCommentsMap((prev) => {
        const memoryComments = prev[memoryId] || [];
        const updated = memoryComments.map((c) => {
          if (c.id === commentId) {
            const replyItem: ReplyItem = {
              id: newReply.id,
              author: newReply.author_name || "You",
              text: newReply.body ?? "",
              time: newReply.created_at
                ? new Date(newReply.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Just now",
            };
            return { ...c, replies: [...(c.replies || []), replyItem] };
          }
          return c;
        });
        return { ...prev, [memoryId]: updated };
      });
    } catch (err) {
      console.error("Failed to post reply:", err);
      alert("Could not post reply. Please ensure you are logged in and authorized.");
    }
  };

  const handleSearchTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 250);
  };

  const filteredMemories = activeMemories.filter((mem) => {
    if (searchQuery === "") return true;
    const q = searchQuery.toLowerCase();
    return (
      (mem.text && mem.text.toLowerCase().includes(q)) ||
      (mem.author && mem.author.toLowerCase().includes(q)) ||
      (mem.imageCaption && mem.imageCaption.toLowerCase().includes(q)) ||
      (mem.title && mem.title.toLowerCase().includes(q))
    );
  });

  const memoryChapterNames = Array.from(new Set(activeMemories.map((m) => m.chapter)));
  const uniqueChapters =
    liveChaptersList.length > 0
      ? [...liveChaptersList, ...memoryChapterNames.filter((c) => !liveChaptersList.includes(c))]
      : memoryChapterNames;

  // Per-chapter timeline label derived from its visible memories' years.
  const chapterTimelines = uniqueChapters.map((chapterName) => {
    const years = filteredMemories
      .filter((m) => m.chapter === chapterName)
      .map((m) => new Date(m.date).getFullYear())
      .filter((y) => !isNaN(y));
    let timeline = "—";
    if (years.length > 0) {
      const min = Math.min(...years);
      const max = Math.max(...years);
      timeline =
        Math.floor(min / 10) === Math.floor(max / 10) ? `${Math.floor(min / 10) * 10}` : `${min} – ${max}`;
    }
    return { name: chapterName, timeline };
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-serif text-stone-900 selection:bg-memory-maroon/20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .font-serif { font-family: "Times New Roman", Times, serif !important; }
        .book-text { hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto; }
        @keyframes scribble {
          0% { transform: rotate(-12deg) translate(0px, 0px); }
          25% { transform: rotate(-16deg) translate(-1px, 2px); }
          50% { transform: rotate(-8deg) translate(2px, -1px); }
          75% { transform: rotate(-14deg) translate(-1px, 1px); }
          100% { transform: rotate(-12deg) translate(0px, 0px); }
        }
        .animate-scribble { animation: scribble 0.2s infinite; }
        .cursor-blink::after { content: '|'; animation: blink 1s step-start infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .clearfix::after { content: ""; clear: both; display: table; }
      `,
        }}
      />

      <MemoirHeader isVisible={isVisible} />

      {isPreviewMode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-serif italic px-4 py-2 rounded-full shadow-md">
          Preview Mode — this proposal is not yet applied
        </div>
      )}

      <MemoirHero
        onOpenGallery={() => setShowScatteredView(true)}
        subjectName={subjectName}
        description={memoirDescription}
        dob={dob}
        dod={dod}
        heroPhotos={activeHeroPhotos}
      />

      <div className="max-w-[100rem] mx-auto px-6 mb-8 flex flex-col gap-0.5 opacity-60">
        <div className="w-full h-[1px] bg-stone-300"></div>
        <div className="w-full h-[1px] bg-stone-300"></div>
      </div>

      <MemoirActionBar
        pdfFileName={pdfFileName}
        setPdfFileName={setPdfFileName}
        triggerExport={triggerExport}
        isExporting={isExporting}
        searchQuery={searchQuery}
        handleSearchTyping={handleSearchTyping}
        isTyping={isTyping}
      />

      <div className="max-w-[100rem] mx-auto flex flex-col lg:flex-row px-6 md:px-10 py-4 gap-8 md:gap-16">
        <main style={{ perspective: "2500px" }} className="flex-1 max-w-6xl">
          <div
            className={`relative bg-[#FCFBF8] border border-stone-200/80 px-6 md:px-10 py-6 rounded-sm pb-16 origin-left overflow-hidden ${
              isTurningPage
                ? "transition-all duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] opacity-0 [transform:rotateY(-130deg)_rotateX(4deg)_scale(0.95)] shadow-2xl brightness-50"
                : "transition-opacity duration-500 ease-in opacity-100 [transform:rotateY(0deg)_rotateX(0deg)_scale(1)] shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_0_60px_rgba(90,24,39,0.02)] brightness-100"
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
            }}
          >
            <div
              className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black/5 via-black/0 to-transparent pointer-events-none"
              style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-black/5 via-transparent to-transparent pointer-events-none"
              style={{ clipPath: "polygon(0 100%, 0 0, 100% 100%)" }}
            />

            {loadingFeed ? (
              <div className="py-20 text-center text-stone-400 font-serif italic">
                Opening the archive pages...
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="py-16 text-center text-stone-400 font-serif italic">
                No entries found matching your criteria.
              </div>
            ) : (
              uniqueChapters.map((chapterName, chapterIdx) => {
                const chapterMemories = filteredMemories.filter((m) => m.chapter === chapterName);
                if (chapterMemories.length === 0) return null;
                const chapterSub = chapterMemories[0].chapterSubtitle;

                return (
                  <div
                    key={`chapter-sec-${chapterName}-${chapterIdx}`}
                    id={chapterAnchorId(chapterName)}
                    className="mb-10 scroll-mt-28"
                  >
                    <div className="mb-4 mt-4 text-left relative flex flex-col">
                      <div className="w-full h-[2px] bg-stone-800 mb-3"></div>
                      <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-2 leading-tight">
                        {chapterName}
                      </h2>
                      {chapterSub && (
                        <div className="text-[15px] font-serif text-stone-700 mb-6 leading-relaxed bg-stone-50/60 p-4 rounded-sm border-l-2 border-memory-maroon/40 whitespace-pre-line">
                          {chapterSub}
                        </div>
                      )}
                    </div>

                    {chapterMemories.map((m) => (
                      <article key={`story-${m.id}`} className="mb-8">
                        {m.title && (
                          <h3 className="font-serif font-bold text-lg text-stone-900 mb-1">{m.title}</h3>
                        )}
                        <div className="text-[11px] font-sans uppercase tracking-widest text-stone-400 font-semibold mb-2">
                          {m.date} &middot; {m.author}
                        </div>
                        {m.text && (
                          <p className="book-text font-serif text-[15px] text-stone-800 leading-[1.7] whitespace-pre-line">
                            {m.text}
                          </p>
                        )}

                        {m.images && m.images.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-3">
                            {m.images.map((img) => (
                              <figure
                                key={`story-img-${img.id}`}
                                className="w-40 shrink-0 bg-white p-1.5 border border-stone-200 shadow-sm"
                              >
                                <div className="relative w-full aspect-square bg-stone-100 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={img.url} alt={img.caption || m.title} className="w-full h-full object-cover" />
                                </div>
                                {img.caption && (
                                  <figcaption className="pt-1 text-[10px] font-serif italic text-stone-600 text-center truncate px-1">
                                    {img.caption}
                                  </figcaption>
                                )}
                              </figure>
                            ))}
                          </div>
                        )}

                        {!isPreviewMode && m.audioClips && m.audioClips.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {m.audioClips.map((a) => (
                              <div
                                key={a.id}
                                className="bg-[#f5f3ef] border border-stone-200 rounded-sm px-3 py-2"
                              >
                                <div className="text-[10px] text-stone-500 font-mono mb-1 truncate font-semibold">
                                  {a.caption || "Audio Recording"}
                                </div>
                                <audio controls src={a.url} className="w-full h-8 opacity-80" />
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}

                    {(() => {
                      const uniqueAuthors = Array.from(
                        new Set(chapterMemories.map((m) => m.author).filter(Boolean)),
                      ).join(", ");

                      const combinedReactions = chapterMemories.reduce(
                        (sum, m) => sum + (m.reactionsCount || 0),
                        0,
                      );

                      const anchorId = chapterMemories[0].id;

                      const combinedMemory: MemoryItem = {
                        id: anchorId,
                        author: uniqueAuthors || "Family Member",
                        title: undefined,
                        text: "",
                        reactionsCount: combinedReactions,
                        chapter: chapterName,
                        chapterSubtitle: chapterSub,
                        date: chapterMemories[0].date,
                      };

                      return (
                        <MemoryCard
                          key={`chapter-narrative-${chapterName}-${chapterIdx}`}
                          mem={combinedMemory}
                          isHighlighted={combinedMemory.reactionsCount > 20}
                          currentReaction={reactions[anchorId] || { count: combinedReactions, reacted: false }}
                          handleToggleReaction={handleToggleReaction}
                          isCommentsOpen={openCommentsId === anchorId}
                          setOpenCommentsId={setOpenCommentsId}
                          commentsList={commentsMap[anchorId] || []}
                          commentInputValue={commentInputs[anchorId] || ""}
                          setCommentInputValue={(val) => setCommentInputs({ ...commentInputs, [anchorId]: val })}
                          handlePostComment={handlePostComment}
                          handlePostReply={(commentId, replyText) => handlePostReply(anchorId, commentId, replyText)}
                        />
                      );
                    })()}
                  </div>
                );
              })
            )}

            {filteredMemories.length > 0 && (
              <div className="mt-16 flex flex-col items-center justify-center opacity-90 pb-8">
                <div
                  className="relative w-20 h-20 bg-memory-maroon flex items-center justify-center cursor-default group"
                  style={{
                    boxShadow:
                      "0 4px 10px rgba(0,0,0,0.2), inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 3px 8px rgba(255,255,255,0.2)",
                    borderRadius: "50% 48% 52% 49% / 49% 51% 48% 52%",
                  }}
                >
                  <div className="absolute -top-1 right-2 w-3 h-3 rounded-full bg-memory-maroon shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]"></div>
                  <div className="absolute bottom-1 -left-1 w-4 h-3 rounded-full bg-memory-maroon shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]"></div>
                  <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] bg-memory-maroon/50">
                    <span className="font-serif text-white/80 text-3xl italic font-bold select-none">
                      {subjectName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-8 text-center border-t border-stone-200/60 pt-6 flex flex-col items-center">
                  <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-4 font-semibold">
                    Sealed & Shared
                  </p>
                  <p className="text-[16px] md:text-[18px] font-serif italic text-stone-600 max-w-lg leading-loose px-4">
                    Dedicated to {subjectName} and preserved for family and loved ones.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <ChapterTimelineSidebar
          chapters={chapterTimelines}
          onSelectChapter={(chapterName) => {
            document
              .getElementById(chapterAnchorId(chapterName))
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      {showScatteredView && (
        <ScatteredGallery heroPhotos={activeHeroPhotos} onClose={() => setShowScatteredView(false)} />
      )}
    </div>
  );
}