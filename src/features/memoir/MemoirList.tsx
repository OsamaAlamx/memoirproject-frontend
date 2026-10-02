"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listMemoirs, deleteMemoir } from "@/features/memoir/api";
import type { MemoirRecord } from "@/features/memoir/schemas";
import { isUnauthorizedError } from "@/lib/api/errors";

function formatDates(memoir: MemoirRecord): string {
  if (memoir.subject_is_living) {
    const born = memoir.subject_born_on ? memoir.subject_born_on.substring(0, 4) : "";
    return born ? `${born} – Present` : "Living";
  }
  const born = memoir.subject_born_on ? memoir.subject_born_on.substring(0, 4) : "";
  const died = memoir.subject_died_on ? memoir.subject_died_on.substring(0, 4) : "";
  if (born || died) return `${born || "?"} – ${died || "?"}`;
  return "Dates unknown";
}

export default function MemoirList() {
  const router = useRouter();
  const [memoirs, setMemoirs] = useState<MemoirRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    listMemoirs().then(
      (data) => {
        if (!cancelled) {
          setMemoirs(data);
          setLoading(false);
        }
      },
      (err) => {
        if (cancelled) return;
        // Stale JWT: apiRequest already cleared storage; bounce to login.
        if (isUnauthorizedError(err)) {
          router.replace("/login?expired=1");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load memoirs.");
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [router]);

  const openMemoir = (memoir: MemoirRecord) => {
    localStorage.setItem("active_memoir", JSON.stringify(memoir));
    router.push("/dashboard");
  };

  const handleDelete = async (memoir: MemoirRecord) => {
    const ok = window.confirm(
      `Delete "${memoir.subject_name || "this memoir"}"? All of its memories, media, chapters and comments will be permanently removed. This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(memoir.id);
    try {
      await deleteMemoir(memoir.id);
      setMemoirs((prev) => prev.filter((m) => m.id !== memoir.id));
      // If the deleted memoir was active, drop the stale pointer.
      try {
        const saved = localStorage.getItem("active_memoir");
        if (saved) {
          const parsed = JSON.parse(saved) as { data?: { id?: string }; id?: string };
          const activeId = parsed.data?.id ?? parsed.id;
          if (activeId === memoir.id) localStorage.removeItem("active_memoir");
        }
      } catch {
        localStorage.removeItem("active_memoir");
      }
    } catch (err) {
      if (isUnauthorizedError(err)) {
        router.replace("/login?expired=1");
        return;
      }
      alert(err instanceof Error ? err.message : "Failed to delete memoir.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-memory-muted text-sm">Loading your memoirs…</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl text-sm text-center border border-red-100">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-1.5 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 font-semibold cursor-pointer transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-memory-muted">
          {memoirs.length === 0
            ? "No memoirs yet"
            : `${memoirs.length} memoir${memoirs.length === 1 ? "" : "s"}`}
        </p>
        <Link
          href="/memory-subject-selection"
          className="px-4 py-2 text-sm bg-memory-primary text-white rounded-lg font-medium hover:bg-memory-maroon transition shadow-sm"
        >
          + New memoir
        </Link>
      </div>

      {memoirs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-memory-border p-8">
          <p className="font-serif text-memory-primary text-lg mb-2">No memoirs yet</p>
          <p className="text-sm text-memory-muted">
            Create your first memoir to start collecting stories, voice notes and photos.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {memoirs.map((memoir) => (
            <li
              key={memoir.id}
              className="bg-white border border-memory-border rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:border-memory-accent transition-colors"
            >
              <button
                type="button"
                onClick={() => openMemoir(memoir)}
                className="flex-1 text-left cursor-pointer min-w-0"
                title="Open dashboard"
              >
                <p className="font-serif font-bold text-lg text-memory-primary truncate">
                  {memoir.subject_name || "Untitled memoir"}
                </p>
                <p className="text-xs text-memory-muted font-mono mt-1">{formatDates(memoir)}</p>
                {memoir.status && (
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-widest bg-memory-light border border-memory-border text-memory-muted px-2 py-0.5 rounded-full">
                    {memoir.status}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(memoir)}
                disabled={deletingId === memoir.id}
                className="shrink-0 text-xs text-memory-muted hover:text-red-600 border border-memory-border hover:border-red-300 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50 font-medium uppercase tracking-wide"
              >
                {deletingId === memoir.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
