import { Context } from "@azure/functions";
import { ServiceLifecycle } from "@io-services-cms/models";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { QueryResult } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceReviewRowDataTable } from "../../utils/service-review-dao";
import { SYNC_FROM_LEGACY } from "../../utils/synchronizer";
import { createRequestReviewLegacyHandler } from "../request-review-legacy-handler";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { IConfig } from "../../config";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const aVoidFn = () => console.log("");

const anUserId = "123";
const ownerId = `/an/owner/${anUserId}`;

const mockConfig = {
  USERID_REQUEST_REVIEW_LEGACY_INCLUSION_LIST: [anUserId],
} as unknown as IConfig;

const aBaseQueueMessage = {
  isNewTicket: true,
  serviceId: "aServiceId",
  ticketId: "aTicketId",
  ticketKey: "aTicketKey",
  apimUserId: ownerId,
};
const aBaseServiceLifecycle = {
  id: "aServiceId",
  last_update: "aServiceLastUpdate",
  data: {
    name: "aServiceName",
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
  fsm: {
    state: "draft",
  },
} as unknown as ServiceLifecycle.ItemType;

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
  executeOnPending: vi.fn(
    (
      fn: (items: ServiceReviewRowDataTable[]) => TE.TaskEither<Error, void>
    ) => {
      return TE.of(aVoidFn());
    }
  ),
  updateStatus: vi.fn(),
};

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

