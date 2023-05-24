import * as t from "io-ts";
import { Service } from "../service-lifecycle/definitions";

export type RequestReviewItem = t.TypeOf<typeof RequestReviewItem>;
export const RequestReviewItem = Service;
