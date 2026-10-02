import { apiRequest } from "@/lib/api/client";
import {
  shareLinkResponseSchema,
  shareActionResponseSchema,
  sharedMemoirResponseSchema,
  readerJoinResponseSchema,
  guestCommentListResponseSchema,
  guestCommentResponseSchema,
  reactionToggleResponseSchema,
  reactionSummaryResponseSchema,
} from "./schemas";

/** The only public reader route is /live/[token]; rewrite legacy /share URLs. */
export function toLiveUrl(url: string): string {
  return url.replace(/\/share\//, "/live/");
}

/** Creates the live view link, or returns the existing one (backend get-or-create). */
export async function ensureShareLink(memoirId: string) {
  const body = await apiRequest(
    `/api/memoirs/${memoirId}/share-link`,
    { method: "POST" },
    shareLinkResponseSchema,
  );
  const link = body.data;
  const url = typeof link.url === "string" ? toLiveUrl(link.url) : link.url;
  return { ...link, url };
}

export async function revokeShareLink(memoirId: string) {
  await apiRequest(`/api/memoirs/${memoirId}/share-link`, { method: "DELETE" }, shareActionResponseSchema);
}

export async function getSharedMemoir(token: string) {
  const body = await apiRequest(`/api/share/${token}`, { method: "GET" }, sharedMemoirResponseSchema);
  return body.data;
}

export async function joinSharedMemoir(token: string, displayName: string) {
  const body = await apiRequest(
    `/api/share/${token}/join`,
    { method: "POST", body: JSON.stringify({ display_name: displayName }) },
    readerJoinResponseSchema,
  );
  return body.data;
}

export async function getSharedComments(token: string, memoryId?: string) {
  const qs = memoryId ? `?memory_id=${encodeURIComponent(memoryId)}` : "";
  const body = await apiRequest(`/api/share/${token}/comments${qs}`, { method: "GET" }, guestCommentListResponseSchema);
  return body.data;
}

export async function postSharedComment(
  token: string,
  payload: { participant_id: string; memory_id?: string; parent_comment_id?: string; body: string },
) {
  const body = await apiRequest(
    `/api/share/${token}/comments`,
    { method: "POST", body: JSON.stringify(payload) },
    guestCommentResponseSchema,
  );
  return body.data;
}

export async function getReactionSummary(token: string, participantId?: string) {
  const qs = participantId ? `?participant_id=${encodeURIComponent(participantId)}` : "";
  const body = await apiRequest(
    `/api/share/${token}/reactions${qs}`,
    { method: "GET" },
    reactionSummaryResponseSchema,
  );
  return body.data;
}

export async function toggleSharedReaction(
  token: string,
  payload: { participant_id: string; memory_id?: string; media_asset_id?: string; comment_id?: string },
) {
  const body = await apiRequest(
    `/api/share/${token}/reactions`,
    { method: "POST", body: JSON.stringify(payload) },
    reactionToggleResponseSchema,
  );
  return body.data;
}

/** Reader PDF export (images + text only) for the single live link. */
export async function requestReaderExport(token: string, participantId: string) {
  const body = await apiRequest(
    `/api/share/${encodeURIComponent(token)}/export`,
    { method: "POST", body: JSON.stringify({ participant_id: participantId }) },
    shareActionResponseSchema,
  );
  return body as { success?: boolean; data?: { status?: string; download_url?: string | null } };
}

export async function getReaderExportStatus(token: string) {
  const body = await apiRequest(
    `/api/share/${encodeURIComponent(token)}/export/latest`,
    { method: "GET" },
    shareActionResponseSchema,
  );
  return body as unknown as { status: string; download_url?: string | null; error_message?: string | null };
}
