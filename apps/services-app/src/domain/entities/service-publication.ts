import z from "zod";

import { serviceSchema } from "./service.js";

const publicationFsmSchema = z.discriminatedUnion("state", [
  z.object({
    lastTransition: z.string().optional(),
    state: z.literal("published"),
  }),
  z.object({
    lastTransition: z.string().optional(),
    state: z.literal("unpublished"),
  }),
]);

export const servicePublicationSchema = serviceSchema.extend({
  fsm: publicationFsmSchema,
});

export type ServicePublication = z.infer<typeof servicePublicationSchema>;
