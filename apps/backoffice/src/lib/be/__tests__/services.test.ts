import { ServiceLifecycle } from "@io-services-cms/models";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { ValidationError } from "io-ts";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../types/next-auth";
import {
  forwardIoServicesCmsRequest,
  retrieveServiceList
} from "../services/business";
import { toServiceListItem } from "../services/utils";

const anUserEmail = "anEmail@email.it";
const anUserId = "anUserId";
const aSubscriptionId = "aSubscriptionId";
const aUserPermissions = ["permission1", "permission2"];
const jwtMock = ({
  permissions: aUserPermissions,
  parameters: {
    userEmail: anUserEmail,
    userId: anUserId,
    subscriptionId: aSubscriptionId
  }
} as unknown) as BackOfficeUser;

const mocks: {
  statusOK: number;
  statusNoContent: number;
  aSamplePayload: { test: string };
  aBaseServiceLifecycle: ServiceLifecycle.ItemType;
  anUserId: string;
} = vi.hoisted(() => ({
  statusOK: 200,
  statusNoContent: 204,
  aSamplePayload: { test: "test" },
  aBaseServiceLifecycle: ({
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
        scope: "LOCAL"
      },
      organization: {
        name: "anOrganizationName",
        fiscal_code: "12345678901"
      },
      require_secure_channel: false
    },
    fsm: {
      state: "draft"
    }
  } as unknown) as ServiceLifecycle.ItemType,
  anUserId: "anUserId"
}));

const { getIoServicesCmsClient } = vi.hoisted(() => ({
  getIoServicesCmsClient: vi.fn().mockReturnValue({
    getServices: vi.fn(() =>
      Promise.resolve(
        E.of({ status: mocks.statusOK, value: mocks.aSamplePayload })
      )
    ),
    createService: vi.fn(() =>
      Promise.resolve(
        E.of({ status: mocks.statusOK, value: mocks.aSamplePayload })
      )
    ),
    reviewService: vi.fn(() =>
      Promise.resolve(E.of({ status: mocks.statusNoContent, value: undefined }))
    )
  })
}));

const { getApimRestClient } = vi.hoisted(() => ({
  getApimRestClient: vi.fn().mockReturnValue(
    Promise.resolve({
      getServiceList: vi.fn(() =>
        TE.right({
          value: [],
          count: 0
        })
      )
    })
  )
}));

const {
  getServiceLifecycleCosmosStore,
  getServicePublicationCosmosStore
} = vi.hoisted(() => ({
  getServiceLifecycleCosmosStore: vi.fn().mockReturnValue({
    bulkFetch: vi.fn(() => TE.right([]))
  }),
  getServicePublicationCosmosStore: vi.fn().mockReturnValue({
    bulkFetch: vi.fn(() => TE.right([]))
  })
}));

vi.mock("@/lib/be/cms-client", () => ({
  getIoServicesCmsClient
}));

vi.mock("@/lib/be/apim-service", () => ({
  getApimRestClient
}));