describe("Request Review Legacy Handler", () => {
  it("should set to submitted status the item", async () => {
    const aServiceId = "s1";
    const aQueueMessage = {
      ...aBaseQueueMessage,
      serviceId: aServiceId,
    };
    const aServiceLifecycle = {
      ...aBaseServiceLifecycle,
      id: aServiceId,
    } as unknown as ServiceLifecycle.ItemType;

    const mockFsmLifecycleClient = {
      fetch: vi.fn(() => TE.right(O.some(aServiceLifecycle))),
      override: vi.fn(() =>
        TE.right({ ...aServiceLifecycle, fsm: { state: "submitted" } })
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    const handler = createRequestReviewLegacyHandler(
      mockFsmLifecycleClient,
      mainMockServiceReviewDao,
      mockConfig
    );
    const context = createContext();
    await handler(context, JSON.stringify(aQueueMessage));

    expect(mockFsmLifecycleClient.fetch).toHaveBeenCalledWith(aServiceId);

    expect(mockFsmLifecycleClient.override).toHaveBeenCalledWith(aServiceId, {
      ...aServiceLifecycle,
      fsm: {
        ...aServiceLifecycle.fsm,
        state: "submitted",
        lastTransition: SYNC_FROM_LEGACY,
      },
    });
    expect(mainMockServiceReviewDao.insert).toHaveBeenCalled();
  });

  it("should set to submitted status the item when wildcard is present in inclusionList", async () => {
    const aServiceId = "s1";
    const aQueueMessage = {
      ...aBaseQueueMessage,
      serviceId: aServiceId,
    };
    const aServiceLifecycle = {
      ...aBaseServiceLifecycle,
      id: aServiceId,
    } as unknown as ServiceLifecycle.ItemType;

    const mockFsmLifecycleClient = {
      fetch: vi.fn(() => TE.right(O.some(aServiceLifecycle))),
      override: vi.fn(() =>
        TE.right({ ...aServiceLifecycle, fsm: { state: "submitted" } })
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    const excusiveConfig = {
      USERID_REQUEST_REVIEW_LEGACY_INCLUSION_LIST: ["*"],
    } as unknown as IConfig;

    const handler = createRequestReviewLegacyHandler(
      mockFsmLifecycleClient,
      mainMockServiceReviewDao,
      excusiveConfig
    );
    const context = createContext();
    await handler(context, JSON.stringify(aQueueMessage));

    expect(mockFsmLifecycleClient.fetch).toHaveBeenCalledWith(aServiceId);

    expect(mockFsmLifecycleClient.override).toHaveBeenCalledWith(aServiceId, {
      ...aServiceLifecycle,
      fsm: {
        ...aServiceLifecycle.fsm,
        state: "submitted",
        lastTransition: SYNC_FROM_LEGACY,
      },
    });
    expect(mainMockServiceReviewDao.insert).toHaveBeenCalled();
  });

  it("should do nothing when a service is not related to an allowed user", async () => {
    const aServiceId = "s1";
    const aQueueMessage = {
      ...aBaseQueueMessage,
      serviceId: aServiceId,
    };
    const aServiceLifecycle = {
      ...aBaseServiceLifecycle,
      id: aServiceId,
    } as unknown as ServiceLifecycle.ItemType;

    const mockFsmLifecycleClient = {
      fetch: vi.fn(() => TE.right(O.some(aServiceLifecycle))),
      override: vi.fn(() =>
        TE.right({ ...aServiceLifecycle, fsm: { state: "submitted" } })
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    const excusiveConfig = {
      USERID_REQUEST_REVIEW_LEGACY_INCLUSION_LIST: ["anotherUserId"],
    } as unknown as IConfig;

    const handler = createRequestReviewLegacyHandler(
      mockFsmLifecycleClient,
      mainMockServiceReviewDao,
      excusiveConfig
    );
    const context = createContext();
    await handler(context, JSON.stringify(aQueueMessage));

    expect(mockFsmLifecycleClient.fetch).not.toHaveBeenCalled();
    expect(mockFsmLifecycleClient.override).not.toHaveBeenCalled();
    expect(mainMockServiceReviewDao.insert).not.toHaveBeenCalled();
  });

  it("should fail on bad queue items", async () => {
    const aServiceId = "s2";

    const aQueueMessage = {
      badProp: "aBadProp",
    };

    const aServiceLifecycle = {
      ...aBaseServiceLifecycle,
      id: aServiceId,
    } as unknown as ServiceLifecycle.ItemType;

    const mockFsmLifecycleClient = {
      fetch: vi.fn(() => TE.right(O.some(aServiceLifecycle))),
      override: vi.fn(() =>
        TE.right({ ...aServiceLifecycle, fsm: { state: "submitted" } })
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    const handler = createRequestReviewLegacyHandler(
      mockFsmLifecycleClient,
      mainMockServiceReviewDao,
      mockConfig
    );
    const context = createContext();
    await expect(() =>
      handler(context, JSON.stringify(aQueueMessage))
    ).rejects.toThrowError();
  });

  it("should fail on not found service", async () => {
    const aServiceId = "s3";

    const aQueueMessage = {
      ...aBaseQueueMessage,
      serviceId: aServiceId,
    };
    const aServiceLifecycle = {
      ...aBaseServiceLifecycle,
      id: aServiceId,
    } as unknown as ServiceLifecycle.ItemType;

    const mockFsmLifecycleClient = {
      fetch: vi.fn(() => TE.right(O.none)),
      override: vi.fn(() =>
        TE.right({ ...aServiceLifecycle, fsm: { state: "submitted" } })
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    const handler = createRequestReviewLegacyHandler(
      mockFsmLifecycleClient,
      mainMockServiceReviewDao,
      mockConfig
    );
    const context = createContext();
    await expect(() =>
      handler(context, JSON.stringify(aQueueMessage))
    ).rejects.toThrowError(`Service ${aServiceId} not found `);

    expect(mockFsmLifecycleClient.fetch).toHaveBeenCalledWith(aServiceId);
    expect(mockFsmLifecycleClient.override).not.toHaveBeenCalled();
    expect(mainMockServiceReviewDao.insert).not.toHaveBeenCalled();
  });

  it("should fail on when fetch service fails", async () => {
    const aServiceId = "s3";

    const aQueueMessage = {
      ...aBaseQueueMessage,
      serviceId: aServiceId,
    };
    const aServiceLifecycle = {
      ...aBaseServiceLifecycle,
      id: aServiceId,
    } as unknown as ServiceLifecycle.ItemType;

    const mockFsmLifecycleClient = {
      fetch: vi.fn(() => TE.left(new Error("error fetching service"))),
      override: vi.fn(() =>
        TE.right({ ...aServiceLifecycle, fsm: { state: "submitted" } })
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    const handler = createRequestReviewLegacyHandler(
      mockFsmLifecycleClient,
      mainMockServiceReviewDao,
      mockConfig
    );
    const context = createContext();
    await expect(() =>
      handler(context, JSON.stringify(aQueueMessage))
    ).rejects.toThrowError("error fetching service");

    expect(mockFsmLifecycleClient.fetch).toHaveBeenCalledWith(aServiceId);
    expect(mockFsmLifecycleClient.override).not.toHaveBeenCalled();
    expect(mainMockServiceReviewDao.insert).not.toHaveBeenCalled();
  });

  it("should not insert when overriding the service fails", async () => {
    const aServiceId = "s3";

    const aQueueMessage = {
      ...aBaseQueueMessage,
      serviceId: aServiceId,
    };
    const aServiceLifecycle = {
      ...aBaseServiceLifecycle,
      id: aServiceId,
    } as unknown as ServiceLifecycle.ItemType;

    const mockFsmLifecycleClient = {
      fetch: vi.fn(() => TE.right(O.some(aServiceLifecycle))),
      override: vi.fn(() => TE.left(new Error("error overriding the service"))),
    } as unknown as ServiceLifecycle.FsmClient;

    const handler = createRequestReviewLegacyHandler(
      mockFsmLifecycleClient,
      mainMockServiceReviewDao,
      mockConfig
    );
    const context = createContext();
    await expect(() =>
      handler(context, JSON.stringify(aQueueMessage))
    ).rejects.toThrowError("error overriding the service");

    expect(mockFsmLifecycleClient.fetch).toHaveBeenCalledWith(aServiceId);
    expect(mockFsmLifecycleClient.override).toHaveBeenCalledWith(aServiceId, {
      ...aServiceLifecycle,
      fsm: {
        ...aServiceLifecycle.fsm,
        state: "submitted",
        lastTransition: SYNC_FROM_LEGACY,
      },
    });
    expect(mainMockServiceReviewDao.insert).not.toHaveBeenCalled();
  });
});
