import z from "zod";

import { serviceSchema } from "./service.js";

const publicationFsmSchema = z.object({
  lastTransition: z.string().optional(),
  state: z.union([z.literal("published"), z.literal("unpublished")]),
});

export const servicePublicationSchema = serviceSchema.extend({
  fsm: publicationFsmSchema,
});

export type ServicePublication = z.infer<typeof servicePublicationSchema>;
