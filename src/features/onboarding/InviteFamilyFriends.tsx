/**
 * @file InviteFamilyFriends.tsx
 * @description Component rendering the family and friends invitation screen.
 */

"use client";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, Heart, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createMemoir } from "@/features/memoir";

export default function InviteFamilyFriends() {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  /**
   * End-of-funnel exit. The funnel stashes `pending_memoir` for post-auth
   * creation, so a logged-in user arriving here still has an uncreated draft:
   * flush it now so the new memoir opens instead of stranding the draft.
   * Returns true when navigation was handled (caller must stop).
   */
  const finishLoggedIn = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!localStorage.getItem("access_token")) return false;
    setFinishing(true);
    setFinishError(null);
    try {
      const pending = localStorage.getItem("pending_memoir");
      if (pending) {
        const created = await createMemoir(JSON.parse(pending));
        localStorage.setItem("active_memoir", JSON.stringify(created));
        localStorage.removeItem("pending_memoir");
        router.push("/dashboard");
      } else {
        router.push("/memoirs");
      }
      return true;
    } catch (err) {
      setFinishError(err instanceof Error ? err.message : "Could not finish setup. Please try again.");
      return true;
    } finally {
      setFinishing(false);
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-memory-bg px-6 py-12 text-memory-primary font-sans">
      {/* Very subtle background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-105 w-105 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-xl"
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute -top-1 left-0 z-50 flex cursor-pointer items-center gap-2 text-memory-muted transition hover:text-memory-primary"
        >
          <ArrowLeft size={17} strokeWidth={1.5} />
          <span className="font-serif text-sm">Back</span>
        </button>

        {/* Content */}
        <div className="pt-14 text-center">
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="font-serif text-3xl leading-tight md:text-4xl"
          >
            You remember it.
            <br />
            <span className="italic">They might too.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mx-auto mt-4 max-w-sm font-serif text-[15px] leading-6 text-memory-muted"
          >
            Invite someone who shared that moment with you.
          </motion.p>

          {/* Interactive Memory Scene */}
          <div className="group relative mx-auto mt-10 h-85 w-full max-w-107.5">
            {/* TOP-RIGHT POPUP */}
            <div
              className="
                absolute right-0 top-0 z-40
                translate-x-11.25 translate-y-13.75
                scale-90 opacity-0
                pointer-events-none
                transition-all duration-500 ease-out
                group-hover:pointer-events-auto
                group-hover:translate-x-0
                group-hover:translate-y-0
                group-hover:scale-100
                group-hover:opacity-100
              "
            >
              <div className="relative w-61.25 rounded-2xl rounded-bl-md border border-memory-border bg-white px-5 py-4 text-left shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-memory-card">
                    <Link2
                      size={15}
                      strokeWidth={1.5}
                      className="text-memory-primary"
                    />
                  </div>

                  <div>
                    <p className="font-serif text-[11px] text-memory-muted">
                      A memory was shared
                    </p>

                    <p className="mt-1 font-serif text-[13px] italic leading-5 text-memory-primary">
                      “I thought you’d remember this too.”
                    </p>
                  </div>
                </div>

                {/* Tail */}
                <span className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b border-r border-memory-border bg-white" />
              </div>
            </div>

            {/* BOTTOM-LEFT POPUP */}
            <div
              className="
                absolute bottom-4 left-0 z-40
                translate-x-11.25 translate-y-8.75
                scale-90 opacity-0
                pointer-events-none
                transition-all duration-500 ease-out
                group-hover:pointer-events-auto
                group-hover:translate-x-0
                group-hover:translate-y-0
                group-hover:scale-100
                group-hover:opacity-100
              "
            >
              <div className="relative w-51.25 rounded-2xl rounded-tr-md border border-memory-border bg-white px-5 py-4 text-left shadow-xl">
                <p className="font-serif text-[11px] text-memory-muted">
                  Maybe they remember...
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="font-serif text-[13px] italic text-memory-primary">
                    “I do.”
                  </span>

                  <Heart
                    size={14}
                    strokeWidth={1.4}
                    className="text-memory-primary"
                  />
                </div>

                {/* Tail */}
                <span className="absolute -right-2 top-5 h-4 w-4 rotate-45 border-t border-r border-memory-border bg-white" />
              </div>
            </div>

            {/* MEMORY PHOTO */}
            <motion.div
              whileHover={{
                rotate: -1,
                scale: 1.025,
              }}
              transition={{ duration: 0.35 }}
              className="
                absolute left-1/2 top-5 z-30
                h-62.5 w-48.75
                -translate-x-1/2
                cursor-pointer
                overflow-hidden
                rounded-sm
                border-[7px]
                border-white
                bg-white
                shadow-xl
              "
            >
              <div className="relative h-full w-full">
                <Image
                  src="/invite family.jpg"
                  alt="A cherished family memory"
                  fill
                  sizes="195px"
                  className="object-cover"
                />
              </div>
            </motion.div>

            {/* Interaction hint */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-300 group-hover:opacity-0">
              <p className="font-serif text-[11px] italic text-memory-muted">
                Hover over the memory
              </p>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-2"
          >
            {finishError && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {finishError}
              </p>
            )}

            <button
              type="button"
              disabled={finishing}
              onClick={async () => {
                if (await finishLoggedIn()) return;
                router.push("/");
              }}
              className="w-full cursor-pointer rounded-xl bg-memory-primary py-4 text-[15px] font-semibold text-white shadow-md shadow-memory-primary/10 transition hover:bg-memory-maroon disabled:opacity-60"
            >
              {finishing ? "Finishing setup…" : "Invite Family & Friends"}
            </button>

            <button
              type="button"
              disabled={finishing}
              onClick={async () => {
                if (await finishLoggedIn()) return;
                router.push("/signup");
              }}
              className="cursor-pointer py-2 font-serif text-sm text-memory-muted transition hover:text-memory-primary disabled:opacity-60"
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
