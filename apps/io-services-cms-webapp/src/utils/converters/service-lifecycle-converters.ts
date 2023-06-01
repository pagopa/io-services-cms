import { ServiceLifecycle } from "@io-services-cms/models";

import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import { ScopeEnum } from "../../generated/api/ServiceMetadata";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";

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

export const itemToResponse = ({
  fsm,
  data,
  id,
}: ServiceLifecycle.ItemType): ServiceResponsePayload => ({
  id,
  status: toServiceStatus(fsm),
  name: data.name,
  description: data.description,
  organization: data.organization,
  metadata: { ...data.metadata, scope: toScopeType(data.metadata.scope) },
});

// export const toServiceStatusType = (
//   s: ServiceLifecycle.ItemType["fsm"]["state"]
// ): ServiceLifecycleStatusType => {
//   switch (s) {
//     case "approved":
//     case "deleted":
//     case "draft":
//     case "rejected":
//     case "submitted":
//       return ServiceLifecycleStatusTypeEnum[s];
//     default:
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       const _: never = s;
//       return ServiceLifecycleStatusTypeEnum[s];
//   }
// };

export const toServiceStatus = (
  fsm: ServiceLifecycle.ItemType["fsm"]
): ServiceLifecycleStatus => {
  switch (fsm.state) {
    case "approved":
    case "deleted":
    case "draft":
    case "submitted":
      return { value: ServiceLifecycleStatusTypeEnum[fsm.state] };
    case "rejected":
      return {
        value: ServiceLifecycleStatusTypeEnum[fsm.state],
        reason: (fsm.reason as string) ?? undefined, // FIXME
      };

    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = fsm;
      return ServiceLifecycleStatusTypeEnum[fsm];
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
