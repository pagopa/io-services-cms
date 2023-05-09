import { afterEach, describe, expect, it, vi, vitest } from "vitest";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import {
  CreateJiraIssueResponse,
  JiraIssue,
  SearchJiraIssuesResponse,
} from "../../jira_client";
import { Delegate } from "../../utils/service_review_proxy";
import { createRequestReviewHandler } from "../request-review-handler";
import { Context } from "@azure/functions";
import { Service } from "@io-services-cms/models/service-lifecycle/types";
import { DatabaseError, QueryResult } from "pg";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

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
      name: "aStatusValue",
    },
  },
};

const aSearchJiraIssuesResponse: SearchJiraIssuesResponse = {
  startAt: 0,
  total: 12,
  issues: [aJiraIssue],
};

const aCreateJiraIssueResponse = {
  id: aJiraIssue.id,
  key: aJiraIssue.key,
} as unknown as CreateJiraIssueResponse;

const aService = {
  id: "aServiceId",
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
} as unknown as Service;

const aDelegate = {
  firstName: "aName",
  lastName: "aSurname",
  email: "anEmail",
  permissions: ["permission1", "permission2"],
} as Delegate;

const anInsertQueryResult: QueryResult = {
  command: "string",
  rowCount: 1,
  oid: 1,
  fields: [],
  rows: [],
};

const aDbInsertData: ServiceReviewRowDataTable = {
  service_id: aService.id,
  service_version: aService.id,
  ticket_id: aCreateJiraIssueResponse.id,
  ticket_key: aCreateJiraIssueResponse.key,
  status: "PENDING",
  extra_data: {},
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
  createJiraIssue: vi.fn((service: Service, delegate: Delegate) => {
    return TE.of(aCreateJiraIssueResponse);
  }),
  searchJiraIssuesByKey: vi.fn(
    (jiraIssueKeys: ReadonlyArray<NonEmptyString>) => {
      return TE.of(aSearchJiraIssuesResponse);
    }
  ),
  getJiraIssueByServiceId: vi.fn((serviceId: NonEmptyString) => {
    return TE.of(O.none);
  }),
};

const mainMockApimProxy = {
  getDelegateFromServiceId: vi.fn((sid: NonEmptyString) => {
    return TE.of(aDelegate);
  }),
};

describe("Service Review Handler", () => {
  it("should create a non existing ticket for a new service review", async () => {
    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimProxy
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(mainMockJiraProxy.getJiraIssueByServiceId).toBeCalledWith(
      aService.id
    );
    expect(mainMockApimProxy.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate
    );
    expect(mainMockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(result).toBe(anInsertQueryResult);
  });

  it("should insert pending review only on db if service already exist on Jira", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getJiraIssueByServiceId: vi.fn((serviceId: NonEmptyString) => {
        return TE.of(O.some(aJiraIssue));
      }),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimProxy
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(mockJiraProxy.getJiraIssueByServiceId).toBeCalledWith(aService.id);
    expect(mainMockApimProxy.getDelegateFromServiceId).not.toBeCalled();
    expect(mockJiraProxy.createJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(result).toBe(anInsertQueryResult);
  });

  it("should have a generic error if getJiraIssueByServiceId returns an Error", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getJiraIssueByServiceId: vi.fn((serviceId: NonEmptyString) => {
        return TE.left(new Error());
      }),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimProxy
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(mockJiraProxy.getJiraIssueByServiceId).toBeCalledWith(aService.id);
    expect(mainMockApimProxy.getDelegateFromServiceId).not.toBeCalled();
    expect(mockJiraProxy.createJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
  });

  it("should have a generic error if getDelegateFromServiceId returns an ApimError", async () => {
    const mockApimProxy = {
      getDelegateFromServiceId: vi.fn((sid: NonEmptyString) => {
        return TE.left({ statusCode: 400 });
      }),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mockApimProxy
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(mainMockJiraProxy.getJiraIssueByServiceId).toBeCalledWith(
      aService.id
    );
    expect(mockApimProxy.getDelegateFromServiceId).toBeCalledWith(aService.id);
    expect(mainMockJiraProxy.createJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
  });

  it("should have a generic error if createJiraIssue returns an Error", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      createJiraIssue: vi.fn((service: Service, delegate: Delegate) => {
        return TE.left(new Error());
      }),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimProxy
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(mockJiraProxy.getJiraIssueByServiceId).toBeCalledWith(aService.id);
    expect(mainMockApimProxy.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mockJiraProxy.createJiraIssue).toBeCalledWith(aService, aDelegate);
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
  });

  it("should have a generic error if insert on db returns an Error", async () => {
    const mockServiceReviewDao = {
      ...mainMockServiceReviewDao,
      insert: vi.fn((data: ServiceReviewRowDataTable) => {
        return TE.left(new DatabaseError("aMessage", 1, "error"));
      }),
    };

    const handler = createRequestReviewHandler(
      mockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimProxy
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(mainMockJiraProxy.getJiraIssueByServiceId).toBeCalledWith(
      aService.id
    );
    expect(mainMockApimProxy.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate
    );
    expect(mockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
  });
});
