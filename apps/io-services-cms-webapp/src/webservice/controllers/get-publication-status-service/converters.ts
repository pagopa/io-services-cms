import { ServicePublication } from "@io-services-cms/models";
import { Service as ServiceResponsePayload } from "../../../generated/api/Service";
import {
  ServiceVisibility,
  ServiceVisibilityEnum,
} from "../../../generated/api/ServiceVisibility";
import { toScopeType } from "../create-service/converters";

export const itemToResponse = ({
  fsm: { state },
  data,
  id,
}: ServicePublication.ItemType): ServiceResponsePayload => ({
  id,
  visibility: toVisibilityStatusType(state),
  name: data.name,
  description: data.description,
  organization: data.organization,
  metadata: { ...data.metadata, scope: toScopeType(data.metadata.scope) },
});

export const toVisibilityStatusType = (
  s: ServicePublication.ItemType["fsm"]["state"]
): ServiceVisibility => {
  switch (s) {
    case "published":
    case "unpublished":
      return ServiceVisibilityEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = s;
      return ServiceVisibilityEnum[s];
  }
};
