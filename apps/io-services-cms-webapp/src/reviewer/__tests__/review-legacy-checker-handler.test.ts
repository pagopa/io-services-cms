import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { QueryResult } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JiraIssue } from "../../lib/clients/jira-client";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import {
  IssueItemPair,
  buildIssueItemPairs,
  updateReview,
} from "../review-legacy-checker-handler";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const mockContext = {
  log: {
    error: vi.fn((_) => console.error(_)),
    info: vi.fn((_) => console.info(_)),
    warn: vi.fn((_) => console.warn(_)),
  },
} as any;

const aService = {
  data: {
    authorized_recipients: [],
    description: "aServiceDescription",
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    name: "aServiceName" as NonEmptyString,
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  id: "s1",
} as unknown as ServiceLifecycle.definitions.Service;

const aService2 = {
  ...aService,
  id: "s2",
} as unknown as ServiceLifecycle.definitions.Service;

const anItem1: ServiceReviewRowDataTable = {
  service_id: "s1" as NonEmptyString,
  service_version: "v1" as NonEmptyString,
  status: "PENDING",
  ticket_id: "tid1" as NonEmptyString,
  ticket_key: "tk1" as NonEmptyString,
};

const anItem2: ServiceReviewRowDataTable = {
  service_id: "s2" as NonEmptyString,
  service_version: "v2" as NonEmptyString,
  status: "PENDING",
  ticket_id: "tid2" as NonEmptyString,
  ticket_key: "tk2" as NonEmptyString,
};

const anItemList: ServiceReviewRowDataTable[] = [anItem1, anItem2];

const aJiraIssue1: JiraIssue = {
  fields: {
    comment: {
      comments: [
        { body: "comment 1" },
        { body: "a *formatted* comment … {{some code}} ." },
      ],
    },
    status: {
      name: "Completata",
    },
    statuscategorychangedate: "2023-05-12T15:10:05.173+0200" as NonEmptyString,
  },
  id: anItem1.ticket_id,
  key: anItem1.ticket_key,
};
const aJiraIssue2: JiraIssue = {
  fields: {
    comment: {
      comments: [{ body: "reason comment 1" }, { body: "reason comment 2" }],
    },
    status: {
      name: "REJECTED",
    },
    statuscategorychangedate: "2023-05-12T15:24:09.173+0200" as NonEmptyString,
  },
  id: anItem2.ticket_id,
  key: anItem2.ticket_key,
};

const anInsertQueryResult: QueryResult = {
  command: "string",
  fields: [],
  oid: 1,
  rowCount: 1,
  rows: [],
};

const mainMockServiceReviewDao = {
  executeOnPending: vi.fn(),
  insert: vi.fn(),
  updateStatus: vi.fn((data: ServiceReviewRowDataTable) =>
    TE.of(anInsertQueryResult),
  ),
};

const mainMockJiraProxy = {
  createJiraIssue: vi.fn(),
  getJiraIssueByServiceId: vi.fn(),
  getPendingAndRejectedJiraIssueByServiceId: vi.fn(),
  reOpenJiraIssue: vi.fn(),
  searchJiraIssuesByKeyAndStatus: vi.fn(),
  updateJiraIssue: vi.fn(),
};

describe("Service Review Legacy Checker Handler tests", () => {
  describe("buildIssueItemPairs", () => {
    it("should build TWO IssueItemPairs given 2 jira issues, an APPROVED one and a REJECTED one", async () => {
      mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
        () =>
          TE.of({
            issues: [aJiraIssue1, aJiraIssue2],
            startAt: 0,
            total: 2,
          }),
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

    it("should build EMPTY IssueItemPair given ZERO jira issues", async () => {
      mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
        () =>
          TE.of({
            issues: [],
            startAt: 0,
            total: 0,
          }),
      );

      const result = await buildIssueItemPairs(mainMockJiraProxy)([])();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual([]);
      }
    });

    it("should build EMPTY IssueItemPair given EMPTY jira issues response", async () => {
      mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
        () =>
          TE.of({
            issues: [],
            startAt: 0,
            total: 0,
          }),
      );

      const result = await buildIssueItemPairs(mainMockJiraProxy)(anItemList)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual([]);
      }
    });

    it("should return Error if searchJiraIssuesByKeyAndStatus returns an error", async () => {
      mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
        () => TE.left(new Error()),
      );

      const result = await buildIssueItemPairs(mainMockJiraProxy)(anItemList)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toStrictEqual(new Error());
      }
    });
  });

  describe("updateReview", () => {
    it("should update TWO PENDING service review given TWO IssueItemPairs, one with APPROVED jira status and one with REJECTED jira status", async () => {
      const mockFetch = vi
        .fn()
        .mockImplementationOnce(() =>
          TE.right(
            O.some({
              ...aService,
              fsm: { state: "submitted" },
            }),
          ),
        )
        .mockImplementationOnce(() =>
          TE.right(
            O.some({
              ...aService2,
              fsm: { state: "submitted" },
            }),
          ),
        );

      const mockFsmLifecycleClient = {
        fetch: mockFetch,
        override: vi.fn((_, service) => TE.right(service)),
      } as unknown as ServiceLifecycle.FsmClient;

      const result = await updateReview(
        mainMockServiceReviewDao,
        mockFsmLifecycleClient,
        mockContext,
      )([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
        {
          issue: aJiraIssue2,
          item: anItem2,
        },
      ] as unknown as IssueItemPair[])();

      expect(E.isRight(result)).toBeTruthy();
      expect(mockFsmLifecycleClient.fetch).toBeCalledTimes(2);
      expect(mockFsmLifecycleClient.override).toBeCalledTimes(2);

      // Test1: approve
      expect(mockFsmLifecycleClient.override).toBeCalledWith(aService.id, {
        ...aService,
        fsm: {
          approvalDate: aJiraIssue1.fields.statuscategorychangedate,
          state: "approved",
        },
      });

      // Test2: reject
      expect(mockFsmLifecycleClient.override).toBeCalledWith(aService2.id, {
        ...aService2,
        fsm: {
          reason: aJiraIssue2.fields.comment.comments
            .map((value) => value.body)
            .join("|"),
          state: "rejected",
        },
      });

      expect(mainMockServiceReviewDao.updateStatus).toBeCalledTimes(2);
      expect(mainMockServiceReviewDao.updateStatus).toBeCalledWith({
        ...anItem1,
        status: "APPROVED",
      });
      expect(mainMockServiceReviewDao.updateStatus).toBeCalledWith({
        ...anItem2,
        status: aJiraIssue2.fields.status.name,
      });
    });

    it("should not change service review status if it receives an empty issueItemPair", async () => {
      const mockFsmLifecycleClient =
        vi.fn() as unknown as ServiceLifecycle.FsmClient;
      const result = await updateReview(
        mainMockServiceReviewDao,
        mockFsmLifecycleClient,
        mockContext,
      )([])();

      expect(E.isRight(result)).toBeTruthy();

      expect(mockFsmLifecycleClient).not.toBeCalled();

      expect(mainMockServiceReviewDao.updateStatus).not.toBeCalled();
    });

    it("Should not write on DB when an error appen while overriding", async () => {
      const mockFetch = vi.fn(() =>
        TE.right(
          O.some({
            ...aService,
            fsm: { state: "submitted" },
          }),
        ),
      );

      const mockFsmLifecycleClient = {
        fetch: mockFetch,
        override: vi.fn(() => TE.left(new Error("Error overriding service"))),
      } as unknown as ServiceLifecycle.FsmClient;

      const mockServiceReviewDao_onUpdateStatus = vi.fn(() =>
        Promise.resolve({} as QueryResult),
      );
      const mockServiceReviewDao = {
        executeOnPending: vi.fn(),
        insert: vi.fn(),
        updateStatus: vi.fn((_: ServiceReviewRowDataTable) =>
          TE.fromTask(mockServiceReviewDao_onUpdateStatus),
        ),
      };

      const result = await updateReview(
        mockServiceReviewDao,
        mockFsmLifecycleClient,
        mockContext,
      )([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
      ] as unknown as IssueItemPair[])();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).eq("Error overriding service");
      }

      expect(mockFsmLifecycleClient.fetch).toBeCalledWith();
      expect(mockFsmLifecycleClient.override).toBeCalledWith();
      expect(mockServiceReviewDao.updateStatus).toBeCalledWith();
      expect(mockServiceReviewDao_onUpdateStatus).not.toBeCalled();
    });

    it("should not change service review status if it receives an empty issueItemPair", async () => {
      const mockFsmLifecycleClient =
        vi.fn() as unknown as ServiceLifecycle.FsmClient;
      const result = await updateReview(
        mainMockServiceReviewDao,
        mockFsmLifecycleClient,
        mockContext,
      )([])();

      expect(E.isRight(result)).toBeTruthy();

      expect(mockFsmLifecycleClient).not.toBeCalled();

      expect(mainMockServiceReviewDao.updateStatus).not.toBeCalled();
    });

    it("Should fails when fetch return none", async () => {
      const mockFsmLifecycleClient = {
        fetch: vi.fn(() => TE.right(O.none)),
        override: vi.fn((_, service) => TE.right(service)),
      } as unknown as ServiceLifecycle.FsmClient;

      const mockServiceReviewDao_onUpdateStatus = vi.fn(() =>
        Promise.resolve({} as QueryResult),
      );
      const mockServiceReviewDao = {
        executeOnPending: vi.fn(),
        insert: vi.fn(),
        updateStatus: vi.fn((_: ServiceReviewRowDataTable) =>
          TE.fromTask(mockServiceReviewDao_onUpdateStatus),
        ),
      };

      const result = await updateReview(
        mockServiceReviewDao,
        mockFsmLifecycleClient,
        mockContext,
      )([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
      ] as unknown as IssueItemPair[])();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).eq(
          `Service ${anItem1.service_id} not found cannot ovverride after legacy review`,
        );
      }

      expect(mockFsmLifecycleClient.fetch).toBeCalledWith();
      expect(mockFsmLifecycleClient.override).not.toBeCalled();
      expect(mockServiceReviewDao.updateStatus).toBeCalledWith();
      expect(mockServiceReviewDao_onUpdateStatus).not.toBeCalled();
    });

    it("Should not override when a service is currently deleted", async () => {
      const mockFetch = vi.fn(() =>
        TE.right(
          O.some({
            ...aService,
            fsm: { state: "deleted" },
          }),
        ),
      );

      const mockFsmLifecycleClient = {
        fetch: mockFetch,
        override: vi.fn((_, service) => TE.right(service)),
      } as unknown as ServiceLifecycle.FsmClient;

      const mockServiceReviewDao_onUpdateStatus = vi.fn(() =>
        Promise.resolve({} as QueryResult),
      );
      const mockServiceReviewDao = {
        executeOnPending: vi.fn(),
        insert: vi.fn(),
        updateStatus: vi.fn((_: ServiceReviewRowDataTable) =>
          TE.fromTask(mockServiceReviewDao_onUpdateStatus),
        ),
      };

      const result = await updateReview(
        mockServiceReviewDao,
        mockFsmLifecycleClient,
        mockContext,
      )([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
      ] as unknown as IssueItemPair[])();

      expect(E.isRight(result)).toBeTruthy();

      expect(mockFsmLifecycleClient.fetch).toBeCalledWith();
      expect(mockFsmLifecycleClient.override).not.toBeCalled();
      expect(mockServiceReviewDao.updateStatus).toBeCalledWith();
      expect(mockServiceReviewDao_onUpdateStatus).toBeCalledWith();
    });
  });
});
