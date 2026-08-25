import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Memoir } from "@/features/memoir/schemas";

export function ProfileCard({ memoir }: { memoir: Memoir }) {
  const badge = memoir.subject_is_living ? "Ongoing" : "In Loving memory";

  return (
    <section className="rounded-3xl bg-[#F3E8DA] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 ring-4 ring-white">
            <div className="h-full w-full bg-gradient-to-b from-sky-200 to-green-300" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl text-amber-950">
                {memoir.subject_name}
              </h1>
              <span className="rounded-full bg-[#65402A] px-3 py-1 text-xs font-medium text-white">
                {badge}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-amber-900/80">
              {memoir.description?.trim() ||
                "Start adding memories to tell their story."}
            </p>
          </div>
        </div>

        <Link href={`/dashboard/${memoir.id}/settings`}>
          <Button className="rounded-xl bg-[#65402A] hover:bg-amber-950">
            Edit profile
          </Button>
        </Link>
      </div>
    </section>
  );
}
