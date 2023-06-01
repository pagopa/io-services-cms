import { Queue, ServicePublication } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

type Actions = "requestHistory";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestHistoryAction = Action<"requestHistory", Queue.RequestHistoryItem>;
type OnReleaseActions = RequestHistoryAction;

const noAction = {};

const onReleaseHandler = (
  item: ServicePublication.ItemType
): RequestHistoryAction => ({
  requestHistory: {
    ...item,
    last_update:
      item.last_update ?? (new Date().toISOString() as NonEmptyString), // last_update fallback (value is always set by persistence layer) TODO add log
  },
});

export const handler: RTE.ReaderTaskEither<
  { item: ServicePublication.ItemType },
  Error,
  NoAction | OnReleaseActions
> = ({ item }) => {
  switch (item.fsm.state) {
    case "unpublished":
    case "published":
      return pipe(item, onReleaseHandler, TE.right);
    default:
      return TE.right(noAction);
  }
};
