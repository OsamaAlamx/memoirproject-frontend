import Link from "next/link";

import { getMemoir } from "@/features/memoir/server";
import { getMemories } from "@/features/memory/server";
import { InviteCard } from "@/features/dashboard/components/InviteCard";
import { ProfileCard } from "@/features/dashboard/components/ProfileCard";
import { NewestMemories } from "@/features/dashboard/components/NewestMemories";

export default async function MemoirHomePage({
  params,
}: {
  params: Promise<{ memoirId: string }>;
}) {
  const { memoirId } = await params;
  const memoir = await getMemoir(memoirId);
  const memoryList = await getMemories(memoirId).catch(() => ({
    memories: [],
    total: 0,
  }));

  const submitted = memoryList.memories
    .filter((m) => m.status === "submitted")
    .slice(0, 2);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <ProfileCard memoir={memoir} />
        <InviteCard memoirId={memoirId} />
      </div>

      <NewestMemories
        memoirId={memoirId}
        memories={submitted}
      />
    </div>
  );
}