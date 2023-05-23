import { ServicePublication } from "@io-services-cms/models";
import { ServicePublication as ServiceResponsePayload } from "../../../generated/api/ServicePublication";
import { toScopeType } from "../create-service/converters";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum,
} from "../../../generated/api/ServicePublicationStatusType";

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
  metadata: { ...data.metadata, scope: toScopeType(data.metadata.scope) },
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
