import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { IAzureApiAuthorization } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  IResponseErrorInternal,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { IConfig } from "../config";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "./applicationinsight";
import { getLogger } from "./logger";
import { serviceOwnerCheckManageTask } from "./subscription";

interface GenericStore<T> {
  fetch: (id: NonEmptyString) => TE.TaskEither<Error, O.Option<T>>;
}

type GenericItemToResponse<T, V> = (
  dbConfig: IConfig,
) => (item: T) => TE.TaskEither<IResponseErrorInternal, V>;

export const genericServiceRetrieveHandler =
  <
    T extends {
      fsm: {
        lastTransition?: string | undefined;
      } & { state: string } & Record<string, unknown>;
    } & Record<string, unknown>,
    V,
  >(
    store: GenericStore<T>,
    apimService: ApimUtils.ApimService,
    telemetryClient: TelemetryClient,
    config: IConfig,
    itemToResponse: GenericItemToResponse<T, V>,
  ) =>
  (
    context: Context,
    auth: IAzureApiAuthorization,
    serviceId: NonEmptyString,
    logPrefix: string,
    event: EventNameEnum,
  ) =>
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
          TE.chainW(
            flow(
              TE.fromOption(() =>
                ResponseErrorNotFound("Not found", `${serviceId} not found`),
              ),
              TE.chainW(itemToResponse(config)),
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
      TE.toUnion,
    )();
