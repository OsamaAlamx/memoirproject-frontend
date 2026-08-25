import { MemoriesPageClient } from "@/features/memory/components/MemoriesPageClient";

export default async function MemoriesPage({
  params,
}: {
  params: Promise<{ memoirId: string }>;
}) {
  const { memoirId } = await params;

  // Owner path this cycle: treat the signed-in owner as "You"
  return <MemoriesPageClient memoirId={memoirId} currentUserId="owner" />;
}