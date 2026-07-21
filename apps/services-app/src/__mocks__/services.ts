import { serviceLifecycleSchema } from "../domain/entities/service-lifecycle.js";
import { servicePublicationSchema } from "../domain/entities/service-publication.js";

export const aService = {
  data: {
    authorized_cidrs: [],
    authorized_recipients: [],
    description: "Service description",
    max_allowed_payment_amount: 0,
    metadata: { scope: "NATIONAL" },
    name: "A service",
    organization: {
      fiscal_code: "01234567890",
      name: "An organization",
    },
    require_secure_channel: false,
  },
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
} as const;

export const aLifecycleService = serviceLifecycleSchema.parse({
  ...aService,
  fsm: { state: "draft" },
});

export const aPublicationService = servicePublicationSchema.parse({
  ...aService,
  fsm: { state: "published" },
});
