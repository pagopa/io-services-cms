import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { DatabaseError, QueryResult } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IConfig } from "../../config";
import {
  CreateJiraIssueResponse,
  JiraIssue,
  SearchJiraIssuesResponse,
} from "../../lib/clients/jira-client";
import { PG_PK_UNIQUE_VIOLATION_CODE } from "../../lib/clients/pg-client";
import { Delegate, JiraIssueStatusFilter } from "../../utils/jira-proxy";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import { createRequestReviewHandler } from "../request-review-handler";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const isFirstReview = true;
const isNotFirstReview = false;

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  }) as unknown as Context;

const aJiraIssue: JiraIssue = {
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
    statuscategorychangedate: "2023-05-10T14:00:15.173+0200" as NonEmptyString,
  },
  id: "aJiraIssueId" as NonEmptyString,
  key: "anIssueKey" as NonEmptyString,
};

const aRejectedJiraIssue: JiraIssue = {
  fields: {
    comment: {
      comments: [
        { body: "comment 1" },
        { body: "comment 2" },
        { body: "a *formatted* comment … {{some code}} ." },
      ],
    },
    status: {
      id: "10986",
      name: "REJECTED",
    },
    statuscategorychangedate: "2023-05-10T14:00:15.173+0200" as NonEmptyString,
  },
  id: "aJiraIssueId" as NonEmptyString,
  key: "aRejectedIssueKey" as NonEmptyString,
};

const aSearchJiraIssuesResponse: SearchJiraIssuesResponse = {
  issues: [aJiraIssue],
  startAt: 0,
  total: 12,
};

const aCreateJiraIssueResponse = {
  id: aJiraIssue.id,
  key: aJiraIssue.key,
} as unknown as CreateJiraIssueResponse;

const aService = {
  data: {
    authorized_cidrs: [],
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
  id: "aServiceId",
  version: "aVersion",
} as unknown as ServiceLifecycle.definitions.Service;

const aDelegate = {
  email: "anEmail",
  firstName: "aName",
  lastName: "aSurname",
  permissions: ["permission1", "permission2"],
} as Delegate;

const anInsertQueryResult: QueryResult = {
  command: "string",
  fields: [],
  oid: 1,
  rowCount: 1,
  rows: [],
};

const aDbInsertData: ServiceReviewRowDataTable = {
  extra_data: {},
  service_id: aService.id,
  service_version: aService.version as NonEmptyString,
  status: "PENDING",
  ticket_id: aCreateJiraIssueResponse.id,
  ticket_key: aCreateJiraIssueResponse.key,
};

const aRejectDbInsertData: ServiceReviewRowDataTable = {
  extra_data: {},
  service_id: aService.id,
  service_version: aService.version as NonEmptyString,
  status: "PENDING",
  ticket_id: aRejectedJiraIssue.id,
  ticket_key: aRejectedJiraIssue.key,
};

const aVoidFn = () => console.log("");

const mainMockServiceReviewDao = {
  executeOnPending: vi.fn(
    (fn: (items: ServiceReviewRowDataTable[]) => TE.TaskEither<Error, void>) =>
      TE.of(aVoidFn()),
  ),
  insert: vi.fn((data: ServiceReviewRowDataTable) =>
    TE.of(anInsertQueryResult),
  ),
  updateStatus: vi.fn((data: ServiceReviewRowDataTable) =>
    TE.of(anInsertQueryResult),
  ),
};

const mainMockJiraProxy = {
  createJiraIssue: vi.fn(
    (service: ServiceLifecycle.definitions.Service, delegate: Delegate) =>
      TE.of(aCreateJiraIssueResponse),
  ),
  getJiraIssueByServiceId: vi.fn((serviceId: NonEmptyString) => TE.of(O.none)),
  getPendingAndRejectedJiraIssueByServiceId: vi.fn(
    (serviceId: NonEmptyString) => TE.of(O.none),
  ),
  reOpenJiraIssue: vi.fn((ticketKey: NonEmptyString) => TE.of(void 0)),
  searchJiraIssuesByKeyAndStatus: vi.fn(
    (
      jiraIssueKeys: readonly NonEmptyString[],
      jiraIssueStatuses: readonly JiraIssueStatusFilter[],
    ) => TE.of(aSearchJiraIssuesResponse),
  ),

  updateJiraIssue: vi.fn(
    (
      ticketKey: NonEmptyString,
      service: ServiceLifecycle.definitions.Service,
      delegate: Delegate,
    ) => TE.of(void 0),
  ),
};

const anUserId = "123";
const anOwnerId = `/an/owner/${anUserId}`;
const mainMockApimService = {
  getDelegateFromServiceId: vi.fn((sid: NonEmptyString) => TE.of(aDelegate)),
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId: anOwnerId,
    }),
  ),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  USERID_AUTOMATIC_SERVICE_APPROVAL_INCLUSION_LIST: [],
} as unknown as IConfig;

const mockFsmLifecycleClient = {
  approve: vi.fn((serviceId: NonEmptyString) => TE.of(void 0)),
} as unknown as ServiceLifecycle.FsmClient;

const mockFsmPublicationClient = {
  getStore: vi.fn(() => ({
    fetch: vi.fn((serviceId: NonEmptyString) => TE.of(O.none)),
  })),
} as unknown as ServicePublication.FsmClient;

