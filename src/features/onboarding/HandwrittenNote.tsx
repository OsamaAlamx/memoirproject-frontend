/**
 * @file HandwrittenNote.tsx
 * @description Component rendering a handwritten style note card personalized
 * with the memoir subject's name from onboarding.
 * Elevated to a premium, blank stationery look to distinguish it from the drafting phase.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function readSubjectName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('pending_memoir');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { subject_name?: unknown };
    if (typeof parsed.subject_name === 'string' && parsed.subject_name.trim()) {
      return parsed.subject_name.trim();
    }
  } catch {
    // Ignore malformed draft data and fall back to generic greeting.
  }
  return null;
}

export default function HandwrittenNote() {
  // Resolved after mount only: the server has no localStorage, so rendering
  // the stored name on first paint would mismatch the SSR HTML.
  const [subjectName, setSubjectName] = useState<string | null>(null);

  useEffect(() => {
    async function resolveSubjectName() {
      const name = readSubjectName();
      if (name) setSubjectName(name);
    }
    resolveSubjectName();
  }, []);
  return (
    <section className="min-h-screen bg-memory-bg text-memory-primary flex flex-col items-center justify-center px-6 py-16 relative z-10 font-sans selection:bg-memory-primary selection:text-white">

      {/* Keepsake Note Card (Elevated from torn paper to premium stationery) */}
      <div
        className="relative w-full max-w-90 bg-white border border-memory-border/50 shadow-2xl shadow-memory-primary/10 -rotate-1 transition-transform hover:rotate-0 duration-500 p-10 sm:p-12 rounded-3xl"
      >
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Using the global font-caveat utility class */}
          <h2 className="font-caveat text-[40px] font-bold text-memory-primary mb-4">
            {subjectName ? `Dear ${subjectName}!` : 'Dear Friend!'}
          </h2>

          <p className="font-caveat text-[28px] text-memory-primary leading-10">
            Every family has a story worth keeping, the quiet mornings,
            the faded photographs, and the voices you never want to lose.
            We built this space to hold those precious pieces safe for you
            and the ones you love.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-4 mt-6 w-full max-w-85">
        <Link
          href="/memory-subject-selection"
          className="flex-1 text-center bg-white border border-memory-border text-memory-primary text-[16px] font-semibold py-4 rounded-2xl hover:border-memory-accent transition shadow-sm"
        >
          Back
        </Link>

        <Link
          href="/unfold-memory"
          className="flex-1 text-center bg-memory-primary text-white text-[16px] font-semibold py-4 rounded-2xl hover:bg-memory-maroon transition shadow-md"
        >
          Continue
        </Link>
      </div>

    </section>
  );
}

