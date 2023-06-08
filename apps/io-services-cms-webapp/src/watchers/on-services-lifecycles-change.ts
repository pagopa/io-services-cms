import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import { ulidGenerator } from "@pagopa/io-functions-commons/dist/src/utils/strings";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestReview" | "requestPublication";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;

type RequestReviewAction = Action<"requestReview", Queue.RequestReviewItem>;
type OnSubmitActions = Action<"requestReview", unknown>;

type RequestPublicationAction = Action<
  "requestPublication",
  Queue.RequestPublicationItem
>;
type OnApproveActions = Action<"requestPublication", unknown>;

const noAction = {};

const onSubmitHandler = (
  item: ServiceLifecycle.ItemType
): RequestReviewAction => ({
  requestReview: {
    id: item.id,
    data: item.data,
    version: item.version ?? (`ERR_${ulidGenerator()}` as NonEmptyString), // TODO add log
  },
});

const onApproveHandler = (
  item: ServiceLifecycle.ItemType
): RequestPublicationAction => ({
  requestPublication: {
    id: item.id,
    data: item.data,
    autoPublish: (item.fsm.autoPublish as boolean) ?? false,
  },
});

export const handler: RTE.ReaderTaskEither<
  { item: ServiceLifecycle.ItemType },
  Error,
  NoAction | OnSubmitActions | OnApproveActions
> = ({ item }) => {
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (item.fsm.state) {
    case "submitted":
      return pipe(item, onSubmitHandler, TE.right);
    case "approved":
      return pipe(item, onApproveHandler, TE.right);
    default:
      return TE.right(noAction);
  }
};
