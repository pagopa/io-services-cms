import { ServiceLifecycle } from "@io-services-cms/models";
import {
  IResponseErrorInternal,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { TopicPostgreSqlConfig } from "../../config";
import { Cidr } from "../../generated/api/Cidr";
import { FiscalCode } from "../../generated/api/FiscalCode";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import {
  CategoryEnum,
  ScopeEnum,
} from "../../generated/api/ServiceBaseMetadata";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import { getDao as getServiceTopicDao } from "../service-topic-dao";

export const payloadToItem = (
  id: ServiceLifecycle.definitions.Service["id"],
  {
    require_secure_channel = false,
    max_allowed_payment_amount = 0 as NonNullable<
      ServiceRequestPayload["max_allowed_payment_amount"]
    >,
    authorized_recipients = [] as ReadonlyArray<FiscalCode>,
    authorized_cidrs = [] as ReadonlyArray<Cidr>,
    metadata = {} as ServiceRequestPayload["metadata"],
    ...data
  }: ServiceRequestPayload,
  sandboxFiscalCode: FiscalCode
): ServiceLifecycle.definitions.Service => ({
  id,
  data: {
    ...data,
    require_secure_channel,
    max_allowed_payment_amount,
    authorized_recipients: [sandboxFiscalCode, ...authorized_recipients],
    authorized_cidrs: [...authorized_cidrs],
    metadata: { ...metadata, category: toCategoryType(metadata.category) },
  },
});

export const itemToResponse =
  (dbConfig: TopicPostgreSqlConfig) =>
  ({
    fsm,
    data: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata: { scope, category, custom_special_flow, topic_id, ...metadata },
      ...data
    },
    id,
    last_update,
  }: ServiceLifecycle.ItemType): TE.TaskEither<
    IResponseErrorInternal,
    ServiceResponsePayload
  > =>
    pipe(
      toServiceTopic(dbConfig)(id, topic_id),
      TE.bimap(
        (err) => ResponseErrorInternal(err.message),
        (topic) => ({
          id,
          status: toServiceStatus(fsm),
          last_update: last_update ?? new Date().getTime().toString(),
          ...data,
          metadata: {
            ...metadata,
            scope: toScopeType(scope),
            topic,
          },
        })
      )
    );

const toServiceTopic =
  (dbConfig: TopicPostgreSqlConfig) =>
  (
    serviceId: ServiceLifecycle.ItemType["id"],
    topicId: ServiceLifecycle.ItemType["data"]["metadata"]["topic_id"]
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

export const toServiceStatus = (
  fsm: ServiceLifecycle.ItemType["fsm"]
): ServiceLifecycleStatus => {
  switch (fsm.state) {
    case "approved":
    case "deleted":
    case "draft":
    case "submitted":
      return { value: ServiceLifecycleStatusTypeEnum[fsm.state] };
    case "rejected":
      return {
        value: ServiceLifecycleStatusTypeEnum[fsm.state],
        reason: (fsm.reason as string) ?? undefined, // FIXME
      };

    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = fsm;
      return ServiceLifecycleStatusTypeEnum[fsm];
  }
};

export const toScopeType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["scope"]
): ScopeEnum => {
  switch (s) {
    case "LOCAL":
    case "NATIONAL":
      return ScopeEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = s;
      return ScopeEnum[s];
  }
};

export const toCategoryType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["category"]
): CategoryEnum => {
  switch (s) {
    case "STANDARD":
    case "SPECIAL":
      return CategoryEnum[s];
    default:
      return CategoryEnum.STANDARD;
  }
};
