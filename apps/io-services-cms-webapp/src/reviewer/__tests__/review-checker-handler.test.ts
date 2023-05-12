import { afterEach, describe, expect, it, vi } from "vitest";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import { JiraIssue } from "../../lib/clients/jira-client";
import {
  IssueItemPair,
  buildIssueItemPairs,
  updateReview,
} from "../review-checker-handler";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { QueryResult } from "pg";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();

const anItem1: ServiceReviewRowDataTable = {
  service_id: "s1" as NonEmptyString,
  service_version: "v1" as NonEmptyString,
  ticket_id: "tid1" as NonEmptyString,
  ticket_key: "tk1" as NonEmptyString,
  status: "PENDING",
};

const anItem2: ServiceReviewRowDataTable = {
  service_id: "s2" as NonEmptyString,
  service_version: "v2" as NonEmptyString,
  ticket_id: "tid2" as NonEmptyString,
  ticket_key: "tk2" as NonEmptyString,
  status: "PENDING",
};

const anItemList: ServiceReviewRowDataTable[] = [anItem1, anItem2];

const aJiraIssue1: JiraIssue = {
  id: anItem1.ticket_id,
  key: anItem1.ticket_key,
  fields: {
    comment: {
      comments: [
        { body: "comment 1" },
        { body: "a *formatted* comment … {{some code}} ." },
      ],
    },
    status: {
      name: "APPROVED",
    },
  },
};
const aJiraIssue2: JiraIssue = {
  id: anItem2.ticket_id,
  key: anItem2.ticket_key,
  fields: {
    comment: {
      comments: [{ body: "reason comment 1" }, { body: "reason comment 2" }],
    },
    status: {
      name: "REJECTED",
    },
  },
};

const anInsertQueryResult: QueryResult = {
  command: "string",
  rowCount: 1,
  oid: 1,
  fields: [],
  rows: [],
};

const mainMockServiceReviewDao = {
  insert: vi.fn((data: ServiceReviewRowDataTable) => {
    return TE.of(anInsertQueryResult);
  }),
  executeOnPending: vi.fn(),
};

const mainMockJiraProxy = {
  createJiraIssue: vi.fn(),
  searchJiraIssuesByKey: vi.fn(),
  getJiraIssueByServiceId: vi.fn(),
};

describe("[Service Review Checker Handler] buildIssueItemPairs", () => {
  it("should build TWO IssueItemPairs given 2 jira issues, an APPROVED one and a REJECTED one", async () => {
    mainMockJiraProxy.searchJiraIssuesByKey.mockImplementationOnce(() =>
      TE.of({
        startAt: 0,
        total: 2,
        issues: [aJiraIssue1, aJiraIssue2],
      })
    );

    const result = await buildIssueItemPairs(mainMockJiraProxy)(anItemList)();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
        {
          issue: aJiraIssue2,
          item: anItem2,
        },
      ]);
    }
  });

  it("should build ONE IssueItemPair given TWO jira issues, an APPROVED one and a NEW one", async () => {
    mainMockJiraProxy.searchJiraIssuesByKey.mockImplementationOnce(() =>
      TE.of({
        startAt: 0,
        total: 2,
        issues: [
          aJiraIssue1,
          { ...aJiraIssue2, fields: { status: { name: "NEW" } } },
        ],
      })
    );

    const result = await buildIssueItemPairs(mainMockJiraProxy)(anItemList)();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
      ]);
    }
  });

  it("should build EMPTY IssueItemPair given TWO jira issues with status different from APPROVED or REJECTED", async () => {
    mainMockJiraProxy.searchJiraIssuesByKey.mockImplementationOnce(() =>
      TE.of({
        startAt: 0,
        total: 2,
        issues: [
          { ...aJiraIssue1, fields: { status: { name: "REVIEW" } } },
          { ...aJiraIssue2, fields: { status: { name: "NEW" } } },
        ],
      })
    );

    const result = await buildIssueItemPairs(mainMockJiraProxy)(anItemList)();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual([]);
    }
  });

  it("should build EMPTY IssueItemPair given EMPTY jira issues response", async () => {
    mainMockJiraProxy.searchJiraIssuesByKey.mockImplementationOnce(() =>
      TE.of({
        startAt: 0,
        total: 0,
        issues: [],
      })
    );

    const result = await buildIssueItemPairs(mainMockJiraProxy)(anItemList)();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual([]);
    }
  });

  it("should return Error if searchJiraIssuesByKey returns an error", async () => {
    mainMockJiraProxy.searchJiraIssuesByKey.mockImplementationOnce(() =>
      TE.left(new Error())
    );

    const result = await buildIssueItemPairs(mainMockJiraProxy)(anItemList)();

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(new Error());
    }
  });
});
