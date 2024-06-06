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
import { HttpOrHttpsUrlString } from "@io-services-cms/models/service-lifecycle/definitions";
import { IConfig, ServiceValidationConfig } from "../config";
import { TelemetryClient } from "../utils/applicationinsight";
import { CosmosHelper } from "../utils/cosmos-helper";
import { isServiceAllowedForQualitySkip } from "../utils/feature-flag-handler";

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
        tos_url: HttpOrHttpsUrlString,
        // Queue.RequestReviewItemStrict.types[0].types[0].props.data.types[1]
        //   .props.metadata.types[1].props.tos_url,
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
    E.chain(flow(Queue.RequestReviewItemStrict2.decode)),
    (x) => x,
    E.mapLeft(
      flow(readableReport, (errorMessage) => ({
        serviceId: item.id,
        reason: errorMessage,
      }))
    )
  );

const validateForExclusionList = (
  item: Queue.RequestReviewItem
): E.Either<ValidationError, Queue.RequestReviewItemStrict> =>
  pipe(
    item,
    ValidSecureChannelService.decode,
    E.chain(flow(Queue.RequestReviewItemExclusionListType.decode)),
    (x) => x,
    E.mapLeft(
      flow(readableReport, (errorMessage) => ({
        serviceId: item.id,
        reason: errorMessage,
      }))
    )
  );

// const testcode = (
//   item: Queue.RequestReviewItem,
//   config: IConfig
// ): E.Either<ValidationError, Queue.RequestReviewItemStrict> =>
//   pipe(
//     item,
//     ValidSecureChannelService.decode,
//     /* if (item.newQualityCkeckType.decode && isServiceInQualityCheckExclusionList) => return Queue.RequestReviewItemStrict
//        else quello dopo */
//     isServiceAllowedForQualitySkip(config, item.id)
//       ? E.chain(flow(Queue.RequestReviewItemExclusionListType.decode))
//       : E.chain(flow(Queue.RequestReviewItemStrict.decode)),

//     (x) => x,
//     E.mapLeft(
//       flow(readableReport, (errorMessage) => ({
//         serviceId: item.id,
//         reason: errorMessage,
//       }))
//     )
//   );

const getDuplicatesOnServicePublication =
  (servicePublicationCosmosHelper: CosmosHelper) =>
  (item: Queue.RequestReviewItemStrict) =>
    servicePublicationCosmosHelper.fetchItems(
      {
        query: `SELECT VALUE c.id FROM c WHERE STRINGEQUALS(c.data.name, @serviceName, true) AND c.data.organization.fiscal_code = @organizationFiscalCode AND c.id != @currentServiceId`,
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
    );
const getNotDeletedDuplicatesOnServiceLifecycle =
  (serviceLifecycleCosmosHelper: CosmosHelper) =>
  (serviceIds: ReadonlyArray<NonEmptyString>) =>
    serviceLifecycleCosmosHelper.fetchSingleItem(
      {
        query: `SELECT VALUE c.id FROM c WHERE c.id IN ('${serviceIds.join(
          "', '"
        )}') AND c.fsm.state != 'deleted'`,
      },
      NonEmptyString
    );

const validateDuplicates =
  (
    servicePublicationCosmosHelper: CosmosHelper,
    serviceLifecycleCosmosHelper: CosmosHelper
  ) =>
  (
    item: Queue.RequestReviewItemStrict
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
                  serviceLifecycleCosmosHelper
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
                          serviceId: item.id,
                          reason: `Il servizio '${item.data.name}' ha lo stesso nome di un altro del servizio con ID '${result}'. Per questo motivo non è possibile procedere con l’approvazione del servizio, che risulta essere il duplicato di un altro.`,
                        })
                    )
                  )
                )
              )
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
  serviceLifecycleCosmosHelper: CosmosHelper;
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
    serviceLifecycleCosmosHelper,
  }) =>
  ({ item }) =>
    pipe(
      item,
      parseIncomingMessage,
      E.map((x) =>
        isServiceAllowedForQualitySkip(config, x.id)
          ? E.chainW(validate)
          : E.chainW(validateForExclusionList)
      ),
      TE.fromEither,
      (x) => x,
      TE.chainW(
        validateDuplicates(
          servicePublicationCosmosHelper,
          serviceLifecycleCosmosHelper
        )
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
