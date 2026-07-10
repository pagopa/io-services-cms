import z from "zod";

export const InfoOutputSchema = z.object({
  name: z.string(),
  version: z.string(),
});
