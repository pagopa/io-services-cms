import {
  ServiceListItem,
  VisibilityEnum
} from "@/generated/api/ServiceListItem";
import {
  CategoryEnum,
  ScopeEnum
} from "@/generated/services-cms/ServiceBaseMetadata";
import { ServiceLifecycleStatus } from "@/generated/services-cms/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/services-cms/ServiceLifecycleStatusType";
import { ServiceTopic } from "@/generated/services-cms/ServiceTopic";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import {
  NonEmptyString,
  OrganizationFiscalCode
} from "@pagopa/ts-commons/lib/strings";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { Institution } from "../../../../types/next-auth";

export const MISSING_SERVICE_NAME = "Servizio non disponibile" as NonEmptyString;
export const MISSING_SERVICE_DESCRIPTION = "Descrizione non disponibile" as NonEmptyString;
export const MISSING_SERVICE_ORGANIZATION = "Istituzione non disponibile" as NonEmptyString;

export const reducePublicationServicesList = (
  publicationServices: ReadonlyArray<ServicePublication.ItemType>
) =>
  pipe(
    publicationServices,
    RA.map(item => [item.id, item.fsm.state] as [string, VisibilityEnum]),
    arr =>
      arr.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, VisibilityEnum>)
  );

export const toServiceListItem = (topicsMap: Record<string, ServiceTopic>) => ({
  fsm,
  data,
  id,
  last_update_ts
}: ServiceLifecycle.ItemType): ServiceListItem => {
  const { topic_id, ...otherMetadata } = data.metadata;
  return {
    id,
    status: toServiceStatus(fsm),
    last_update: last_update_ts
      ? (new Date(last_update_ts * 1000).toISOString() as NonEmptyString)
      : new Date().toISOString(),
    name: data.name,
    description: data.description,
    organization: data.organization,
    metadata: {
      ...otherMetadata,
      scope: toScopeType(otherMetadata.scope),
      category: toCategoryType(otherMetadata.category),
      topic: decodeServiceTopic(topic_id, topicsMap)
    },
    authorized_recipients: data.authorized_recipients,
    authorized_cidrs: data.authorized_cidrs
  };
};

const toServiceStatus = (
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
        reason: (fsm.reason as string) ?? undefined // FIXME
      };

    default:
      const _: never = fsm;
      return ServiceLifecycleStatusTypeEnum[fsm];
  }
};

const toScopeType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["scope"]
): ScopeEnum => {
  switch (s) {
    case "LOCAL":
    case "NATIONAL":
      return ScopeEnum[s];
    default:
      const _: never = s;
      return ScopeEnum[s];
  }
};

const toCategoryType = (
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

const decodeServiceTopic = (
  topic_id: number | undefined,
  topicsMap: Record<string, ServiceTopic>
): ServiceTopic | undefined => {
  if (topic_id !== undefined && topic_id !== null) {
    return topicsMap[topic_id.toString()];
  }
  return undefined;
};

export const buildMissingService = (
  serviceId: string,
  institution: Institution,
  lastUpdate = new Date()
): ServiceListItem => ({
  id: serviceId,
  status: { value: ServiceLifecycleStatusTypeEnum.deleted },
  last_update: lastUpdate.toISOString(),
  name: MISSING_SERVICE_NAME,
  description: MISSING_SERVICE_DESCRIPTION,
  organization: {
    name: (institution.name as NonEmptyString) ?? MISSING_SERVICE_ORGANIZATION,
    fiscal_code: (institution.fiscalCode ??
      "00000000000") as OrganizationFiscalCode
  },
  metadata: {
    scope: ScopeEnum.LOCAL,
    category: CategoryEnum.STANDARD
  },
  authorized_recipients: [],
  authorized_cidrs: []
});

export const reduceServiceTopicsList = (
  topics: ReadonlyArray<ServiceTopic> | undefined
): Record<string, ServiceTopic> =>
  topics
    ? topics.reduce((acc, topic) => {
        acc[topic.id] = topic;
        return acc;
      }, {} as Record<string, ServiceTopic>)
    : ({} as Record<string, ServiceTopic>);
