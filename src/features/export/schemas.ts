import { z } from "zod";

// Single ID rule shared by both export endpoints: parse before send so a bad
// id never reaches the backend (same pattern as the other features' api.ts).
export const memoirIdSchema = z.string().trim().min(1, "Memoir ID is required.");

// Export job shapes (schemas/export.py + api/export.py). The status endpoint
// answers flat (no data envelope); the request endpoint answers { success, data }.
export const exportJobSchema = z
  .object({
    export_id: z.string().optional(),
    memoir_id: z.string().optional(),
    status: z.string(),
    message: z.string().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export const requestExportResponseSchema = z
  .object({ success: z.boolean().optional(), data: exportJobSchema })
  .passthrough();

export const exportStatusResponseSchema = z
  .object({
    success: z.boolean().optional(),
    status: z.string(),
    error_message: z.string().nullable().optional(),
    download_url: z.string().nullable().optional(),
  })
  .passthrough();

export type ExportStatus = z.infer<typeof exportStatusResponseSchema>;
