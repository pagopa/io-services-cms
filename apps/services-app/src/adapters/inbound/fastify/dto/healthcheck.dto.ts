import z from "zod";

export const HealthcheckOutputSchema = z.object({
  failures: z.array(z.string()),
});
