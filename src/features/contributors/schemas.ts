import { z } from "zod";

export const contributorSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullish(),
  display_name: z.string(),
  role: z.enum(["Admin", "Contributor"]),
  status: z.enum(["Accepted", "Pending"]),
});

export const contributorListSchema = z.array(contributorSchema);

export type Contributor = z.infer<typeof contributorSchema>;
