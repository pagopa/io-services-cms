import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  LegacyService,
  Queue,
  ServiceLifecycle,
} from "@io-services-cms/models";
import {
  Service,
  ValidService,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import {
  JiraLegacyAPIClient,
  JiraLegacyIssueStatus,
} from "../lib/clients/jira-legacy-client";
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
  (
    jiraLegacyClient: JiraLegacyAPIClient,
    qualityCheckExclusionList: ReadonlyArray<ServiceLifecycle.definitions.ServiceId>
  ) =>
  (item: Service): TE.TaskEither<Error, RequestSyncCmsAction> =>
    pipe(
      legacyToCms(jiraLegacyClient, qualityCheckExclusionList, item),
      TE.map((docs) => ({ requestSyncCms: docs }))
    );

const isValidService =
  (
    qualityCheckExclusionList: ReadonlyArray<ServiceLifecycle.definitions.ServiceId>
  ) =>
  (service: Service) =>
    qualityCheckExclusionList.indexOf(service.serviceId) > -1
      ? true
      : pipe(
          ValidService.decode(service),
          E.fold(
            (_) => false,
            (_) => true
          )
        );

const hasOngoingReview = (issueStatus?: JiraLegacyIssueStatus) =>
  issueStatus === "NEW" || issueStatus === "REVIEW";

const isDeletedService = (service: Service) =>
  service.serviceName.startsWith("DELETED");

const getLegacyToCmsStatus = (
  qualityCheckExclusionList: ReadonlyArray<ServiceLifecycle.definitions.ServiceId>,
  service: Service,
  issueStatus?: JiraLegacyIssueStatus
): Array<Queue.RequestSyncCmsItem["fsm"]["state"]> => {
  if (isDeletedService(service)) {
    return ["deleted"];
  } else if (
    isValidService(qualityCheckExclusionList)(service) &&
    hasOngoingReview(issueStatus)
  ) {
    return ["submitted"];
  } else if (isValidService(qualityCheckExclusionList)(service)) {
    return service.isVisible ? ["approved", "published"] : ["approved"];
  } else {
    return ["draft"];
  }
};

const fromLegacyToCmsService = (
  service: Service,
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
      description: service.serviceMetadata?.description,
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

const getDescription = (service: Service) =>
  service.serviceMetadata?.description ?? ("-" as NonEmptyString);

const legacyToCms = (
  jiraLegacyClient: JiraLegacyAPIClient,
  qualityCheckExclusionList: ReadonlyArray<ServiceLifecycle.definitions.ServiceId>,
  item: Service
) =>
  pipe(
    jiraLegacyClient.searchJiraIssueByServiceId(item.serviceId),
    TE.map(
      flow(
        O.fold(
          () => getLegacyToCmsStatus(qualityCheckExclusionList, item),
          (issue) =>
            getLegacyToCmsStatus(
              qualityCheckExclusionList,
              item,
              issue.fields.status.name
            )
        )
      )
    ),
    TE.map((statusList) =>
      statusList.map((status) => fromLegacyToCmsService(item, status))
    )
  );

export const handler =
  (
    jiraLegacyClient: JiraLegacyAPIClient,
    config: IConfig,
    apimClient: ApiManagementClient
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
                onLegacyServiceChangeHandler(
                  jiraLegacyClient,
                  config.SERVICEID_QUALITY_CHECK_EXCLUSION_LIST
                )
              ),
              O.getOrElse(() => TE.right(noAction))
            )
          )
        )
      ),
      O.getOrElse(() => TE.right(noAction))
    );
