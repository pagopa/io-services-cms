import z from "zod";

export const serviceTopicSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
});

export type ServiceTopic = z.infer<typeof serviceTopicSchema>;
