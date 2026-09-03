import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMemoir } from "@/features/memoir/server";
import { ScrollBook } from "@/features/memoir/components/ScrollBook";

export default async function ReadMemoirPage({ params }: { params: Promise<{ memoirId: string }> }) {
  const { memoirId } = await params;
  const memoir = await getMemoir(memoirId);

  return (
    <main className="min-h-screen bg-[#1F1611]">
      <div className="fixed left-6 top-6 z-50">
        <Link href="/memoirs" className="flex items-center gap-2 rounded-full bg-black/20 p-2 text-amber-50/70 backdrop-blur-sm transition-colors hover:bg-black/40 hover:text-amber-50">
          <ChevronLeft className="size-5" />
          <span className="pr-2 text-sm font-medium">Back to Memoirs</span>
        </Link>
      </div>
      
      <ScrollBook memoir={memoir} />
    </main>
  );
}