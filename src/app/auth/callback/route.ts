import { NextResponse } from "next/server";

import { syncBackendUser } from "@/features/auth/server";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(origin: string) {
  return NextResponse.redirect(new URL("/login", origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return loginRedirect(origin);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user || !data.session) {
    console.error("OAuth callback failed:", error);
    return loginRedirect(origin);
  }

  try {
    await syncBackendUser(data.user, data.session.access_token);
  } catch (syncError) {
    console.error("OAuth user synchronization failed:", syncError);
    return loginRedirect(origin);
  }

  return NextResponse.redirect(new URL("/onboarding", origin));
}
