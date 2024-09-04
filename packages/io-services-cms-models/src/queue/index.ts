import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { LegacyService } from "../service-legacy";
import { ItemType as LifecycleItemType } from "../service-lifecycle";
import {
  Service,
  ServiceId,
  ServiceQualityStrict,
  ServiceStrict,
} from "../service-lifecycle/definitions";
import { ItemType as PublicationItemType } from "../service-publication";

export type RequestReviewItem = t.TypeOf<typeof RequestReviewItem>;
export const RequestReviewItem = t.intersection([
  Service,
  t.type({
    version: NonEmptyString, // version required
  }),
]);

export type RequestDetailItem = t.TypeOf<typeof RequestDetailItem>;
export const RequestDetailItem = t.intersection([
  Service,
  t.type({
    cms_modified_at: t.Integer, // this will be used to value the version field on the serviceDetails(pp-backend api)
    kind: t.union([t.literal("publication"), t.literal("lifecycle")]),
  }),
]);

export type RequestReviewItemStrict = t.TypeOf<typeof RequestReviewItemStrict>;
export const RequestReviewItemStrict = t.intersection([
  ServiceStrict,
  t.type({
    version: NonEmptyString, // version required
  }),
]);

export type RequestReviewItemQualityStrict = t.TypeOf<
  typeof RequestReviewItemQualityStrict
>;
export const RequestReviewItemQualityStrict = t.intersection([
  ServiceQualityStrict,
  t.type({
    version: NonEmptyString, // version required
  }),
]);

export type RequestPublicationItem = t.TypeOf<typeof RequestPublicationItem>;
export const RequestPublicationItem = t.intersection([
  Service,
  t.type({
    autoPublish: t.boolean, // autoPublish required
  }),
]);

export type RequestDeletionItem = t.TypeOf<typeof RequestDeletionItem>;
export const RequestDeletionItem = t.type({
  id: ServiceId,
});

export type RequestHistoricizationItem = t.TypeOf<
  typeof RequestHistoricizationItem
>;
export const RequestHistoricizationItem = t.intersection([
  t.union([LifecycleItemType, PublicationItemType]),
  t.type({
    modified_at: t.Integer,
  }),
]);

export type RequestSyncCmsItem = t.TypeOf<typeof RequestSyncCmsItem>;
export const RequestSyncCmsItem = t.union([
  t.intersection([
    LifecycleItemType,
    t.type({
      kind: t.literal("LifecycleItemType"),
    }),
  ]),
  t.intersection([
    PublicationItemType,
    t.type({
      kind: t.literal("PublicationItemType"),
    }),
  ]),
]);

export type RequestSyncCmsItems = t.TypeOf<typeof RequestSyncCmsItems>;
export const RequestSyncCmsItems = t.readonlyArray(RequestSyncCmsItem);

const omitIsVisible = <T extends Record<string, unknown>>(
  t: T,
): Omit<T, "isVisible"> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isVisible, ...rest } = t;
  return rest;
};

export type RequestSyncLegacyItem = t.TypeOf<typeof RequestSyncLegacyItem>;
export const RequestSyncLegacyItem = t.intersection([
  t.type({
    ...omitIsVisible(LegacyService.types[0].types[0].props),
    ...LegacyService.types[0].types[1].props,
    ...LegacyService.types[2].props,
  }),
  t.partial({ isVisible: t.boolean }),
]);

export type RequestReviewLegacyItem = t.TypeOf<typeof RequestReviewLegacyItem>;
export const RequestReviewLegacyItem = t.type({
  apimUserId: NonEmptyString,
  isNewTicket: t.boolean,
  serviceId: NonEmptyString,
  ticketId: NonEmptyString,
  ticketKey: NonEmptyString,
});
