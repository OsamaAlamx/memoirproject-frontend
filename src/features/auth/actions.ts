"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { syncBackendUser } from "./server";
import type { SignUpFormValues, SignInFormValues } from "./schemas";

export async function signUp(formData: SignUpFormValues) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is enabled, Supabase creates the user but does not
  // return a session. The pending onboarding data remains in sessionStorage and
  // will be consumed after the user confirms the email and signs in.
  if (!data.user || !data.session) {
    return {
      message:
        "Account created. Check your email to confirm your account, then sign in to continue.",
    };
  }

  try {
    await syncBackendUser(data.user, data.session.access_token);
  } catch (error) {
    console.error("Failed to initialize backend user account:", error);
    return {
      error:
        "Your account was created, but workspace setup is unavailable right now. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signIn(formData: SignInFormValues) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user || !data.session) {
    return { error: "Sign-in did not create an authenticated session." };
  }

  try {
    await syncBackendUser(data.user, data.session.access_token);
  } catch (error) {
    console.error("Failed to initialize backend user account:", error);
    return {
      error:
        "You are authenticated, but workspace setup is unavailable right now. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Unable to start Google sign-in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