describe("Service Review Handler", () => {
  it("should create a non existing ticket for a new service review", async () => {
    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate,
      isFirstReview,
    );
    expect(mainMockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("when a new ticket is created it should contains the fact that a service is not the first time it is published", async () => {
    const mockFsmPublicationClient = {
      getStore: vi.fn(() => ({
        fetch: vi.fn((serviceId: NonEmptyString) => TE.of(O.some(aService))),
      })),
    } as unknown as ServicePublication.FsmClient;

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate,
      isNotFirstReview,
    );
    expect(mainMockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should update a existing rejected ticket for a new service review", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getPendingAndRejectedJiraIssueByServiceId: vi.fn(
        (serviceId: NonEmptyString) => TE.of(O.some(aRejectedJiraIssue)),
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );
    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mockJiraProxy.updateJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key,
      aService,
      aDelegate,
      isFirstReview,
    );
    expect(mockJiraProxy.reOpenJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key,
    );
    expect(mainMockServiceReviewDao.insert).toHaveBeenCalledWith(
      aRejectDbInsertData,
    );
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("rejected ticket is reopened and is related to an already published service", async () => {
    const mockFsmPublicationClient = {
      getStore: vi.fn(() => ({
        fetch: vi.fn((serviceId: NonEmptyString) => TE.of(O.some(aService))),
      })),
    } as unknown as ServicePublication.FsmClient;

    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getPendingAndRejectedJiraIssueByServiceId: vi.fn(
        (serviceId: NonEmptyString) => TE.of(O.some(aRejectedJiraIssue)),
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );
    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mockJiraProxy.updateJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key,
      aService,
      aDelegate,
      isNotFirstReview,
    );
    expect(mockJiraProxy.reOpenJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key,
    );
    expect(mainMockServiceReviewDao.insert).toHaveBeenCalledWith(
      aRejectDbInsertData,
    );
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should approve the service when the user is in inclusionList", async () => {
    const mockConfig = {
      USERID_AUTOMATIC_SERVICE_APPROVAL_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).not.toHaveBeenCalled();
    expect(mainMockApimService.getDelegateFromServiceId).not.toHaveBeenCalled();
    expect(mainMockJiraProxy.createJiraIssue).not.toHaveBeenCalled();
    expect(mainMockServiceReviewDao.insert).not.toHaveBeenCalled();

    expect(mockFsmLifecycleClient.approve).toBeCalledWith(aService.id, {
      approvalDate: expect.any(String),
    });
  });

  it("should insert pending review only on db if service already exist on Jira", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getPendingAndRejectedJiraIssueByServiceId: vi.fn(
        (serviceId: NonEmptyString) => TE.of(O.some(aJiraIssue)),
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).not.toBeCalled();
    expect(mockJiraProxy.createJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should have a generic error if getPendingAndRejectedJiraIssueByServiceId returns an Error", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getPendingAndRejectedJiraIssueByServiceId: vi.fn(
        (serviceId: NonEmptyString) => TE.left(new Error()),
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).not.toBeCalled();
    expect(mockJiraProxy.createJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should have a generic error if getDelegateFromServiceId returns an ApimError", async () => {
    const mockApimProxy = {
      ...mainMockApimService,
      getDelegateFromServiceId: vi.fn((sid: NonEmptyString) =>
        TE.left({ statusCode: 400 }),
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mockApimProxy,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mockApimProxy.getDelegateFromServiceId).toBeCalledWith(aService.id);
    expect(mainMockJiraProxy.createJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should have a generic error if createJiraIssue returns an Error", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      createJiraIssue: vi.fn(
        (service: ServiceLifecycle.definitions.Service, delegate: Delegate) =>
          TE.left(new Error()),
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate,
      isFirstReview,
    );
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should have a generic error if updateJiraIssue returns an Error and shoul not reopen a ticket", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getPendingAndRejectedJiraIssueByServiceId: vi.fn(
        (serviceId: NonEmptyString) => TE.of(O.some(aRejectedJiraIssue)),
      ),
      updateJiraIssue: vi.fn(
        (
          ticketKey: NonEmptyString,
          service: ServiceLifecycle.definitions.Service,
          delegate: Delegate,
        ) => TE.left(new Error()),
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mockJiraProxy.updateJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key,
      aService,
      aDelegate,
      isFirstReview,
    );
    expect(mockJiraProxy.reOpenJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should return no error if insert on db returns a Contraint violation Error", async () => {
    const mockServiceReviewDao = {
      ...mainMockServiceReviewDao,
      insert: vi.fn((data: ServiceReviewRowDataTable) => {
        const databaseError = {
          code: PG_PK_UNIQUE_VIOLATION_CODE,
          constraint: "constraint_name",
          detail: "Key (xxx, yyy)=(xxx_val, yyy_val) already exists.",
          length: 1,
          message:
            'duplicate key value violates unique constraint "constraint_name"',
          severity: "ERROR",
        } as DatabaseError;
        return TE.left(databaseError);
      }),
    };
    const handler = createRequestReviewHandler(
      mockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate,
      isFirstReview,
    );
    expect(mockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should have a generic error if insert on db returns an Error", async () => {
    const mockServiceReviewDao = {
      ...mainMockServiceReviewDao,
      insert: vi.fn((data: ServiceReviewRowDataTable) =>
        TE.left(new DatabaseError("aMessage", 1, "error")),
      ),
    };

    const handler = createRequestReviewHandler(
      mockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      mockConfig,
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId,
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id,
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate,
      isFirstReview,
    );
    expect(mockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });
});
