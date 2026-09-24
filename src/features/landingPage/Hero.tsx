/**
 * @file Hero.tsx
 * @description Component rendering the landing page hero section,
 * refactored to use shared theme color tokens instead of hardcoded hex brackets.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export default function Hero() {
  const router = useRouter();

  const handleGatherMemories = (e: MouseEvent) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (token) {
      e.preventDefault();
      router.push("/dashboard");
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 max-w-7xl mx-auto px-8 py-20 md:py-32 bg-memory-bg">
      <div className="lg:col-span-6 flex flex-col justify-center">
        <h1 className="text-memory-primary text-5xl md:text-[56px] font-serif font-bold leading-tight max-w-140">
          A shared family
          <br />
          memoir created by
          <br />
          everyone who
          <br />
          loved them.
        </h1>

        <p className="mt-6 md:mt-8 text-xl md:text-[22px] font-sans font-light leading-relaxed text-memory-primary/80 max-w-135">
          Share one link to collect voice stories, memories and photos from family. Everything is
          automatically organized into a chaptered archive and printable PDF.
        </p>

        <div className="flex mt-8">
          <Link
            href="/memory-subject-selection"
            onClick={handleGatherMemories}
            className="bg-memory-maroon text-memory-bg text-base md:text-lg font-sans font-medium px-8 py-3.5 rounded-xl hover:bg-memory-primary hover:shadow-xl hover:shadow-memory-maroon/20 hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center justify-center border border-memory-maroon"
          >
            Gather your memories
          </Link>
        </div>
      </div>

      <div className="lg:col-span-6 mt-12 lg:mt-0 relative">
        <div className="min-h-110 bg-memory-card border-2 border-dashed border-memory-accent/50 rounded-2xl flex flex-col items-center justify-center p-10 text-center shadow-lg group hover:border-memory-accent transition-colors duration-300">
          <div className="w-12 h-12 rounded-full bg-memory-accent/10 flex items-center justify-center mb-6">
            <svg
              className="w-6 h-6 text-memory-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
          </div>

          <p className="text-xl font-serif italic text-memory-primary/60 leading-relaxed max-w-[80%] group-hover:text-memory-primary/80 transition-colors">
            Proper preview of how the living memoir will look like at the end so the user knows what
            value they are getting right away.
          </p>
        </div>
      </div>
    </section>
  );
}