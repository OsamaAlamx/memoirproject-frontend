/**
 * @file ScatteredMemories.tsx
 * @description Component rendering the scattered memories and quote section,
 * refactored to use shared theme color tokens instead of hardcoded hex brackets.
 */

"use client";
import Image from "next/image";

export default function ScatteredMemories() {
  return (
    <div className="flex flex-col w-full">
      {/* Unified background color matching the rest of the landing page */}
      <section className="relative min-h-screen flex items-center justify-center p-8 bg-memory-bg overflow-hidden">
        {/* 1. The Photo Artifact (Top Left) */}
        <div className="hidden md:block absolute top-16 left-20 lg:left-32 w-48 h-64 bg-gray-200 border-10 border-white shadow-xl -rotate-12 transition-transform duration-500 hover:scale-105 hover:z-20 overflow-hidden">
          <Image
            src="/TopLeftImage.jpg"
            alt="Vintage family memory"
            fill
            sizes="192px"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. The Second Photo Artifact (Bottom Right) */}
        <div className="hidden md:block absolute bottom-24 right-20 lg:right-32 w-72 h-44 bg-gray-200 border-8 border-white shadow-xl -rotate-15 transition-transform duration-500 hover:scale-105 hover:z-20 overflow-hidden">
          <Image
            src="/BottomRightImage.jpg"
            alt="Nostalgic family memory"
            fill
            sizes="288px"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 3. The Voice Note Artifact (Mid-Left) */}
        <div className="hidden md:flex absolute bottom-20 left-1/4 w-60 h-16 bg-white rounded-full shadow-lg -rotate-12 opacity-90 border border-gray-100 transition-transform duration-500 hover:scale-105 hover:z-20 items-center px-4 gap-3 cursor-pointer">
          {/* Updated play button background to match the primary brand color token */}
          <div className="w-10 h-10 rounded-full bg-memory-primary flex items-center justify-center shrink-0">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-8 border-l-memory-accent border-b-[5px] border-b-transparent ml-1"></div>
          </div>
        </div>

        {/* 4. The Journal Text Artifact (Top Right) */}
        <div className="hidden md:block absolute top-20 right-[35%] w-56 p-6 bg-white shadow-lg rotate-12 opacity-80 border border-gray-100 transition-transform duration-500 hover:scale-105 hover:z-20">
          <div className="w-full h-px bg-gray-200 mb-3"></div>
          <div className="w-full h-px bg-gray-200 mb-3"></div>
          <p className="font-serif italic text-gray-500 text-sm leading-relaxed">
            I still remember the summer he taught us...
          </p>
        </div>

        {/* Main Central Quote Box */}
        <div className="relative z-10 max-w-2xl backdrop-blur-md bg-white/70 p-8 md:p-10 rounded-3xl border border-white shadow-[0_8px_30px_rgb(56,28,36,0.06)]">
          {/* Updated heading text color to match the global primary theme system */}
          <h2 className="text-memory-primary text-2xl md:text-3xl text-center font-serif leading-relaxed">
            Every family already holds the memoir. It is just{" "}
            <span className="text-memory-accent italic">scattered across</span> the
            people who loved them.
          </h2>
        </div>
      </section>
    </div>
  );
}