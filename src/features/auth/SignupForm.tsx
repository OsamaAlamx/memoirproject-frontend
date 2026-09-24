/**
 * @file signupForm.tsx
 * @description Client-side React component that renders the user registration form,
 * manages form field validation via React Hook Form and Zod, and delegates network actions
 * and submission states to the useAuth custom hook while maintaining side-by-side
 * password fields, exact login styling specs, and strict accessibility attributes.
 */

"use client";

import { signupSchema } from "./schemas";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "./hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const extendedSignupSchema = signupSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match!",
    path: ["confirmPassword"],
  });

type ExtendedSignupInput = z.infer<typeof extendedSignupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const { loading, serverError, successMessage, handleSignup } = useAuth();

  // If already logged in, go to dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExtendedSignupInput>({
    resolver: zodResolver(extendedSignupSchema),
  });

  const onSubmit = async (data: ExtendedSignupInput) => {
    try {
      await handleSignup(data);
      // routing is handled inside the hook:
      // - if token exists -> /dashboard
      // - if confirmation required -> /login (after showing message)
    } catch (err) {
      console.error("Signup error:", err);
    }
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
            href="/invite-family-friends"
            className="text-memory-muted hover:text-memory-primary text-[15px] font-medium transition inline-flex items-center gap-1"
          >
            ←
          </Link>
        </div>

        {/* Header with Top-Right Login Link */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl text-memory-primary leading-snug">
            Let’s create a safe <br className="hidden sm:block" />space for
            your memories
          </h1>

          <div className="flex flex-col text-[15px] text-memory-muted whitespace-nowrap">
            <span>Have an account?</span>
            <Link
              href="/login"
              className="text-memory-primary font-semibold hover:underline transition mt-0.5"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Server Success / Error Banners with Accessibility Role */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 p-4 bg-memory-card border border-memory-border text-memory-primary rounded-xl text-sm"
          >
            Signup Failed: {serverError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-6 p-4 bg-memory-card border border-memory-border text-memory-primary rounded-xl text-sm"
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {/* Full Name */}
          <div>
            <label
              htmlFor="signup-fullname"
              className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5"
            >
              Full Name
              <span aria-hidden="true" className="ml-1 text-memory-required">
                *
              </span>
            </label>
            <input
              id="signup-fullname"
              type="text"
              placeholder="John Doe"
              aria-invalid={Boolean(errors.full_name)}
              aria-describedby={errors.full_name ? "signup-fullname-error" : undefined}
              {...register("full_name")}
              className={`w-full rounded-xl border bg-memory-bg px-5 py-4 text-[16px] text-memory-primary placeholder:text-memory-muted/60 outline-none transition-all duration-300 shadow-2xs ${
                errors.full_name
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-memory-border focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20"
              }`}
            />
            {errors.full_name && (
              <p id="signup-fullname-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5"
            >
              Email
              <span aria-hidden="true" className="ml-1 text-memory-required">
                *
              </span>
            </label>
            <input
              id="signup-email"
              type="email"
              placeholder="john@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              {...register("email")}
              className={`w-full rounded-xl border bg-memory-bg px-5 py-4 text-[16px] text-memory-primary placeholder:text-memory-muted/60 outline-none transition-all duration-300 shadow-2xs ${
                errors.email
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-memory-border focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20"
              }`}
            />
            {errors.email && (
              <p id="signup-email-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5"
              >
                Password
                <span aria-hidden="true" className="ml-1 text-memory-required">
                  *
                </span>
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "signup-password-error" : undefined}
                {...register("password")}
                className={`w-full rounded-xl border bg-memory-bg px-5 py-4 text-[16px] text-memory-primary placeholder:text-memory-muted/60 outline-none transition-all duration-300 shadow-2xs ${
                  errors.password
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-memory-border focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20"
                }`}
              />
              {errors.password && (
                <p id="signup-password-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-confirmpassword"
                className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5 ml-1"
              >
                Confirm Password
                <span aria-hidden="true" className="ml-1 text-memory-required">
                  *
                </span>
              </label>
              <input
                id="signup-confirmpassword"
                type="password"
                placeholder="Confirm your password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "signup-confirmpassword-error" : undefined}
                {...register("confirmPassword")}
                className={`w-full rounded-xl border bg-memory-bg px-5 py-4 text-[16px] text-memory-primary placeholder:text-memory-muted/60 outline-none transition-all duration-300 shadow-2xs ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-memory-border focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20"
                }`}
              />
              {errors.confirmPassword && (
                <p id="signup-confirmpassword-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
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
            {loading ? "Creating account..." : "Continue"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-memory-muted mt-8">
          By clicking continue you agree to the{" "}
          <span className="text-memory-primary font-medium cursor-pointer hover:underline underline-offset-2">
            Terms and Conditions
          </span>
        </p>
      </motion.div>
    </section>
  );
}