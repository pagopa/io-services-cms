import { ApimUtils } from "@io-services-cms/external-clients";
import { LegacyServiceCosmosResource, Queue } from "@io-services-cms/models";
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
  (
    item: LegacyServiceCosmosResource,
  ): TE.TaskEither<Error, RequestSyncCmsAction> =>
    pipe(
      legacyToCms(item, legacyServiceModel),
      TE.map((docs) => ({ requestSyncCms: docs })),
    );

const isDeletedService = (service: LegacyServiceCosmosResource) =>
  service.serviceName.startsWith("DELETED");

const getLegacyToCmsStatus = (
  service: LegacyServiceCosmosResource,
  wasPublished = false,
): Queue.RequestSyncCmsItem["fsm"]["state"][] => {
  if (isDeletedService(service)) {
    return ["deleted"];
  } else if (service.isVisible) {
    return ["approved", "published"];
  } else if (wasPublished) {
    return ["approved", "unpublished"];
  } else {
    return ["draft"];
  }
};

const fromLegacyToCmsService = (
  service: LegacyServiceCosmosResource,
  status: Queue.RequestSyncCmsItem["fsm"]["state"],
): Queue.RequestSyncCmsItem => ({
  data: {
    authorized_cidrs: Array.from(service.authorizedCIDRs.values()),
    authorized_recipients: Array.from(service.authorizedRecipients.values()),
    description: getDescription(service),
    max_allowed_payment_amount: service.maxAllowedPaymentAmount,
    metadata: {
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
      scope: service.serviceMetadata?.scope ?? "LOCAL", // FIXME: va bene come valore di default?
      support_url: service.serviceMetadata?.supportUrl,
      token_name: service.serviceMetadata?.tokenName,
      tos_url: service.serviceMetadata?.tosUrl,
      web_url: service.serviceMetadata?.webUrl,
    },
    name: calculateServiceName(service.serviceName),
    organization: {
      department_name: service.departmentName,
      fiscal_code: service.organizationFiscalCode,
      name: service.organizationName,
    },
    require_secure_channel: service.requireSecureChannels,
  },
  fsm: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: status as any, // FIXME provare ad eliminare l'any
  },
  id: service.serviceId,
  kind:
    status === "published" || status === "unpublished"
      ? "PublicationItemType"
      : "LifecycleItemType",
  modified_at: service._ts,
});

const getDescription = (service: LegacyServiceCosmosResource) =>
  service.serviceMetadata?.description ?? ("-" as NonEmptyString);

const legacyToCms = (
  item: LegacyServiceCosmosResource,
  legacyServiceModel: ServiceModel,
) =>
  pipe(
    item,
    O.fromPredicate((item) => !isDeletedService(item) && !item.isVisible),
    O.fold(
      () => TE.right(false), // default false quando non serve controllare se un servizio era pubblicato
      serviceWasPublished(legacyServiceModel),
    ),
    TE.map((wasPublished) => getLegacyToCmsStatus(item, wasPublished)),
    TE.map((statusList) =>
      statusList.map((status) => fromLegacyToCmsService(item, status)),
    ),
  );

export const serviceWasPublished =
  (legacyServiceModel: ServiceModel) =>
  (item: LegacyServiceCosmosResource): TE.TaskEither<Error, boolean> =>
    pipe(
      item,
      buildPreviousVersionId,
      O.fold(
        () => TE.right(false),
        (previousId) =>
          pipe(
            legacyServiceModel.find([previousId, item.serviceId]),
            TE.mapLeft(
              (e) => new Error(`Error while retrieving previous service ${e}`),
            ),
            TE.chainW(
              flow(
                O.fold(
                  () =>
                    serviceWasPublished(legacyServiceModel)({
                      ...item,
                      version: item.version - 1,
                    }),
                  (service) => TE.right(service.isVisible),
                ),
              ),
            ),
          ),
      ),
    );

export const buildPreviousVersionId = (
  item: LegacyServiceCosmosResource,
): O.Option<NonEmptyString> => {
  if (item.version === 0) {
    return O.none;
  }

  const previousVersionId = item.version - 1;

  return O.some(
    `${item.serviceId}-${previousVersionId
      .toString()
      .padStart(16, "0")}` as NonEmptyString,
  );
};

export const handler =
  (
    config: IConfig,
    apimService: ApimUtils.ApimService,
    legacyServiceModel: ServiceModel,
  ): RTE.ReaderTaskEither<
    { item: LegacyServiceCosmosResource },
    Error,
    NoAction | RequestSyncCmsAction
  > =>
  ({ item }) =>
    pipe(
      item,
      O.fromPredicate((itm) => itm.cmsTag !== true),
      O.map(() =>
        pipe(
          isUserEnabledForLegacyToCmsSync(config, apimService, item.serviceId),
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
                        `Error while processing serviceId ${item.serviceId}, the reason was => ${e.message}, the stack was => ${e.stack}`,
                      ),
                  ),
                ),
              ),
              O.getOrElse(() => TE.right(noAction)),
            ),
          ),
        ),
      ),
      O.getOrElse(() => TE.right(noAction)),
    );

const calculateServiceName = (serviceName: NonEmptyString) => {
  const calculatedName = serviceName.replace("DELETED", "").trim();

  if (NonEmptyString.is(calculatedName)) {
    return calculatedName;
  }

  return "-" as NonEmptyString;
};
