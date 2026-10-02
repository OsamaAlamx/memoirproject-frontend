"use client";

import { useEffect, useRef, useState } from "react";
import { setMemoirPublication, setMemoirSettings, getUserActiveMemoir } from "@/features/memoir";
import { ensureShareLink, revokeShareLink } from "./api";
import type { ShareLink } from "./schemas";
import { isUnauthorizedError } from "@/lib/api/errors";

export default function SharePanel({
  memoirId,
  isPublishedExternal,
}: {
  memoirId: string;
  isPublishedExternal?: boolean;
}) {
  const [published, setPublished] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Hydrate fresh status after mount (server has no localStorage, and the
  // snapshot can predate publishing). Published memoirs resolve their link
  // idempotently (backend get-or-create). State survives tab switches because
  // the dashboard keeps this panel mounted (hidden, not unmounted).
  const fail = (err: unknown, fallback: string) => {
    if (isUnauthorizedError(err)) {
      setError("Session expired. Please log in again.");
    } else {
      setError(err instanceof Error ? err.message : fallback);
    }
  };

  // StrictMode remounts effects in dev and tab switches can retrigger init:
  // dedupe by memoir so a second mount reuses the in-flight init instead of
  // firing a duplicate active + share-link round trip (each 1.5-4s on Render).
  const initRef = useRef<{ memoirId: string; promise: Promise<void> } | null>(null);

  useEffect(() => {
    async function run() {
      if (!memoirId) return;
      setLoading(true);
      try {
        const active = await getUserActiveMemoir();
        // Only trust the active snapshot for this memoir; another memoir's
        // status must never flip this panel back to "Go live".
        if (active && active.id && active.id !== memoirId) return;
        const isLive = active?.status === "published";
        setPublished(isLive);
        setCommentsOpen(active?.comment_policy === "anyone_who_can_view");
        if (!isLive) return;
        try {
          setLink(await ensureShareLink(memoirId));
        } catch (err) {
          fail(err, "Memoir is live but the share link could not be loaded. Use Show share link to retry.");
        }
      } catch {
        // Panel actions surface errors with context; stay quiet here.
      } finally {
        setLoading(false);
      }
    }
    if (initRef.current?.memoirId === memoirId) {
      initRef.current.promise.then(
        () => setLoading(false),
        () => setLoading(false),
      );
      return;
    }
    const promise = run();
    initRef.current = { memoirId, promise };
  }, [memoirId]);

  // Sync when publishing happens outside this panel (AI Organizer's
  // Publish Memoir). The backend link is get-or-create, so resolving here
  // returns the same single link — never a second one.
  useEffect(() => {
    if (!isPublishedExternal || !memoirId || published || link) return;
    let cancelled = false;
    async function sync() {
      setLoading(true);
      try {
        setPublished(true);
        const resolved = await ensureShareLink(memoirId);
        if (!cancelled) setLink(resolved);
      } catch (err) {
        if (!cancelled) {
          fail(err, "Memoir is live but the share link could not be loaded. Use Show share link to retry.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    sync();
    return () => {
      cancelled = true;
    };
  }, [isPublishedExternal, memoirId, published, link]);

  const handleGoLive = async () => {
    if (!memoirId) return;
    setLoading(true);
    setError(null);
    try {
      await setMemoirPublication(memoirId, true);
      setPublished(true);
      setLink(await ensureShareLink(memoirId));
    } catch (err) {
      fail(err, "Could not publish this memoir.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!memoirId) return;
    setLoading(true);
    setError(null);
    try {
      await setMemoirPublication(memoirId, false);
      setPublished(false);
    } catch (err) {
      fail(err, "Could not unpublish this memoir.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowLink = async () => {    if (!memoirId) return;
    setLoading(true);
    setError(null);
    try {
      setLink(await ensureShareLink(memoirId));
    } catch (err) {
      fail(err, "Could not load the share link.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!memoirId) return;
    if (!window.confirm("Revoke this link? Anyone holding it loses access immediately.")) return;
    setLoading(true);
    setError(null);
    try {
      await revokeShareLink(memoirId);
      setLink(null);
    } catch (err) {
      fail(err, "Could not revoke the link.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!link?.url) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed — long-press the link to copy it manually.");
    }
  };

  const handleToggleComments = async () => {
    if (!memoirId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const next = !commentsOpen;
      const updated = await setMemoirSettings(memoirId, {
        comment_policy: next ? "anyone_who_can_view" : "invited_only",
      });
      setCommentsOpen(updated.comment_policy === "anyone_who_can_view");
    } catch (err) {
      fail(err, "Could not update comment settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!memoirId) {
    return (
      <div className="rounded-2xl border border-memory-border bg-white p-8 text-sm text-memory-muted">
        Complete onboarding or select a memoir to manage sharing.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-memory-border bg-white p-8">
      <h2 className="font-serif text-xl font-semibold text-memory-maroon">Share this memoir</h2>
      <p className="mt-2 text-sm text-memory-muted">
        {published
          ? "Live — one link for all readers. Anyone with it can open the reader view, comment, reply, react, and export the PDF."
          : "Private draft — nothing is visible until you go live."}
      </p>

      {error && <div className="mb-4 mt-4 p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

      {!published ? (
        <button
          type="button"
          onClick={handleGoLive}
          disabled={loading}
          className="mt-6 px-6 py-2.5 bg-memory-primary hover:bg-memory-maroon text-memory-light text-sm font-medium rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
        >
          {loading ? "Going live..." : "Go live"}
        </button>
      ) : link ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={link.url}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-memory-bg border border-memory-border rounded-lg px-3 py-2 text-sm text-memory-primary outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-memory-primary hover:bg-memory-maroon text-memory-light text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <p className="text-xs text-memory-muted">
            Opened {link.open_count ?? 0} time{(link.open_count ?? 0) === 1 ? "" : "s"}
            {link.expires_at ? ` · Expires ${new Date(link.expires_at).toLocaleDateString()}` : " · Never expires"}
          </p>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={commentsOpen}
              disabled={loading}
              onChange={handleToggleComments}
              className="mt-1 w-4 h-4 accent-memory-primary cursor-pointer"
            />
            <span>
              <span className="block text-sm font-medium text-memory-primary">Let readers comment</span>
              <span className="block text-xs text-memory-muted">
                {commentsOpen
                  ? "Readers can comment; each comment appears after your approval."
                  : "Comment boxes are hidden from readers."}
              </span>
            </span>
          </label>
          <div className="flex flex-wrap gap-3 pt-2 border-t border-memory-border">
            <button
              type="button"
              onClick={handleRevoke}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-memory-border text-xs text-memory-muted hover:bg-memory-light cursor-pointer disabled:opacity-50"
            >
              Revoke link
            </button>
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-memory-border text-xs text-memory-muted hover:bg-memory-light cursor-pointer disabled:opacity-50"
            >
              {loading ? "Working..." : "Unpublish"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleShowLink}
          disabled={loading}
          className="mt-6 px-6 py-2.5 bg-memory-primary hover:bg-memory-maroon text-memory-light text-sm font-medium rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Show share link"}
        </button>
      )}
    </div>
  );
}
