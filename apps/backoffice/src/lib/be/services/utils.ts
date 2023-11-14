import {
  ServiceListItem,
  VisibilityEnum
} from "@/generated/api/ServiceListItem";
import { ServiceLifecycleStatus } from "@/generated/services-cms/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/services-cms/ServiceLifecycleStatusType";
import {
  CategoryEnum,
  ScopeEnum
} from "@/generated/services-cms/ServiceMetadata";
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

export const toServiceListItem = ({
  fsm,
  data,
  id,
  last_update
}: ServiceLifecycle.ItemType): ServiceListItem => ({
  id,
  status: toServiceStatus(fsm),
  last_update: last_update ?? new Date().getTime().toString(),
  name: data.name,
  description: data.description,
  organization: data.organization,
  metadata: {
    ...data.metadata,
    scope: toScopeType(data.metadata.scope),
    category: toCategoryType(data.metadata.category)
  },
  authorized_recipients: data.authorized_recipients,
  authorized_cidrs: data.authorized_cidrs
});

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

export const buildMissingService = (
  serviceId: string,
  institution: Institution,
  lastUpdate = new Date()
): ServiceListItem => ({
  id: serviceId,
  status: { value: ServiceLifecycleStatusTypeEnum.deleted },
  last_update: lastUpdate.getTime().toString(),
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
