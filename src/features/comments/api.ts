import { apiRequest } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import {
  commentCreateSchema,
  commentsResponseSchema,
  commentResponseSchema,
  pendingCommentsResponseSchema,
  deleteCommentResponseSchema,
  type CommentEntity,
  type CommentCreatePayload,
} from "./schemas";

export async function getComments(memoryId: string): Promise<CommentEntity[]> {
  return apiRequest(
    `/api/comments/?memory_id=${memoryId}`,
    { method: "GET" },
    commentsResponseSchema,
  ).catch((err) => {
    if (isApiError(err) && err.status === 404) return [] as CommentEntity[];
    throw err;
  });
}

export async function createComment(payload: CommentCreatePayload): Promise<CommentEntity> {
  return apiRequest(
    "/api/comments/",
    { method: "POST", body: JSON.stringify(commentCreateSchema.parse(payload)) },
    commentResponseSchema,
  );
}

export async function listPendingComments(memoirId: string): Promise<CommentEntity[]> {
  return apiRequest(
    `/api/comments/pending?memoir_id=${encodeURIComponent(memoirId)}`,
    { method: "GET" },
    pendingCommentsResponseSchema,
  );
}

export async function approveComment(commentId: string): Promise<CommentEntity> {
  return apiRequest(
    `/api/comments/${commentId}/approve`,
    { method: "PATCH" },
    commentResponseSchema,
  );
}

export async function rejectComment(commentId: string): Promise<string> {
  const body = await apiRequest(
    `/api/comments/${commentId}`,
    { method: "DELETE" },
    deleteCommentResponseSchema,
  );
  return body.data.id;
}
