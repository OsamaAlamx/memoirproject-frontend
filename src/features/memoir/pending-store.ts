"use client";

import type { RelationshipGroup } from "./schemas";

export type PendingOnboarding = {
  relationship: RelationshipGroup;
  subject_name: string;
  birth_year: string;
  is_living: boolean;
  end_year: string;
};

const STORAGE_KEY = "memoir.pending-onboarding.v1";

export function savePendingOnboarding(data: PendingOnboarding): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage is optional. The in-memory form still remains usable.
  }
}

export function loadPendingOnboarding(): PendingOnboarding | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingOnboarding>;

    if (
      typeof parsed.relationship !== "string" ||
      typeof parsed.subject_name !== "string" ||
      typeof parsed.birth_year !== "string" ||
      typeof parsed.end_year !== "string" ||
      typeof parsed.is_living !== "boolean"
    ) {
      return null;
    }

    return parsed as PendingOnboarding;
  } catch {
    return null;
  }
}

export function clearPendingOnboarding(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
