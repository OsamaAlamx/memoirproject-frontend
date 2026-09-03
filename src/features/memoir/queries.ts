import "server-only";

import { apiRequestServer } from "@/lib/api/server";
import { memoirSchema, memoirListSchema, type Memoir } from "./schemas";

export async function getMemoir(id: string): Promise<Memoir> {
  return apiRequestServer({
    path: `/memoirs/${id}`,
    schema: memoirSchema,
    cache: "no-store",
  });
}

export async function getMemoirs(): Promise<Memoir[]> {
  return apiRequestServer({
    path: "/memoirs",
    schema: memoirListSchema,
    cache: "no-store",
  });
}