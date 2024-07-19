import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
import { toError } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import nodeFetch from "node-fetch-commonjs";
import { JiraConfig } from "../../config";

export const JIRA_REST_API_PATH = "/rest/api/2/";
const NO_BODY_REQUEST = "no body on request";

export const CreateJiraIssueResponse = t.type({
  id: NonEmptyString,
  key: NonEmptyString,
});
export type CreateJiraIssueResponse = t.TypeOf<typeof CreateJiraIssueResponse>;
export type UpdateJiraIssueResponse = t.TypeOf<typeof CreateJiraIssueResponse>;

export const JiraIssue = t.type({
  id: NonEmptyString,
  key: NonEmptyString,
  fields: t.type({
    comment: t.type({
      comments: t.readonlyArray(t.type({ body: t.string })),
    }),
    status: t.intersection([
      t.type({
        name: t.string,
      }),
      t.partial({
        id: t.string,
      }),
    ]),
    statuscategorychangedate: withDefault(
      NonEmptyString,
      new Date().toISOString() as NonEmptyString
    ),
  }),
});
export type JiraIssue = t.TypeOf<typeof JiraIssue>;

export const SearchJiraIssuesResponse = t.intersection([
  t.type({
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

const SearchJiraIssuesPayload = t.type({
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
    priority: NonEmptyString,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ) => TaskEither<Error, CreateJiraIssueResponse>;
  readonly updateJiraIssue: (
    ticketKey: NonEmptyString,
    title: NonEmptyString,
    description: NonEmptyString,
    priority: NonEmptyString,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ) => TaskEither<Error, void>;
  readonly searchJiraIssues: (
    bodyData: SearchJiraIssuesPayload
  ) => TaskEither<Error, SearchJiraIssuesResponse>;
  readonly applyJiraIssueTransition: (
    ticketKey: NonEmptyString,
    transitionId: NonEmptyString,
    message?: string
  ) => TaskEither<Error, void>;
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

export const checkJiraResponse = (
  response: Response,
  method: string,
  bodyString?: string
): TE.TaskEither<Error, Response> => {
  if (
    response.status === 200 ||
    response.status === 201 ||
    response.status === 204
  ) {
    return TE.right(response);
  } else if (response.status === 400) {
    return pipe(
      TE.tryCatch(() => response.json(), E.toError),
      TE.mapLeft(
        (_) =>
          new Error(
            `Jira API ${method} returns an Invalid request, content => Cannot Extract Content, body => ${
              bodyString ?? NO_BODY_REQUEST
            }`
          )
      ),
      TE.chainW((content) =>
        TE.left(
          new Error(
            `Jira API ${method} returns an Invalid request, content =>  => ${JSON.stringify(
              content
            )}, body => ${bodyString ?? NO_BODY_REQUEST}`
          )
        )
      )
    );
  } else if (response.status === 401) {
    return TE.left(new Error("Jira secrets misconfiguration"));
  } else if (response.status >= 500) {
    return pipe(
      TE.tryCatch(() => response.text(), E.toError),
      TE.mapLeft(
        (_) =>
          new Error(
            `Jira API ${method} returns an error, content => Cannot Extract Content, body => ${
              bodyString ?? NO_BODY_REQUEST
            }`
          )
      ),
      TE.chainW((content) =>
        TE.left(
          new Error(
            `Jira API ${method} returns an error, content => ${content}, body => ${
              bodyString ?? NO_BODY_REQUEST
            }`
          )
        )
      )
    );
  } else {
    return TE.left(
      new Error(`Unknown status code ${response.status} received`)
    );
  }
};

// eslint-disable-next-line max-lines-per-function
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
    priority: NonEmptyString,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ): TaskEither<Error, CreateJiraIssueResponse> =>
    pipe(
      JSON.stringify({
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
          priority: {
            id: priority,
          },
        },
      }),
      TE.right,
      TE.bindTo("bodyStringified"),
      TE.bind("response", ({ bodyStringified }) =>
        TE.tryCatch(
          () =>
            fetchApi(`${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}issue`, {
              body: bodyStringified,
              headers: jiraHeaders,
              method: "POST",
            }),
          toError
        )
      ),
      TE.chain(({ response, bodyStringified }) =>
        checkJiraResponse(response, "createJiraIssue", bodyStringified)
      ),
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

  const updateJiraIssue = (
    ticketKey: NonEmptyString,
    title: NonEmptyString,
    description: NonEmptyString,
    priority: NonEmptyString,
    labels?: ReadonlyArray<NonEmptyString>,
    customFields?: ReadonlyMap<string, unknown>
  ): TaskEither<Error, void> =>
    pipe(
      JSON.stringify({
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
          priority: {
            id: priority,
          },
        },
      }),
      TE.right,
      TE.bindTo("bodyStringified"),
      TE.bind("response", ({ bodyStringified }) =>
        TE.tryCatch(
          () =>
            fetchApi(
              `${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}issue/${ticketKey}`,
              {
                body: bodyStringified,
                headers: jiraHeaders,
                method: "PUT",
              }
            ),
          toError
        )
      ),
      TE.chain(({ response, bodyStringified }) =>
        checkJiraResponse(response, "updateJiraIssue", bodyStringified)
      ),
      TE.map((_) => void 0)
    );

  const applyJiraIssueTransition = (
    ticketKey: NonEmptyString,
    transitionId: NonEmptyString,
    message?: string
  ): TaskEither<Error, void> =>
    pipe(
      JSON.stringify({
        ...pipe(
          message,
          O.fromNullable,
          O.map((_) => ({
            update: {
              comment: [
                {
                  add: {
                    body: _,
                  },
                },
              ],
            },
          })),
          O.toUndefined
        ),
        transition: {
          id: transitionId,
        },
      }),
      TE.right,
      TE.bindTo("bodyStringified"),
      TE.bind("response", ({ bodyStringified }) =>
        TE.tryCatch(
          () =>
            fetchApi(
              `${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}issue/${ticketKey}/transitions`,
              {
                body: bodyStringified,
                headers: jiraHeaders,
                method: "POST",
              }
            ),
          toError
        )
      ),
      TE.chain(({ response, bodyStringified }) =>
        checkJiraResponse(response, "applyJiraIssueTransition", bodyStringified)
      ),
      TE.map((_) => void 0)
    );

  const searchJiraIssues = (
    bodyData: SearchJiraIssuesPayload
  ): TaskEither<Error, SearchJiraIssuesResponse> =>
    pipe(
      JSON.stringify(bodyData),
      TE.right,
      TE.bindTo("bodyStringified"),
      TE.bind("response", ({ bodyStringified }) =>
        TE.tryCatch(
          () =>
            fetchApi(
              `${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}search`,
              {
                body: bodyStringified,
                headers: jiraHeaders,
                method: "POST",
              }
            ),
          toError
        )
      ),
      TE.chain(({ response, bodyStringified }) =>
        checkJiraResponse(response, "searchJiraIssues", bodyStringified)
      ),
      TE.mapLeft(
        (e) =>
          new Error(
            `Error in searchJiraIssues: ${e.message}, url: ${
              config.JIRA_NAMESPACE_URL
            }${JIRA_REST_API_PATH}search, body: ${JSON.stringify(bodyData)}`
          )
      ),
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
    updateJiraIssue,
    applyJiraIssueTransition,
  };
};
