import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { QueryResult } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JiraIssue } from "../../lib/clients/jira-client";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import {
  IssueItemPair,
  buildIssueItemPairs,
  updateReview,
} from "../review-checker-handler";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const aService = {
  id: "s1",
  data: {
    name: "aServiceName" as NonEmptyString,
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
} as unknown as ServiceLifecycle.definitions.Service;

const aService2 = {
  ...aService,
  id: "s2",
} as unknown as ServiceLifecycle.definitions.Service;

const aService3 = {
  ...aService,
  id: "s3",
} as unknown as ServiceLifecycle.definitions.Service;

const aService4 = {
  ...aService,
  id: "s4",
} as unknown as ServiceLifecycle.definitions.Service;

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

const anItem3: ServiceReviewRowDataTable = {
  service_id: "s3" as NonEmptyString,
  service_version: "v2" as NonEmptyString,
  ticket_id: "tid3" as NonEmptyString,
  ticket_key: "tk3" as NonEmptyString,
  status: "PENDING",
};

const anItem4: ServiceReviewRowDataTable = {
  service_id: "s4" as NonEmptyString,
  service_version: "v2" as NonEmptyString,
  ticket_id: "tid4" as NonEmptyString,
  ticket_key: "tk4" as NonEmptyString,
  status: "PENDING",
};

const anItemList: ServiceReviewRowDataTable[] = [
  anItem1,
  anItem2,
  anItem3,
  anItem4,
];

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
    statuscategorychangedate: "2023-05-12T15:10:05.173+0200" as NonEmptyString,
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
    statuscategorychangedate: "2023-05-12T15:24:09.173+0200" as NonEmptyString,
  },
};

const aJiraIssue3: JiraIssue = {
  id: anItem3.ticket_id,
  key: anItem3.ticket_key,
  fields: {
    comment: {
      comments: [
        { body: "comment 3" },
        { body: "a *formatted* comment … {{some code}} ." },
      ],
    },
    status: {
      name: "Approvata",
      id: "10985",
    },
    statuscategorychangedate: "2023-05-12T15:10:05.173+0200" as NonEmptyString,
  },
};

const aJiraIssue4: JiraIssue = {
  id: anItem4.ticket_id,
  key: anItem4.ticket_key,
  fields: {
    comment: {
      comments: [
        { body: "comment 4" },
        { body: "a *formatted* comment … {{some code}} ." },
      ],
    },
    status: {
      name: "aBadStatusName",
      id: "10986",
    },
    statuscategorychangedate: "2023-05-12T15:10:05.173+0200" as NonEmptyString,
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
  insert: vi.fn(),
  executeOnPending: vi.fn(),
  updateStatus: vi.fn((data: ServiceReviewRowDataTable) => {
    return TE.of(anInsertQueryResult);
  }),
};

const mainMockJiraProxy = {
  createJiraIssue: vi.fn(),
  searchJiraIssuesByKeyAndStatus: vi.fn(),
  getJiraIssueByServiceId: vi.fn(),
  getPendingJiraIssueByServiceId: vi.fn(),
};

const mockContext = {
  log: {
    error: vi.fn((_) => console.error(_)),
    info: vi.fn((_) => console.info(_)),
    warn: vi.fn((_) => console.warn(_)),
  },
} as any;

describe("[Service Review Checker Handler] buildIssueItemPairs", () => {
  it("should build THREE IssueItemPairs given 3 jira issues, an APPROVED one, a REJECTED one and an Approvata one", async () => {
    mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
      () =>
        TE.of({
          startAt: 0,
          total: 3,
          issues: [aJiraIssue1, aJiraIssue2, aJiraIssue3],
        }),
    );

    const result = await buildIssueItemPairs(
      mockContext,
      mainMockJiraProxy,
    )(anItemList)();

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
        {
          issue: aJiraIssue3,
          item: anItem3,
        },
      ]);
    }
  });

  it("should build EMPTY IssueItemPair given ZERO jira issues", async () => {
    mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
      () =>
        TE.of({
          startAt: 0,
          total: 0,
          issues: [],
        }),
    );

    const result = await buildIssueItemPairs(
      mockContext,
      mainMockJiraProxy,
    )([])();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual([]);
    }
  });

  it("should build EMPTY IssueItemPair given EMPTY jira issues response", async () => {
    mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
      () =>
        TE.of({
          startAt: 0,
          total: 0,
          issues: [],
        }),
    );

    const result = await buildIssueItemPairs(
      mockContext,
      mainMockJiraProxy,
    )(anItemList)();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual([]);
    }
  });

  it("should return Error if searchJiraIssuesByKeyAndStatus returns an error", async () => {
    mainMockJiraProxy.searchJiraIssuesByKeyAndStatus.mockImplementationOnce(
      () => TE.left(new Error()),
    );

    const result = await buildIssueItemPairs(
      mockContext,
      mainMockJiraProxy,
    )(anItemList)();

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(new Error());
    }
  });
});

