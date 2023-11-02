import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { ValidationError } from "io-ts";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../types/next-auth";
import {
  forwardIoServicesCmsRequest,
  retrieveServiceList,
  toServiceListItem
} from "../cms/business";
import { ServiceLifecycle } from "@io-services-cms/models";

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
      const bulkFetchLifecycleMock = vi.fn(() =>
        TE.right([O.some(mocks.aBaseServiceLifecycle)])
      );
      const bulkFetchPublicationMock = vi.fn(() =>
        TE.right([
          O.some({
            id: mocks.aBaseServiceLifecycle.id,
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

      const result = await retrieveServiceList(mocks.anUserId, 10, 0);

      expect(getServiceListMock).toHaveBeenCalledWith(mocks.anUserId, 10, 0);
      expect(bulkFetchLifecycleMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id
      ]);
      expect(bulkFetchPublicationMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id
      ]);

      expect(result).toStrictEqual({
        value: [
          {
            ...toServiceListItem(mocks.aBaseServiceLifecycle),
            id: "aServiceId",
            visibility: "published"
          }
        ],
        pagination: { count: 1, limit: 10, offset: 0 }
      });
    });
  });
});
