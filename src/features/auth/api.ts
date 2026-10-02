import { apiRequest } from "@/lib/api/client";
import { signupSchema, loginSchema, authResponseSchema, profileResponseSchema, type SignupInput, type LoginInput } from "./schemas";

export async function signup(payload: SignupInput) {
  return apiRequest(
    "/api/auth/signup",
    { method: "POST", body: JSON.stringify(signupSchema.parse(payload)) },
    authResponseSchema,
  );
}

export async function login(payload: LoginInput) {
  return apiRequest(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify(loginSchema.parse(payload)) },
    authResponseSchema,
  );
}

export async function getMyProfile() {
  const body = await apiRequest("/api/auth/me", { method: "GET" }, profileResponseSchema);
  return body.data;
}
