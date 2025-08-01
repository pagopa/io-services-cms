import { DateUtils, ServicePublication } from "@io-services-cms/models";
import {
  IResponseErrorInternal,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { TopicPostgreSqlConfig } from "../../config";
import { ServicePublication as ServiceResponsePayload } from "../../generated/api/ServicePublication";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum,
} from "../../generated/api/ServicePublicationStatusType";
import { getDao as getServiceTopicDao } from "../service-topic-dao";
import { toScopeType } from "./service-lifecycle-converters";

export const itemToResponse =
  (dbConfig: TopicPostgreSqlConfig) =>
  ({
    data: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata: { category, custom_special_flow, scope, topic_id, ...metadata },
      ...data
    },
    fsm: { state },
    id,
    modified_at,
  }: ServicePublication.ItemType): TE.TaskEither<
    IResponseErrorInternal,
    ServiceResponsePayload
  > =>
    pipe(
      toServiceTopic(dbConfig)(id, topic_id),
      TE.bimap(
        (err) => ResponseErrorInternal(err.message),
        (topic) => ({
          id,
          last_update: modified_at
            ? DateUtils.isoStringfromUnixMillis(modified_at)
            : new Date().toISOString(),
          status: toServiceStatusType(state),
          ...data,
          metadata: {
            ...metadata,
            scope: toScopeType(scope),
            topic,
          },
        }),
      ),
    );

const toServiceTopic =
  (dbConfig: TopicPostgreSqlConfig) =>
  (
    serviceId: ServicePublication.ItemType["id"],
    topicId: ServicePublication.ItemType["data"]["metadata"]["topic_id"],
  ): TE.TaskEither<Error, ServiceResponsePayload["metadata"]["topic"]> =>
    topicId !== undefined && topicId !== null
      ? pipe(
          getServiceTopicDao(dbConfig),
          (dao) => dao.findById(topicId),
          TE.chain(
            TE.fromOption(
              () =>
                new Error(
                  `service (${serviceId}) has an invalid topic_id (${topicId})`, // TODO: fix error message
                ),
            ),
          ),
        )
      : TE.right(undefined);

export const toServiceStatusType = (
  s: ServicePublication.ItemType["fsm"]["state"],
): ServicePublicationStatusType => {
  switch (s) {
    case "published":
    case "unpublished":
      return ServicePublicationStatusTypeEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations
      const _: never = s;
      return ServicePublicationStatusTypeEnum[s];
  }
};
