"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useMemoriesQuery } from "@/features/memory/hooks";
import { EmptyState } from "@/features/memory/components/EmptyState";
import { MemoryCard } from "@/features/memory/components/MemoryCard";
import { MemoryComposer } from "@/features/memory/components/MemoryComposer";

export function MemoriesGrid({ memoirId, currentUserId }: { memoirId: string; currentUserId: string }) {
  const { data, isLoading, isError } = useMemoriesQuery(memoirId);
  const [composing, setComposing] = useState(false);

  if (isLoading) return <p className="py-16 text-center text-muted-foreground">Loading memories…</p>;
  if (isError) return <p className="py-16 text-center text-destructive">Couldn&apos;t load memories. Please try again.</p>;

  const submittedMemories = (data?.memories ?? []).filter((m) => m.status === "submitted");

  if (submittedMemories.length === 0) {
    return (
      <>
        <EmptyState onAdd={() => setComposing(true)} />
        {composing && <MemoryComposer memoirId={memoirId} onClose={() => setComposing(false)} />}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setComposing(true)}>+ Add Memory</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {submittedMemories.map((memory) => (
          <MemoryCard key={memory.id} memory={memory} currentUserId={currentUserId} />
        ))}
      </div>

      {composing && <MemoryComposer memoirId={memoirId} onClose={() => setComposing(false)} />}
    </div>
  );
}