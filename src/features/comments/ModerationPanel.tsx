"use client";

import { useEffect, useState } from "react";
import { listPendingComments, approveComment, rejectComment } from "@/features/comments";
import type { CommentEntity } from "@/features/comments";
import { isUnauthorizedError } from "@/lib/api/errors";

export default function ModerationPanel({ memoirId }: { memoirId: string }) {
  const [comments, setComments] = useState<CommentEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!memoirId) return;
      setLoading(true);
      setError(null);
      try {
        setComments(await listPendingComments(memoirId));
      } catch (err) {
        if (isUnauthorizedError(err)) setError("Session expired. Please log in again.");
        else setError(err instanceof Error ? err.message : "Could not load pending comments.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [memoirId]);

  const fail = (err: unknown, fallback: string) => {
    if (isUnauthorizedError(err)) setError("Session expired. Please log in again.");
    else setError(err instanceof Error ? err.message : fallback);
  };

  const handleApprove = async (commentId: string) => {
    setWorking(commentId);
    try {
      await approveComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      fail(err, "Could not approve comment.");
    } finally {
      setWorking(null);
    }
  };

  const handleReject = async (commentId: string) => {
    if (!window.confirm("Permanently delete this comment? Replies will also be removed.")) return;
    setWorking(commentId);
    try {
      await rejectComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      fail(err, "Could not delete comment.");
    } finally {
      setWorking(null);
    }
  };

  if (!memoirId) return null;

  return (
    <div className="rounded-2xl border border-memory-border bg-white p-8">
      <h2 className="font-serif text-xl font-semibold text-memory-maroon mb-2">Review comments</h2>
      <p className="text-sm text-memory-muted mb-6">
        Guest comments are hidden until you approve them. Approve to publish; Reject deletes the comment and its replies.
      </p>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

      {loading ? (
        <div className="py-8 text-center text-sm text-memory-muted">Loading pending comments...</div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-sm text-memory-muted">No comments awaiting review.</div>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="bg-memory-bg border border-memory-border/50 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-sans uppercase tracking-[0.1em] text-memory-accent font-semibold">
                      {c.memory_id ? "On memory" : c.media_asset_id ? "On photo" : "Guestbook"}
                    </span>
                    <span className="text-xs text-memory-muted">by {c.author_name || "Reader"}</span>
                    <span className="text-xs text-memory-muted">•</span>
                    <time className="text-xs text-memory-muted">
                      {c.created_at ? new Date(c.created_at).toLocaleString() : "Just now"}
                    </time>
                  </div>
                  <p className="font-serif text-[15px] text-memory-primary leading-relaxed whitespace-pre-line">
                    {c.body}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(c.id)}
                    disabled={working === c.id}
                    className="px-3 py-1.5 bg-memory-primary hover:bg-memory-maroon text-white text-xs font-medium rounded cursor-pointer disabled:opacity-50"
                  >
                    {working === c.id ? "Working..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(c.id)}
                    disabled={working === c.id}
                    className="px-3 py-1.5 border border-memory-border text-xs text-memory-muted hover:bg-red-50 hover:border-red-300 hover:text-red-600 rounded cursor-pointer disabled:opacity-50"
                  >
                    {working === c.id ? "Working..." : "Reject"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}