"use client";

import { Volume2 } from "lucide-react";

import type { Memory } from "@/features/memory/schemas";

export function MemoryCard({
  memory,
  currentUserId,
}: {
  memory: Memory;
  currentUserId: string;
}) {
  const firstPhoto = memory.media.find((m) => m.kind === "photo");
  const firstAudio = memory.media.find((m) => m.kind === "audio");
  const dateStr = new Date(memory.created_at).toLocaleDateString();

  const durationSec = firstAudio?.duration_ms
    ? Math.round(firstAudio.duration_ms / 1000)
    : null;

  return (
    <article className="rounded-2xl bg-[#F3E8DA] p-5 shadow-sm">
      <h3 className="font-heading text-xl text-amber-950">
        {memory.title || "Untitled memory"}
      </h3>

      {firstPhoto && (
        <div className="mt-3 overflow-hidden rounded-xl">
          {/* Storage URLs are dynamic signed URLs, so a native image avoids
              Next Image hostname configuration requirements. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstPhoto.playback_url}
            alt={firstPhoto.caption ?? memory.title ?? "Memory photo"}
            loading="lazy"
            className="h-48 w-full object-cover"
          />
        </div>
      )}

      {firstAudio && (
        <div className="mt-3 space-y-2 rounded-xl border border-amber-900/10 bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-amber-950">
            <span className="flex items-center gap-1.5">
              <Volume2 className="size-4 text-amber-900" /> Voice Recording
            </span>
            {durationSec !== null && (
              <span className="rounded-md bg-amber-900/10 px-2 py-0.5 text-amber-900">
                {formatTime(durationSec)}
              </span>
            )}
          </div>
          <audio
            controls
            preload="metadata"
            src={firstAudio.playback_url}
            className="h-10 w-full"
          />
        </div>
      )}

      {memory.body_text && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-amber-900/85">
          {memory.body_text}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-amber-900/15 pt-3 text-xs text-amber-900/70">
        <span>{currentUserId === "owner" ? "By You" : "By Contributor"}</span>
        <span>{dateStr}</span>
      </div>
    </article>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
