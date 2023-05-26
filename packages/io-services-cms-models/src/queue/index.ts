import * as t from "io-ts";
import { Service } from "../service-lifecycle/definitions";

export type RequestReviewItem = t.TypeOf<typeof RequestReviewItem>;
export const RequestReviewItem = Service;

export type RequestPublicationItem = t.TypeOf<typeof RequestPublicationItem>;
export const RequestPublicationItem = Service;

export type RequestHistoryItem = t.TypeOf<typeof RequestHistoryItem>;
export const RequestHistoryItem = Service;