describe("[Service Review Checker Handler] updateReview", () => {
  it("should update TWO PENDING service review given TWO IssueItemPairs, one with APPROVED jira status and one with REJECTED jira status", async () => {
    const mockFsmLifecycleClient = {
      approve: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "approved" },
        }),
      ),
      reject: vi.fn(() =>
        TE.right({
          ...aService2,
          fsm: { state: "rejected" },
        }),
      ),
    } as unknown as ServiceLifecycle.FsmClient;
    const result = await updateReview(
      mockContext,
      mainMockServiceReviewDao,
      mockFsmLifecycleClient,
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

    expect(mockFsmLifecycleClient.approve).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.approve).toBeCalledWith(aService.id, {
      approvalDate: aJiraIssue1.fields.statuscategorychangedate,
    });

    expect(mockFsmLifecycleClient.reject).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.reject).toBeCalledWith(aService2.id, {
      reason: aJiraIssue2.fields.comment.comments
        .map((value) => value.body)
        .join("|"),
    });

    expect(mainMockServiceReviewDao.updateStatus).toBeCalledTimes(2);
    expect(mainMockServiceReviewDao.updateStatus).toBeCalledWith({
      ...anItem1,
      status: aJiraIssue1.fields.status.name,
    });
    expect(mainMockServiceReviewDao.updateStatus).toBeCalledWith({
      ...anItem2,
      status: aJiraIssue2.fields.status.name,
    });
  });

  it("should update TWO PENDING service review given TWO IssueItemPairs, one with Approvata jira status and one with a bad status name but REJECTED Id jira status", async () => {
    const mockFsmLifecycleClient = {
      approve: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "approved" },
        }),
      ),
      reject: vi.fn(() =>
        TE.right({
          ...aService2,
          fsm: { state: "rejected" },
        }),
      ),
    } as unknown as ServiceLifecycle.FsmClient;
    const result = await updateReview(
      mockContext,
      mainMockServiceReviewDao,
      mockFsmLifecycleClient,
    )([
      {
        issue: aJiraIssue3,
        item: anItem3,
      },
      {
        issue: aJiraIssue4,
        item: anItem4,
      },
    ] as unknown as IssueItemPair[])();

    expect(E.isRight(result)).toBeTruthy();

    expect(mockFsmLifecycleClient.approve).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.approve).toBeCalledWith(aService3.id, {
      approvalDate: aJiraIssue3.fields.statuscategorychangedate,
    });

    expect(mockFsmLifecycleClient.reject).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.reject).toBeCalledWith(aService4.id, {
      reason: aJiraIssue4.fields.comment.comments
        .map((value) => value.body)
        .join("|"),
    });

    expect(mainMockServiceReviewDao.updateStatus).toBeCalledTimes(2);
    expect(mainMockServiceReviewDao.updateStatus).toBeCalledWith({
      ...anItem3,
      status: "APPROVED",
    });
    expect(mainMockServiceReviewDao.updateStatus).toBeCalledWith({
      ...anItem4,
      status: "REJECTED",
    });
  });

  it("should not change service review status if it receives an empty issueItemPair", async () => {
    const mockFsmLifecycleClient =
      vi.fn() as unknown as ServiceLifecycle.FsmClient;
    const result = await updateReview(
      mockContext,
      mainMockServiceReviewDao,
      mockFsmLifecycleClient,
    )([] as unknown as IssueItemPair[])();

    expect(E.isRight(result)).toBeTruthy();

    expect(mockFsmLifecycleClient).not.toBeCalled();

    expect(mainMockServiceReviewDao.updateStatus).not.toBeCalled();
  });

  it("should return a generic Error when FSM apply fails (all AllFsmErrors but FsmNoTransitionMatchedError)", async () => {
    class FSMError extends Error {
      public kind = "GenericError";
      constructor() {
        super(`aMessage`);
      }
    }
    const mockFsmLifecycleClient = {
      approve: vi.fn(() => TE.left(new FSMError())),
    } as unknown as ServiceLifecycle.FsmClient;
    const mockServiceReviewDao_onUpdateStatus = vi.fn(() =>
      Promise.resolve({} as QueryResult),
    );
    const mockServiceReviewDao = {
      insert: vi.fn(),
      executeOnPending: vi.fn(),
      updateStatus: vi.fn((_: ServiceReviewRowDataTable) =>
        TE.fromTask(mockServiceReviewDao_onUpdateStatus),
      ),
    };

    const result = await updateReview(
      mockContext,
      mockServiceReviewDao,
      mockFsmLifecycleClient,
    )([
      {
        issue: aJiraIssue1,
        item: anItem1,
      },
    ] as unknown as IssueItemPair[])();

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.message).eq("aMessage");
    }

    expect(mockFsmLifecycleClient.approve).toBeCalled();
    expect(mockServiceReviewDao.updateStatus).toBeCalled();
    expect(mockServiceReviewDao_onUpdateStatus).not.toBeCalled();
  });

  it("should not fails when requested transition is not applicable", async () => {
    class FSMError extends Error {
      public kind = "FsmNoTransitionMatchedError";
    }
    const mockFsmLifecycleClient = {
      approve: vi.fn(() => TE.left(new FSMError())),
    } as unknown as ServiceLifecycle.FsmClient;
    const mockServiceReviewDao_onUpdateStatus = vi.fn(() =>
      Promise.resolve({} as QueryResult),
    );
    const mockServiceReviewDao = {
      insert: vi.fn(),
      executeOnPending: vi.fn(),
      updateStatus: vi.fn((_: ServiceReviewRowDataTable) =>
        TE.fromTask(mockServiceReviewDao_onUpdateStatus),
      ),
    };

    const result = await updateReview(
      mockContext,
      mockServiceReviewDao,
      mockFsmLifecycleClient,
    )([
      {
        issue: aJiraIssue1,
        item: anItem1,
      },
    ] as unknown as IssueItemPair[])();

    // updateReview result
    expect(E.isRight(result)).toBeTruthy();

    // serviceReviewDao number of calls and updateStatus values
    expect(mockFsmLifecycleClient.approve).toBeCalled();
    expect(mockServiceReviewDao.updateStatus).toBeCalled();
    expect(mockServiceReviewDao_onUpdateStatus).toBeCalled();
  });
});
