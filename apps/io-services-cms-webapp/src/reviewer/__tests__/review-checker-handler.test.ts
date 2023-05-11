import { afterEach, describe, expect, it, vi } from "vitest";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import {
  JiraIssue,
  SearchJiraIssuesResponse,
} from "../../lib/clients/jira-client";
import { createReviewCheckerHandler } from "../review-checker-handler";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { QueryResult } from "pg";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();

const aJiraIssue: JiraIssue = {
  id: "aJiraIssueId" as NonEmptyString,
  key: "anIssueKey" as NonEmptyString,
  fields: {
    comment: {
      comments: [
        { body: "comment 1" },
        { body: "comment 2" },
        { body: "a *formatted* comment … {{some code}} ." },
      ],
    },
    status: {
      name: "REVIEW",
    },
  },
};

const aSearchJiraIssuesResponse: SearchJiraIssuesResponse = {
  startAt: 0,
  total: 1,
  issues: [aJiraIssue],
};

const anInsertQueryResult: QueryResult = {
  command: "string",
  rowCount: 1,
  oid: 1,
  fields: [],
  rows: [],
};

const aVoidFn = () => console.log("");

const mainMockServiceReviewDao = {
  insert: vi.fn((data: ServiceReviewRowDataTable) => {
    return TE.of(anInsertQueryResult);
  }),
  executeOnPending: vi.fn(
    (
      fn: (items: ServiceReviewRowDataTable[]) => TE.TaskEither<Error, void>
    ) => {
      return TE.of(aVoidFn());
    }
  ),
};

const mainMockJiraProxy = {
  createJiraIssue: vi.fn(),
  searchJiraIssuesByKey: vi.fn(
    (jiraIssueKeys: ReadonlyArray<NonEmptyString>) => {
      return TE.of(aSearchJiraIssuesResponse);
    }
  ),
  getJiraIssueByServiceId: vi.fn(),
};

describe("Service Review Checker Handler", () => {
  it("should check a NEW|REVIEW service review", async () => {
    const handler = createReviewCheckerHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      serviceLifecycleStore
    );

    const result = await handler;

    expect(mainMockServiceReviewDao.executeOnPending).toBeCalled();
    //expect(mainMockJiraProxy.searchJiraIssuesByKey).toBeCalled();
    // todo: FSM
    //expect(mainMockServiceReviewDao.insert).toBeCalled();
    // console.log(result);
  });
});
