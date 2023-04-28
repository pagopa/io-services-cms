import { TaskEither } from "fp-ts/lib/TaskEither";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Service } from "io-services-cms-models/service-lifecycle/types";
import {
  CreateJiraIssueResponse,
  SearchJiraIssuesPayload,
  SearchJiraIssuesResponse,
  jiraAPIClient,
} from "../jira_client";

const formatOptionalStringValue = (value?: string) =>
  value || `{color:#FF991F}*[ DATO MANCANTE ]*{color}`;

export type ServiceReviewProxy = {
  readonly createJiraIssue: (
    service: Service,
    delegate: Delegate
  ) => TaskEither<Error, CreateJiraIssueResponse>;
  readonly searchJiraIssuesByKey: (
    jiraIssueKeys: ReadonlyArray<NonEmptyString>
  ) => TaskEither<Error, SearchJiraIssuesResponse>;
};

export type Delegate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  permissions: Array<string | undefined>;
};

export const ServiceReviewProxy = (
  jiraClient: jiraAPIClient
): ServiceReviewProxy => {
  const buildIssueCustomFields = (service: Service, delegate: Delegate) => {
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

  const buildIssueDescription = (service: Service, delegate: Delegate) =>
    `Effettua la review del servizio al seguente [link|https://developer.io.italia.it/service/${
      service.id
    }]
    \n\nh2. *${service.data.name} (${service.data.metadata.scope})*
    \n\n${formatOptionalStringValue(service.data.description)}
    \n\n----\n\nh3. _Contatti:_
    \n\n*Url di supporto:* ${formatOptionalStringValue(
      service.data.metadata.supportUrl
    )}
    \n\n*Telefono:* ${formatOptionalStringValue(service.data.metadata.phone)}
    \n\n*E-mail:* ${formatOptionalStringValue(service.data.metadata.email)}
    \n\n*Pec:* ${formatOptionalStringValue(service.data.metadata.pec)}
    \n\nh3. _Sicurezza e Privacy:_
    \n\n*Privacy Url:* ${formatOptionalStringValue(
      service.data.metadata.privacyUrl
    )}
    \n\nh3. _Dati account ({account_type}):_
    \n\n${formatOptionalStringValue(delegate.email)}
    \n\n*Limitato:* ${
      delegate.permissions.indexOf("apimessagewrite") !== -1 ? "NO" : "SI"
    }
    \n\n*Autorizzazioni:* ${delegate.permissions.join(", ")}` as NonEmptyString;

  const createJiraIssue = (
    service: Service,
    delegate: Delegate
  ): TaskEither<Error, CreateJiraIssueResponse> =>
    jiraClient.createJiraIssue(
      `Review #${service.id}` as NonEmptyString,
      buildIssueDescription(service, delegate),
      [`service-${service.id}` as NonEmptyString],
      buildIssueCustomFields(service, delegate)
    );

  const buildSearchIssuesPayload = (
    jiraIssueKeys: ReadonlyArray<NonEmptyString>
  ): SearchJiraIssuesPayload => ({
    fields: ["status", "comment"],
    fieldsByKeys: false,
    maxResults: jiraIssueKeys.length,
    startAt: 0,
    jql: `project = ${
      jiraClient.config.JIRA_PROJECT_NAME
    } AND key IN(${jiraIssueKeys.join(",")})`,
  });

  const searchJiraIssuesByKey = (
    jiraIssueKeys: ReadonlyArray<NonEmptyString>
  ): TaskEither<Error, SearchJiraIssuesResponse> =>
    jiraClient.searchJiraIssues(buildSearchIssuesPayload(jiraIssueKeys));

  return {
    createJiraIssue,
    searchJiraIssuesByKey,
  };
};
