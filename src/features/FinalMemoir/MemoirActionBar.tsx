import React from "react";

interface MemoirActionBarProps {
  pdfFileName: string;
  setPdfFileName: (val: string) => void;
  triggerExport: (name: string) => void;
  isExporting: boolean;
  searchQuery: string;
  handleSearchTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isTyping: boolean;
}

export default function MemoirActionBar({
  pdfFileName,
  setPdfFileName,
  triggerExport,
  isExporting,
  searchQuery,
  handleSearchTyping,
  isTyping,
}: MemoirActionBarProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-2 pb-2 flex flex-col lg:flex-row justify-between items-end gap-6 relative z-10">
      {/* LEFT: Compact PDF Export Trigger */}
      <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm px-4 py-2.5 border border-stone-200 shadow-sm rounded-sm mb-1 w-full lg:w-auto">
        <span className="text-[10px] font-sans uppercase tracking-[0.1em] text-stone-600 font-semibold">
          Printable Archive
        </span>
        <div className="h-4 w-px bg-stone-300"></div>
        <input
          type="text"
          value={pdfFileName}
          onChange={(e) => setPdfFileName(e.target.value)}
          placeholder="Filename"
          className="w-32 sm:w-40 bg-transparent border-none px-1 text-[13px] font-serif text-stone-800 placeholder-stone-400 outline-none focus:ring-0"
        />
        <button
          type="button"
          onClick={() => triggerExport(pdfFileName)}
          disabled={isExporting}
          className="bg-memory-maroon text-white px-3 py-1.5 rounded-sm text-[10px] font-sans font-medium uppercase tracking-wider hover:bg-stone-800 transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Download"}
        </button>
      </div>

      {/* RIGHT: Vintage Paper Scrap Semantic Search Box */}
      <div
        className="relative p-4 shadow-[1px_2px_8px_rgba(0,0,0,0.08)] bg-white border-2 border-[#EAE3D9] w-full lg:w-80"
        style={{
          borderRadius: "2px 20px 4px 15px / 15px 4px 20px 3px",
          backgroundImage: `url("data:image/svg+xml,%3 viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3C%3 width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FAF9F6] rounded-full"></div>
        <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#FAF9F6] rounded-full"></div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none max-w-full overflow-visible">
            <span className="font-serif text-[15px] px-1 py-1 text-transparent whitespace-pre">
              {searchQuery}
            </span>
            <div className={`transition-opacity duration-300 z-30 opacity-100 ${isTyping ? "animate-scribble" : ""}`}>
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-memory-maroon drop-shadow-md -mt-5 ml-0 transform -rotate-12"
              >
                <path d="M20.2 2.8c-1.1-.8-2.6-.9-3.8-.2l-9.1 5.3c-.6.3-1.1.8-1.4 1.4L2.3 16.5c-.3.5-.2 1.1.2 1.5.4.4 1 .5 1.5.2l7.2-3.6c.6-.3 1.1-.8 1.4-1.4l5.3-9.1c.7-1.2.6-2.7-.2-3.8zm-6.2 9l-5.4 2.7 2.7-5.4 6.7-3.9-3.9 6.6zM21 4.4c.4.6.4 1.4 0 2L16 11.5l-2.5-4.3L18.6 2.1c.6-.4 1.4-.3 2 .2.2.3.4.6.4 1z" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search the archive..."
            value={searchQuery}
            onChange={handleSearchTyping}
            className="w-full bg-transparent border-b border-stone-400/50 border-dashed px-1 py-1 text-[15px] font-serif text-stone-800 placeholder-stone-400 outline-none focus:border-memory-maroon transition-colors relative z-20"
            style={{ paddingRight: "30px" }}
          />
        </div>
      </div>
    </div>
  );
}