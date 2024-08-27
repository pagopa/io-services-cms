import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { ServiceTopicList } from "../../generated/api/ServiceTopicList";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { ServiceTopicDao } from "../../utils/service-topic-dao";

const logPrefix = "GetServiceTopicsHandler";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceTopicList>
  | ErrorResponseTypes;

type GetServiceTopicsHandler = (
  context: Context
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  serviceTopicDao: ServiceTopicDao;
};

export const makeGetServiceTopicsHandler =
  ({ serviceTopicDao }: Dependencies): GetServiceTopicsHandler =>
  (context) =>
    pipe(
      serviceTopicDao.findAllNotDeletedTopics(),
      TE.map(
        flow(
          O.fold(
            () => ResponseSuccessJson({ topics: [] }),
            (topics) => ResponseSuccessJson({ topics })
          )
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
    ContextMiddleware()
  );
  return wrapRequestHandler(
    middlewaresWrap(
      // eslint-disable-next-line max-params
      handler
    )
  );
};
