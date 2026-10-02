/**
 * @file MemoryFeed.tsx
 * @description Client-side component that renders interactive capture cards
 * with fallback resolution for active memoir IDs from local storage.
 */

"use client";

import { useState } from "react";
import { MemoryItem } from "./MemoryCard";
import { useCaptureMemory } from "@/features/memories";

interface MemoryFeedProps {
  memories: MemoryItem[];
  memoirId?: string; 
  isPublished?: boolean;
  onOptionSelect?: (action: string, memoryId: string) => void;
  onSuccess?: () => void;
}

export function MemoryFeed({ memoirId, isPublished = false, onSuccess }: MemoryFeedProps) {
  const [activeCaptureMode, setActiveCaptureMode] = useState<"text" | "audio" | "combined" | null>(null);

  // Fallback to localStorage if the memoirId prop wasn't passed down
  const effectiveMemoirId = memoirId || (() => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("active_memoir");
    if (!stored) return "";
    try {
      const parsed = JSON.parse(stored);
      return parsed.id || parsed;
    } catch {
      return stored;
    }
  })();

  // Hooking directly into your exact production backend capture logic
  const {
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
    handleSubmit
  } = useCaptureMemory(effectiveMemoirId, () => {
    setActiveCaptureMode(null);
    if (onSuccess) onSuccess();
  });

  const handleCardClick = (mode: "text" | "audio" | "combined") => {
    // Published memoirs are frozen: the live book no longer accepts entries.
    if (isPublished) {
      alert("This memoir is published and no longer accepts new memories.");
      return;
    }
    // Guard capture actions if neither prop nor localStorage has a valid ID
    if (!effectiveMemoirId) {
      alert("Please select an active memoir before attempting to capture new entries.");
      return;
    }
    setActiveCaptureMode(activeCaptureMode === mode ? null : mode);
  };

  if (isPublished) {
    return (
      <div className="rounded-2xl border border-memory-maroon/20 bg-white p-8 text-center shadow-xs">
        <h3 className="font-serif text-lg text-memory-primary mb-2">Memoir Published</h3>
        <p className="text-sm text-memory-muted max-w-md mx-auto">
          This memoir is live on its single share link. Adding memories is locked to keep the
          published book stable — unpublish it from the Share tab to add more entries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* --- THREE SQUARE INTERACTIVE INPUT CARDS --- */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-xs text-memory-muted uppercase tracking-wider">
          Capture New Entry
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Card 1: Written Reflection */}
          <div 
            onClick={() => handleCardClick("text")}
            className={`relative bg-memory-card border p-6 rounded-3xl cursor-pointer transition-all shadow-xs hover:border-memory-accent aspect-square flex flex-col justify-between ${
              activeCaptureMode === "text" ? "border-memory-primary ring-2 ring-memory-primary/25 scale-[1.02]" : "border-memory-border"
            }`}
          >
            <div className="space-y-2 pr-4">
              <h4 className="font-serif font-bold text-memory-primary text-lg">Written Reflection</h4>
              <p className="text-xs text-memory-muted leading-relaxed">Add a text story, journal entry, or historical note.</p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-md ${
                  activeCaptureMode === "text" ? "bg-memory-maroon text-memory-light rotate-90" : "bg-memory-primary text-memory-light hover:scale-110"
                }`}
                aria-label="Open text capture form"
              >
                <span className="text-sm font-bold">↗</span>
              </button>
            </div>
          </div>

          {/* Card 2: Voice Recording */}
          <div 
            onClick={() => handleCardClick("audio")}
            className={`relative bg-memory-light border p-6 rounded-3xl cursor-pointer transition-all shadow-xs hover:border-memory-accent aspect-square flex flex-col justify-between ${
              activeCaptureMode === "audio" ? "border-memory-primary ring-2 ring-memory-primary/25 scale-[1.02]" : "border-memory-border"
            }`}
          >
            <div className="space-y-2 pr-4">
              <h4 className="font-serif font-bold text-memory-primary text-lg">Voice Recording</h4>
              <p className="text-xs text-memory-muted leading-relaxed">Record or upload an audio narrative with auto-transcription.</p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-md ${
                  activeCaptureMode === "audio" ? "bg-memory-maroon text-memory-light rotate-90" : "bg-memory-primary text-memory-light hover:scale-110"
                }`}
                aria-label="Open audio capture form"
              >
                <span className="text-sm font-bold">↗</span>
              </button>
            </div>
          </div>

          {/* Card 3: Media & Combined */}
          <div 
            onClick={() => handleCardClick("combined")}
            className={`relative bg-memory-maroon text-memory-light border p-6 rounded-3xl cursor-pointer transition-all shadow-xs hover:border-memory-accent aspect-square flex flex-col justify-between ${
              activeCaptureMode === "combined" ? "border-memory-accent ring-2 ring-memory-accent/40 scale-[1.02]" : "border-memory-accent/30"
            }`}
          >
            <div className="space-y-2 pr-4">
              <h4 className="font-serif font-bold text-memory-light text-lg">Media & Combined</h4>
              <p className="text-xs text-memory-border/80 leading-relaxed">Attach photos with descriptive text or audio notes.</p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-md ${
                  activeCaptureMode === "combined" ? "bg-memory-accent text-memory-primary rotate-90" : "bg-memory-light text-memory-primary hover:scale-110"
                }`}
                aria-label="Open media capture form"
              >
                <span className="text-sm font-bold">↗</span>
              </button>
            </div>
          </div>

        </div>

        {/* --- EXPANDED BACKEND-CONNECTED FORM DROPDOWN --- */}
        {activeCaptureMode && (
          <div className="bg-memory-card border border-memory-border rounded-2xl p-6 shadow-md transition-all animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-memory-border">
              <h4 className="font-serif font-bold text-memory-primary text-sm uppercase tracking-wider">
                {activeCaptureMode === "text" && "New Written Reflection"}
                {activeCaptureMode === "audio" && "New Voice Recording Entry"}
                {activeCaptureMode === "combined" && "New Media & Story Entry"}
              </h4>
              <button
                type="button"
                onClick={() => setActiveCaptureMode(null)}
                className="text-xs text-memory-muted hover:text-memory-primary cursor-pointer font-medium"
              >
                Close Form
              </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm rounded">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-memory-muted uppercase mb-1">Entry Title</label>
                  <input
                    type="text"
                    required
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="e.g., Summer at the lake house"
                    className="w-full bg-memory-light border border-memory-border rounded-lg px-3 py-2 text-sm text-memory-primary focus:outline-none focus:border-memory-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-memory-muted uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={draft.occurred_start}
                    onChange={(e) => setDraft({ ...draft, occurred_start: e.target.value })}
                    className="w-full bg-memory-light border border-memory-border rounded-lg px-3 py-2 text-sm text-memory-primary focus:outline-none focus:border-memory-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-memory-muted uppercase mb-1">Story / Text</label>
                <textarea
                  rows={4}
                  value={draft.body_text}
                  onChange={(e) => setDraft({ ...draft, body_text: e.target.value })}
                  placeholder="Write your memory here..."
                  className="w-full bg-memory-light border border-memory-border rounded-lg px-3 py-2 text-sm text-memory-primary focus:outline-none focus:border-memory-accent resize-none"
                />
              </div>

              {activeCaptureMode === "audio" && (
                <div className="border-t border-memory-border pt-3">
                  <label className="block text-xs font-semibold text-memory-muted uppercase mb-2">Voice Recordings</label>
                  {!recording && (
                    <button type="button" onClick={startRecording} className="px-3 py-1.5 bg-memory-primary text-memory-light text-xs font-medium rounded hover:bg-memory-maroon cursor-pointer transition-colors">
                      {audioClips.length > 0 ? "Record Another" : "Record Voice"}
                    </button>
                  )}
                  {recording && (
                    <button type="button" onClick={stopRecording} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded animate-pulse cursor-pointer">
                      Stop Recording
                    </button>
                  )}
                  {audioClips.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {audioClips.map((clip, index) => (
                        <div key={clip.id} className="flex items-center space-x-3">
                          <span className="text-xs text-memory-muted shrink-0">Take {index + 1}</span>
                          <audio controls src={clip.url} className="h-8 min-w-0 flex-1" />
                          <button type="button" onClick={() => removeAudioClip(clip.id)} className="text-xs text-red-600 underline cursor-pointer shrink-0">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeCaptureMode === "combined" && (
                <div className="border-t border-memory-border pt-3 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-memory-muted uppercase mb-2">Photographs</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) addPhotos(e.target.files);
                        e.target.value = "";
                      }}
                      className="text-xs text-memory-primary"
                    />
                    {photos.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {photos.map((photo, index) => (
                          <div key={photo.id} className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-memory-primary truncate">{index + 1}. {photo.file.name}</p>
                              <input
                                type="text"
                                placeholder="Optional photo caption..."
                                value={photo.caption}
                                onChange={(e) => setPhotoCaption(photo.id, e.target.value)}
                                className="w-full bg-memory-light border border-memory-border rounded-lg px-3 py-2 text-sm text-memory-primary focus:outline-none focus:border-memory-accent mt-1"
                              />
                            </div>
                            <button type="button" onClick={() => removePhoto(photo.id)} className="text-xs text-red-600 underline cursor-pointer shrink-0 mt-1">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-memory-muted uppercase mb-2">Voice Recordings</label>
                    {!recording && (
                      <button type="button" onClick={startRecording} className="px-3 py-1.5 bg-memory-primary text-memory-light text-xs font-medium rounded hover:bg-memory-maroon cursor-pointer transition-colors">
                        {audioClips.length > 0 ? "Record Another" : "Record Voice"}
                      </button>
                    )}
                    {recording && (
                      <button type="button" onClick={stopRecording} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded animate-pulse cursor-pointer">
                        Stop Recording
                      </button>
                    )}
                    {audioClips.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {audioClips.map((clip, index) => (
                          <div key={clip.id} className="flex items-center space-x-3">
                            <span className="text-xs text-memory-muted shrink-0">Take {index + 1}</span>
                            <audio controls src={clip.url} className="h-8 min-w-0 flex-1" />
                            <button type="button" onClick={() => removeAudioClip(clip.id)} className="text-xs text-red-600 underline cursor-pointer shrink-0">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-memory-border">
                <button
                  type="button"
                  onClick={() => setActiveCaptureMode(null)}
                  className="px-4 py-2 rounded-lg border border-memory-border text-xs text-memory-muted hover:bg-memory-light cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-memory-primary hover:bg-memory-maroon text-memory-light text-xs font-medium rounded shadow-xs cursor-pointer transition-colors"
                >
                  {loading ? "Saving Memory..." : "Save Memory to Feed"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}