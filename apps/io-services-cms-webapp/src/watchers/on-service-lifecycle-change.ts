import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import { ulidGenerator } from "@pagopa/io-functions-commons/dist/src/utils/strings";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as RE from "fp-ts/lib/ReaderEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/Option";
import * as B from "fp-ts/boolean";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";

type Actions =
  | "requestReview"
  | "requestPublication"
  | "requestUnpublication"
  | "requestHistoricization";

type Action<A extends Actions, B> = Record<A, B>;

type RequestReviewAction = Action<"requestReview", Queue.RequestReviewItem>;
type OnSubmitActions = Action<"requestReview", unknown>;

type RequestPublicationAction = Action<
  "requestPublication",
  Queue.RequestPublicationItem
>;
type OnApproveActions = Action<"requestPublication", unknown>;

type RequestUnpublicationItem = Action<
  "requestPublication",
  Queue.RequestUnpublicationItem
>;
type OnDeleteActions = Action<"requestPublication", unknown>;

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
      kind: "RequestPublicationItem",
    },
  });

const onDeleteHandler = (
  item: ServiceLifecycle.ItemType
): RequestUnpublicationItem => ({
  requestPublication: {
    id: item.id,
    kind: "RequestUnpublicationItem",
  },
});

const getSpecificAction =
  (config: IConfig) =>
  (
    item: ServiceLifecycle.ItemType
  ): O.Option<OnSubmitActions | OnApproveActions | OnDeleteActions> => {
    switch (item.fsm.state) {
      case "submitted":
        return pipe(item, onSubmitHandler, O.some);
      case "approved":
        return pipe(item, onApproveHandler(config), O.some);
      case "deleted":
        return pipe(item, onDeleteHandler, O.some);
      default:
        return O.none;
    }
  };

export const handler =
  (
    config: IConfig
  ): RE.ReaderEither<
    { item: ServiceLifecycle.ItemType },
    Error,
    | RequestHistoricizationAction
    | ((OnSubmitActions | OnApproveActions | OnDeleteActions) &
        RequestHistoricizationAction)
  > =>
  ({ item }) =>
    pipe(
      item,
      onAnyChangesHandler,
      E.right,
      E.chain((historicizationAction) =>
        pipe(
          item.fsm.lastTransition !== SYNC_FROM_LEGACY ||
            item.fsm.state === "deleted",
          B.fold(
            () => E.right(historicizationAction),
            () =>
              pipe(
                item,
                getSpecificAction(config),
                O.fold(
                  () => E.right(historicizationAction),
                  (specificAction) =>
                    E.right({ ...specificAction, ...historicizationAction })
                )
              )
          )
        )
      )
    );
