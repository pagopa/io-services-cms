import { ServiceLifecycle } from "@io-services-cms/models";
import { Service } from "@io-services-cms/models/service-lifecycle/types";

import { Service as ServiceResponsePayload } from "../../../generated/api/Service";
import { ServicePayload as ServiceRequestPayload } from "../../../generated/api/ServicePayload";
import {
  ServiceStatusType,
  ServiceStatusTypeEnum,
} from "../../../generated/api/ServiceStatusType";
import { ScopeEnum } from "../../../generated/api/ServiceMetadata";

export const payloadToItem = (
  id: Service["id"],
  {
    require_secure_channel = false,
    max_allowed_payment_amount = 0 as NonNullable<
      ServiceRequestPayload["max_allowed_payment_amount"]
    >,
    ...data
  }: ServiceRequestPayload
): Service => ({
  id,
  data: {
    ...data,
    require_secure_channel,
    max_allowed_payment_amount,
    authorized_recipients: [],
  },
});

export const itemToResponse = ({
  fsm: { state },
  data,
  id,
}: ServiceLifecycle.ItemType): ServiceResponsePayload => ({
  id,
  status: { value: toServiceStatusType(state) },
  name: data.name,
  description: data.description,
  organization: data.organization,
  metadata: { ...data.metadata, scope: toScopeType(data.metadata.scope) },
});

export const toServiceStatusType = (
  s: ServiceLifecycle.ItemType["fsm"]["state"]
): ServiceStatusType => {
  switch (s) {
    case "approved":
    case "deleted":
    case "draft":
    case "rejected":
    case "submitted":
      return ServiceStatusTypeEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = s;
      return ServiceStatusTypeEnum[s];
  }
};

export const toScopeType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["scope"]
): ScopeEnum => {
  switch (s) {
    case "LOCAL":
    case "NATIONAL":
      return ScopeEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = s;
      return ScopeEnum[s];
  }
};
