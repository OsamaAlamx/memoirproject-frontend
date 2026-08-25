"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useMemoriesQuery } from "@/features/memory/hooks";
import { EmptyState } from "@/features/memory/components/EmptyState";
import { MemoryCard } from "@/features/memory/components/MemoryCard";
import { MemoryComposer } from "@/features/memory/components/MemoryComposer";

export function MemoriesPageClient({
  memoirId,
  currentUserId,
}: {
  memoirId: string;
  currentUserId: string;
}) {
  const { data, isLoading, isError, refetch } = useMemoriesQuery(memoirId);
  const [composing, setComposing] = useState(false);

  if (isLoading) {
    return (
      <p className="py-24 text-center text-amber-900/70">Loading memories…</p>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-destructive">Couldn&apos;t load memories.</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  const submitted = (data?.memories ?? []).filter((m) => m.status === "submitted");

  return (
    <div className="space-y-8">
      {submitted.length === 0 ? (
        <EmptyState onAdd={() => setComposing(true)} />
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              onClick={() => setComposing(true)}
              className="rounded-xl bg-[#65402A] hover:bg-amber-950"
            >
              + Add Memory
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {submitted.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </>
      )}

      {composing && (
        <MemoryComposer
          memoirId={memoirId}
          onClose={() => {
            setComposing(false);
            void refetch();
          }}
        />
      )}
    </div>
  );
}