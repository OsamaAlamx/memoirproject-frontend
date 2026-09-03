import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Edit3, Image as ImageIcon, Sparkles, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged in -> memoir list. Logged out -> onboarding wizard.
  const ctaHref = user ? "/memoirs" : "/onboarding";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="px-8 py-6">
        <h1 className="font-heading text-2xl font-bold text-amber-950">Memoir</h1>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="flex flex-col items-center justify-between gap-12 lg:flex-row">
          <div className="max-w-xl space-y-6">
            <h2 className="font-heading text-5xl leading-tight text-amber-950 md:text-6xl">
              Everyone Deserves to be remembered
            </h2>
            <p className="text-sm font-semibold uppercase leading-relaxed tracking-widest text-amber-900/80">
              BRING TOGETHER THE STORIES, PHOTOGRAPHS, VOICES, AND MOMENTS. WE TURN THEM INTO A MEMORY WORTH KEEPING FOR GENERATIONS.
            </p>
            <Link href={ctaHref} className="inline-block">
              <Button
                size="lg"
                className="h-14 rounded-full bg-[#65402A] px-8 text-lg hover:bg-amber-950"
              >
                Let&apos;s start preserving
              </Button>
            </Link>
          </div>

          <div className="relative aspect-video w-full max-w-lg overflow-hidden rounded-2xl bg-amber-100 shadow-xl">
            <Image
              src="/Couple.png"
              alt="Family memory"
              fill
              sizes="(max-width: 1024px) 100vw, 512px"
              className="object-cover"
            />
          </div>
        </section>

        <section className="mt-32 text-center">
          <h3 className="font-heading text-4xl text-amber-950">
            How we preserve memories
          </h3>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProcessCard icon={Edit3} title="CREATE YOUR WORKSPACE" />
            <ProcessCard
              icon={ImageIcon}
              title="INVITE MEMBERS TO CONTRIBUTE MEMORIES"
            />
            <ProcessCard icon={Sparkles} title="AI AGENTS ORGANIZES MEMORIES" />
            <ProcessCard icon={BookOpen} title="GET YOUR MEMOIR" />
          </div>
        </section>
      </main>
    </div>
  );
}

function ProcessCard({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-[#F3E8DA] p-8 text-center shadow-sm transition-transform hover:scale-105">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-900/10">
        <Icon className="size-8 text-amber-950" />
      </div>
      <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-amber-950">
        {title}
      </h4>
    </div>
  );
}
