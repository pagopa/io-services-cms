import { ApiManagementClient } from "@azure/arm-apimanagement";
import { LegacyService, Queue } from "@io-services-cms/models";
import { ServiceModel } from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import { isUserEnabledForLegacyToCmsSync } from "../utils/feature-flag-handler";

const noAction = {};
type NoAction = typeof noAction;
type Actions = "requestSyncCms";
type Action<A extends Actions, B> = Record<A, B>;
type RequestSyncCmsAction = Action<
  "requestSyncCms",
  Queue.RequestSyncCmsItem[]
>;

const onLegacyServiceChangeHandler =
  (legacyServiceModel: ServiceModel) =>
  (item: LegacyService): TE.TaskEither<Error, RequestSyncCmsAction> =>
    pipe(
      legacyToCms(item, legacyServiceModel),
      TE.map((docs) => ({ requestSyncCms: docs }))
    );

const isDeletedService = (service: LegacyService) =>
  service.serviceName.startsWith("DELETED");

const getLegacyToCmsStatus = (
  service: LegacyService,
  wasPublished: boolean = false
): Array<Queue.RequestSyncCmsItem["fsm"]["state"]> => {
  if (isDeletedService(service)) {
    return ["deleted", "unpublished"];
  } else if (service.isVisible) {
    return ["approved", "published"];
  } else if (wasPublished) {
    return ["approved", "unpublished"];
  } else {
    return ["draft"];
  }
};

const fromLegacyToCmsService = (
  service: LegacyService,
  status: Queue.RequestSyncCmsItem["fsm"]["state"]
): Queue.RequestSyncCmsItem => ({
  id: service.serviceId,
  data: {
    authorized_cidrs: Array.from(service.authorizedCIDRs.values()),
    authorized_recipients: Array.from(service.authorizedRecipients.values()),
    description: getDescription(service),
    max_allowed_payment_amount: service.maxAllowedPaymentAmount,
    metadata: {
      scope: service.serviceMetadata?.scope ?? "LOCAL", // FIXME: va bene come valore di default?
      address: service.serviceMetadata?.address,
      app_android: service.serviceMetadata?.appAndroid,
      app_ios: service.serviceMetadata?.appIos,
      category: service.serviceMetadata?.category,
      cta: service.serviceMetadata?.cta,
      custom_special_flow: service.serviceMetadata?.customSpecialFlow,
      description: getDescription(service),
      email: service.serviceMetadata?.email,
      pec: service.serviceMetadata?.pec,
      phone: service.serviceMetadata?.phone,
      privacy_url: service.serviceMetadata?.privacyUrl,
      support_url: service.serviceMetadata?.supportUrl,
      token_name: service.serviceMetadata?.tokenName,
      tos_url: service.serviceMetadata?.tosUrl,
      web_url: service.serviceMetadata?.webUrl,
    },
    name: service.serviceName.replace("DELETED", "").trim() as NonEmptyString,
    organization: {
      fiscal_code: service.organizationFiscalCode,
      name: service.organizationName,
      department_name: service.departmentName,
    },
    require_secure_channel: service.requireSecureChannels,
  },
  fsm: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: status as any, // FIXME provare ad eliminare l'any
  },
  kind:
    status === "published" || status === "unpublished"
      ? "PublicationItemType"
      : "LifecycleItemType",
});

const getDescription = (service: LegacyService) =>
  service.serviceMetadata?.description ?? ("-" as NonEmptyString);

const legacyToCms = (item: LegacyService, legacyServiceModel: ServiceModel) =>
  pipe(
    item,
    O.fromPredicate((item) => !isDeletedService(item) && !item.isVisible),
    O.fold(
      () => TE.right(O.none), // evitiamo la chiamata a Jira quando non serve, simulando una sua risposta vuota
      (_) => serviceWasPublished(item, legacyServiceModel)
    ),
    TE.map(
      flow(
        O.fold(
          () => getLegacyToCmsStatus(item),
          (wasPublished) => getLegacyToCmsStatus(item, wasPublished)
        )
      )
    ),
    TE.map((statusList) =>
      statusList.map((status) => fromLegacyToCmsService(item, status))
    )
  );

const serviceWasPublished = (
  item: LegacyService,
  legacyServiceModel: ServiceModel
): TE.TaskEither<Error, O.Option<boolean>> =>
  pipe(
    item,
    buildPreviousVersionId,
    O.fold(
      () => TE.right(O.some(false)),
      (previousId) =>
        pipe(
          legacyServiceModel.find([previousId, item.serviceId]),
          TE.mapLeft(
            (e) => new Error(`Error while retrieving previous service ${e}`)
          ),
          TE.chainW(
            flow(
              O.fold(
                () =>
                  TE.left(
                    new Error(
                      `Previous service version was not found ${previousId}`
                    )
                  ),
                (service) => TE.right(O.some(service.isVisible))
              )
            )
          )
        )
    )
  );

const buildPreviousVersionId = (
  item: LegacyService
): O.Option<NonEmptyString> => {
  if (item.version === 0) {
    return O.none;
  }

  const previousVersionId = item.version - 1;

  return O.some(
    `${item.serviceId}-${previousVersionId
      .toString()
      .padStart(16, "0")}` as NonEmptyString
  );
};

export const handler =
  (
    config: IConfig,
    apimClient: ApiManagementClient,
    legacyServiceModel: ServiceModel
  ): RTE.ReaderTaskEither<
    { item: LegacyService },
    Error,
    NoAction | RequestSyncCmsAction
  > =>
  ({ item }) =>
    pipe(
      item,
      O.fromPredicate((itm) => itm.cmsTag !== true),
      O.map(() =>
        pipe(
          isUserEnabledForLegacyToCmsSync(config, apimClient, item.serviceId),
          TE.chainW((isUserEnabled) =>
            pipe(
              item,
              O.fromPredicate((_) => isUserEnabled),
              O.map(
                flow(
                  onLegacyServiceChangeHandler(legacyServiceModel),
                  TE.mapLeft(
                    (e) =>
                      new Error(
                        `Error while processing serviceId ${item.serviceId}, the reason was => ${e.message}, the stack was => ${e.stack}`
                      )
                  )
                )
              ),
              O.getOrElse(() => TE.right(noAction))
            )
          )
        )
      ),
      O.getOrElse(() => TE.right(noAction))
    );
