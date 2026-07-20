import z from "zod";

import { serviceMetadataSchema, serviceSchema } from "./service.js";
import { serviceLifecycleSchema } from "./service-lifecycle.js";
import { servicePublicationSchema } from "./service-publication.js";
import { serviceTopicSchema } from "./service-topic.js";

const enrichedServiceMetadataSchema = serviceMetadataSchema
  .omit({ topic_id: true })
  .extend({ topic: serviceTopicSchema.optional() });

const enrichedServiceDataSchema = serviceSchema.shape.data.extend({
  metadata: enrichedServiceMetadataSchema,
});

export const enrichedServiceLifecycleSchema = serviceLifecycleSchema.extend({
  data: enrichedServiceDataSchema,
});

export const enrichedServicePublicationSchema = servicePublicationSchema.extend(
  {
    data: enrichedServiceDataSchema,
  },
);

export type EnrichedService =
  | z.infer<typeof enrichedServiceLifecycleSchema>
  | z.infer<typeof enrichedServicePublicationSchema>;
