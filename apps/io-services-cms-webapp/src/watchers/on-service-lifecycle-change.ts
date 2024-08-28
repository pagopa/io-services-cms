import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import * as O from "fp-ts/Option";
import * as B from "fp-ts/boolean";
import * as E from "fp-ts/lib/Either";
import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../config";
import { buildRequestHistoricizationQueueMessage } from "../historicizer/request-historicization-handler";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";

type Actions =
  | "requestDeletion"
  | "requestHistoricization"
  | "requestPublication"
  | "requestReview"
  | "requestUnpublication";

type Action<A extends Actions, B> = Record<A, B>;

type RequestReviewAction = Action<"requestReview", Queue.RequestReviewItem>;
type OnSubmitActions = Action<"requestReview", unknown>;

type RequestPublicationAction = Action<
  "requestPublication",
  Queue.RequestPublicationItem
>;
type OnApproveActions = Action<"requestPublication", unknown>;

type RequestDeletionItem = Action<"requestDeletion", Queue.RequestDeletionItem>;
type OnDeleteActions = Action<"requestDeletion", unknown>;

type RequestHistoricizationAction = Action<
  "requestHistoricization",
  Queue.RequestHistoricizationItem
>;

const onAnyChangesHandler = (
  item: ServiceLifecycle.CosmosResource,
): RequestHistoricizationAction => ({
  requestHistoricization: buildRequestHistoricizationQueueMessage(item),
});

const onSubmitHandler = (
  item: ServiceLifecycle.CosmosResource,
): RequestReviewAction => ({
  requestReview: {
    data: item.data,
    id: item.id,
    // eslint-disable-next-line no-underscore-dangle
    version: item._etag,
  },
});

const onApproveHandler =
  ({ MAX_ALLOWED_PAYMENT_AMOUNT }: IConfig) =>
  (item: ServiceLifecycle.CosmosResource): RequestPublicationAction => ({
    requestPublication: {
      autoPublish: ServiceLifecycle.getAutoPublish(item),
      data: {
        ...item.data,
        max_allowed_payment_amount: MAX_ALLOWED_PAYMENT_AMOUNT,
      },
      id: item.id,
    },
  });

const onDeleteHandler = (
  item: ServiceLifecycle.CosmosResource,
): RequestDeletionItem => ({
  requestDeletion: {
    id: item.id,
  },
});

const getSpecificAction =
  (config: IConfig) =>
  (
    item: ServiceLifecycle.CosmosResource,
  ): O.Option<OnApproveActions | OnDeleteActions | OnSubmitActions> => {
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

// Intecept service-lifecycle changes and take the following actions:
// - When a service is submitted, we should validate by invoking the OnRequestValidation function via the request-validation queue
// - When a service is approved, we should release by invoking the OnRequestPublication function via the it in reques-publication queue
// - When a service is deleted, we should delete from publication by invoking the OnRequestDeletion function via the it in request-deletion queue
// - In any case we should historicize the change by invocking the OnRequestHistoricization function via the it in request-historicization queue
export const handler =
  (
    config: IConfig,
  ): RE.ReaderEither<
    { item: ServiceLifecycle.CosmosResource },
    Error,
    | ((OnApproveActions | OnDeleteActions | OnSubmitActions) &
        RequestHistoricizationAction)
    | RequestHistoricizationAction
  > =>
  ({ item }) =>
    pipe(
      item,
      // always historicize service-lifecycle changes
      onAnyChangesHandler,
      E.right,
      E.chain((historicizationAction) =>
        pipe(
          // process all changes except the one synced from legacy and not delete, those are already handled on the legacy service sync flow
          item.fsm.lastTransition !== SYNC_FROM_LEGACY ||
            item.fsm.state === "deleted",
          B.fold(
            () => E.right(historicizationAction),
            () =>
              pipe(
                item,
                // get change specific action
                getSpecificAction(config),
                O.fold(
                  () => E.right(historicizationAction),
                  (specificAction) =>
                    E.right({ ...specificAction, ...historicizationAction }),
                ),
              ),
          ),
        ),
      ),
    );
