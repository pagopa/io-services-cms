import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
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
import { Delegate, JiraIssueStatusFilter } from "../../utils/jira-proxy";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import { createRequestReviewHandler } from "../request-review-handler";

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
      name: "REVIEW",
    },
    statuscategorychangedate: "2023-05-10T14:00:15.173+0200" as NonEmptyString,
  },
};

const aRejectedJiraIssue: JiraIssue = {
  id: "aJiraIssueId" as NonEmptyString,
  key: "aRejectedIssueKey" as NonEmptyString,
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
    authorized_cidrs: [],
  },
  version: "aVersion",
} as unknown as ServiceLifecycle.definitions.Service;

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
  service_version: aService.version as NonEmptyString,
  ticket_id: aCreateJiraIssueResponse.id,
  ticket_key: aCreateJiraIssueResponse.key,
  status: "PENDING",
  extra_data: {},
};

const aRejectDbInsertData: ServiceReviewRowDataTable = {
  service_id: aService.id,
  service_version: aService.version as NonEmptyString,
  ticket_id: aRejectedJiraIssue.id,
  ticket_key: aRejectedJiraIssue.key,
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
  updateStatus: vi.fn(),
};

const mainMockJiraProxy = {
  createJiraIssue: vi.fn(
    (service: ServiceLifecycle.definitions.Service, delegate: Delegate) => {
      return TE.of(aCreateJiraIssueResponse);
    }
  ),
  searchJiraIssuesByKeyAndStatus: vi.fn(
    (
      jiraIssueKeys: ReadonlyArray<NonEmptyString>,
      jiraIssueStatuses: ReadonlyArray<JiraIssueStatusFilter>
    ) => {
      return TE.of(aSearchJiraIssuesResponse);
    }
  ),
  getJiraIssueByServiceId: vi.fn((serviceId: NonEmptyString) => {
    return TE.of(O.none);
  }),
  getPendingAndRejectedJiraIssueByServiceId: vi.fn(
    (serviceId: NonEmptyString) => {
      return TE.of(O.none);
    }
  ),
  updateJiraIssue: vi.fn(
    (
      ticketKey: NonEmptyString,
      service: ServiceLifecycle.definitions.Service,
      delegate: Delegate
    ) => {
      return TE.of(void 0);
    }
  ),

  reOpenJiraIssue: vi.fn((ticketKey: NonEmptyString) => {
    return TE.of(void 0);
  }),
};

const anUserId = "123";
const anOwnerId = `/an/owner/${anUserId}`;
const mainMockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId: anOwnerId,
    })
  ),
  getDelegateFromServiceId: vi.fn((sid: NonEmptyString) => {
    return TE.of(aDelegate);
  }),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  USERID_AUTOMATIC_SERVICE_APPROVAL_INCLUSION_LIST: [],
} as unknown as IConfig;

const mockFsmLifecycleClient = {
  approve: vi.fn((serviceId: NonEmptyString) => {
    return TE.of(void 0);
  }),
} as unknown as ServiceLifecycle.FsmClient;

describe("Service Review Handler", () => {
  it("should create a non existing ticket for a new service review", async () => {
    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate
    );
    expect(mainMockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should update a existing rejected ticket for a new service review", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getPendingAndRejectedJiraIssueByServiceId: vi.fn(
        (serviceId: NonEmptyString) => {
          return TE.of(O.some(aRejectedJiraIssue));
        }
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mockJiraProxy.updateJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key,
      aService,
      aDelegate
    );
    expect(mockJiraProxy.reOpenJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key
    );
    expect(mainMockServiceReviewDao.insert).toBeCalledWith(aRejectDbInsertData);
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
      mockConfig
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
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
        (serviceId: NonEmptyString) => {
          return TE.of(O.some(aJiraIssue));
        }
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    const result = await handler(context, JSON.stringify(aService));

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
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
        (serviceId: NonEmptyString) => {
          return TE.left(new Error());
        }
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).not.toBeCalled();
    expect(mockJiraProxy.createJiraIssue).not.toBeCalled();
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should have a generic error if getDelegateFromServiceId returns an ApimError", async () => {
    const mockApimProxy = {
      ...mainMockApimService,
      getDelegateFromServiceId: vi.fn((sid: NonEmptyString) => {
        return TE.left({ statusCode: 400 });
      }),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mainMockJiraProxy,
      mockApimProxy,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
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
        (service: ServiceLifecycle.definitions.Service, delegate: Delegate) => {
          return TE.left(new Error());
        }
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mockJiraProxy.createJiraIssue).toBeCalledWith(aService, aDelegate);
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });

  it("should have a generic error if updateJiraIssue returns an Error", async () => {
    const mockJiraProxy = {
      ...mainMockJiraProxy,
      getPendingAndRejectedJiraIssueByServiceId: vi.fn(
        (serviceId: NonEmptyString) => {
          return TE.of(O.some(aRejectedJiraIssue));
        }
      ),
      updateJiraIssue: vi.fn(
        (
          ticketKey: NonEmptyString,
          service: ServiceLifecycle.definitions.Service,
          delegate: Delegate
        ) => {
          return TE.left(new Error());
        }
      ),
    };

    const handler = createRequestReviewHandler(
      mainMockServiceReviewDao,
      mockJiraProxy,
      mainMockApimService,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mockJiraProxy.updateJiraIssue).toBeCalledWith(
      aRejectedJiraIssue.key,
      aService,
      aDelegate
    );
    expect(mainMockServiceReviewDao.insert).not.toBeCalled();
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
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
      mainMockApimService,
      mockFsmLifecycleClient,
      mockConfig
    );

    const context = createContext();
    try {
      await handler(context, JSON.stringify(aService));
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(
      mainMockJiraProxy.getPendingAndRejectedJiraIssueByServiceId
    ).toBeCalledWith(aService.id);
    expect(mainMockApimService.getDelegateFromServiceId).toBeCalledWith(
      aService.id
    );
    expect(mainMockJiraProxy.createJiraIssue).toBeCalledWith(
      aService,
      aDelegate
    );
    expect(mockServiceReviewDao.insert).toBeCalledWith(aDbInsertData);
    expect(mockFsmLifecycleClient.approve).not.toHaveBeenCalled();
  });
});
