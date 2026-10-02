"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import { MetricsGrid } from "./components/MetricsGrid";
import { MemoryFeed } from "./components/MemoryFeed";
import MemoryFeedList from "./MemoryFeedList";
import { BookCoverExperience } from "./BookCoverExperience";
import { ChapterOrganizer } from "./components/ChapterOrganizer";
import { SharePanel } from "@/features/share";
import { ModerationPanel } from "@/features/comments";
import { getUserActiveMemoir } from "@/features/memoir";
import { getMyProfile } from "@/features/auth";
import { isUnauthorizedError } from "@/lib/api/errors";

interface MemoirData {
  id?: string;
  subject_name?: string | null;
  subject_born_on?: string | null;
  subject_died_on?: string | null;
  subject_is_living?: boolean;
  status?: string | null;
}

interface MemoirLocalStorageData {
  data?: MemoirData;
  id?: string;
  subject_name?: string;
  subject_born_on?: string;
  subject_died_on?: string;
  subject_is_living?: boolean;
  status?: string;
}

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [memoirId, setMemoirId] = useState<string>("");
  const [subjectName, setSubjectName] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [dod, setDod] = useState<string>("");
  const [loadingMemoir, setLoadingMemoir] = useState<boolean>(true);
  const [ownerName, setOwnerName] = useState<string>("");
  const [memoirStatus, setMemoirStatus] = useState<string>("");
  const isPublished = memoirStatus === "published";

  // Owner name resolves after mount only: the server has no localStorage, so
  // rendering stored data on first paint would mismatch the SSR HTML.
  // Sessions that logged in before the profile was persisted fall through
  // to GET /api/auth/me and cache the result for next time.
  useEffect(() => {
    async function resolveOwnerName() {
      try {
        const raw = localStorage.getItem("auth_user");
        if (raw) {
          const parsed = JSON.parse(raw) as { full_name?: unknown };
          if (typeof parsed.full_name === "string" && parsed.full_name.trim()) {
            setOwnerName(parsed.full_name.trim());
            return;
          }
        }
      } catch {
        // Malformed snapshot: fall through to the profile fetch.
      }
      try {
        const profile = await getMyProfile();
        const name = profile?.full_name?.trim();
        if (name) {
          setOwnerName(name);
          localStorage.setItem(
            "auth_user",
            JSON.stringify({ full_name: name, email: profile?.email ?? undefined }),
          );
        }
      } catch {
        // Keep the generic "Owner" fallback; a 401 already bounces to login.
      }
    }
    resolveOwnerName();
  }, []);

  const router = useRouter();

  // Guard: if no token, redirect to login
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const [feedRefreshKey, setFeedRefreshKey] = useState<number>(0);
  const [memoryCount, setMemoryCount] = useState<number>(0);

  const applyMemoirData = useCallback((memoirObj: MemoirData) => {
    if (memoirObj.id) setMemoirId(memoirObj.id);
    if (memoirObj.subject_name) setSubjectName(memoirObj.subject_name);
    if (memoirObj.status) setMemoirStatus(memoirObj.status);
    if (memoirObj.subject_born_on) setDob(memoirObj.subject_born_on.substring(0, 4));

    if (memoirObj.subject_died_on) {
      setDod(memoirObj.subject_died_on.substring(0, 4));
    } else if (memoirObj.subject_is_living) {
      setDod("Present");
    } else {
      setDod("");
    }
  }, []);

  // Hydrate memoir from localStorage or fetch from backend API

  useEffect(() => {
    async function initMemoir() {
      setLoadingMemoir(true);
      let hasSavedSelection = false;
      try {
        const savedMemoir = localStorage.getItem("active_memoir");

        if (savedMemoir) {
          try {
            const parsed = JSON.parse(savedMemoir) as MemoirLocalStorageData;
            const memoirObj = parsed.data || parsed;

            if (memoirObj && memoirObj.id) {
              applyMemoirData(memoirObj);
              hasSavedSelection = true;
            }
          } catch {
            // Malformed snapshot: fall through to the backend fetch below.
          }
        }

        // Only fall back to the backend's "active" memoir when the user has
        // no explicit selection (e.g. fresh login). Otherwise the fetch
        // overwrites whatever was just clicked in /memoirs with the newest
        // memoir_participant row.
        const token = localStorage.getItem("access_token");
        if (token && !hasSavedSelection) {
          try {
            const activeMemoir = await getUserActiveMemoir();
            if (activeMemoir && activeMemoir.id) {
              localStorage.setItem("active_memoir", JSON.stringify(activeMemoir));
              applyMemoirData(activeMemoir);
            }
          } catch (err: unknown) {
            // Stale JWT: apiRequest already cleared storage; bounce to login.
            if (isUnauthorizedError(err)) {
              router.replace("/login?expired=1");
              return;
            }
          }
        }
      } catch (err: unknown) {
        console.warn("Could not load active memoir:", err);
      } finally {
        setLoadingMemoir(false);
      }
    }

    initMemoir();
  }, [applyMemoirData, router]);

  const handlePublished = useCallback(() => {
    setMemoirStatus("published");
    try {
      const raw = localStorage.getItem("active_memoir");
      if (raw) {
        const parsed = JSON.parse(raw);
        const obj = parsed.data || parsed;
        if (parsed.data) {
          parsed.data = { ...obj, status: "published" };
        } else {
          parsed.status = "published";
        }
        localStorage.setItem("active_memoir", JSON.stringify(parsed));
      }
    } catch {
      // Best-effort snapshot refresh; backend stays the source of truth.
    }
    setActiveTab("share");
  }, []);

  const metricsData = [
    { label: "Total Entries", value: memoryCount },
    { label: "Media Vault", value: "Active" },
    { label: "Collaborators", value: 1 },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("active_memoir");
    localStorage.removeItem("auth_user");
    router.push("/");
  };

  return (
    <BookCoverExperience
      title={subjectName ? `${subjectName}'s Memoir` : "Personal Life Memoir"}
      subtitle="A preserved record of personal stories, reflections, and voice notes."
    >
      <div className="flex min-h-screen overflow-hidden rounded-2xl border border-memory-border bg-memory-bg text-memory-primary shadow-lg">
        <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} memoirId={memoirId} ownerName={ownerName} />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <DashboardHeader
            subjectName={subjectName || "Loading Memoir..."}
            dob={dob}
            dod={dod}
            onLogout={handleLogout}
          />

          <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
            <div className="mb-7">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-memory-accent">
                Living Archive
              </p>

              <h1 className="font-serif text-2xl font-bold tracking-tight text-memory-maroon sm:text-3xl">
                {subjectName ? `Memoir for ${subjectName}` : "Preserve the moments that matter."}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-memory-muted">
                Capture stories, voices, photographs, and memories to build a lasting personal archive.
              </p>
            </div>

            <div className="mb-9">
              <MetricsGrid metrics={metricsData} />
            </div>

            {activeTab === "feed" && (
              <div className="space-y-10">
                <MemoryFeed
                  memories={[]}
                  memoirId={memoirId}
                  isPublished={isPublished}
                  onSuccess={() => setFeedRefreshKey((prev) => prev + 1)}
                />

                {loadingMemoir ? (
                  <div className="rounded-2xl border border-memory-maroon/20 bg-white p-6 py-12 text-center text-sm text-memory-muted">
                    Loading your memoir container...
                  </div>
                ) : memoirId ? (
                  <MemoryFeedList
                    key={feedRefreshKey}
                    memoirId={memoirId}
                    isPublished={isPublished}
                    onCountChange={setMemoryCount}
                  />
                ) : (
                  <div className="rounded-2xl border border-memory-maroon/20 bg-white p-6 py-12 text-center text-sm text-memory-muted">
                    No active memoir container found. Please complete onboarding or create a new memoir.
                  </div>
                )}
              </div>
            )}

            <div className={activeTab === "chapters" ? "" : "hidden"}>
              <ChapterOrganizer memoirId={memoirId} isPublished={isPublished} onPublished={handlePublished} />
            </div>

            {activeTab === "media" && (
              <div className="rounded-2xl border border-memory-border bg-white p-8">
                <h2 className="font-serif text-xl font-semibold text-memory-maroon">Media Vault</h2>
                <p className="mt-2 text-sm text-memory-muted">Your media collection will appear here.</p>
              </div>
            )}

            {activeTab === "team" && (
              <div className="rounded-2xl border border-memory-border bg-white p-8">
                <h2 className="font-serif text-xl font-semibold text-memory-maroon">Collaborators</h2>
                <p className="mt-2 text-sm text-memory-muted">
                  Your collaborators and team members will appear here.
                </p>
              </div>
            )}

            <div className={activeTab === "share" ? "" : "hidden"}>
              <SharePanel memoirId={memoirId} isPublishedExternal={isPublished} />
            </div>

            <div className={activeTab === "moderate" ? "" : "hidden"}>
              {activeTab === "moderate" && <ModerationPanel memoirId={memoirId} />}
            </div>
          </div>
        </main>
      </div>
    </BookCoverExperience>
  );
}