import { ServiceLifecycle } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export type RequestReview = ServiceLifecycle.definitions.Service;

export const handler: RTE.ReaderTaskEither<
  { item: Omit<ServiceLifecycle.ItemType, "fsm"> },
  Error,
  { requestReview: RequestReview }
> = ({ item }) =>
  pipe({ requestReview: { id: item.id, data: item.data } }, TE.right);
