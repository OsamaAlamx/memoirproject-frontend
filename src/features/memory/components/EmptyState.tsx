"use client";

import { Button } from "@/components/ui/button";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <p className="font-heading text-3xl text-amber-900/90">
        No memories uploaded yet
      </p>
      <Button
        size="lg"
        onClick={onAdd}
        className="rounded-xl bg-[#65402A] px-6 hover:bg-amber-950"
      >
        + Add Memories
      </Button>
    </div>
  );
}