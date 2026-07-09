import { DateUtils, ServiceLifecycle } from "@io-services-cms/models";
import {
  IResponseErrorInternal,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig, TopicPostgreSqlConfig } from "../../config";
import { Cidr } from "../../generated/api/Cidr";
import { FiscalCode } from "../../generated/api/FiscalCode";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import { getDao as getServiceTopicDao } from "../service-topic-dao";
import {
  toScopeType,
  withSuitableForMinors,
} from "./service-common-converters";

// Min age for a service is 14 years old
const SUITABLE_FOR_MINORS_MIN_AGE = 14;

export const payloadToItem = (
  id: ServiceLifecycle.definitions.Service["id"],
  {
    authorized_cidrs = [] as readonly Cidr[],
    authorized_recipients = [] as readonly FiscalCode[],
    max_allowed_payment_amount = 0 as NonNullable<
      ServiceRequestPayload["max_allowed_payment_amount"]
    >,
    metadata = {} as ServiceRequestPayload["metadata"],
    require_secure_channel = false,
    suitable_for_minors,
    ...data
  }: ServiceRequestPayload,
  sandboxFiscalCode: FiscalCode,
): ServiceLifecycle.definitions.Service => ({
  data: {
    ...data,
    age: suitableForMinorsToAge(suitable_for_minors),
    authorized_cidrs: [...authorized_cidrs],
    authorized_recipients: calculateItemAuthorizedRecipients(
      authorized_recipients,
      sandboxFiscalCode,
    ),
    max_allowed_payment_amount,
    metadata,
    require_secure_channel,
  },
  id,
});

const calculateItemAuthorizedRecipients = (
  authorizedRecipients: readonly FiscalCode[],
  sandboxFiscalCode: FiscalCode,
) =>
  authorizedRecipients.includes(sandboxFiscalCode)
    ? [...authorizedRecipients]
    : [...authorizedRecipients, sandboxFiscalCode];

/**
 * API DTO => Service Lifecycle age mapping
 * If a service is suitable, the min age is set to 14.
 * No max age is set
 *
 * @param suitableForMinors
 * @returns ServiceLifecycle.definitions.Service["data"]["age"]
 */
const suitableForMinorsToAge = (
  suitableForMinors: ServiceRequestPayload["suitable_for_minors"],
): ServiceLifecycle.definitions.Service["data"]["age"] =>
  suitableForMinors
    ? {
        min: SUITABLE_FOR_MINORS_MIN_AGE as NonNullable<
          ServiceLifecycle.definitions.Age["min"]
        >,
      }
    : undefined;

export const itemToResponse =
  (
    config: Pick<IConfig, "FF_SUITABLE_FOR_MINORS_ENABLED"> &
      TopicPostgreSqlConfig,
  ) =>
  ({
    data: {
      age,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata: { category, custom_special_flow, scope, topic_id, ...metadata },
      ...data
    },
    fsm,
    id,
    modified_at,
  }: ServiceLifecycle.ItemType): TE.TaskEither<
    IResponseErrorInternal,
    ServiceResponsePayload
  > =>
    pipe(
      toServiceTopic(config)(id, topic_id),
      TE.bimap(
        (err) => ResponseErrorInternal(err.message),
        (topic) => ({
          id,
          last_update: modified_at
            ? DateUtils.isoStringfromUnixMillis(modified_at)
            : new Date().toISOString(),
          status: toServiceStatus(fsm),
          ...withSuitableForMinors(config)(age),
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
    serviceId: ServiceLifecycle.ItemType["id"],
    topicId: ServiceLifecycle.ItemType["data"]["metadata"]["topic_id"],
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

export const toServiceStatus = (
  fsm: ServiceLifecycle.ItemType["fsm"],
): ServiceLifecycleStatus => {
  switch (fsm.state) {
    case "approved":
    case "deleted":
    case "draft":
    case "submitted":
      return { value: ServiceLifecycleStatusTypeEnum[fsm.state] };
    case "rejected":
      return {
        reason: (fsm.reason as string) ?? undefined, // FIXME
        value: ServiceLifecycleStatusTypeEnum[fsm.state],
      };

    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations
      const _: never = fsm;
      return ServiceLifecycleStatusTypeEnum[fsm];
  }
};
