import { ServicePublication } from "@io-services-cms/models";
import {
  IResponseErrorInternal,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { TopicPostgreSqlConfig } from "../../config";
import { CategoryEnum } from "../../generated/api/ServiceBaseMetadata";
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
    last_update_ts,
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
          last_update: last_update_ts
            ? new Date(last_update_ts * 1000).toISOString()
            : new Date().getTime().toString(),
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

export const toCategoryType = (
  s: ServicePublication.ItemType["data"]["metadata"]["category"],
): CategoryEnum => {
  switch (s) {
    case "STANDARD":
    case "SPECIAL":
      return CategoryEnum[s];
    default:
      return CategoryEnum.STANDARD;
  }
};
