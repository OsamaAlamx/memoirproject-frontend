import React from "react";
import { ShortQuote } from "./types";

interface MemoirSidebarProps {
  activeView: "timeline" | "chapters";
  setActiveView: (val: "timeline" | "chapters") => void;
  mockShortQuotes: ShortQuote[];
  chapters?: string[];
  decades?: string[];
  activeDecade?: string | null;
  onSelectChapter?: (chapter: string) => void;
  onSelectDecade?: (decade: string) => void;
}

export default function MemoirSidebar({
  activeView,
  setActiveView,
  mockShortQuotes,
  chapters = ["The girl with the open window", "The things she carried", "A room at the center", "What stays warm"],
  decades = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"],
  activeDecade = null,
  onSelectChapter,
  onSelectDecade,
}: MemoirSidebarProps) {
  const displayDecades = decades.length > 0 ? decades : ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"];
  const displayChapters =
    chapters.length > 0 ? chapters : ["The girl with the open window", "The things she carried", "A room at the center", "What stays warm"];

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-8">
      <div className="bg-white p-4 rounded-sm border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center p-0.5 bg-stone-100/50 border border-stone-200 rounded-sm mb-4">
          {[
            { id: "timeline", label: "Timeline" },
            { id: "chapters", label: "Chapters" },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id as "timeline" | "chapters")}
              className={`flex-1 py-1.5 text-[9px] font-sans uppercase tracking-wider transition-all rounded-sm cursor-pointer ${
                activeView === v.id ? "bg-white text-memory-maroon font-bold shadow-sm" : "text-stone-500 hover:text-memory-maroon"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {activeView === "timeline" && (
            <ul className="space-y-2.5 text-[11px] font-serif">
              {displayDecades.map((decade, idx) => (
                <li
                  key={`decade-${decade}-${idx}`}
                  onClick={() => onSelectDecade?.(decade)}
                  className={`flex items-center justify-between cursor-pointer pb-1 border-b border-stone-100 ${
                    activeDecade === decade ? "text-memory-maroon font-semibold" : "text-stone-600 hover:text-memory-maroon"
                  }`}
                >
                  <span>{decade}</span>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-stone-400">
                    {activeDecade === decade ? "Selected" : "Archive"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {activeView === "chapters" && (
            <ul className="space-y-2.5 text-[11px] font-serif">
              {displayChapters.map((chapter, idx) => (
                <li
                  key={`chapter-${chapter}-${idx}`}
                  onClick={() => onSelectChapter?.(chapter)}
                  className="flex items-center justify-between text-stone-600 hover:text-memory-maroon cursor-pointer pb-1 border-b border-stone-100"
                >
                  <span className="truncate pr-2">{chapter}</span>
                  <span className="text-[9px] font-sans text-stone-400 shrink-0">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-[11px] font-sans uppercase tracking-[0.2em] text-stone-500 font-semibold mb-6 border-b border-stone-200 pb-2">
          Fleeting Thoughts
        </label>
        <div className="space-y-10">
          {mockShortQuotes.map((quote) => (
            <div key={quote.id} className="relative">
              <p className="text-[16px] font-serif italic text-stone-700 leading-relaxed">
                <span className="text-memory-maroon/40 font-serif mr-0.5">“</span>
                {quote.text}
                <span className="text-memory-maroon/40 font-serif ml-0.5">”</span>
              </p>
              <div className="mt-2 flex justify-end items-center gap-2">
                <span className="w-3 h-px bg-memory-maroon/30"></span>
                <span className="text-[9px] font-sans font-semibold text-stone-400 uppercase tracking-wider">
                  {quote.author}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}