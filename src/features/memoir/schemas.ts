import { z } from "zod";

export const relationshipGroupSchema = z.enum([
  "spouse_partner", "child", "grandchild", "sibling",
  "parent", "extended_family", "friend", "colleague",
  "neighbour", "self", "other"
]);

export const memoirCreateRequestSchema = z.object({
  subject_name: z.string().trim().min(1, "Please enter a name").max(200),
  birth_year: z.number().int().min(1800).max(2100).nullish(),
  end_year: z.number().int().min(1800).max(2100).nullish(),
  is_living: z.boolean(),
  relationship: relationshipGroupSchema,
});

export const memoirSchema = z.object({
  id: z.string().uuid(),
  subject_name: z.string(),
  subject_born_on: z.string().nullish(),
  subject_died_on: z.string().nullish(),
  subject_is_living: z.boolean(),
  description: z.string().nullish(),
  status: z.string(),
  created_at: z.string(),
});

export type RelationshipGroup = z.infer<typeof relationshipGroupSchema>;
export type MemoirCreateRequest = z.input<typeof memoirCreateRequestSchema>;
export type Memoir = z.infer<typeof memoirSchema>;

// Form specific type combining steps
export type WizardFormValues = {
  relationship: RelationshipGroup | null;
  subject_name: string;
  birth_year: string;
  is_living: boolean;
  end_year: string;
};