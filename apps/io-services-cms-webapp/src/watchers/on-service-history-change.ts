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
import { flow, pipe } from "fp-ts/lib/function";

import { IConfig } from "../config";
import { isUserEnabledForCmsToLegacySync } from "../utils/feature-flag-handler";
import {
  shouldSkipSync,
  SKIP_SYNC_TO_LEGACY_PREFIX,
  SYNC_FROM_LEGACY,
} from "../utils/synchronizer";

type Actions = "requestSyncLegacy";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestSyncLegacyAction = Action<
  "requestSyncLegacy",
  Queue.RequestSyncLegacyItem
>;
const noAction = {};

const cmsToLegacy = (
  serviceHistory: ServiceHistory,
): Queue.RequestSyncLegacyItem => {
  const legacyServiceBase = {
    authorizedCIDRs: toAuthorizedCIDRs(serviceHistory.data.authorized_cidrs),
    authorizedRecipients: toAuthorizedRecipients(
      serviceHistory.data.authorized_recipients,
    ),
    cmsTag: true,
    departmentName:
      serviceHistory.data.organization.department_name ??
      ("-" as NonEmptyString),
    maxAllowedPaymentAmount: serviceHistory.data.max_allowed_payment_amount,
    organizationFiscalCode: serviceHistory.data.organization.fiscal_code,
    organizationName: serviceHistory.data.organization.name,
    requireSecureChannels: serviceHistory.data.require_secure_channel,
    serviceId: serviceHistory.serviceId,
    serviceMetadata: {
      address: serviceHistory.data.metadata.address,
      appAndroid: serviceHistory.data.metadata.app_android,
      appIos: serviceHistory.data.metadata.app_ios,
      cta: serviceHistory.data.metadata.cta,
      description: serviceHistory.data.description,
      email: serviceHistory.data.metadata.email,
      pec: serviceHistory.data.metadata.pec,
      phone: serviceHistory.data.metadata.phone,
      privacyUrl: serviceHistory.data.metadata.privacy_url,
      scope: ServiceScopeEnum[serviceHistory.data.metadata.scope],
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
        serviceHistory.data.metadata.custom_special_flow,
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
  }
  return { isVisible: false };
};

const getSpecialFields = (
  cat?: "SPECIAL" | "STANDARD",
  customSpecialFlow?: string,
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

const shouldServiceBeSynced =
  (fsmPublicationClient: ServicePublication.FsmClient) =>
  (itm: ServiceHistory) => {
    // Already synced to legacy / Explicit Skip sync to legacy
    if (shouldSkipSync(itm, [SYNC_FROM_LEGACY, SKIP_SYNC_TO_LEGACY_PREFIX])) {
      return TE.of(false);
    }

    // Publication service always synced to legacy
    if (itm.fsm.state === "published" || itm.fsm.state === "unpublished") {
      return TE.of(true);
    }

    // Deleted service always synced to legacy
    if (itm.fsm.state === "deleted") {
      return TE.of(true);
    }

    // Lifecycle service synced to legacy only if it has never been published before
    return pipe(
      itm.serviceId,
      fsmPublicationClient.getStore().fetch,
      TE.map(
        flow(
          O.fold(
            () => true,
            (_) => false,
          ),
        ),
      ),
    );
  };

const toRequestSyncLegacyAction = (
  serviceHistory: ServiceHistory,
): RequestSyncLegacyAction => ({
  requestSyncLegacy: cmsToLegacy(serviceHistory),
});

export const handler =
  (
    config: IConfig,
    apimService: ApimUtils.ApimService,
    fsmPublicationClient: ServicePublication.FsmClient,
  ): RTE.ReaderTaskEither<
    { item: ServiceHistory },
    Error,
    NoAction | RequestSyncLegacyAction
  > =>
  ({ item }) =>
    pipe(
      item,
      shouldServiceBeSynced(fsmPublicationClient),
      TE.chainW((shouldSync) =>
        pipe(
          // We sincronize items when:
          // - that does not comes from legacy (SYNC_FROM_LEGACY)
          // - that are publication items or deleted items, this to prevent draft updates to be synced and directly published on IO App)
          // - that are lifecycle items but have never been published
          // BTW this module will be removed when the legacy application will be decommissioned
          shouldSync ? O.some(item) : O.none,
          O.map(() =>
            pipe(
              isUserEnabledForCmsToLegacySync(
                config,
                apimService,
                item.serviceId,
              ),
              TE.chainW((isUserEnabled) =>
                pipe(
                  item,
                  O.fromPredicate((_) => isUserEnabled),
                  O.map(toRequestSyncLegacyAction),
                  O.getOrElse(() => noAction),
                  TE.right,
                ),
              ),
            ),
          ),
          O.getOrElse(() => TE.right(noAction)),
        ),
      ),
    );
