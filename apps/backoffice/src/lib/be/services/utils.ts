import {
  ServiceListItem,
  VisibilityEnum,
} from "@/generated/api/ServiceListItem";
import {
  CategoryEnum,
  ScopeEnum,
} from "@/generated/services-cms/ServiceBaseMetadata";
import { ServiceLifecycleStatus } from "@/generated/services-cms/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/services-cms/ServiceLifecycleStatusType";
import { ServiceTopic } from "@/generated/services-cms/ServiceTopic";
import {
  DateUtils,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import {
  NonEmptyString,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";

import { Institution } from "../../../../types/next-auth";

export const MISSING_SERVICE_NAME =
  "Servizio non disponibile" as NonEmptyString;
export const MISSING_SERVICE_DESCRIPTION =
  "Descrizione non disponibile" as NonEmptyString;
export const MISSING_SERVICE_ORGANIZATION =
  "Istituzione non disponibile" as NonEmptyString;

export const reducePublicationServicesList = (
  publicationServices: readonly ServicePublication.ItemType[],
) =>
  pipe(
    publicationServices,
    RA.map((item) => [item.id, item.fsm.state] as [string, VisibilityEnum]),
    (arr) =>
      arr.reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, VisibilityEnum>,
      ),
  );

export const toServiceListItem =
  (topicsMap: Record<string, ServiceTopic>) =>
  ({
    data,
    fsm,
    id,
    modified_at,
  }: ServiceLifecycle.ItemType): ServiceListItem => {
    const { topic_id, ...otherMetadata } = data.metadata;
    return {
      authorized_cidrs: data.authorized_cidrs,
      authorized_recipients: data.authorized_recipients,
      description: data.description,
      id,
      last_update: modified_at
        ? (DateUtils.isoStringfromUnixMillis(modified_at) as NonEmptyString)
        : new Date().toISOString(),
      metadata: {
        ...otherMetadata,
        category: toCategoryType(otherMetadata.category),
        scope: toScopeType(otherMetadata.scope),
        topic: decodeServiceTopic(topic_id, topicsMap),
      },
      name: data.name,
      organization: data.organization,
      status: toServiceStatus(fsm),
    };
  };

const toServiceStatus = (
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
      // eslint-disable-next-line no-case-declarations
      const _: never = fsm;
      return ServiceLifecycleStatusTypeEnum[fsm];
  }
};

const toScopeType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["scope"],
): ScopeEnum => {
  switch (s) {
    case "LOCAL":
    case "NATIONAL":
      return ScopeEnum[s];
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = s;
      return ScopeEnum[s];
  }
};

const toCategoryType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["category"],
): CategoryEnum => {
  switch (s) {
    case "STANDARD":
    case "SPECIAL":
      return CategoryEnum[s];
    default:
      return CategoryEnum.STANDARD;
  }
};

const decodeServiceTopic = (
  topic_id: number | undefined,
  topicsMap: Record<string, ServiceTopic>,
): ServiceTopic | undefined => {
  if (topic_id !== undefined && topic_id !== null) {
    return topicsMap[topic_id.toString()];
  }
  return undefined;
};

export const buildMissingService = (
  serviceId: string,
  institution: Institution,
  lastUpdate = new Date(),
): ServiceListItem => ({
  authorized_cidrs: [],
  authorized_recipients: [],
  description: MISSING_SERVICE_DESCRIPTION,
  id: serviceId,
  last_update: lastUpdate.toISOString(),
  metadata: {
    category: CategoryEnum.STANDARD,
    scope: ScopeEnum.LOCAL,
  },
  name: MISSING_SERVICE_NAME,
  organization: {
    fiscal_code: (institution.fiscalCode ??
      "00000000000") as OrganizationFiscalCode,
    name: (institution.name as NonEmptyString) ?? MISSING_SERVICE_ORGANIZATION,
  },
  status: { value: ServiceLifecycleStatusTypeEnum.deleted },
});

export const reduceServiceTopicsList = (
  topics: readonly ServiceTopic[] | undefined,
): Record<string, ServiceTopic> =>
  topics
    ? topics.reduce(
        (acc, topic) => {
          acc[topic.id] = topic;
          return acc;
        },
        {} as Record<string, ServiceTopic>,
      )
    : ({} as Record<string, ServiceTopic>);
