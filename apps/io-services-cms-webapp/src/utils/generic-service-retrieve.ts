import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  FsmAuthorizationError,
  FsmStoreFetchError,
} from "@io-services-cms/models";
import { IAzureApiAuthorization } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "./applicationinsight";
import { fsmToApiError } from "./converters/fsm-error-converters";
import { ErrorResponseTypes, getLogger } from "./logger";
import { serviceOwnerCheckManageTask } from "./subscription";

type GenericItemToResponse<T, V> = (
  item: T,
) => TE.TaskEither<IResponseErrorInternal, V>;

export const genericServiceRetrieveHandler =
  <T, V>(
    fetch: (
      id: NonEmptyString,
    ) => TE.TaskEither<FsmAuthorizationError | FsmStoreFetchError, O.Option<T>>,
    apimService: ApimUtils.ApimService,
    telemetryClient: TelemetryClient,
    itemToResponse: GenericItemToResponse<T, V>,
  ) =>
  (
    context: Context,
    auth: IAzureApiAuthorization,
    serviceId: NonEmptyString,
    logPrefix: string,
    event: EventNameEnum,
    _authzGroupIds: readonly NonEmptyString[],
  ): TE.TaskEither<ErrorResponseTypes, IResponseSuccessJson<V>> =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId,
      ),
      TE.chainW(flow(fetch, TE.mapLeft(fsmToApiError))),
      TE.chainW(
        TE.fromOption(() =>
          ResponseErrorNotFound("Not found", `${serviceId} not found`),
        ),
      ),
      TE.chainW(itemToResponse),
      TE.map(ResponseSuccessJson<V>),
      TE.map(
        trackEventOnResponseOK(telemetryClient, event, {
          serviceId,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          serviceId,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
    );
