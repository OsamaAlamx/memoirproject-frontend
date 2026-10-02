// src/features/FinalMemoir/ChapterTimelineSidebar.tsx
import React from "react";

export interface ChapterTimelineEntry {
  name: string;
  timeline: string;
}

interface ChapterTimelineSidebarProps {
  chapters: ChapterTimelineEntry[];
  onSelectChapter?: (chapter: string) => void;
}

export default function ChapterTimelineSidebar({ chapters, onSelectChapter }: ChapterTimelineSidebarProps) {
  return (
    <aside className="w-full lg:w-80 shrink-0 lg:order-first">
      <div className="py-2">
        <p className="text-[13px] font-sans uppercase tracking-[0.2em] text-stone-500 font-semibold mb-4 border-b border-stone-200 pb-2">
          Chapters
        </p>
        {chapters.length === 0 ? (
          <p className="text-[15px] font-serif italic text-stone-400">No chapters yet.</p>
        ) : (
          <ul className="space-y-3 text-[17px] font-serif">
            {chapters.map((chapter, idx) => (
              <li
                key={`chapter-timeline-${chapter.name}-${idx}`}
                onClick={() => onSelectChapter?.(chapter.name)}
                className="flex items-baseline gap-2 flex-nowrap cursor-pointer pb-1 border-b border-stone-100 text-stone-600 hover:text-memory-maroon transition-colors"
              >
                <span className="shrink-0">Chapter {idx + 1}</span>
                <span aria-hidden="true" className="text-stone-300 select-none shrink-0">----</span>
                <span className="min-w-0 flex-1 truncate" title={chapter.name}>{chapter.name}</span>
                <span aria-hidden="true" className="text-stone-300 select-none shrink-0">----</span>
                <span className="text-[13px] font-sans uppercase tracking-wider text-stone-700 shrink-0">
                  {chapter.timeline}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
