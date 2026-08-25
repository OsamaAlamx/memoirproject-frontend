import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Memory } from "@/features/memory/schemas";

export function NewestMemories({
  memoirId,
  memories,
}: {
  memoirId: string;
  memories: Memory[];
}) {
  return (
    <section className="rounded-3xl bg-[#F3E8DA] p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-xl text-amber-950">Newest memories</h2>

      <div className="space-y-3">
        {memories.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-amber-900/70">
            No memories yet. Add the first one from the Memories tab.
          </div>
        ) : (
          memories.map((memory) => (
            <article key={memory.id} className="rounded-2xl bg-white p-5">
              <h3 className="font-heading text-lg text-amber-950">
                {memory.title || "Untitled memory"}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-amber-900/75">
                {memory.body_text || "No description"}
              </p>
              <p className="mt-3 text-xs text-amber-900/60">Uploaded By You</p>
            </article>
          ))
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Link href={`/dashboard/${memoirId}/memories`}>
          <Button className="rounded-xl bg-[#65402A] hover:bg-amber-950">
            See All memories
          </Button>
        </Link>
      </div>
    </section>
  );
}