import { TaskEither } from "fp-ts/lib/TaskEither";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  CreateJiraIssueResponse,
  SearchJiraIssuesPayload,
  SearchJiraIssuesResponse,
  jiraAPIClient,
} from "../jira_client";
// TODO: check Service model import
import { Service } from "../../../../packages/io-services-cms-models/dist/service-lifecycle/types";

const formatOptionalStringValue = (value?: NonEmptyString) =>
  value || `* {color:#FF991F}*[ DATO MANCANTE ]*{color}`;

export type serviceReviewProxy = {
  readonly createJiraIssue: (
    service: Service,
    delegate: unknown
  ) => TaskEither<Error, CreateJiraIssueResponse>;
  readonly searchJiraIssuesByKey: (
    jiraIssueKeys: ReadonlyArray<NonEmptyString>
  ) => TaskEither<Error, SearchJiraIssuesResponse>;
};

export const ServiceReviewProxy = (
  jiraClient: jiraAPIClient
): serviceReviewProxy => {
  const buildIssueCustomFields = (service: Service, _delegate: unknown) => {
    const customFields: Map<string, unknown> = new Map<string, unknown>();
    customFields.set(
      jiraClient.config.JIRA_ORGANIZATION_CF_CUSTOM_FIELD,
      "12345678901"
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
      "${delegate_name}"
    );
    customFields.set(
      jiraClient.config.JIRA_DELEGATE_EMAIL_CUSTOM_FIELD,
      "${delegate_email}"
    );
    return customFields;
  };

  const buildIssueDescription = (service: Service, _delegate: unknown) =>
    `Effettua la review del servizio al seguente [link|https://developer.io.italia.it/service/${
      service.id
    }]
    \n\nh2. *${service.data.name} (${service.data.metadata.scope})*
    \n\n${formatOptionalStringValue(service.data.description)}
    \n\n----
    \n\nh3. _Contatti:_
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
    \n\n{delegate_email}
    \n\n*Limitato:* {is_limited}
    \n\n*Autorizzazioni:* {account_permissions}` as NonEmptyString;

  const createJiraIssue = (
    service: Service,
    delegate: unknown
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
