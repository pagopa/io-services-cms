import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorInternal,
  ResponseErrorValidation,
} from "@pagopa/ts-commons/lib/responses";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { identity, pipe } from "fp-ts/lib/function";
import { TopicPostgreSqlConfig } from "../config";
import { ServicePayload } from "../generated/api/ServicePayload";
import { getDao as getServiceTopicDao } from "./service-topic-dao";

export const validateServiceTopicRequest =
  (dbConfig: TopicPostgreSqlConfig) =>
  (
    topicId: ServicePayload["metadata"]["topic_id"]
  ): TE.TaskEither<IResponseErrorInternal | IResponseErrorValidation, void> =>
    topicId
      ? pipe(
          getServiceTopicDao(dbConfig),
          (dao) => dao.existsById(topicId),
          TE.bimap(
            (error) => ResponseErrorInternal(error.message),
            O.fromPredicate(identity)
          ),
          TE.chainW(
            TE.fromOption(() =>
              ResponseErrorValidation(
                "Bad Request",
                "Provided topic_id does not exists"
              )
            )
          ),
          TE.map(() => void 0)
        )
      : TE.right(void 0);
