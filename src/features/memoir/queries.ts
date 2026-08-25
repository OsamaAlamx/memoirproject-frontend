import "server-only";

import { apiRequestServer } from "@/lib/api/server";
import { memoirSchema, type Memoir } from "./schemas";

export async function getMemoir(id: string): Promise<Memoir> {
  return apiRequestServer({
    path: `/memoirs/${id}`,
    schema: memoirSchema,
    cache: "no-store",
  });
}