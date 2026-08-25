"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type RecordedClip = {
  blob: Blob;
  durationMs: number;
  mimeType: string;
  url: string;
};

export function VoiceRecorder({
  onSave,
}: {
  onSave: (clip: RecordedClip) => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [clip, setClip] = useState<RecordedClip | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMime();
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalDuration = Math.max(
          1000,
          Math.round(Date.now() - startTimeRef.current - totalPausedTimeRef.current)
        );
        setDurationMs(finalDuration);

        const rawMime = recorder.mimeType || mimeType;
        const cleanMime = rawMime.split(";")[0].trim() || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: cleanMime });

        const c: RecordedClip = {
          blob,
          durationMs: finalDuration,
          mimeType: cleanMime,
          url: URL.createObjectURL(blob),
        };
        setClip(c);
        setState("stopped");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start(200);
      recorderRef.current = recorder;

      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      pauseStartRef.current = 0;
      setDurationMs(0);
      setError(null);
      setState("recording");

      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
        setDurationMs(Math.max(0, elapsed));
      }, 100);
    } catch {
      setError("Microphone access is needed to record. Please check your browser permissions.");
    }
  }

  function pause() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
      pauseStartRef.current = Date.now();
      if (timerRef.current) window.clearInterval(timerRef.current);
      setState("paused");
    }
  }

  function resume() {
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume();
      if (pauseStartRef.current > 0) {
        totalPausedTimeRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
      setState("recording");
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
        setDurationMs(Math.max(0, elapsed));
      }, 100);
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      if (recorderRef.current.state === "paused" && pauseStartRef.current > 0) {
        totalPausedTimeRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      recorderRef.current.stop();
    }
  }

  function discard() {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    setDurationMs(0);
    chunksRef.current = [];
    setState("idle");
  }

  function save() {
    if (clip) {
      onSave(clip);
      setClip(null);
      setDurationMs(0);
      chunksRef.current = [];
      setState("idle");
    }
  }

  const seconds = Math.floor(durationMs / 1000);

  return (
    <div className="space-y-3 rounded-xl border border-amber-900/20 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
          <Mic
            className={`size-5 ${state === "recording" ? "animate-pulse text-red-600" : "text-red-400"}`}
          />
        </div>
        <div className="flex-1 text-sm font-medium text-amber-900">
          {state === "idle" && "Ready to record"}
          {state === "recording" && `Recording… ${formatTime(seconds)}`}
          {state === "paused" && `Paused at ${formatTime(seconds)}`}
          {state === "stopped" && `Recorded ${formatTime(seconds)}`}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {state === "idle" && (
          <Button type="button" onClick={start} variant="default" className="bg-[#65402A] hover:bg-amber-950">
            <Mic className="size-4" /> Start Recording
          </Button>
        )}
        {state === "recording" && (
          <>
            <Button type="button" onClick={pause} variant="outline">
              <Pause className="size-4" /> Pause
            </Button>
            <Button type="button" onClick={stop} className="bg-[#65402A] hover:bg-amber-950">
              <Square className="size-4" /> Stop
            </Button>
          </>
        )}
        {state === "paused" && (
          <>
            <Button type="button" onClick={resume} variant="default" className="bg-[#65402A] hover:bg-amber-950">
              <Play className="size-4" /> Resume
            </Button>
            <Button type="button" onClick={stop} className="bg-[#65402A] hover:bg-amber-950">
              <Square className="size-4" /> Stop
            </Button>
          </>
        )}
        {state === "stopped" && clip && (
          <div className="flex w-full flex-col gap-2">
            <audio controls src={clip.url} className="w-full" />
            <div className="flex gap-2">
              <Button type="button" onClick={save} className="bg-[#65402A] hover:bg-amber-950">
                Attach to memory
              </Button>
              <Button type="button" onClick={discard} variant="outline">
                <Trash2 className="size-4" /> Re-record
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function pickMime(): string {
  const candidates = [
    "audio/mp4",
    "audio/aac",
    "audio/wav",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return "audio/webm";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}