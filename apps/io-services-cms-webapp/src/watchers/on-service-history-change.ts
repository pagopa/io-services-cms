import { Queue, ServiceHistory } from "@io-services-cms/models";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { SpecialServiceCategoryEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/SpecialServiceCategory";
import { StandardServiceCategoryEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/StandardServiceCategory";
import {
  toAuthorizedCIDRs,
  toAuthorizedRecipients,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";

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
): Queue.RequestSyncLegacyItem => ({
  authorizedCIDRs: toAuthorizedCIDRs(serviceHistory.data.authorized_cidrs),
  authorizedRecipients: toAuthorizedRecipients(
    serviceHistory.data.authorized_recipients
  ),
  departmentName: serviceHistory.data.organization
    .department_name as NonEmptyString,
  isVisible: serviceHistory.fsm.state === "published",
  maxAllowedPaymentAmount: serviceHistory.data.max_allowed_payment_amount,
  organizationFiscalCode: serviceHistory.data.organization.fiscal_code,
  organizationName: serviceHistory.data.organization.name,
  requireSecureChannels: serviceHistory.data.require_secure_channel,
  serviceId: serviceHistory.serviceId,
  serviceName: serviceHistory.data.name,
  cmsTag: true,
  serviceMetadata: {
    category:
      (serviceHistory.data.metadata.category as
        | StandardServiceCategoryEnum
        | SpecialServiceCategoryEnum) ?? StandardServiceCategoryEnum.STANDARD,
    scope: serviceHistory.data.metadata.scope as ServiceScopeEnum,
    customSpecialFlow: serviceHistory.data.metadata
      .custom_special_flow as undefined,
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
});

const toRequestSyncLegacyAction = (
  serviceHistory: ServiceHistory
): RequestSyncLegacyAction => ({
  requestSyncLegacy: cmsToLegacy(serviceHistory),
});

export const handler: RE.ReaderEither<
  { item: ServiceHistory },
  Error,
  NoAction | RequestSyncLegacyAction
> = ({ item }) =>
  pipe(
    item,
    O.fromPredicate((itm) => itm.fsm.lastTransition !== "from Legacy"),
    O.map(toRequestSyncLegacyAction),
    O.getOrElse(() => noAction),
    E.right
  );
