"use client";

import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useContributorsQuery } from "@/features/contributors/hooks";

export function ContributorsPage({ memoirId }: { memoirId: string }) {
  const { data: contributors = [], isLoading, isError, refetch } =
    useContributorsQuery(memoirId);

  if (isLoading) {
    return <p className="py-24 text-center text-amber-900/70">Loading contributors…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-destructive">Couldn&apos;t load contributors.</p>
        <Button onClick={() => void refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-amber-950">Contributor List</h1>
        <p className="mt-1 text-sm text-amber-900/70">
          People who can contribute stories to this memoir.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-amber-900/10 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] bg-[#F3E8DA] px-6 py-4 text-sm font-medium text-amber-950">
          <span>Contributor</span>
          <span>Role</span>
          <span>Status</span>
        </div>

        {contributors.length === 0 ? (
          <div className="border-t border-amber-900/10 px-6 py-8 text-sm text-amber-900/70">
            No contributors have been added yet.
          </div>
        ) : (
          contributors.map((contributor) => (
            <div
              key={contributor.id}
              className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center border-t border-amber-900/10 px-6 py-4 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2 text-amber-950">
                <Mail className="size-4 shrink-0 text-amber-900/60" />
                <span className="min-w-0 truncate">
                  {contributor.email || contributor.display_name}
                </span>
              </div>
              <span className="text-amber-900/80">{contributor.role}</span>
              <span>
                <span
                  className={
                    contributor.status === "Accepted"
                      ? "rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-amber-400 px-3 py-1 text-xs font-medium text-amber-950"
                  }
                >
                  {contributor.status}
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
