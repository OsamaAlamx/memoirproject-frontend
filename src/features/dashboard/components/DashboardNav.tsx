"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/features/auth";

const tabs = [
  { label: "Memoir", href: "" },
  { label: "Memories", href: "/memories" },
  { label: "Contributor list", href: "/contributors" },
  { label: "Settings", href: "/settings" },
] as const;

export function DashboardNav({ memoirId }: { memoirId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${memoirId}`;

  return (
    <header className="border-b border-amber-900/10 bg-[#FDFBF7] px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
        <nav className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`;
            const active =
              tab.href === ""
                ? pathname === base || pathname === `${base}/`
                : pathname.startsWith(href);

            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#65402A] text-white"
                    : "text-amber-900/80 hover:bg-amber-900/5 hover:text-amber-950",
                )}
              >
                {tab.label === "Memoir" ? (
                  <span className="font-heading text-base">Memoir</span>
                ) : (
                  tab.label
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => signOut()}
          className={cn(
            buttonVariants({ size: "default" }),
            "rounded-xl bg-[#65402A] text-white hover:bg-amber-950",
          )}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}