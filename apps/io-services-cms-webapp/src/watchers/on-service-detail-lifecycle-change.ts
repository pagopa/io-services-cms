import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestDetailLifecycle";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestDetailLifecycleAction = Action<
  "requestDetailLifecycle",
  Queue.RequestDetailItem
>;
type OnDetailLifecycleActions = RequestDetailLifecycleAction;

const noAction = {};

const onDetailLifecycleHandler = (
  item: ServiceLifecycle.ItemType
): RequestDetailLifecycleAction => ({
  requestDetailLifecycle: {
    ...item,
    kind: "lifecycle",
  },
});

export const handler: RTE.ReaderTaskEither<
  { item: ServiceLifecycle.ItemType },
  Error,
  NoAction | OnDetailLifecycleActions
> = ({ item }) => {
  switch (item.fsm.state) {
    case "draft":
      return pipe(item, onDetailLifecycleHandler, TE.right);
    case "approved":
    case "deleted":
    case "rejected":
    case "submitted":
      return TE.right(noAction);
    default:
      return TE.right(noAction);
  }
};
