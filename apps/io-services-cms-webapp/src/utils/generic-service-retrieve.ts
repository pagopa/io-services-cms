import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { FSMStore } from "@io-services-cms/models";
import { IAzureApiAuthorization } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
  getResponseErrorForbiddenNoAuthorizationGroups,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";

import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "./applicationinsight";
import { ErrorResponseTypes, getLogger } from "./logger";
import { serviceOwnerCheckManageTask } from "./subscription";

export type GenericItemToResponse<T, V> = (
  item: T,
) => TE.TaskEither<IResponseErrorInternal, V>;

export const genericServiceRetrieveHandler =
  <
    T extends {
      data: { metadata?: { group_id?: NonEmptyString } };
      fsm: {
        lastTransition?: string | undefined;
        state: string;
      };
    },
    V,
  >(
    store: FSMStore<T>,
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
    authzGroupIds: readonly NonEmptyString[],
  ): TE.TaskEither<ErrorResponseTypes, IResponseSuccessJson<V>> =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId,
      ),
      TE.chainW(
        flow(
          store.fetch,
          TE.mapLeft((err) => ResponseErrorInternal(err.message)),
          TE.chain(
            flow(
              TE.fromOption(() =>
                ResponseErrorNotFound("Not found", `${serviceId} not found`),
              ),
              flow(
                event === EventNameEnum.GetServiceLifecycle // group authz check is applied only to ServiceLifecycle entity
                  ? TE.filterOrElseW(isAuthorized(authzGroupIds), (_) =>
                      getResponseErrorForbiddenNoAuthorizationGroups(),
                    )
                  : identity,
              ),
              TE.chainW(itemToResponse),
              TE.map(ResponseSuccessJson<V>),
            ),
          ),
        ),
      ),
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

const isAuthorized =
  (authzGroupIds: readonly NonEmptyString[]) =>
  (service: { data: { metadata?: { group_id?: NonEmptyString } } }) =>
    authzGroupIds.length === 0 ||
    (!!service.data.metadata?.group_id &&
      authzGroupIds.includes(service.data.metadata.group_id));