vi.mock("@/lib/be/cosmos-store", () => ({
  getServiceLifecycleCosmosStore,
  getServicePublicationCosmosStore
}));
afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});
describe("Services TEST", () => {
  describe("forwardIoServicesCmsRequest", () => {
    it("request without body request and with response body", async () => {
      // Mock io-services-cms client
      const getServices = vi.fn(() =>
        Promise.resolve(E.of({ status: 200, value: { test: "test" } }))
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        getServices
      });

      // Mock NextRequest
      const request = ({
        bodyUsed: false
      } as any) as NextRequest;

      const result = await forwardIoServicesCmsRequest(
        "getServices",
        request,
        jwtMock
      );

      expect(getServices).toHaveBeenCalled();
      expect(getServices).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": anUserEmail,
          "x-user-id": anUserId,
          "x-subscription-id": aSubscriptionId,
          "x-user-groups": aUserPermissions.join(",")
        })
      );

      expect(result.status).toBe(200);
      expect(result.body).not.toBe(null);
    });

    it("request with body request and with response body", async () => {
      // Mock io-services-cms client
      const createService = vi.fn(() =>
        Promise.resolve(E.of({ status: 200, value: { test: "test" } }))
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        createService
      });

      const aBodyPayload = {
        name: "test",
        description: "test"
      };

      // Mock NextRequest
      const request = ({
        bodyUsed: true,
        json: () => Promise.resolve(aBodyPayload)
      } as any) as NextRequest;

      const result = await forwardIoServicesCmsRequest(
        "createService",
        request,
        jwtMock,
        {
          serviceId: "test"
        }
      );

      expect(createService).toHaveBeenCalled();
      expect(createService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": anUserEmail,
          "x-user-id": anUserId,
          "x-subscription-id": aSubscriptionId,
          "x-user-groups": aUserPermissions.join(","),
          body: aBodyPayload,
          serviceId: "test"
        })
      );

      expect(result.status).toBe(200);
      expect(result.body).not.toBe(null);
    });

    it("request without body response", async () => {
      // Mock io-services-cms client
      const reviewService = vi.fn(() =>
        Promise.resolve(E.of({ status: 204, value: undefined }))
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        reviewService
      });

      const aBodyPayload = {
        name: "test"
      };

      // Mock NextRequest
      const request = ({
        bodyUsed: true,
        json: () => Promise.resolve(aBodyPayload)
      } as any) as NextRequest;

      const result = await forwardIoServicesCmsRequest(
        "reviewService",
        request,
        jwtMock,
        {
          serviceId: "test"
        }
      );

      expect(reviewService).toHaveBeenCalled();
      expect(reviewService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": anUserEmail,
          "x-user-id": anUserId,
          "x-subscription-id": aSubscriptionId,
          "x-user-groups": aUserPermissions.join(","),
          body: aBodyPayload,
          serviceId: "test"
        })
      );

      expect(result.status).toBe(204);
      expect(result.body).toBe(null);
    });

    it("fn call with explicitly body and expect response body", async () => {
      // Mock io-services-cms client
      const createService = vi.fn(() =>
        Promise.resolve(E.of({ status: 200, value: { test: "test" } }))
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        createService
      });

      // Mock request body
      const aBodyPayload = {
        name: "test",
        description: "test"
      };

      const result = await forwardIoServicesCmsRequest(
        "createService",
        aBodyPayload,
        jwtMock,
        {
          serviceId: "test"
        }
      );

      expect(createService).toHaveBeenCalled();
      expect(createService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": anUserEmail,
          "x-user-id": anUserId,
          "x-subscription-id": aSubscriptionId,
          "x-user-groups": aUserPermissions.join(","),
          body: aBodyPayload,
          serviceId: "test"
        })
      );

      expect(result.status).toBe(200);
      expect(result.body).not.toBe(null);
    });

    it("ValidationErrors occurs on request", async () => {
      const validationError: ValidationError[] = [
        {
          value: "test",
          context: [
            {
              key: "test",
              type: "string",
              actual: "test",
              message: "test"
            }
          ],
          message: "test"
        } as any
      ];

      // Mock io-services-cms client
      const reviewService = vi.fn(() =>
        Promise.resolve(E.left(validationError))
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        reviewService
      });

      const aBodyPayload = {
        name: "test"
      };

      // Mock NextRequest
      const request = ({
        bodyUsed: true,
        json: () => Promise.resolve(aBodyPayload)
      } as any) as NextRequest;

      const result = await forwardIoServicesCmsRequest(
        "reviewService",
        request,
        jwtMock,
        {
          serviceId: "test"
        }
      );

      expect(reviewService).toHaveBeenCalled();
      expect(reviewService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": anUserEmail,
          "x-user-id": anUserId,
          "x-subscription-id": aSubscriptionId,
          "x-user-groups": aUserPermissions.join(","),
          body: aBodyPayload,
          serviceId: "test"
        })
      );

      expect(result.status).toBe(400);
      expect(result.body).not.toBe(null);
    });
  });

  describe("retrieveServiceList", () => {
    it("should return a list of services with visibility", async () => {
      const aServiceinPublicationId = "aServiceInPublicationId";
      const aServiceNotInPublicationId = "aServiceNotInPublicationId";

      const bulkFetchLifecycleMock = vi.fn(() =>
        TE.right([
          O.some({
            ...mocks.aBaseServiceLifecycle,
            id: aServiceinPublicationId
          }),
          O.some({
            ...mocks.aBaseServiceLifecycle,
            id: aServiceNotInPublicationId
          })
        ])
      );
      const bulkFetchPublicationMock = vi.fn(() =>
        TE.right([
          O.some({
            id: aServiceinPublicationId,
            name: "aServiceName",
            fsm: {
              state: "published"
            }
          })
        ])
      );

      const getServiceListMock = vi.fn(() =>
        TE.right({
          value: [
            {
              name: aServiceinPublicationId
            },
            {
              name: aServiceNotInPublicationId
            }
          ],
          count: 2
        })
      );

      getServiceLifecycleCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchLifecycleMock
      });
      getServicePublicationCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchPublicationMock
      });

      getApimRestClient.mockReturnValueOnce(
        Promise.resolve({
          getServiceList: getServiceListMock
        })
      );

      const result = await retrieveServiceList(mocks.anUserId, 10, 0);

      expect(getServiceListMock).toHaveBeenCalledWith(mocks.anUserId, 10, 0);
      expect(bulkFetchLifecycleMock).toHaveBeenCalledWith([
        aServiceinPublicationId,
        aServiceNotInPublicationId
      ]);
      expect(bulkFetchPublicationMock).toHaveBeenCalledWith([
        aServiceinPublicationId,
        aServiceNotInPublicationId
      ]);

      expect(result).toStrictEqual({
        value: [
          {
            ...toServiceListItem(mocks.aBaseServiceLifecycle),
            id: aServiceinPublicationId,
            visibility: "published"
          },
          {
            ...toServiceListItem(mocks.aBaseServiceLifecycle),
            id: aServiceNotInPublicationId,
            visibility: undefined
          }
        ],
        pagination: { count: 2, limit: 10, offset: 0 }
      });
    });

    it("when no services are found on APIM neither service-lifecycle or service-publication bulkFetch method should be called", async () => {
      const bulkFetchLifecycleMock = vi.fn(() => TE.right([]));
      const bulkFetchPublicationMock = vi.fn(() => TE.right([]));

      const getServiceListMock = vi.fn(() =>
        TE.right({
          value: [],
          count: 90
        })
      );

      getServiceLifecycleCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchLifecycleMock
      });
      getServicePublicationCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchPublicationMock
      });

      getApimRestClient.mockReturnValueOnce(
        Promise.resolve({
          getServiceList: getServiceListMock
        })
      );

      const result = await retrieveServiceList(mocks.anUserId, 10, 90);

      expect(getServiceListMock).toHaveBeenCalledWith(mocks.anUserId, 10, 90);
      expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
      expect(bulkFetchPublicationMock).not.toHaveBeenCalled();

      expect(result).toStrictEqual({
        value: [],
        pagination: { count: 90, limit: 10, offset: 90 }
      });
    });

    // This is a BORDER CASE, this can happen only if a service is manually deleted from services-lifecycle cosmos container
    // and not on apim, in such remote case we still return the list of services
    it("when a service is found on apim and not service-lifecycle should not appears on returned list", async () => {
      const aServiceInLifecycleId = "aServiceInLifecycleId";
      const aServiceNotInLifecycleId = "aServiceNotInLifecycleId";

      const bulkFetchLifecycleMock = vi.fn(() =>
        TE.right([
          O.some({
            ...mocks.aBaseServiceLifecycle,
            id: aServiceInLifecycleId
          })
        ])
      );
      const bulkFetchPublicationMock = vi.fn(() =>
        TE.right([
          O.some({
            id: aServiceInLifecycleId,
            name: "aServiceName",
            fsm: {
              state: "published"
            }
          })
        ])
      );

      const getServiceListMock = vi.fn(() =>
        TE.right({
          value: [
            {
              name: aServiceInLifecycleId
            },
            {
              name: aServiceNotInLifecycleId
            }
          ],
          count: 2
        })
      );

      getServiceLifecycleCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchLifecycleMock
      });
      getServicePublicationCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchPublicationMock
      });

      getApimRestClient.mockReturnValueOnce(
        Promise.resolve({
          getServiceList: getServiceListMock
        })
      );

      const result = await retrieveServiceList(mocks.anUserId, 10, 0);

      expect(getServiceListMock).toHaveBeenCalledWith(mocks.anUserId, 10, 0);
      expect(bulkFetchLifecycleMock).toHaveBeenCalledWith([
        aServiceInLifecycleId,
        aServiceNotInLifecycleId
      ]);
      expect(bulkFetchPublicationMock).toHaveBeenCalledWith([
        aServiceInLifecycleId
      ]);

      expect(result).toStrictEqual({
        value: [
          {
            ...toServiceListItem(mocks.aBaseServiceLifecycle),
            id: aServiceInLifecycleId,
            visibility: "published"
          }
        ],
        pagination: { count: 2, limit: 10, offset: 0 }
      });
    });

    it("when service-publication bulk-fetch fails an error is returned", async () => {
      const bulkFetchLifecycleMock = vi.fn(() =>
        TE.right([O.some(mocks.aBaseServiceLifecycle)])
      );
      const bulkFetchPublicationMock = vi.fn(() =>
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: "error"
        })
      );

      const getServiceListMock = vi.fn(() =>
        TE.right({
          value: [
            {
              name: mocks.aBaseServiceLifecycle.id
            }
          ],
          count: 1
        })
      );

      getServiceLifecycleCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchLifecycleMock
      });
      getServicePublicationCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchPublicationMock
      });

      getApimRestClient.mockReturnValueOnce(
        Promise.resolve({
          getServiceList: getServiceListMock
        })
      );

      await expect(
        retrieveServiceList(mocks.anUserId, 10, 0)
      ).rejects.toThrowError();

      expect(getServiceListMock).toHaveBeenCalledWith(mocks.anUserId, 10, 0);
      expect(bulkFetchLifecycleMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id
      ]);
      expect(bulkFetchPublicationMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id
      ]);
    });

    it("when service-lifecycle bulk-fetch fails an error is returned", async () => {
      const bulkFetchLifecycleMock = vi.fn(() =>
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: "error"
        })
      );
      const bulkFetchPublicationMock = vi.fn(() => TE.right([]));

      const getServiceListMock = vi.fn(() =>
        TE.right({
          value: [
            {
              name: mocks.aBaseServiceLifecycle.id
            }
          ],
          count: 1
        })
      );

      getServiceLifecycleCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchLifecycleMock
      });
      getServicePublicationCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchPublicationMock
      });

      getApimRestClient.mockReturnValueOnce(
        Promise.resolve({
          getServiceList: getServiceListMock
        })
      );

      await expect(
        retrieveServiceList(mocks.anUserId, 10, 0)
      ).rejects.toThrowError();

      expect(getServiceListMock).toHaveBeenCalledWith(mocks.anUserId, 10, 0);
      expect(bulkFetchLifecycleMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id
      ]);
      expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    });

    it("when apim rest call fails an error is returned", async () => {
      const bulkFetchLifecycleMock = vi.fn(() => TE.right([]));
      const bulkFetchPublicationMock = vi.fn(() => TE.right([]));

      const getServiceListMock = vi.fn(() =>
        TE.left({
          message: "Apim Failure",
          response: { status: 500 }
        })
      );

      getServiceLifecycleCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchLifecycleMock
      });
      getServicePublicationCosmosStore.mockReturnValueOnce({
        bulkFetch: bulkFetchPublicationMock
      });

      getApimRestClient.mockReturnValueOnce(
        Promise.resolve({
          getServiceList: getServiceListMock
        })
      );

      await expect(
        retrieveServiceList(mocks.anUserId, 10, 0)
      ).rejects.toThrowError();

      expect(getServiceListMock).toHaveBeenCalledWith(mocks.anUserId, 10, 0);
      expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
      expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    });
  });
});
