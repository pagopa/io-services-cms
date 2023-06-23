import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { Service } from "../service-lifecycle/definitions";
import { ItemType as LifecycleItemType } from "../service-lifecycle";
import { ItemType as PublicationItemType } from "../service-publication";

export type RequestReviewItem = t.TypeOf<typeof RequestReviewItem>;
export const RequestReviewItem = t.intersection([
  Service,
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

export type RequestHistoricizationItem = t.TypeOf<
  typeof RequestHistoricizationItem
>;
export const RequestHistoricizationItem = t.intersection([
  Service,
  t.type({
    last_update: NonEmptyString, // last_update required
  }),
]);

export type RequestSyncCmsItem = LifecycleItemType | PublicationItemType;
