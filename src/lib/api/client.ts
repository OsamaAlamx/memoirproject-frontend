const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") || localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  return res;
}

interface ApiErrorDetail {
  loc?: (string | number)[];
  msg?: string;
}

interface ApiErrorResponse {
  detail?: string | ApiErrorDetail[];
  message?: string;
}

function parseErrorDetail(errData: ApiErrorResponse | null | undefined, defaultMessage: string): string {
  if (!errData) return defaultMessage;
  if (typeof errData.detail === "string") return errData.detail;

  if (Array.isArray(errData.detail)) {
    return errData.detail
      .map((err: ApiErrorDetail) => {
        const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : "Field";
        return `${field}: ${err.msg || "Invalid value"}`;
      })
      .join(" | ");
  }

  if (errData.message) return errData.message;
  return defaultMessage;
}

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface MemoirCreatePayload {
  subject_name: string;
  subject_born_on?: string;
  subject_died_on?: string;
  subject_is_living: boolean;
  description?: string;
  visibility?: string;
  comment_policy?: string;
  relationship?: string;
}

export interface MemoryCreatePayload {
  memoir_id: string;
  title: string;
  body_text?: string | null;
  status?: string;
  occurred_start?: string | null;
  occurred_end?: string | null;
  occurred_precision?: string | null;
  date_source?: string | null;
  media_asset_ids?: string[];
}

export interface MemoryUpdatePayload {
  title?: string;
  body_text?: string;
  occurred_start?: string | null;
  media_asset_ids_to_add?: string[];
  media_asset_ids_to_remove?: string[];
}

export interface PresignedUrlPayload {
  memoir_id: string;
  filename: string;
  file_type: string;
  kind: string;
}

export interface MediaMetadataPayload {
  memoir_id: string;
  storage_key: string;
  kind: string;
  mime_type: string;
  byte_size: number;
  original_filename: string;
  caption?: string;
  width_px?: number;
  height_px?: number;
  duration_ms?: number | null;
}

export interface CommentEntity {
  id: string;
  memoir_id: string;
  memory_id: string | null;
  media_asset_id: string | null;
  parent_comment_id: string | null;
  author_participant_id: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
  hidden_by_participant_id: string | null;
  deleted_at: string | null;
  author_name?: string;
}

export interface CommentCreatePayload {
  memoir_id: string;
  memory_id?: string | null;
  media_asset_id?: string | null;
  author_participant_id?: string | null;
  parent_comment_id?: string | null;
  body: string;
}

export interface ChapterProposalPayload {
  chapters: {
    title: string;
    summary?: string;
    memories: { id: string; title: string; date: string | null }[];
  }[];
}

export const api = {
  async signup(payload: SignupPayload) {
    const res = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Signup failed"));
    }
    return res.json();
  },

  async login(payload: { email: string; password: string }) {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Login failed"));
    }
    return res.json();
  },

  async createMemoir(payload: MemoirCreatePayload) {
    const res = await apiFetch("/api/memoirs/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to create memoir"));
    }
    return res.json();
  },

  async getLiveMemoir(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/live`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch live memoir data");
    const json = await res.json();
    return json.data || json;
  },

  async getMemoirFeed(memoirId: string) {
    const res = await apiFetch(`/api/memories/feed/${memoirId}`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch memoir feed");
    const json = await res.json();
    return json.data || json;
  },

  async createMemory(payload: MemoryCreatePayload) {
    const res = await apiFetch("/api/memories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to create memory"));
    }
    return res.json();
  },

  async updateMemory(memoryId: string, payload: MemoryUpdatePayload) {
    const res = await apiFetch(`/api/memories/${memoryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to update memory"));
    }
    const json = await res.json();
    return json.data || json;
  },

  async deleteMemory(memoryId: string) {
    const res = await apiFetch(`/api/memories/${memoryId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete memory");
    return res.json();
  },

  async getPresignedUrl(payload: PresignedUrlPayload) {
    const res = await apiFetch("/api/media/presigned-url", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to get presigned URL"));
    }

    const responseJson = await res.json();
    return responseJson.data || responseJson;
  },

  async registerMediaMetadata(payload: MediaMetadataPayload) {
    const res = await apiFetch("/api/media/metadata", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to register media metadata"));
    }

    const responseJson = await res.json();
    return responseJson.data || responseJson;
  },

  async getComments(memoryId: string): Promise<CommentEntity[]> {
    const res = await apiFetch(`/api/comments/?memory_id=${memoryId}`, {
      method: "GET",
    });

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to fetch comments"));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.comments || [];
  },

  async createComment(payload: CommentCreatePayload): Promise<CommentEntity> {
    const res = await apiFetch("/api/comments/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to post comment"));
    }

    const data = await res.json();
    return data.comment || data;
  },

  async requestMemoirExport(memoirId: string) {
    if (!memoirId) {
      throw new Error("No active memoir ID found.");
    }

    const res = await apiFetch(`/api/memoirs/${memoirId}/export`, {
      method: 'POST',
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Backend export error response:", errorBody);
      throw new Error(`Failed to initiate PDF export: ${res.status} ${res.statusText}`);
    }

    return res.json();
  },

  async getLatestExportStatus(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/export/latest`, {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error("Failed to check export status.");
    }

    return res.json();
  },

  async searchMemories(memoirId: string, query: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to search archive");
    const json = await res.json();
    return json.data || json;
  },

   async proposeChapters(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chapters/propose`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to generate AI chapter proposal");
    const json = await res.json();
    return json.data;
  },

  async refineChapters(memoirId: string, currentProposal: ChapterProposalPayload, prompt: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chapters/refine`, {
      method: "POST",
      body: JSON.stringify({ current_proposal: currentProposal, user_prompt: prompt }),
    });
    if (!res.ok) throw new Error("Failed to refine AI chapter proposal");
    const json = await res.json();
    return json.data;
  },

  async applyChapters(memoirId: string, payload: ChapterProposalPayload) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chapters/apply`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to apply chapter layout");
    return res.json();
  },

  async getUserActiveMemoir() {
    const res = await apiFetch("/api/memoirs/user/active", {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch active memoir for user");
    const json = await res.json();
    return json.data || json;
  },
};