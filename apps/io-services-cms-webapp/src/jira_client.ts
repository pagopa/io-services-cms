import { toError } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import nodeFetch from "node-fetch";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";

const JIRA_ISSUE_REST_API_PATH = "/rest/api/3/issue";

export type jiraConfig = {
  readonly projectName: NonEmptyString;
  readonly jiraUsername: EmailAddress;
  readonly token: NonEmptyString;
};

export const CreateJiraIssueResponse = t.interface({
  id: NonEmptyString,
  key: NonEmptyString,
});
export type CreateJiraIssueResponse = t.TypeOf<typeof CreateJiraIssueResponse>;

export type jiraAPIClient = {
  readonly createJiraIssue: (
    title: NonEmptyString,
    description: ReadonlyArray<unknown>,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ) => TaskEither<Error, CreateJiraIssueResponse>;
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

export const JiraAPIClient = (
  baseUrl: NonEmptyString,
  config: jiraConfig,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): jiraAPIClient => {
  const jiraHeaders = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(
      `${config.jiraUsername}:${config.token}`
    ).toString("base64")}`,
    "Content-Type": "application/json",
  };

  const createJiraIssue = (
    title: NonEmptyString,
    description: ReadonlyArray<unknown>,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ): TaskEither<Error, CreateJiraIssueResponse> =>
    pipe(
      TE.tryCatch(
        () =>
          fetchApi(`${baseUrl}${JIRA_ISSUE_REST_API_PATH}`, {
            body: JSON.stringify({
              fields: {
                ...fromMapToObject(customFields),
                description: {
                  version: 1,
                  type: "doc",
                  content: description,
                },
                issuetype: {
                  name: "Task",
                },
                labels: labels || [],
                project: {
                  key: config.projectName,
                },
                summary: title,
              },
            }),
            headers: jiraHeaders,
            method: "POST",
          }),
        toError
      ),
      TE.chain((_) => {
        if (_.status >= 500) {
          return TE.left(new Error("Jira API returns an error"));
        }
        if (_.status === 401) {
          return TE.left(new Error("Jira secrets misconfiguration"));
        }
        if (_.status === 400) {
          return TE.left(new Error("Invalid request"));
        }
        if (_.status !== 201) {
          return TE.left(new Error("Unknown status code response error"));
        }
        return pipe(
          TE.tryCatch(() => _.json(), toError),
          TE.chain((responseBody) =>
            pipe(
              responseBody,
              CreateJiraIssueResponse.decode,
              TE.fromEither,
              TE.mapLeft((errors) => toError(readableReport(errors)))
            )
          )
        );
      })
    );

  return {
    createJiraIssue,
  };
};
