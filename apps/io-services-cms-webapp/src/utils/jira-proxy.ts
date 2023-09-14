import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ServiceLifecycle } from "@io-services-cms/models";
import {
  CreateJiraIssueResponse,
  JiraAPIClient,
  JiraIssue,
  JiraIssueStatus,
  SearchJiraIssuesPayload,
  SearchJiraIssuesResponse,
} from "../lib/clients/jira-client";

const formatOptionalStringValue = (value?: string) =>
  value || `*[ DATO MANCANTE ]*`;

const formatIssueTitle = (serviceId: NonEmptyString) =>
  `Review #${serviceId}` as NonEmptyString;

export type JiraProxy = {
  readonly createJiraIssue: (
    service: ServiceLifecycle.definitions.Service,
    delegate: Delegate
  ) => TE.TaskEither<Error, CreateJiraIssueResponse>;
  readonly searchJiraIssuesByKeyAndStatus: (
    jiraIssueKeys: ReadonlyArray<NonEmptyString>,
    jiraIssueStatuses: ReadonlyArray<JiraIssueStatus>
  ) => TE.TaskEither<Error, SearchJiraIssuesResponse>;
  readonly getJiraIssueByServiceId: (
    serviceId: NonEmptyString
  ) => TE.TaskEither<Error, O.Option<JiraIssue>>;
  readonly getPendingJiraIssueByServiceId: (
    serviceId: NonEmptyString
  ) => TE.TaskEither<Error, O.Option<JiraIssue>>;
};

export type Delegate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  permissions: Array<string | undefined>;
};

export const jiraProxy = (jiraClient: JiraAPIClient): JiraProxy => {
  const buildIssueCustomFields = (
    service: ServiceLifecycle.definitions.Service,
    delegate: Delegate
  ) => {
    const customFields: Map<string, unknown> = new Map<string, unknown>();
    customFields.set(
      jiraClient.config.JIRA_ORGANIZATION_CF_CUSTOM_FIELD,
      service.data.organization.fiscal_code
    );
    customFields.set(jiraClient.config.JIRA_CONTRACT_CUSTOM_FIELD, {
      value: "Assente",
    });
    customFields.set(
      jiraClient.config.JIRA_ORGANIZATION_NAME_CUSTOM_FIELD,
      service.data.organization.name
    );
    customFields.set(
      jiraClient.config.JIRA_DELEGATE_NAME_CUSTOM_FIELD,
      `${delegate.firstName || ""} ${delegate.lastName || ""}`
    );
    customFields.set(
      jiraClient.config.JIRA_DELEGATE_EMAIL_CUSTOM_FIELD,
      `${delegate.email || ""}`
    );
    return customFields;
  };

  const buildIssueDescription = (
    service: ServiceLifecycle.definitions.Service,
    delegate: Delegate
  ) =>
    `h1. Dati Servizio
    \n\nEffettua la review del servizio al seguente [link|https://developer.io.italia.it/service/${
      service.id
    }]
    \n\nh2. *Nome Servizio: ${service.data.name}*
    \n\n*Descrizione*: ${formatOptionalStringValue(service.data.description)}
    \n\n*Area:* ${service.data.metadata.scope}
    \n\n----\n\nh3. _Contatti:_
    \n\n*Url di supporto:* ${formatOptionalStringValue(
      service.data.metadata.support_url
    )}
    \n\n*Telefono:* ${formatOptionalStringValue(service.data.metadata.phone)}
    \n\n*E-mail:* ${formatOptionalStringValue(service.data.metadata.email)}
    \n\n*Pec:* ${formatOptionalStringValue(service.data.metadata.pec)}
    \n\nh3. _Sicurezza e Privacy:_
    \n\n*Privacy Url:* ${formatOptionalStringValue(
      service.data.metadata.privacy_url
    )}
    \n\nh3. _Dati account (API V2):_
    \n\n${formatOptionalStringValue(delegate.email)}
    \n\n*Limitato:* ${
      delegate.permissions.indexOf("apimessagewrite") !== -1 ? "NO" : "SI"
    }
    \n\n*Autorizzazioni:* ${delegate.permissions.join(", ")}` as NonEmptyString;

  const createJiraIssue = (
    service: ServiceLifecycle.definitions.Service,
    delegate: Delegate
  ): TE.TaskEither<Error, CreateJiraIssueResponse> =>
    jiraClient.createJiraIssue(
      formatIssueTitle(service.id),
      buildIssueDescription(service, delegate),
      [`service-${service.id}` as NonEmptyString],
      buildIssueCustomFields(service, delegate)
    );

  const buildSearchIssuesBasePayload = (
    jql: string
  ): SearchJiraIssuesPayload => ({
    fields: ["status", "comment", "statuscategorychangedate"],
    fieldsByKeys: false,
    maxResults: 1,
    startAt: 0,
    jql,
  });

  const buildSearchJiraIssuesByKeyAndStatusPayload = (
    jiraIssueKeys: ReadonlyArray<NonEmptyString>,
    jiraIssueStatuses: ReadonlyArray<JiraIssueStatus>
  ) => ({
    ...buildSearchIssuesBasePayload(
      `project = ${
        jiraClient.config.JIRA_PROJECT_NAME
      } AND key IN(${jiraIssueKeys.join(
        ","
      )}) AND status IN (${jiraIssueStatuses.join(",")})`
    ),
    maxResults: jiraIssueKeys.length,
  });

  const searchJiraIssuesByKeyAndStatus = (
    jiraIssueKeys: ReadonlyArray<NonEmptyString>,
    jiraIssueStatuses: ReadonlyArray<JiraIssueStatus>
  ): TE.TaskEither<Error, SearchJiraIssuesResponse> =>
    jiraClient.searchJiraIssues(
      buildSearchJiraIssuesByKeyAndStatusPayload(
        jiraIssueKeys,
        jiraIssueStatuses
      )
    );

  const buildGetJiraIssueByServiceIdPayload = (serviceId: NonEmptyString) => ({
    ...buildSearchIssuesBasePayload(
      `project = ${
        jiraClient.config.JIRA_PROJECT_NAME
      } AND summary ~ '${formatIssueTitle(serviceId)}'`
    ),
  });

  const buildGetPendingJiraIssueByServiceIdPayload = (
    serviceId: NonEmptyString
  ) => ({
    ...buildSearchIssuesBasePayload(
      `project = ${
        jiraClient.config.JIRA_PROJECT_NAME
      } AND summary ~ '${formatIssueTitle(
        serviceId
      )}' AND status IN (NEW , REVIEW)`
    ),
  });

  const getJiraIssueByServiceId = (
    serviceId: NonEmptyString
  ): TE.TaskEither<Error, O.Option<JiraIssue>> =>
    pipe(
      jiraClient.searchJiraIssues(
        buildGetJiraIssueByServiceIdPayload(serviceId)
      ),
      TE.map((response) =>
        response.issues.length > 0 ? O.some(response.issues[0]) : O.none
      )
    );

  const getPendingJiraIssueByServiceId = (
    serviceId: NonEmptyString
  ): TE.TaskEither<Error, O.Option<JiraIssue>> =>
    pipe(
      jiraClient.searchJiraIssues(
        buildGetPendingJiraIssueByServiceIdPayload(serviceId)
      ),
      TE.map((response) =>
        response.issues.length > 0 ? O.some(response.issues[0]) : O.none
      )
    );

  return {
    createJiraIssue,
    searchJiraIssuesByKeyAndStatus,
    getJiraIssueByServiceId,
    getPendingJiraIssueByServiceId,
  };
};
