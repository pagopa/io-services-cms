import { ServiceId } from "@io-services-cms/models/service-lifecycle/definitions";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { isNumber } from "fp-ts/lib/number";
import * as T from "fp-ts/Task";
import * as t from "io-ts";
import nodeFetch from "node-fetch-commonjs";
import { IConfig } from "../../config";
import { JIRA_REST_API_PATH, SearchJiraIssuesPayload } from "./jira-client";

export const JIRA_SERVICE_TAG_PREFIX = "devportal-service-";

export const JiraLegacyIssue = t.type({
  id: NonEmptyString,
  key: NonEmptyString,
  fields: t.intersection([
    t.type({
      comment: t.type({
        comments: t.readonlyArray(t.type({ body: t.string })),
      }),
      status: t.type({
        name: t.string,
      }),
    }),
    t.partial({
      statuscategorychangedate: t.string,
    }),
  ]),
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

export type JiraLegacyOptions = {
  defaultRetryAfter?: number;
  maxRetry?: number;
};

export type JiraLegacyAPIClient = {
  readonly searchJiraIssueByServiceId: (
    serviceId: ServiceId,
    options?: JiraLegacyOptions
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

  const searchJiraIssueByServiceId = (
    serviceId: ServiceId,
    {
      defaultRetryAfter = 5000,
      maxRetry = 5,
    }: {
      defaultRetryAfter?: number;
      maxRetry?: number;
    } = {}
  ) => {
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
      fetchApiWithRetry(
        `${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}search`,
        fetchApi,
        {
          body: JSON.stringify(bodyData),
          headers: jiraHeaders,
          method: "POST",
        },
        defaultRetryAfter,
        maxRetry
      ),
      TE.chain((response) =>
        pipe(
          TE.tryCatch(
            () => response.json(),
            (err) =>
              new Error(
                `Error parsing Jira response, statusCode: ${
                  response.status
                }, headers: ${extractHeaders(response)}, error: ${
                  E.toError(err).message
                }`
              )
          ),
          TE.chain((responseBody) =>
            pipe(
              checkJiraResponse(response.status, responseBody),
              TE.fromEither
            )
          )
        )
      ),
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

  const fetchApiWithRetry = (
    url: string,
    fetchApi: typeof fetch,
    options: RequestInit,
    defaultRetryAfter: number,
    maxRetryCount: number
  ): TE.TaskEither<Error, Response> => {
    const attempt = (retryCount: number): TE.TaskEither<Error, Response> =>
      pipe(
        TE.tryCatch(() => fetchApi(url, options), E.toError),
        TE.chain((response) =>
          response.status === 429
            ? pipe(
                response.headers.get("Retry-After"),
                O.fromNullable,
                O.chain((delay) =>
                  isNumber(Number(delay)) ? O.some(delay) : O.none
                ),
                O.fold(
                  () => defaultRetryAfter,
                  (retryAfter) => Number(retryAfter) * 1000
                ),
                (retryAfter) =>
                  retryCount < maxRetryCount
                    ? pipe(
                        T.delay(retryAfter)(attempt(retryCount + 1)),
                        TE.map(TE.right),
                        TE.flatten
                      )
                    : TE.left(
                        new Error(
                          `Cannot Contact jira after retries, statusCode: ${
                            response.status
                          }, headers: ${extractHeaders(response)}`
                        )
                      )
              )
            : TE.right(response)
        )
      );

    return attempt(0);
  };

  const extractHeaders = (response: Response) => {
    try {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        // eslint-disable-next-line functional/immutable-data
        headers[key] = value;
      });
      return JSON.stringify(headers);
    } catch (e) {
      return "CANNOT EXTRACT HEADERS";
    }
  };

  const checkJiraResponse = (
    status: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responseBody: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): E.Either<Error, any> => {
    if (status === 200 || status === 201) {
      return E.right(responseBody);
    } else if (status === 400) {
      return E.left(
        new Error(
          `Invalid request, responseBody: ${JSON.stringify(responseBody)}`
        )
      );
    } else if (status === 401) {
      return E.left(
        new Error(
          `Jira secrets misconfiguration, responseBody: ${JSON.stringify(
            responseBody
          )}`
        )
      );
    } else if (status >= 500) {
      return E.left(
        new Error(
          `Jira API returns an error, responseBody: ${JSON.stringify(
            responseBody
          )}`
        )
      );
    } else {
      return E.left(
        new Error(
          `Unknown status code ${status} received, responseBody: ${JSON.stringify(
            responseBody
          )}`
        )
      );
    }
  };

  return {
    searchJiraIssueByServiceId,
  };
};
