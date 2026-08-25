import "server-only";

import { env } from "@/lib/config/env";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getDisplayName(user: AuthUser): string {
  const metadata = user.user_metadata ?? {};

  return (
    firstString(
      metadata.full_name,
      metadata.name,
      metadata.display_name,
      user.email?.split("@")[0],
    ) ?? "Memoir User"
  );
}

export async function syncBackendUser(
  user: AuthUser,
  accessToken: string,
): Promise<void> {
  const email = user.email?.trim();

  if (!email) {
    throw new Error("The authenticated user does not have an email address.");
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      id: user.id,
      email,
      full_name: getDisplayName(user),
    }),
  });

  if (response.ok) return;

  let detail = `User setup failed with status ${response.status}.`;

  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string" && payload.detail.trim()) {
      detail = payload.detail;
    }
  } catch {
    // Keep the status-based message.
  }

  throw new Error(detail);
}
