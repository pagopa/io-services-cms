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
    fsm: { state },
    data,
    id,
    last_update,
  }: ServicePublication.ItemType): TE.TaskEither<
    IResponseErrorInternal,
    ServiceResponsePayload
  > =>
    pipe(
      toServiceTopic(dbConfig)(id, data.metadata.topic_id),
      TE.bimap(
        (err) => ResponseErrorInternal(err.message),
        (topic) => ({
          id,
          status: toServiceStatusType(state),
          last_update: last_update ?? new Date().getTime().toString(),
          name: data.name,
          description: data.description,
          organization: data.organization,
          metadata: {
            ...data.metadata,
            scope: toScopeType(data.metadata.scope),
            category: toCategoryType(data.metadata.category),
            topic,
          },
          require_secure_channel: data.require_secure_channel,
          authorized_recipients: data.authorized_recipients,
          authorized_cidrs: data.authorized_cidrs,
          max_allowed_payment_amount: data.max_allowed_payment_amount,
        })
      )
    );

const toServiceTopic =
  (dbConfig: TopicPostgreSqlConfig) =>
  (
    serviceId: ServicePublication.ItemType["id"],
    topicId: ServicePublication.ItemType["data"]["metadata"]["topic_id"]
  ): TE.TaskEither<Error, ServiceResponsePayload["metadata"]["topic"]> =>
    topicId
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

export const toServiceStatusType = (
  s: ServicePublication.ItemType["fsm"]["state"]
): ServicePublicationStatusType => {
  switch (s) {
    case "published":
    case "unpublished":
      return ServicePublicationStatusTypeEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = s;
      return ServicePublicationStatusTypeEnum[s];
  }
};

export const toCategoryType = (
  s: ServicePublication.ItemType["data"]["metadata"]["category"]
): CategoryEnum => {
  switch (s) {
    case "STANDARD":
    case "SPECIAL":
      return CategoryEnum[s];
    default:
      return CategoryEnum.STANDARD;
  }
};
