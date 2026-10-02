/**
 * @file queries.ts
 * @description SERVER data path for the comments feature (reads only;
 * mutations stay on the client path via hooks.ts).
 */
import "server-only";

export { getComments } from "./api";
