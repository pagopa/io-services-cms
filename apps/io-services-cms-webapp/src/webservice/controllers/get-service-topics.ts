import { Context } from "@azure/functions";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import {
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { ServiceTopicList } from "../../generated/api/ServiceTopicList";
import {
  EventNameEnum,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { ServiceTopicDao } from "../../utils/service-topic-dao";

const logPrefix = "GetServiceTopicsHandler";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceTopicList>
  | ErrorResponseTypes;

type GetServiceTopicsHandler = (
  context: Context,
  auth: IAzureApiAuthorization
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // A store od ServiceLifecycle objects
  telemetryClient: ReturnType<typeof initAppInsights>;
  serviceTopicDao: ServiceTopicDao;
};

export const makeGetServiceTopicsHandler =
  ({
    telemetryClient,
    serviceTopicDao,
  }: Dependencies): GetServiceTopicsHandler =>
  (context, auth) =>
    pipe(
      serviceTopicDao.findAllNotDeletedTopics(),
      TE.map(
        flow(
          O.fold(
            // QUESTION: when no topics are found on DB should we return an empty list or an error 404?
            () => ResponseSuccessJson({ topics: [] }),
            (topics) => ResponseSuccessJson({ topics })
          )
        )
      ),
      TE.map(
        trackEventOnResponseOK(
          telemetryClient,
          EventNameEnum.GetServiceLifecycle,
          {
            userSubscriptionId: auth.subscriptionId,
          }
        )
      ),
      TE.mapLeft((err) => {
        getLogger(context, logPrefix).log(
          "error",
          `An Error has occurred while retrieving serviceTopics, reason => ${err.message}, stack => ${err.stack}`
        );
        return ResponseErrorInternal("An error occurred while fetching topics");
      }),
      TE.toUnion
    )();

export const applyRequestMiddelwares = (handler: GetServiceTopicsHandler) => {
  const middlewaresWrap = withRequestMiddlewares(
    // extract the Azure functions context
    ContextMiddleware(),
    // only allow requests by users belonging to certain groups
    AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite]))
  );
  return wrapRequestHandler(
    middlewaresWrap(
      // eslint-disable-next-line max-params
      handler
    )
  );
};
