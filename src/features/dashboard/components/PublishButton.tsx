"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublishMemoir } from "@/features/memoir/hooks";

export function PublishButton({ memoirId }: { memoirId: string }) {
  const publish = usePublishMemoir();
  const router = useRouter();

  const handlePublish = async () => {
    if (!window.confirm("Are you ready to publish this memoir? Once published, it becomes an immutable book and cannot be edited.")) return;
    
    try {
      await publish.mutateAsync(memoirId);
      router.push(`/read/${memoirId}`);
    } catch (err) {
      alert("Failed to publish memoir. Please try again.");
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={publish.isPending}
      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      <BookOpen className="mr-2 size-4" />
      {publish.isPending ? "Publishing..." : "Publish Memoir"}
    </Button>
  );
}