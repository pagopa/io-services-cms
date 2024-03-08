import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json } from "io-ts-types";
import lodash from "lodash";
import { IConfig, ServiceValidationConfig } from "../config";
import { TelemetryClient } from "../utils/applicationinsight";
import { CosmosHelper } from "../utils/cosmos-helper";

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
        tos_url: t.union([t.null, t.undefined]),
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
        tos_url:
          Queue.RequestReviewItemStrict.types[0].types[0].props.data.types[1]
            .props.metadata.types[1].props.tos_url,
      }),
    }),
  ]),
});

type ValidSecureChannelService = t.TypeOf<typeof ValidSecureChannelService>;
const ValidSecureChannelService = t.union([
  ValidSecureChannelFalseConfig,
  ValidSecureChannelTrueConfig,
]);

const EVENT_PREFIX = "services-cms.review";

enum EventNameEnum {
  AutoApprove = `${EVENT_PREFIX}.auto-approve`,
  AutoReject = `${EVENT_PREFIX}.auto-reject`,
  Manual = `${EVENT_PREFIX}.manual`,
}

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

const validateDuplicates =
  (servicePublicationCosmosHelper: CosmosHelper) =>
  (
    item: Queue.RequestReviewItemStrict
  ): TE.TaskEither<Error | ValidationError, Queue.RequestReviewItemStrict> =>
    pipe(
      servicePublicationCosmosHelper.fetchSingleItem(
        {
          query: `SELECT c.id FROM c WHERE c.data.name = @serviceName AND c.data.organization.fiscal_code = @organizationFiscalCode AND c.serviceId != @currentServiceId`,
          parameters: [
            {
              name: "@serviceName",
              value: item.data.name,
            },
            {
              name: "@organizationFiscalCode",
              value: item.data.organization.fiscal_code,
            },
            {
              name: "@currentServiceId",
              value: item.id,
            },
          ],
        },
        NonEmptyString
      ),
      TE.chainW((queryResult) =>
        pipe(
          queryResult,
          O.fold(
            () => TE.right(item),
            (result) =>
              TE.left({
                serviceId: item.id,
                reason: `A service having name '${item.data.name}' already exists, ID ${result}, for the organization ${item.data.organization.name}`,
              })
          )
        )
      )
    );

const onRequestManualValidationHandler =
  (telemetryClient: TelemetryClient) =>
  ({
    item,
    serviceId,
  }: {
    item: Json;
    serviceId: ServiceLifecycle.definitions.ServiceId;
  }): RequestReviewAction =>
    pipe(
      telemetryClient.trackEvent({
        name: EventNameEnum.Manual,
        properties: { serviceId },
      }),
      (_) => ({
        requestReview: item,
      })
    );

const isManualReviewRequested =
  (config: ServiceValidationConfig) =>
  (origin: ServicePublication.ItemType, comparand: Json): boolean =>
    pipe(
      config.MANUAL_REVIEW_PROPERTIES,
      RA.map((path) => lodash.matchesProperty(path, lodash.get(origin, path))),
      RA.some((matchesPropertyFn) => !pipe(comparand, matchesPropertyFn))
    );

const onRequestApproveHandler =
  (
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    telemetryClient: TelemetryClient
  ) =>
  (
    serviceId: ServiceLifecycle.definitions.ServiceId
  ): TE.TaskEither<ServiceLifecycle.AllFsmErrors, NoAction> =>
    pipe(
      fsmLifecycleClient.approve(serviceId, {
        approvalDate: new Date().toISOString(),
      }),
      TE.map((_) =>
        telemetryClient.trackEvent({
          name: EventNameEnum.AutoApprove,
          properties: { serviceId },
        })
      ),
      TE.map((_) => noAction)
    );

const onRequestRejectHandler =
  (
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    telemetryClient: TelemetryClient
  ) =>
  (
    error: ValidationError
  ): TE.TaskEither<ServiceLifecycle.AllFsmErrors, NoAction> =>
    pipe(
      fsmLifecycleClient.reject(error.serviceId, {
        reason: error.reason,
      }),
      TE.map((_) =>
        telemetryClient.trackEvent({
          name: EventNameEnum.AutoReject,
          properties: { serviceId: error.serviceId },
        })
      ),
      TE.map((_) => noAction)
    );

type Dependencies = {
  config: IConfig;
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  fsmPublicationClient: ServicePublication.FsmClient;
  servicePublicationCosmosHelper: CosmosHelper;
  telemetryClient: TelemetryClient;
};

type ServiceValidationHandler = (
  dependencies: Dependencies
) => RTE.ReaderTaskEither<
  { item: Json },
  Error,
  NoAction | RequestReviewAction
>;

export const createServiceValidationHandler: ServiceValidationHandler =
  ({
    config,
    fsmLifecycleClient,
    fsmPublicationClient,
    telemetryClient,
    servicePublicationCosmosHelper,
  }) =>
  ({ item }) =>
    pipe(
      item,
      parseIncomingMessage,
      E.chainW(validate),
      TE.fromEither,
      TE.chainW(validateDuplicates(servicePublicationCosmosHelper)),
      TE.chainW((validService) =>
        pipe(
          validService.id,
          fsmPublicationClient.getStore().fetch,
          TE.chainW(
            O.fold(
              () =>
                pipe(
                  { item, serviceId: validService.id },
                  onRequestManualValidationHandler(telemetryClient),
                  TE.right
                ),
              (servicePub) =>
                isManualReviewRequested(config)(servicePub, item)
                  ? pipe(
                      { item, serviceId: validService.id },
                      onRequestManualValidationHandler(telemetryClient),
                      TE.right
                    )
                  : onRequestApproveHandler(
                      fsmLifecycleClient,
                      telemetryClient
                    )(servicePub.id)
            )
          )
        )
      ),
      TE.orElse((error) => {
        if ("reason" in error) {
          return onRequestRejectHandler(
            fsmLifecycleClient,
            telemetryClient
          )(error);
        } else {
          return TE.left(error);
        }
      })
    );
