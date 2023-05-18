import * as t from "io-ts";
import { ServiceLifecycle } from "..";

export type RequestReviewItem = t.TypeOf<typeof RequestReviewItem>;
export const RequestReviewItem = ServiceLifecycle.definitions.Service;
