import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export const signupSchema = z.object({
  full_name: z.string().min(1, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

// TypeScript types inferred from the schemas. No field uses a default, so
// z.input and z.output are structurally identical today; both aliases exist so
// call sites (useForm's three generics) already follow the input/output split
// when a defaulted field arrives.
export type LoginInput = z.input<typeof loginSchema>;
export type LoginOutput = z.output<typeof loginSchema>;
export type SignupInput = z.input<typeof signupSchema>;
export type SignupOutput = z.output<typeof signupSchema>;

// Form-level schema: signup fields plus confirmation. The only place the
// confirm-password rule and its message live (SignupForm uses this via zodResolver).
export const signupFormSchema = signupSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match!",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type SignupFormInput = z.input<typeof signupFormSchema>;
export type SignupFormOutput = z.output<typeof signupFormSchema>;

// Backend auth responses (login flat / register flat). Lenient: only the token
// shape is asserted, everything else passes through.
const authUserSchema = z
  .object({
    id: z.string().optional(),
    email: z.string().optional(),
    full_name: z.string().optional(),
  })
  .passthrough();

export const authResponseSchema = z
  .object({
    access_token: z.string().nullable().optional(),
    token: z.string().nullable().optional(),
    requires_confirmation: z.boolean().optional(),
    active_memoir: z.unknown().nullable().optional(),
    user: authUserSchema.optional(),
  })
  .passthrough();

export type AuthResponse = z.infer<typeof authResponseSchema>;

// GET /api/auth/me — owner profile backfill for sessions that predate
// the stored `auth_user` snapshot (login already returns the name).
export const profileResponseSchema = z
  .object({
    data: z
      .object({
        user_id: z.string().optional(),
        email: z.string().nullable().optional(),
        full_name: z.string().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
