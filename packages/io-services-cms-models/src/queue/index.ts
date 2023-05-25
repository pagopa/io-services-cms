import * as t from "io-ts";
import { Service } from "../service-lifecycle/definitions";

export type RequestReviewItem = t.TypeOf<typeof RequestReviewItem>;
export const RequestReviewItem = Service;

export type RequestHistoryItem = t.TypeOf<typeof RequestHistoryItem>;
export const RequestHistoryItem = Service;
