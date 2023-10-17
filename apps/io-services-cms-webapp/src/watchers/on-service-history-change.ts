import { ApimUtils } from "@io-services-cms/external-clients";
import {
  Queue,
  ServiceHistory,
  ServicePublication,
} from "@io-services-cms/models";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { SpecialServiceCategoryEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/SpecialServiceCategory";
import { StandardServiceCategoryEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/StandardServiceCategory";
import {
  toAuthorizedCIDRs,
  toAuthorizedRecipients,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
// import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import { isUserEnabledForCmsToLegacySync } from "../utils/feature-flag-handler";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";

type Actions = "requestSyncLegacy";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestSyncLegacyAction = Action<
  "requestSyncLegacy",
  Queue.RequestSyncLegacyItem
>;
const noAction = {};

const cmsToLegacy = (
  serviceHistory: ServiceHistory
): Queue.RequestSyncLegacyItem => {
  const legacyServiceBase = {
    authorizedCIDRs: toAuthorizedCIDRs(serviceHistory.data.authorized_cidrs),
    authorizedRecipients: toAuthorizedRecipients(
      serviceHistory.data.authorized_recipients
    ),
    departmentName:
      serviceHistory.data.organization.department_name ??
      ("-" as NonEmptyString),
    maxAllowedPaymentAmount: serviceHistory.data.max_allowed_payment_amount,
    organizationFiscalCode: serviceHistory.data.organization.fiscal_code,
    organizationName: serviceHistory.data.organization.name,
    requireSecureChannels: serviceHistory.data.require_secure_channel,
    serviceId: serviceHistory.serviceId,
    cmsTag: true,
    serviceMetadata: {
      scope: ServiceScopeEnum[serviceHistory.data.metadata.scope],
      address: serviceHistory.data.metadata.address,
      appAndroid: serviceHistory.data.metadata.app_android,
      appIos: serviceHistory.data.metadata.app_ios,
      cta: serviceHistory.data.metadata.cta,
      description: serviceHistory.data.description,
      email: serviceHistory.data.metadata.email,
      pec: serviceHistory.data.metadata.pec,
      phone: serviceHistory.data.metadata.phone,
      privacyUrl: serviceHistory.data.metadata.privacy_url,
      supportUrl: serviceHistory.data.metadata.support_url,
      tokenName: serviceHistory.data.metadata.token_name,
      tosUrl: serviceHistory.data.metadata.tos_url,
      webUrl: serviceHistory.data.metadata.web_url,
    },
  };
  return {
    ...legacyServiceBase,
    ...manageServiceName(serviceHistory),
    ...manageIsVisibleField(serviceHistory),
    serviceMetadata: {
      ...legacyServiceBase.serviceMetadata,
      ...getSpecialFields(
        serviceHistory.data.metadata.category,
        serviceHistory.data.metadata.custom_special_flow
      ),
    },
  };
};

const manageServiceName = (item: ServiceHistory) => {
  if (item.fsm.state === "deleted") {
    return { serviceName: `DELETED ${item.data.name}` as NonEmptyString };
  }
  return { serviceName: item.data.name };
};

const manageIsVisibleField = (item: ServiceHistory) => {
  if (item.fsm.state === "published") {
    return { isVisible: true };
  } else if (item.fsm.state === "unpublished") {
    return { isVisible: false };
  } else {
    return {};
  }
};

const getSpecialFields = (
  cat?: "STANDARD" | "SPECIAL",
  customSpecialFlow?: string
):
  | {
      category: SpecialServiceCategoryEnum;
      customSpecialFlow: NonEmptyString;
    }
  | {
      category: StandardServiceCategoryEnum;
      customSpecialFlow: undefined;
    } => {
  if (cat && cat === SpecialServiceCategoryEnum.SPECIAL) {
    return {
      category: SpecialServiceCategoryEnum.SPECIAL,
      customSpecialFlow: customSpecialFlow as NonEmptyString, // it will be validated in OnRequestSyncLegacy Azure Function
    };
  } else {
    return {
      category: StandardServiceCategoryEnum.STANDARD,
      customSpecialFlow: customSpecialFlow as undefined, // it will be validated in OnRequestSyncLegacy Azure Function
    };
  }
};

/**
 * This method checks if the service can be syncronized to the legacy application
 * if the given service is from the service-publication fsm, it can be syncronized
 * if the given service is from the service-lifecycle fsm, it can be syncronized only if it is not in the service-publication fsm
 *  */
const shouldBeSyncronized =
  (fsmPublicationClient: ServicePublication.FsmClient) =>
  (serviceHistory: ServiceHistory) =>
    pipe(
      serviceHistory,
      O.fromPredicate((itm) =>
        ["published", "unpublished"].includes(itm.fsm.state)
      ),
      O.fold(
        () =>
          pipe(
            serviceHistory,
            isServiceInPublication(fsmPublicationClient),
            TE.chainW((isInPublication) => TE.right(!isInPublication))
          ),
        (_) => TE.right(true)
      )
    );

const isServiceInPublication =
  (fsmPublicationClient: ServicePublication.FsmClient) =>
  (serviceHistory: ServiceHistory): TE.TaskEither<Error, boolean> =>
    pipe(
      serviceHistory.serviceId,
      fsmPublicationClient.getStore().fetch,
      TE.map(
        flow(
          O.fold(
            () => false,
            (_) => true
          )
        )
      )
    );

const toRequestSyncLegacyAction = (
  serviceHistory: ServiceHistory
): RequestSyncLegacyAction => ({
  requestSyncLegacy: cmsToLegacy(serviceHistory),
});

export const handler =
  (
    config: IConfig,
    apimService: ApimUtils.ApimService,
    fsmPublicationClient: ServicePublication.FsmClient
  ): RTE.ReaderTaskEither<
    { item: ServiceHistory },
    Error,
    NoAction | RequestSyncLegacyAction
  > =>
  ({ item }) =>
    pipe(
      item,
      O.fromPredicate((itm) => itm.fsm.lastTransition !== SYNC_FROM_LEGACY),
      O.map(() =>
        pipe(
          isUserEnabledForCmsToLegacySync(config, apimService, item.serviceId),
          TE.chainW((isUserEnabled) =>
            pipe(
              item,
              shouldBeSyncronized(fsmPublicationClient),
              TE.chainW((shouldBeSync) =>
                pipe(
                  item,
                  O.fromPredicate((_) => isUserEnabled && shouldBeSync),
                  O.map(toRequestSyncLegacyAction),
                  O.getOrElse(() => noAction),
                  TE.right
                )
              )
            )
          )
        )
      ),
      O.getOrElse(() => TE.right(noAction))
    );
