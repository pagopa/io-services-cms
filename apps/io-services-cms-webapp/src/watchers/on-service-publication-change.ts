import { Queue, ServicePublication } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestHistory" | "other";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestHistoryAction = Action<"requestHistory", Queue.RequestHistoryItem>;
type OnReleaseActions = RequestHistoryAction;

const noAction = {};

const onReleaseHandler = (
  item: ServicePublication.ItemType
): RequestHistoryAction => ({
  requestHistory: { id: item.id, data: item.data },
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
