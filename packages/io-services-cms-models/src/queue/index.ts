import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { Service } from "../service-lifecycle/definitions";

export type RequestReviewItem = t.TypeOf<typeof RequestReviewItem>;
export const RequestReviewItem = t.intersection([
  Service,
  t.type({
    version: NonEmptyString, // version required
  }),
]);

export type RequestPublicationItem = t.TypeOf<typeof RequestPublicationItem>;
export const RequestPublicationItem = Service;

export type RequestHistoryItem = t.TypeOf<typeof RequestHistoryItem>;
export const RequestHistoryItem = t.intersection([
  Service,
  t.type({
    last_update: NonEmptyString, // last_update required
  }),
]);
