/**
 * @file page.tsx (LoginForm)
 * @description Client-side React component that renders the user login interface,
 * manages form field validation via React Hook Form and Zod, and delegates network requests
 * and submission states to the useAuth custom hook while preserving exact frame and layout specs,
 * refactored to use shared theme color tokens and strict accessibility attributes.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loginSchema, LoginInput } from "./schemas";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "./hooks";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { loading, serverError, setServerError, handleLogin } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setServerError(null);
    setInfoMessage("Password reset functionality will be available soon.");
  };

  return (
    <section className="min-h-screen bg-memory-bg text-memory-primary flex items-center justify-center px-6 py-16 relative z-10 font-sans selection:bg-memory-primary selection:text-memory-light">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full bg-memory-card border border-memory-border rounded-3xl px-8 md:px-12 py-10 shadow-sm max-w-150"
      >
        {/* Back */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-memory-muted hover:text-memory-primary text-[15px] font-medium transition inline-flex items-center gap-1"
          >
            ←
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl text-memory-primary leading-snug">
            Step back into <br /> your family&rsquo;s safe space
          </h1>
        </div>

        {/* Server Error / Info Banners with Accessibility Role */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 p-4 bg-memory-card border border-memory-border text-memory-primary rounded-xl text-sm"
          >
            Login Failed: {serverError}
          </div>
        )}

        {infoMessage && (
          <div
            role="status"
            className="mb-6 p-4 bg-memory-card border border-memory-border text-memory-primary rounded-xl text-sm"
          >
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-4" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5"
            >
              Email
              <span aria-hidden="true" className="ml-1 text-memory-required">
                *
              </span>
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="e.g. hafsa@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              {...register("email")}
              className={`w-full rounded-xl border bg-memory-bg px-5 py-4 text-[16px] text-memory-primary placeholder:text-memory-muted/60 outline-none transition-all duration-300 shadow-2xs ${
                errors.email
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-memory-border focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20"
              }`}
            />

            {errors.email && (
              <p id="login-email-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5"
            >
              Password
              <span aria-hidden="true" className="ml-1 text-memory-required">
                *
              </span>
            </label>

            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              {...register("password")}
              className={`w-full rounded-xl border bg-memory-bg px-5 py-4 text-[16px] text-memory-primary placeholder:text-memory-muted/60 outline-none transition-all duration-300 shadow-2xs ${
                errors.password
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-memory-border focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20"
              }`}
            />

            {errors.password && (
              <p
                id="login-password-error"
                role="alert"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-sm text-memory-muted py-1">
            <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-memory-border text-memory-primary accent-memory-primary cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="hover:text-memory-primary transition underline underline-offset-2 bg-transparent border-none cursor-pointer text-sm text-memory-muted"
            >
              Forgot your password?
            </button>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.99 } : {}}
            className={`w-full mt-2 py-4 rounded-xl text-[16px] font-semibold transition-all duration-300 cursor-pointer shadow-md ${
              !loading
                ? "bg-memory-primary text-memory-light hover:bg-memory-maroon shadow-memory-primary/10"
                : "bg-memory-border text-memory-muted cursor-not-allowed shadow-none"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>
        </form>

        {/* Footer Link */}
        <div className="border border-memory-border rounded-2xl mt-8 py-4 text-center text-sm text-memory-muted bg-memory-bg">
          Not a member yet?{" "}
          <Link href="/signup" className="text-memory-primary font-semibold ml-1 hover:underline underline-offset-2">
            Sign up
          </Link>
        </div>
      </motion.div>
    </section>
  );
}