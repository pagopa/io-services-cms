import { ServiceLifecycle } from "@io-services-cms/models";
import { Cidr } from "../../generated/api/Cidr";
import { FiscalCode } from "../../generated/api/FiscalCode";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import { CategoryEnum, ScopeEnum } from "../../generated/api/ServiceMetadata";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";

export const payloadToItem = (
  id: ServiceLifecycle.definitions.Service["id"],
  {
    require_secure_channel = false,
    max_allowed_payment_amount = 0 as NonNullable<
      ServiceRequestPayload["max_allowed_payment_amount"]
    >,
    authorized_recipients = [] as ReadonlyArray<FiscalCode>,
    authorized_cidrs = [] as ReadonlyArray<Cidr>,
    metadata = {} as ServiceRequestPayload["metadata"],
    ...data
  }: ServiceRequestPayload,
  sandboxFiscalCode: FiscalCode
): ServiceLifecycle.definitions.Service => ({
  id,
  data: {
    ...data,
    require_secure_channel,
    max_allowed_payment_amount,
    authorized_recipients: [sandboxFiscalCode, ...authorized_recipients],
    authorized_cidrs: [...authorized_cidrs],
    metadata: { ...metadata, category: toCategoryType(metadata.category) },
  },
});

export const itemToResponse = ({
  fsm,
  data,
  id,
  last_update,
}: ServiceLifecycle.ItemType): ServiceResponsePayload => ({
  id,
  status: toServiceStatus(fsm),
  last_update: last_update ?? new Date().getTime().toString(),
  name: data.name,
  description: data.description,
  organization: data.organization,
  metadata: {
    ...data.metadata,
    scope: toScopeType(data.metadata.scope),
    category: toCategoryType(data.metadata.category),
  },
  require_secure_channel: data.require_secure_channel,
  authorized_recipients: data.authorized_recipients,
  authorized_cidrs: data.authorized_cidrs,
  max_allowed_payment_amount: data.max_allowed_payment_amount,
});

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

export const toCategoryType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["category"]
): CategoryEnum => {
  switch (s) {
    case "STANDARD":
    case "SPECIAL":
      return CategoryEnum[s];
    default:
      return CategoryEnum.STANDARD;
  }
};
