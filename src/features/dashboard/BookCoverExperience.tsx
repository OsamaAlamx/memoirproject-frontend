"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface BookCoverExperienceProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function BookCoverExperience({
  children,
  title = "A Lifetime Remembered",
  subtitle = "A Living Archive of Stories & Voices",
}: BookCoverExperienceProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-screen bg-memory-bg relative overflow-hidden perspective-[2000px]">
      {/* --- UNDERLYING DASHBOARD CONTENT --- */}
      <div className="w-full h-full overflow-y-auto">
        {children}
      </div>

      {/* --- CREATIVE BOOK COVER / PAGE THAT SWINGS OPEN --- */}
      <motion.div
        initial={false}
        animate={isOpen ? { rotateY: -180, opacity: 0 } : { rotateY: 0, opacity: 1 }}
        transition={{ duration: 1.0, ease: [0.645, 0.045, 0.355, 1.0] }}
        style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
        className={`absolute inset-0 z-50 w-full h-full bg-memory-primary text-memory-light shadow-[25px_0_60px_rgba(0,0,0,0.3)] flex flex-col items-center justify-between p-10 sm:p-16 select-none ${
          isOpen ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        {/* Real Book Spine Crease & Shadow on Left Edge */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-black/50 via-black/15 to-transparent pointer-events-none" />

        {/* Elegant Inner Foil Border Frame with Corner Accents */}
        <div className="flex justify-between items-center text-memory-accent/60 font-serif text-lg" />
        <div className="flex justify-between items-center text-memory-accent/60 font-serif text-lg" />
        <div />

        {/* Center Cover Art & Typography */}
        <div className="text-center space-y-6 z-10 max-w-md mx-auto px-4">
          <span className="text-memory-accent text-xs tracking-[0.3em] uppercase font-serif block">
            Private Collection
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-memory-light tracking-wide leading-tight">
            {title}
          </h1>
          <p className="font-serif italic text-sm sm:text-base text-memory-border/80 font-light tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* Bottom Footer & Interactive Open Button */}
        <div className="text-center pb-6 z-10 space-y-4">
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center bg-memory-accent text-memory-primary font-serif font-semibold text-xs tracking-[0.3em] uppercase px-10 py-4 rounded-xl shadow-xl cursor-pointer transition-colors hover:bg-white"
          >
            Open Memoir ⟶
          </motion.button>
          <p className="text-[10px] tracking-[0.2em] text-memory-muted uppercase font-serif">
            Click to break the seal & enter
          </p>
        </div>
      </motion.div>
    </div>
  );
}