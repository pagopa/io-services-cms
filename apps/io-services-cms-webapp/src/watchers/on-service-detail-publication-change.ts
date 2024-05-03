import { Queue, ServicePublication } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestDetailPublication";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestDetailPublicationAction = Action<
  "requestDetailPublication",
  Queue.RequestDetailItem
>;
type OnDetailPublicationActions = RequestDetailPublicationAction;

const noAction = {};

const onDetailPublicationHandler = (
  item: ServicePublication.ItemType
): RequestDetailPublicationAction => ({
  requestDetailPublication: {
    ...item,
    kind: "publication",
  },
});

export const handler: RTE.ReaderTaskEither<
  { item: ServicePublication.ItemType },
  Error,
  NoAction | OnDetailPublicationActions
> = ({ item }) => {
  switch (item.fsm.state) {
    case "unpublished":
      return TE.right(noAction);
    case "published":
      return pipe(item, onDetailPublicationHandler, TE.right);
    default:
      return TE.right(noAction);
  }
};
