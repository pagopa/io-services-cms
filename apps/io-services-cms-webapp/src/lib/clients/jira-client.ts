import { Either, toError } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import nodeFetch from "node-fetch-commonjs";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { JiraConfig } from "../../config";

const JIRA_REST_API_PATH = "/rest/api/2/";

export const CreateJiraIssueResponse = t.interface({
  id: NonEmptyString,
  key: NonEmptyString,
});
export type CreateJiraIssueResponse = t.TypeOf<typeof CreateJiraIssueResponse>;

export const JiraIssueStatus = t.union([
  // TODO: maybe get these literal values from config?
  t.literal("NEW"),
  t.literal("REVIEW"),
  t.literal("REJECTED"),
  t.literal("APPROVED"),
]);
export type JiraIssueStatus = t.TypeOf<typeof JiraIssueStatus>;

export const JiraIssue = t.interface({
  id: NonEmptyString,
  key: NonEmptyString,
  fields: t.interface({
    comment: t.interface({
      comments: t.readonlyArray(t.interface({ body: t.string })),
    }),
    status: t.interface({
      name: JiraIssueStatus,
    }),
    statuscategorychangedate: NonEmptyString,
  }),
});
export type JiraIssue = t.TypeOf<typeof JiraIssue>;

export const SearchJiraIssuesResponse = t.intersection([
  t.interface({
    startAt: t.number,
    total: t.number,
    issues: t.readonlyArray(JiraIssue),
  }),
  t.partial({
    warningMessages: t.readonlyArray(t.string),
  }),
]);
export type SearchJiraIssuesResponse = t.TypeOf<
  typeof SearchJiraIssuesResponse
>;

const SearchJiraIssuesPayload = t.interface({
  fields: t.array(t.string),
  fieldsByKeys: t.boolean,
  jql: t.string,
  maxResults: t.number,
  startAt: t.number,
});
export type SearchJiraIssuesPayload = t.TypeOf<typeof SearchJiraIssuesPayload>;

export type JiraAPIClient = {
  readonly config: JiraConfig;
  readonly createJiraIssue: (
    title: NonEmptyString,
    description: NonEmptyString,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ) => TaskEither<Error, CreateJiraIssueResponse>;
  readonly searchJiraIssues: (
    bodyData: SearchJiraIssuesPayload
  ) => TaskEither<Error, SearchJiraIssuesResponse>;
};

export const fromMapToObject = (map?: ReadonlyMap<string, unknown>) =>
  pipe(
    map,
    O.fromNullable,
    O.fold(
      () => new Object(),
      (m) => Object.fromEntries(m)
    )
  );

const checkJiraResponse = (response: Response): Either<Error, Response> => {
  if (response.status === 200 || response.status === 201) {
    return E.right(response);
  } else if (response.status === 400) {
    return E.left(new Error("Invalid request"));
  } else if (response.status === 401) {
    return E.left(new Error("Jira secrets misconfiguration"));
  } else if (response.status >= 500) {
    return E.left(new Error("Jira API returns an error"));
  } else {
    return E.left(new Error("Unknown status code response error"));
  }
};

export const jiraClient = (
  config: JiraConfig,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): JiraAPIClient => {
  const jiraHeaders = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(
      `${config.JIRA_USERNAME}:${config.JIRA_TOKEN}`
    ).toString("base64")}`,
    "Content-Type": "application/json",
  };

  const createJiraIssue = (
    title: NonEmptyString,
    description: NonEmptyString,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ): TaskEither<Error, CreateJiraIssueResponse> =>
    pipe(
      TE.tryCatch(
        () =>
          fetchApi(`${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}issue`, {
            body: JSON.stringify({
              fields: {
                ...fromMapToObject(customFields),
                description,
                issuetype: {
                  name: "Task",
                },
                labels: labels || [],
                project: {
                  key: config.JIRA_PROJECT_NAME,
                },
                summary: title,
              },
            }),
            headers: jiraHeaders,
            method: "POST",
          }),
        toError
      ),
      TE.chainEitherK(checkJiraResponse),
      TE.chain((response) => TE.tryCatch(() => response.json(), toError)),
      TE.chain((responseBody) =>
        pipe(
          responseBody,
          CreateJiraIssueResponse.decode,
          TE.fromEither,
          TE.mapLeft((errors) => toError(readableReport(errors)))
        )
      )
    );

  const searchJiraIssues = (
    bodyData: SearchJiraIssuesPayload
  ): TaskEither<Error, SearchJiraIssuesResponse> =>
    pipe(
      TE.tryCatch(
        () =>
          fetchApi(`${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}search`, {
            body: JSON.stringify(bodyData),
            headers: jiraHeaders,
            method: "POST",
          }),
        toError
      ),
      TE.chainEitherK(checkJiraResponse),
      TE.chain((response) => TE.tryCatch(() => response.json(), toError)),
      TE.chain((responseBody) =>
        pipe(
          responseBody,
          SearchJiraIssuesResponse.decode,
          TE.fromEither,
          TE.mapLeft((errors) => toError(readableReport(errors)))
        )
      )
    );

  return {
    config,
    createJiraIssue,
    searchJiraIssues,
  };
};
