/**
 * @file hooks.ts
 * @description Client data path for the export feature: memoir PDF export
 * requests, status polling, and blob-based custom filename downloads.
 */

"use client";

import { useState } from "react";
import { requestMemoirExport, getLatestExportStatus, downloadExportBlob } from "./api";

export function useExportMemoir(memoirId: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerExport = async (customFileName?: string) => {
    if (!memoirId) {
      setError("No active memoir found.");
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportMessage("Preparing your printable memoir PDF...");

    try {
      // 1. Trigger the export job via the feature's api.ts
      await requestMemoirExport(memoirId);
      setExportMessage("Formatting book layout in the background...");

      // 2. Poll for job completion
      let attempts = 0;
      const maxAttempts = 15;

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const data = (await getLatestExportStatus(memoirId)) as {
            status: string;
            download_url?: string;
            error_message?: string;
          };

          if (data.status === "ready" && data.download_url) {
            clearInterval(pollInterval);
            setIsExporting(false);
            setExportMessage("PDF downloaded successfully! Check your downloads folder.");

            // 3. Fetch as blob to bypass cross-origin restrictions and force local download
            const blobUrl = await downloadExportBlob(data.download_url);

            const link = document.createElement("a");
            link.href = blobUrl;

            // Set user-defined file name or fallback safely
            const fileName = customFileName?.trim() ? `${customFileName.trim()}.pdf` : "my-memoir-archive.pdf";
            link.download = fileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          } else if (data.status === "failed") {
            clearInterval(pollInterval);
            setIsExporting(false);
            setError(`Export failed: ${data.error_message || "Unknown error"}`);
            setExportMessage(null);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setIsExporting(false);
            setError("Export timed out. Please try again.");
            setExportMessage(null);
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during export.";
      setError(errorMessage);
      setExportMessage(null);
      setIsExporting(false);
    }
  };

  return {
    triggerExport,
    isExporting,
    exportMessage,
    error,
  };
}
