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
}: ServicePublication.ItemType): ServiceResponsePayload => ({
  id,
  status: toServiceStatusType(state),
  name: data.name,
  description: data.description,
  organization: data.organization,
  metadata: {
    ...data.metadata,
    scope: toScopeType(data.metadata.scope),
    category: toCategoryType(data.metadata.category),
  },
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
