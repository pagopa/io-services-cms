import {
  FsmItemNotFoundError,
  FsmNoApplicableTransitionError,
  FsmNoTransitionMatchedError,
  FsmStoreFetchError,
  FsmStoreSaveError,
  FsmTooManyTransitionsError,
  FsmTransitionExecutionError,
  ServicePublication,
} from "@io-services-cms/models";
import {
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseErrorNotFound,
} from "@pagopa/ts-commons/lib/responses";
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

/**
 * Convert FSM error to API error
 * @param err FSM custom error
 * @returns API http error
 */
export const fsmToApiError = (err: ServicePublication.AllFsmErrors) => {
  switch (err.constructor) {
    case FsmNoApplicableTransitionError:
    case FsmNoTransitionMatchedError:
    case FsmTooManyTransitionsError:
      return ResponseErrorConflict(err.message);
    case FsmTransitionExecutionError:
    case FsmStoreFetchError:
    case FsmStoreSaveError:
      return ResponseErrorInternal(err.message);
    case FsmItemNotFoundError:
      return ResponseErrorNotFound("Not Found", err.message);
    default:
      return ResponseErrorInternal(err.message);
  }
};
