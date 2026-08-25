"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteCard({ memoirId }: { memoirId: string }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${memoirId}`
      : `https://your-app.com/invite/${memoirId}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <section className="rounded-3xl bg-[#F3E8DA] p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-900/10 text-amber-900">
          <UserPlus className="size-5" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-amber-950">Invite Contributors</h2>
          <p className="mt-1 text-sm text-amber-900/75">
            Share this link with family and friends so they can contribute stories and
            photos to this memoir.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          readOnly
          value={inviteUrl}
          className="h-11 rounded-full border-amber-900/20 bg-[#FBEEDD]"
        />
        <Button
          onClick={copyLink}
          className="rounded-xl bg-[#65402A] hover:bg-amber-950"
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </section>
  );
}