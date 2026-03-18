import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { ServiceTopicList } from "../../generated/api/ServiceTopicList";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { ServiceTopicDao } from "../../utils/service-topic-dao";

const logPrefix = "GetServiceTopicsHandler";

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<ServiceTopicList>;

type GetServiceTopicsHandler = (
  context: InvocationContext,
) => Promise<HandlerResponseTypes>;

interface Dependencies {
  serviceTopicDao: ServiceTopicDao;
}

export const makeGetServiceTopicsHandler =
  ({ serviceTopicDao }: Dependencies): GetServiceTopicsHandler =>
  (context) =>
    pipe(
      serviceTopicDao.findAllNotDeletedTopics(),
      TE.map((topics) => ResponseSuccessJson({ topics })),
      TE.mapLeft((err) => {
        getLogger(context, logPrefix).log(
          "error",
          `An Error has occurred while retrieving serviceTopics, reason => ${err.message}, stack => ${err.stack}`,
        );
        return ResponseErrorInternal("An error occurred while fetching topics");
      }),
      TE.toUnion,
    )();

export const applyRequestMiddelwares = (
  handler: GetServiceTopicsHandler,
): ReturnType<typeof wrapHandlerV4> => {
  const middlewares = [
    // extract the Azure functions context
    ContextMiddleware(),
  ] as const;
  return wrapHandlerV4(middlewares, handler);
};
