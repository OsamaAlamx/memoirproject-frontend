/**
 * @file hooks.ts
 * @description CLIENT data path for the memoir feature (live read).
 * Server components must use queries.ts via "@/features/memoir/server".
 */
"use client";

import { useState, useEffect } from "react";
import { getLiveMemoir } from "./api";

type LiveData = Awaited<ReturnType<typeof getLiveMemoir>>;

export function useLiveMemoir(memoirId: string | null) {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState<boolean>(!!memoirId);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!memoirId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getLiveMemoir(memoirId).then(
      (data) => {
        if (!cancelled) {
          setLiveData(data);
          setLoading(false);
        }
      },
      (err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  return { liveData, loading, error };
}
