import React from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  memoirId?: string;
  ownerName?: string;
}

function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DashboardSidebar({ activeTab, setActiveTab, memoirId, ownerName }: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { id: "feed", label: "Story Feed" },
    { id: "chapters", label: "AI Organizer" },
    { id: "media", label: "Media Vault" },
    { id: "team", label: "Collaborators" },
    { id: "share", label: "Share" },
    { id: "moderate", label: "Review" },
  ];

  return (
    <aside className="w-64 bg-memory-card border-r border-memory-border hidden md:flex flex-col justify-between p-6 shadow-2xs">
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-lg bg-memory-primary text-memory-light flex items-center justify-center font-serif font-bold text-lg shadow-2xs">
            M
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-memory-primary tracking-tight">Memoir</h1>
            <span className="text-xs text-memory-accent font-medium uppercase tracking-wider">{ownerName ? `${ownerName} (owner)` : "Owner"}</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-memory-light text-memory-primary font-semibold border border-memory-border shadow-2xs"
                    : "text-memory-muted hover:bg-memory-light hover:text-memory-primary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* LIVE MEMOIR LINK */}
        {memoirId && (
          <div className="mt-6 pt-4 border-t border-memory-border">
            <button
              onClick={() => router.push("/final-memoir")}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-memory-primary text-memory-light hover:bg-memory-maroon transition-colors cursor-pointer shadow-sm flex items-center gap-2"
            >
              <span className="text-base">📖</span>
              View Live Memoir
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-memory-border pt-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-memory-border flex items-center justify-center font-semibold text-memory-primary text-sm">
          {ownerName ? ownerInitials(ownerName) : "O"}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-memory-primary truncate">{ownerName || "Owner"}</p>
          <p className="text-xs text-memory-muted truncate">Owner</p>
        </div>
      </div>
    </aside>
  );
}