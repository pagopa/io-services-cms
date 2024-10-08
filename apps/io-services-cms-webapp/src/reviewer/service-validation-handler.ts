/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
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
import * as B from "fp-ts/lib/boolean";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json } from "io-ts-types";
import lodash from "lodash";

import { IConfig, ServiceValidationConfig } from "../config";
import { TelemetryClient } from "../utils/applicationinsight";
import { CosmosHelper } from "../utils/cosmos-helper";
import { isServiceAllowedForQualitySkip } from "../utils/feature-flag-handler";
import { parseIncomingMessage } from "../utils/queue-utils";

const noAction = {};
type NoAction = typeof noAction;
type Actions = "requestReview";
type Action<A extends Actions, B> = Record<A, B>;
type RequestReviewAction = Action<"requestReview", Json>;

interface ValidationError {
  reason: string;
  serviceId: Queue.RequestReviewItem["id"];
}

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

const validate =
  (config: IConfig) =>
  (
    item: Queue.RequestReviewItem,
  ): E.Either<ValidationError, Queue.RequestReviewItemStrict> =>
    pipe(
      item,
      ValidSecureChannelService.decode,
      E.chain((s) =>
        pipe(
          isServiceAllowedForQualitySkip(config, item.id),
          B.fold(
            () => Queue.RequestReviewItemQualityStrict.decode(s),
            () => Queue.RequestReviewItemStrict.decode(s),
          ),
        ),
      ),
      E.mapLeft(
        flow(readableReport, (errorMessage) => ({
          reason: errorMessage,
          serviceId: item.id,
        })),
      ),
    );

const getDuplicatesOnServicePublication =
  (servicePublicationCosmosHelper: CosmosHelper) =>
  (item: Queue.RequestReviewItemStrict) =>
    servicePublicationCosmosHelper.fetchItems(
      {
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
        query: `SELECT VALUE c.id FROM c WHERE STRINGEQUALS(c.data.name, @serviceName, true) AND c.data.organization.fiscal_code = @organizationFiscalCode AND c.id != @currentServiceId`,
      },
      NonEmptyString,
    );
const getNotDeletedDuplicatesOnServiceLifecycle =
  (serviceLifecycleCosmosHelper: CosmosHelper) =>
  (serviceIds: readonly NonEmptyString[]) =>
    serviceLifecycleCosmosHelper.fetchSingleItem(
      {
        query: `SELECT VALUE c.id FROM c WHERE c.id IN ('${serviceIds.join(
          "', '",
        )}') AND c.fsm.state != 'deleted'`,
      },
      NonEmptyString,
    );

const validateDuplicates =
  (
    servicePublicationCosmosHelper: CosmosHelper,
    serviceLifecycleCosmosHelper: CosmosHelper,
  ) =>
  (
    item: Queue.RequestReviewItemStrict,
  ): TE.TaskEither<Error | ValidationError, Queue.RequestReviewItemStrict> =>
    pipe(
      // Get Duplicate Services
      getDuplicatesOnServicePublication(servicePublicationCosmosHelper)(item),
      TE.chainW((queryResult) =>
        pipe(
          queryResult,
          O.fold(
            () => TE.right(item),
            (result) =>
              pipe(
                // Check if duplicates found are not related to deleted service
                getNotDeletedDuplicatesOnServiceLifecycle(
                  serviceLifecycleCosmosHelper,
                )(result),
                TE.chainW((queryResult) =>
                  pipe(
                    queryResult,
                    O.fold(
                      // No active duplicates found
                      () => TE.right(item),
                      (result) =>
                        // check if duplicates found are not related to deleted service
                        TE.left({
                          reason: `Il servizio '${item.data.name}' ha lo stesso nome di un altro del servizio con ID '${result}'. Per questo motivo non è possibile procedere con l’approvazione del servizio, che risulta essere il duplicato di un altro.`,
                          serviceId: item.id,
                        }),
                    ),
                  ),
                ),
              ),
          ),
        ),
      ),
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
      }),
    );

const isManualReviewRequested =
  (config: ServiceValidationConfig) =>
  (origin: ServicePublication.ItemType, comparand: Json): boolean =>
    pipe(
      config.MANUAL_REVIEW_PROPERTIES,
      RA.map((path) => lodash.matchesProperty(path, lodash.get(origin, path))),
      RA.some((matchesPropertyFn) => !pipe(comparand, matchesPropertyFn)),
    );

const onRequestApproveHandler =
  (
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    telemetryClient: TelemetryClient,
  ) =>
  (
    serviceId: ServiceLifecycle.definitions.ServiceId,
  ): TE.TaskEither<ServiceLifecycle.AllFsmErrors, NoAction> =>
    pipe(
      fsmLifecycleClient.approve(serviceId, {
        approvalDate: new Date().toISOString(),
      }),
      TE.map((_) =>
        telemetryClient.trackEvent({
          name: EventNameEnum.AutoApprove,
          properties: { serviceId },
        }),
      ),
      TE.map((_) => noAction),
    );

const onRequestRejectHandler =
  (
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    telemetryClient: TelemetryClient,
  ) =>
  (
    error: ValidationError,
  ): TE.TaskEither<ServiceLifecycle.AllFsmErrors, NoAction> =>
    pipe(
      fsmLifecycleClient.reject(error.serviceId, {
        reason: error.reason,
      }),
      TE.map((_) =>
        telemetryClient.trackEvent({
          name: EventNameEnum.AutoReject,
          properties: { serviceId: error.serviceId },
        }),
      ),
      TE.map((_) => noAction),
    );

interface Dependencies {
  config: IConfig;
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  fsmPublicationClient: ServicePublication.FsmClient;
  serviceLifecycleCosmosHelper: CosmosHelper;
  servicePublicationCosmosHelper: CosmosHelper;
  telemetryClient: TelemetryClient;
}

type ServiceValidationHandler = (
  dependencies: Dependencies,
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
    serviceLifecycleCosmosHelper,
    servicePublicationCosmosHelper,
    telemetryClient,
  }) =>
  ({ item }) =>
    pipe(
      item,
      parseIncomingMessage(Queue.RequestReviewItem),
      E.chainW(flow(validate(config))),
      TE.fromEither,
      TE.chainW(
        validateDuplicates(
          servicePublicationCosmosHelper,
          serviceLifecycleCosmosHelper,
        ),
      ),
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
                  TE.right,
                ),
              (servicePub) =>
                isManualReviewRequested(config)(servicePub, item)
                  ? pipe(
                      { item, serviceId: validService.id },
                      onRequestManualValidationHandler(telemetryClient),
                      TE.right,
                    )
                  : onRequestApproveHandler(
                      fsmLifecycleClient,
                      telemetryClient,
                    )(servicePub.id),
            ),
          ),
        ),
      ),
      TE.orElse((error) => {
        if ("reason" in error) {
          return onRequestRejectHandler(
            fsmLifecycleClient,
            telemetryClient,
          )(error);
        } else {
          return TE.left(error);
        }
      }),
    );
