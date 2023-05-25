import { ServiceLifecycle } from "@io-services-cms/models";
import { ServicePayload as ServiceRequestPayload } from "../../../generated/api/ServicePayload";

export const payloadToItem = (
  id: ServiceLifecycle.definitions.Service["id"],
  {
    require_secure_channel = false,
    max_allowed_payment_amount = 0 as NonNullable<
      ServiceRequestPayload["max_allowed_payment_amount"]
    >,
    ...data
  }: ServiceRequestPayload
): ServiceLifecycle.definitions.Service => ({
  id,
  data: {
    ...data,
    require_secure_channel,
    max_allowed_payment_amount,
    authorized_recipients: [],
  },
});
