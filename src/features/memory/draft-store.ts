"use client";

/**
 * Browser-side draft storage using IndexedDB.
 * Protects against tab crashes. NOT against device switches —
 * that is what the server-side draft memory row is for.
 */

const DB_NAME = "memoir-drafts";
const DB_VERSION = 1;
const STORE = "drafts";

export type DraftEnvelope = {
  memoirId: string;
  memoryId: string;   // the server-side draft row id
  title: string;
  body: string;
  audioBlobs: { blob: Blob; durationMs: number; mimeType: string }[];
  imageBlobs: { blob: Blob; caption: string; mimeType: string }[];
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "memoryId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(draft: DraftEnvelope): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...draft, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDraft(
  memoryId: string,
): Promise<DraftEnvelope | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(memoryId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearDraft(memoryId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(memoryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}