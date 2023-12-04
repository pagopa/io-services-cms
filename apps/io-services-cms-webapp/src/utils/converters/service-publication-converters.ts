import { ServicePublication } from "@io-services-cms/models";
import { CategoryEnum } from "../../generated/api/ServiceMetadata";
import { ServicePublication as ServiceResponsePayload } from "../../generated/api/ServicePublication";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum,
} from "../../generated/api/ServicePublicationStatusType";
import { toScopeType } from "./service-lifecycle-converters";

export const itemToResponse = ({
  fsm: { state },
  data,
  id,
  last_update,
}: ServicePublication.ItemType): ServiceResponsePayload => ({
  id,
  status: toServiceStatusType(state),
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

export const toServiceStatusType = (
  s: ServicePublication.ItemType["fsm"]["state"]
): ServicePublicationStatusType => {
  switch (s) {
    case "published":
    case "unpublished":
      return ServicePublicationStatusTypeEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = s;
      return ServicePublicationStatusTypeEnum[s];
  }
};

export const toCategoryType = (
  s: ServicePublication.ItemType["data"]["metadata"]["category"]
): CategoryEnum => {
  switch (s) {
    case "STANDARD":
    case "SPECIAL":
      return CategoryEnum[s];
    default:
      return CategoryEnum.STANDARD;
  }
};
