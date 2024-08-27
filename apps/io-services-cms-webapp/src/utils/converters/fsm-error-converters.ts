import {
  FsmItemNotFoundError,
  FsmNoApplicableTransitionError,
  FsmNoTransitionMatchedError,
  FsmStoreFetchError,
  FsmStoreSaveError,
  FsmTooManyTransitionsError,
  FsmTransitionExecutionError,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import {
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseErrorNotFound,
} from "@pagopa/ts-commons/lib/responses";

/**
 * Convert FSM error to API error
 * @param err FSM custom error
 * @returns API http error
 */
export const fsmToApiError = (
  err: ServiceLifecycle.AllFsmErrors | ServicePublication.AllFsmErrors
) => {
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
