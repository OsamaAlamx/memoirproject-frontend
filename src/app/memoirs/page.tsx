import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getMemoirs } from "@/features/memoir/server";
import { signOut } from "@/features/auth";
import { cn } from "@/lib/utils";

export default async function MemoirsPage() {
  const memoirs = await getMemoirs().catch(() => []);

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <header className="flex items-center justify-between border-b border-amber-900/10 px-8 py-6">
        <h1 className="font-heading text-2xl font-bold text-amber-950">Memoir</h1>
        <form action={signOut}>
          <Button type="submit" className="rounded-xl bg-[#65402A] hover:bg-amber-950">
            Sign Out
          </Button>
        </form>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-4xl text-amber-950">Your memoirs</h2>
            <p className="mt-1 text-sm text-amber-900/70">
              Open a memoir to continue preserving its story.
            </p>
          </div>

          <Link href="/onboarding?new=1">
            <Button className="rounded-xl bg-[#65402A] hover:bg-amber-950">
              <Plus className="mr-2 size-4" /> Create new memoir
            </Button>
          </Link>
        </div>

        {memoirs.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-6 rounded-3xl bg-[#F3E8DA] p-16 text-center">
            <BookOpen className="size-10 text-amber-900/60" />
            <p className="font-heading text-2xl text-amber-950">
              You haven&apos;t created a memoir yet
            </p>
            <Link href="/onboarding?new=1">
              <Button size="lg" className="rounded-full bg-[#65402A] px-8 hover:bg-amber-950">
                Create your first memoir
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {memoirs.map((memoir) => {
              const isPublished = memoir.status === "published";
              const targetUrl = isPublished ? `/read/${memoir.id}` : `/dashboard/${memoir.id}`;

              return (
                <div
                  key={memoir.id}
                  className="group flex flex-col justify-between rounded-3xl bg-[#F3E8DA] p-6 shadow-sm transition-transform hover:scale-[1.02]"
                >
                  <Link href={targetUrl} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-xl text-amber-950">
                        {memoir.subject_name}
                      </h3>
                      <div className="flex flex-col items-end gap-1">
                        <span className="shrink-0 rounded-full bg-[#65402A] px-3 py-1 text-xs font-medium text-white">
                          {memoir.subject_is_living ? "Ongoing" : "In Loving memory"}
                        </span>
                        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white", isPublished ? "bg-emerald-600" : "bg-amber-600")}>
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-amber-900/75">
                      {memoir.description?.trim() ||
                        "Start adding memories to tell their story."}
                    </p>
                  </Link>

                  <div className="mt-5 flex items-center justify-between border-t border-amber-900/10 pt-4">
                    <p className="text-xs text-amber-900/60">
                      Created {new Date(memoir.created_at).toLocaleDateString()}
                    </p>
                    
                    {isPublished && (
                      <Link href={targetUrl}>
                        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                            See Memoir
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}