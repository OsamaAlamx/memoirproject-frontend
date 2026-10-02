// src/features/auth/hooks.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "./api";
import { createMemoir } from "@/features/memoir";
import type { AuthResponse } from "./schemas";

type AuthUserShape = { full_name?: string | null; email?: string | null } | null;

type AuthResult = AuthResponse & {
  active_memoir?: unknown;
  full_name?: string | null;
  email?: string | null;
  user?: AuthUserShape;
  data?: {
    access_token?: string | null;
    token?: string | null;
    active_memoir?: unknown;
    full_name?: string | null;
    email?: string | null;
    user?: AuthUserShape;
  } | null;
};
import { LoginInput, SignupFormValues } from "./schemas";

/** Persists the logged-in owner's profile so the dashboard can greet by name. */
function persistAuthUser(
  res: AuthResult,
  fallback?: { full_name?: string; email?: string },
): void {
  // Backend sends the profile flat inside `data` (login/signup); older
  // responses may nest it under `user`. Either shape is accepted.
  const flatName = res?.data?.full_name ?? res?.full_name;
  const flatEmail = res?.data?.email ?? res?.email;
  const user = res?.user ||
    res?.data?.user ||
    (flatName || flatEmail ? { full_name: flatName, email: flatEmail } : null) ||
    fallback ||
    null;
  if (!user) return;
  try {
    localStorage.setItem("auth_user", JSON.stringify(user));
  } catch {
    // Storage failures must not block auth; dashboard falls back to a generic label.
  }
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const processPendingMemoir = async (): Promise<boolean> => {
    const pendingMemoirData = localStorage.getItem("pending_memoir");
    if (pendingMemoirData) {
      try {
        const memoirPayload = JSON.parse(pendingMemoirData);
        const createdMemoir = await createMemoir(memoirPayload);
        localStorage.setItem("active_memoir", JSON.stringify(createdMemoir));
        localStorage.removeItem("pending_memoir");
        return true;
      } catch (err) {
        console.error("Failed to auto-create memoir during onboarding:", err);
      }
    }
    return false;
  };

  const startAuthAction = () => {
    setLoading(true);
    setServerError(null);
    setSuccessMessage(null);
  };

  const extractAccessToken = (res: AuthResult): string | null => {
    const token =
      res?.access_token ||
      res?.token ||
      res?.data?.access_token ||
      res?.data?.token ||
      null;
    return typeof token === "string" && token.trim() ? token : null;
  };

  const handleLogin = async (data: LoginInput): Promise<boolean> => {
    startAuthAction();

    try {
      const res: AuthResult = await login({
        email: data.email,
        password: data.password,
      });

      const accessToken = extractAccessToken(res);

      if (!accessToken) {
        throw new Error("Login did not return an access token.");
      }

      localStorage.setItem("access_token", accessToken);
      persistAuthUser(res, { email: data.email });
      // Onboarding completion (a memoir was just created above) lands on its
      // dashboard; every other login lands on the memoir list.
      const createdMemoir = await processPendingMemoir();

      router.push(createdMemoir ? "/dashboard" : "/memoirs");
      return true;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred during login";
      setServerError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormValues): Promise<boolean> => {
    startAuthAction();

    try {
      const res: AuthResult = await signup({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      });

      const accessToken = extractAccessToken(res);

      // If Supabase requires email confirmation, access token will be null.
      // Do NOT send the user to /dashboard in that case.
      if (!accessToken) {
        setSuccessMessage(
          "Account created! Please check your email to confirm your account, then log in."
        );
        setTimeout(() => router.push("/login"), 2000);
        return true;
      }

       localStorage.setItem("access_token", accessToken);
       persistAuthUser(res, { full_name: data.full_name, email: data.email });

      // Restore active memoir from login response if present
      const activeMemoir = res?.data?.active_memoir || res?.active_memoir;
      if (activeMemoir) {
        localStorage.setItem("active_memoir", JSON.stringify(activeMemoir));
      }

      const createdMemoir = await processPendingMemoir();

      // Onboarding completion lands on the new memoir's dashboard;
      // a fresh account otherwise lands on the (empty) memoir list.
      router.push(createdMemoir ? "/dashboard" : "/memoirs");
      return true;
      
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during signup";
      setServerError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    serverError,
    successMessage,
    setServerError,
    setSuccessMessage,
    handleLogin,
    handleSignup,
  };
}