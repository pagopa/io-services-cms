import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json, option } from "io-ts-types";
import lodash from "lodash";
import { IConfig, ServiceValidationConfig } from "../config";

const noAction = {};
type NoAction = typeof noAction;
type Actions = "requestReview";
type Action<A extends Actions, B> = Record<A, B>;
type RequestReviewAction = Action<"requestReview", Json>;

type ValidationError = {
  serviceId: Queue.RequestReviewItem["id"];
  reason: string;
};

type ValidSecureChannelFalseConfig = t.TypeOf<
  typeof ValidSecureChannelFalseConfig
>;
const ValidSecureChannelFalseConfig = t.type({
  data: t.intersection([
    t.type({
      require_secure_channel: t.literal(false),
    }),
    t.type({
      metadata: t.type({
        privacy_url: t.union([t.null, t.undefined]),
      }),
    }),
  ]),
});

type ValidSecureChannelTrueConfig = t.TypeOf<
  typeof ValidSecureChannelTrueConfig
>;
const ValidSecureChannelTrueConfig = t.type({
  data: t.intersection([
    t.type({
      require_secure_channel: t.literal(true),
    }),
    t.type({
      metadata: t.type({
        privacy_url: option(
          Queue.RequestReviewItemStrict.types[0].types[0].props.data.types[1]
            .props.metadata.types[1].props.privacy_url
        ),
      }),
    }),
  ]),
});

type ValidSecureChannelService = t.TypeOf<typeof ValidSecureChannelService>;
const ValidSecureChannelService = t.union([
  ValidSecureChannelFalseConfig,
  ValidSecureChannelTrueConfig,
]);

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestReviewItem> =>
  pipe(
    queueItem,
    Queue.RequestReviewItem.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

const validate = (
  item: Queue.RequestReviewItem
): E.Either<ValidationError, Queue.RequestReviewItemStrict> =>
  pipe(
    item,
    ValidSecureChannelService.decode,
    E.chain(flow(Queue.RequestReviewItemStrict.decode)),
    E.mapLeft(
      flow(readableReport, (errorMessage) => ({
        serviceId: item.id,
        reason: errorMessage,
      }))
    )
  );

const onRequestManualValidationHandler = (item: Json): RequestReviewAction => ({
  requestReview: item,
});

const isManualReviewRequested =
  (config: ServiceValidationConfig) =>
  (origin: ServicePublication.ItemType, comparand: Json): boolean =>
    pipe(
      config.MANUAL_REVIEW_PROPERTIES,
      RA.map((path) => lodash.matchesProperty(path, lodash.get(origin, path))),
      RA.some((matchesPropertyFn) => !pipe(comparand, matchesPropertyFn))
    );

const onRequestApproveHandler =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient) =>
  (
    serviceId: ServiceLifecycle.definitions.ServiceId
  ): TE.TaskEither<ServiceLifecycle.AllFsmErrors, NoAction> =>
    pipe(
      fsmLifecycleClient.approve(serviceId, {
        approvalDate: new Date().toISOString(),
      }),
      TE.map((_) => noAction)
    );

const onRequestRejectHandler =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient) =>
  (
    error: ValidationError
  ): TE.TaskEither<ServiceLifecycle.AllFsmErrors, NoAction> =>
    pipe(
      fsmLifecycleClient.reject(error.serviceId, {
        reason: error.reason,
      }),
      TE.map((_) => noAction)
    );

export const createServiceValidationHandler =
  (
    config: IConfig,
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    fsmPublicationClient: ServicePublication.FsmClient
  ): RTE.ReaderTaskEither<
    { item: Json },
    Error,
    NoAction | RequestReviewAction
  > =>
  ({ item }) =>
    pipe(
      item,
      parseIncomingMessage,
      E.chainW(validate),
      TE.fromEither,
      TE.chainW((validService) =>
        pipe(validService.id, fsmPublicationClient.getStore().fetch)
      ),
      TE.chainW(
        O.fold(
          () => pipe(item, onRequestManualValidationHandler, TE.right),
          (servicePub) =>
            isManualReviewRequested(config)(servicePub, item)
              ? pipe(item, onRequestManualValidationHandler, TE.right)
              : onRequestApproveHandler(fsmLifecycleClient)(servicePub.id)
        )
      ),
      TE.orElse((error) => {
        if ("reason" in error) {
          return onRequestRejectHandler(fsmLifecycleClient)(error);
        } else {
          return TE.left(error);
        }
      })
    );
