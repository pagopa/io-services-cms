import { afterEach, describe, expect, it, vi } from "vitest";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import { JiraIssue } from "../../lib/clients/jira-client";
import {
  IssueItemPair,
  UpdateReviewError,
  buildIssueItemPairs,
  updateReview,
} from "../review-checker-handler";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { DatabaseError, QueryResult } from "pg";

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

describe("[Service Review Checker Handler] updateReview", () => {
  it("should update TWO PENDING service review given TWO IssueItemPairs, one with APPROVED jira status and one with REJECTED jira status", async () => {
    serviceLifecycleStore.save(aService.id, {
      ...aService,
      fsm: { state: "submitted" },
    });
    serviceLifecycleStore.save(aService2.id, {
      ...aService2,
      fsm: { state: "submitted" },
    });
    const result = await updateReview(
      mainMockServiceReviewDao,
      serviceLifecycleStore
    )(
      TE.of([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
        {
          issue: aJiraIssue2,
          item: anItem2,
        },
      ] as unknown as IssueItemPair[])
    )();

    // updateReview result
    expect(E.isRight(result)).toBeTruthy();

    // serviceReviewDao number of calls and insert values
    expect(mainMockServiceReviewDao.insert).toBeCalledTimes(2);
    expect(mainMockServiceReviewDao.insert).toBeCalledWith({
      ...anItem1,
      status: "APPROVED",
    });
    expect(mainMockServiceReviewDao.insert).toBeCalledWith({
      ...anItem2,
      status: "REJECTED",
    });

    const fsmServiceResult = await serviceLifecycleStore.fetch(aService.id)();
    const fsmService2Result = await serviceLifecycleStore.fetch(aService2.id)();

    // fsm apply transitions
    expect(E.isRight(fsmServiceResult)).toBeTruthy();
    if (E.isRight(fsmServiceResult)) {
      expect(O.isSome(fsmServiceResult.right)).toBeTruthy();
      if (O.isSome(fsmServiceResult.right)) {
        expect(fsmServiceResult.right.value.fsm.state).toBe("approved");
        expect(fsmServiceResult.right.value.fsm.approvalDate).toBe(
          aJiraIssue1.fields.statuscategorychangedate
        );
      }
    }
    expect(E.isRight(fsmService2Result)).toBeTruthy();
    if (E.isRight(fsmService2Result)) {
      expect(O.isSome(fsmService2Result.right)).toBeTruthy();
      if (O.isSome(fsmService2Result.right)) {
        expect(fsmService2Result.right.value.fsm.state).toBe("rejected");
        expect(fsmService2Result.right.value.fsm.reason).toBe(
          aJiraIssue2.fields.comment.comments
            .map((value) => value.body)
            .join("|")
        );
      }
    }
  });

  it("should not change service review status (db and FSM) if it receives an empty issueItemPair", async () => {
    serviceLifecycleStore.save(aService.id, {
      ...aService,
      fsm: { state: "submitted" },
    });
    serviceLifecycleStore.save(aService2.id, {
      ...aService2,
      fsm: { state: "submitted" },
    });
    const result = await updateReview(
      mainMockServiceReviewDao,
      serviceLifecycleStore
    )(TE.of([] as unknown as IssueItemPair[]))();

    // updateReview result
    expect(E.isRight(result)).toBeTruthy();

    // serviceReviewDao number of calls and insert values
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();

    const fsmServiceResult = await serviceLifecycleStore.fetch(aService.id)();
    const fsmService2Result = await serviceLifecycleStore.fetch(aService2.id)();

    // fsm apply transitions
    expect(E.isRight(fsmServiceResult)).toBeTruthy();
    if (E.isRight(fsmServiceResult)) {
      expect(O.isSome(fsmServiceResult.right)).toBeTruthy();
      if (O.isSome(fsmServiceResult.right)) {
        expect(fsmServiceResult.right.value.fsm.state).toBe("submitted");
      }
    }
    expect(E.isRight(fsmService2Result)).toBeTruthy();
    if (E.isRight(fsmService2Result)) {
      expect(O.isSome(fsmService2Result.right)).toBeTruthy();
      if (O.isSome(fsmService2Result.right)) {
        expect(fsmService2Result.right.value.fsm.state).toBe("submitted");
      }
    }
  });

  it("should return UpdateReviewError if insert on DB returns a DatabaseError", async () => {
    serviceLifecycleStore.save(aService.id, {
      ...aService,
      fsm: { state: "submitted" },
    });

    const mockServiceReviewDao = {
      insert: vi.fn(() => {
        return TE.left(new DatabaseError("aMessage", 1, "error"));
      }),
      executeOnPending: vi.fn(),
    };

    const result = await updateReview(
      mockServiceReviewDao,
      serviceLifecycleStore
    )(
      TE.of([
        {
          issue: aJiraIssue1,
          item: anItem1,
        },
      ] as unknown as IssueItemPair[])
    )();

    // updateReview result
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBeInstanceOf(UpdateReviewError);
    }
  });
});
