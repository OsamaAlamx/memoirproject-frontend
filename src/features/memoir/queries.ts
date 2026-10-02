/**
 * @file queries.ts
 * @description SERVER data path for the memoir feature.
 * Re-exports the read endpoints from api.ts so server components fetch
 * through @/features/memoir/server without touching client hooks.
 */
import "server-only";

export { getLiveMemoir, getUserActiveMemoir, listMemoirs } from "./api";
