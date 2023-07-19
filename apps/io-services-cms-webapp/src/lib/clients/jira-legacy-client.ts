import { ServiceId } from "@io-services-cms/models/service-lifecycle/definitions";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import nodeFetch from "node-fetch-commonjs";
import { IConfig } from "../../config";
import {
  JIRA_REST_API_PATH,
  SearchJiraIssuesPayload,
  checkJiraResponse,
} from "./jira-client";

export const JIRA_SERVICE_TAG_PREFIX = "devportal-service-";

export const JiraLegacyIssueStatus = t.union([
  t.literal("NEW"),
  t.literal("REVIEW"),
  t.literal("REJECTED"),
  t.literal("DONE"),
  t.literal("Completata"), // Status DONE will return this value as name
]);
export type JiraLegacyIssueStatus = t.TypeOf<typeof JiraLegacyIssueStatus>;

export const JiraLegacyIssue = t.type({
  id: NonEmptyString,
  key: NonEmptyString,
  fields: t.type({
    comment: t.type({
      comments: t.readonlyArray(t.type({ body: t.string })),
    }),
    status: t.type({
      name: JiraLegacyIssueStatus,
    }),
    statuscategorychangedate: NonEmptyString,
  }),
});
export type JiraLegacyIssue = t.TypeOf<typeof JiraLegacyIssue>;

export const SearchJiraLegacyIssuesResponse = t.intersection([
  t.type({
    startAt: t.number,
    total: t.number,
    issues: t.readonlyArray(JiraLegacyIssue),
  }),
  t.partial({
    warningMessages: t.readonlyArray(t.string),
  }),
]);
export type SearchJiraLegacyIssuesResponse = t.TypeOf<
  typeof SearchJiraLegacyIssuesResponse
>;

export type JiraLegacyAPIClient = {
  readonly searchJiraIssueByServiceId: (
    serviceId: ServiceId
  ) => TE.TaskEither<Error, O.Option<JiraLegacyIssue>>;
};

export const jiraLegacyClient = (
  config: IConfig,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): JiraLegacyAPIClient => {
  const jiraHeaders = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(
      `${config.JIRA_USERNAME}:${config.JIRA_TOKEN}`
    ).toString("base64")}`,
    "Content-Type": "application/json",
  };

  const searchJiraIssueByServiceId = (serviceId: ServiceId) => {
    const bodyData: SearchJiraIssuesPayload = {
      fields: [
        "summary",
        "status",
        "assignee",
        "comment",
        "labels",
        "statuscategorychangedate",
      ],
      fieldsByKeys: false,
      jql: `project = ${config.LEGACY_JIRA_PROJECT_NAME} AND issuetype = Task AND labels = ${JIRA_SERVICE_TAG_PREFIX}${serviceId} ORDER BY created DESC`,
      startAt: 0,
      maxResults: 1,
    };

    return pipe(
      TE.tryCatch(
        () =>
          fetchApi(`${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}search`, {
            body: JSON.stringify(bodyData),
            headers: jiraHeaders,
            method: "POST",
          }),
        E.toError
      ),
      TE.chainEitherK(checkJiraResponse),
      TE.chain((response) => TE.tryCatch(() => response.json(), E.toError)),
      TE.chain((responseBody) =>
        pipe(
          responseBody,
          SearchJiraLegacyIssuesResponse.decode,
          TE.fromEither,
          TE.mapLeft((errors) => E.toError(readableReport(errors))),
          TE.map((result) => O.fromNullable(result.issues[0]))
        )
      )
    );
  };

  return {
    searchJiraIssueByServiceId,
  };
};
