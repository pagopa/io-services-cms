import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import { ulidGenerator } from "@pagopa/io-functions-commons/dist/src/utils/strings";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";

type Actions =
  | "requestReview"
  | "requestPublication"
  | "requestHistoricization";

type Action<A extends Actions, B> = Record<A, B>;

type RequestReviewAction = Action<"requestReview", Queue.RequestReviewItem>;
type OnSubmitActions = Action<"requestReview", unknown>;

type RequestPublicationAction = Action<
  "requestPublication",
  Queue.RequestPublicationItem
>;
type OnApproveActions = Action<"requestPublication", unknown>;

type RequestHistoricizationAction = Action<
  "requestHistoricization",
  Queue.RequestHistoricizationItem
>;

const onAnyChangesHandler = (
  item: ServiceLifecycle.ItemType
): RequestHistoricizationAction => ({
  requestHistoricization: {
    ...item,
    last_update:
      item.last_update ?? (new Date().toISOString() as NonEmptyString), // last_update fallback (value is always set by persistence layer) TODO add log
  },
});

const onSubmitHandler = (
  item: ServiceLifecycle.ItemType
): RequestReviewAction => ({
  requestReview: {
    id: item.id,
    data: item.data,
    version: item.version ?? (`ERR_${ulidGenerator()}` as NonEmptyString), // TODO add log
  },
});

const onApproveHandler =
  ({ MAX_ALLOWED_PAYMENT_AMOUNT }: IConfig) =>
  (item: ServiceLifecycle.ItemType): RequestPublicationAction => ({
    requestPublication: {
      id: item.id,
      data: {
        ...item.data,
        max_allowed_payment_amount: MAX_ALLOWED_PAYMENT_AMOUNT,
      },
      autoPublish: ServiceLifecycle.getAutoPublish(item),
    },
  });

// FIXME: fix request historicization action (avoid to call onAnyChangesHandler foreach case)
export const handler =
  (
    config: IConfig
  ): RTE.ReaderTaskEither<
    { item: ServiceLifecycle.ItemType },
    Error,
    | RequestHistoricizationAction
    | ((OnSubmitActions | OnApproveActions) & RequestHistoricizationAction)
  > =>
  ({ item }) => {
    if (item.fsm.lastTransition !== "from Legacy") {
      switch (item.fsm.state) {
        case "submitted":
          return pipe(
            item,
            onSubmitHandler,
            (actions) => ({ ...actions, ...onAnyChangesHandler(item) }),
            TE.right
          );
        case "approved":
          return pipe(
            item,
            onApproveHandler(config),
            (x) => x,
            (actions) => ({ ...actions, ...onAnyChangesHandler(item) }),
            TE.right
          );
        default:
          return TE.right(onAnyChangesHandler(item));
      }
    } else {
      return TE.right(onAnyChangesHandler(item));
    }
  };
