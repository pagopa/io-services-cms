import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestReview" | "other";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestReviewAction = Action<"requestReview", Queue.RequestReviewItem>;
type OnSubmitActions = RequestReviewAction;

const noAction = {};

const onSubmitHandler = (
  item: ServiceLifecycle.ItemType
): RequestReviewAction => ({
  requestReview: { id: item.id, data: item.data },
});

export const handler: RTE.ReaderTaskEither<
  { item: ServiceLifecycle.ItemType },
  Error,
  NoAction | OnSubmitActions
> = ({ item }) => {
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (item.fsm.state) {
    case "submitted":
      return pipe(item, onSubmitHandler, TE.right);
    default:
      return TE.right(noAction);
  }
};
