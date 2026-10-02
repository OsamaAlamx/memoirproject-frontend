import { apiRequest, fetchBlob } from "@/lib/api/client";
import { memoirIdSchema, requestExportResponseSchema, exportStatusResponseSchema } from "./schemas";

export async function requestMemoirExport(memoirId: string) {
  const id = memoirIdSchema.parse(memoirId);
  return apiRequest(`/api/memoirs/${encodeURIComponent(id)}/export`, { method: "POST" }, requestExportResponseSchema);
}

export async function getLatestExportStatus(memoirId: string) {
  const id = memoirIdSchema.parse(memoirId);
  return apiRequest(`/api/memoirs/${encodeURIComponent(id)}/export/latest`, { method: "GET" }, exportStatusResponseSchema);
}

/** Download a ready export as an object URL via the shared client (no direct fetch). */
export async function downloadExportBlob(downloadUrl: string): Promise<string> {
  const blob = await fetchBlob(downloadUrl);
  if (typeof window === "undefined") throw new Error("Export download requires a browser.");
  return window.URL.createObjectURL(blob);
}
