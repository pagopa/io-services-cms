import z from "zod";

import { serviceSchema } from "./service.js";

const transitionSchema = z.object({
  lastTransition: z.string().optional(),
});

const lifecycleFsmSchema = z.discriminatedUnion("state", [
  transitionSchema.extend({ state: z.literal("draft") }),
  transitionSchema.extend({
    autoPublish: z.boolean(),
    state: z.literal("submitted"),
  }),
  transitionSchema.extend({
    approvalDate: z.string(),
    autoPublish: z.boolean(),
    state: z.literal("approved"),
  }),
  transitionSchema.extend({
    reason: z.string(),
    state: z.literal("rejected"),
  }),
  transitionSchema.extend({ state: z.literal("deleted") }),
]);

export const serviceLifecycleSchema = serviceSchema.extend({
  fsm: lifecycleFsmSchema,
});

export type ServiceLifecycle = z.infer<typeof serviceLifecycleSchema>;
