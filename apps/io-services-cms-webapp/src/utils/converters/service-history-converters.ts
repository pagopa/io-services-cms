import { ServiceHistory as ServiceHistoryCosmosItem } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { TopicPostgreSqlConfig } from "../../config";
import { ServiceHistoryItem as ServiceResponsePayload } from "../../generated/api/ServiceHistoryItem";
import { ServiceHistoryItemStatus } from "../../generated/api/ServiceHistoryItemStatus";
import { ServiceHistoryStatusKindEnum } from "../../generated/api/ServiceHistoryStatusKind";
import { ServiceHistoryStatusTypeEnum } from "../../generated/api/ServiceHistoryStatusType";
import { getDao as getServiceTopicDao } from "../service-topic-dao";
import { toScopeType } from "./service-lifecycle-converters";

export const itemsToResponse =
  (dbConfig: TopicPostgreSqlConfig) =>
  (
    items: ReadonlyArray<ServiceHistoryCosmosItem>
  ): TE.TaskEither<Error, ReadonlyArray<ServiceResponsePayload>> =>
    pipe(items, TE.traverseArray(itemToResponse(dbConfig)));

export const itemToResponse =
  (dbConfig: TopicPostgreSqlConfig) =>
  ({
    fsm,
    data: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata: { scope, category, custom_special_flow, topic_id, ...metadata },
      ...data
    },
    serviceId,
    last_update,
  }: ServiceHistoryCosmosItem): TE.TaskEither<Error, ServiceResponsePayload> =>
    pipe(
      toServiceTopic(dbConfig)(serviceId, topic_id),
      TE.bimap(E.toError, (topic) => ({
        id: serviceId,
        status: buildStatus(fsm),
        last_update: last_update ?? new Date().getTime().toString(),
        ...data,
        metadata: {
          ...metadata,
          scope: toScopeType(scope),
          topic,
        },
      }))
    );

const toServiceTopic =
  (dbConfig: TopicPostgreSqlConfig) =>
  (
    serviceId: ServiceHistoryCosmosItem["id"],
    topicId: ServiceHistoryCosmosItem["data"]["metadata"]["topic_id"]
  ): TE.TaskEither<Error, ServiceResponsePayload["metadata"]["topic"]> =>
    topicId !== undefined && topicId !== null
      ? pipe(
          getServiceTopicDao(dbConfig),
          (dao) => dao.findById(topicId),
          TE.chain(
            TE.fromOption(
              () =>
                new Error(
                  `service (${serviceId}) has an invalid topic_id (${topicId})` // TODO: fix error message
                )
            )
          )
        )
      : TE.right(undefined);

export const buildStatus = (
  fsm: ServiceHistoryCosmosItem["fsm"]
): ServiceHistoryItemStatus => {
  switch (fsm.state) {
    case "approved":
    case "deleted":
    case "draft":
    case "submitted":
      return {
        kind: ServiceHistoryStatusKindEnum.lifecycle,
        value: ServiceHistoryStatusTypeEnum[fsm.state],
      };
    case "rejected":
      return {
        kind: ServiceHistoryStatusKindEnum.lifecycle,
        value: ServiceHistoryStatusTypeEnum[fsm.state],
        reason: (fsm.reason as string) ?? undefined, // FIXME
      };
    default:
      return {
        kind: ServiceHistoryStatusKindEnum.publication,
        value: ServiceHistoryStatusTypeEnum[fsm.state],
      };
  }
};
