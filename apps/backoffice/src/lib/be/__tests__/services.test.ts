import { ServiceLifecycle } from "@io-services-cms/models";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { ValidationError } from "io-ts";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser, Institution } from "../../../../types/next-auth";
import { MigrationData } from "../../../generated/api/MigrationData";
import { MigrationDelegate } from "../../../generated/api/MigrationDelegate";
import { MigrationItem } from "../../../generated/api/MigrationItem";
import { ServiceLifecycleStatusTypeEnum } from "../../../generated/services-cms/ServiceLifecycleStatusType";
import { ServiceTopic } from "../../../generated/services-cms/ServiceTopic";
import {
  forwardIoServicesCmsRequest,
  retrieveOrganizationDelegates,
  retrieveServiceList
} from "../services/business";
import {
  MISSING_SERVICE_DESCRIPTION,
  MISSING_SERVICE_NAME,
  toServiceListItem
} from "../services/utils";

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
  anInstitution: Institution;
  migrationItem: MigrationItem;
  migrationData: MigrationData;
  migrationDelegate: MigrationDelegate;
  serviceTopicsMaps: Record<string, ServiceTopic>;
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
  anUserId: "anUserId",
  anInstitution: {
    id: "anInstitutionId",
    name: "anInstitutionName",
    fiscalCode: "12345678901",
    role: "admin"
  },
  migrationItem: {
    status: {
      completed: 99,
      failed: 7,
      initial: 63,
      processing: 94
    },
    delegate: {
      sourceId: "3ef50230-9c1f-4cf0-9f4d-af6c0dcf6288",
      sourceName: "Name",
      sourceSurname: "Surname",
      sourceEmail: "test@email.test"
    },
    lastUpdate: "2023-05-05T14:25:49.277Z"
  } as MigrationItem,
  migrationData: {
    status: {
      completed: 31,
      failed: 64,
      initial: 31,
      processing: 25
    }
  } as MigrationData,
  migrationDelegate: {
    sourceId: "c7fd5462-7fa2-4321-a4a4-237523445d1c",
    sourceName: "Name",
    sourceSurname: "Surname",
    sourceEmail: "test@test.test",
    subscriptionCounter: 17
  } as MigrationDelegate,
  serviceTopicsMaps: {}
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

const { getSubscriptionsMigrationClient } = vi.hoisted(() => ({
  getSubscriptionsMigrationClient: vi.fn().mockReturnValue({
    getLatestOwnershipClaimStatus: vi.fn(() =>
      TE.right({
        items: [mocks.migrationItem]
      })
    ),
    getOwnershipClaimStatus: vi.fn(() => TE.right(mocks.migrationData)),
    claimOwnership: vi.fn(() => TE.right(void 0)),
    getDelegatesByOrganization: vi.fn(() =>
      TE.right({
        delegates: [mocks.migrationDelegate]
      })
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

const { isAxiosError } = vi.hoisted(() => ({
  isAxiosError: vi.fn().mockReturnValue(false)
}));

vi.mock("axios", async () => ({
  isAxiosError
}));

vi.mock("@/lib/be/subscription-migration-client", () => ({
  getSubscriptionsMigrationClient
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
      const request = new NextRequest(new URL("http://localhost"));

      const result = await forwardIoServicesCmsRequest("getServices", {
        nextRequest: request,
        backofficeUser: jwtMock
      });

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
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload)
      });

      const result = await forwardIoServicesCmsRequest("createService", {
        nextRequest: request,
        backofficeUser: jwtMock,
        pathParams: {
          serviceId: "test"
        }
      });

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
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload)
      });

      const result = await forwardIoServicesCmsRequest("reviewService", {
        nextRequest: request,
        backofficeUser: jwtMock,
        pathParams: {
          serviceId: "test"
        }
      });

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

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload)
      });

      const result = await forwardIoServicesCmsRequest("createService", {
        nextRequest: request,
        backofficeUser: jwtMock,
        jsonBody: aBodyPayload,
        pathParams: {
          serviceId: "test"
        }
      });

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
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload)
      });

      const result = await forwardIoServicesCmsRequest("reviewService", {
        nextRequest: request,
        backofficeUser: jwtMock,
        pathParams: {
          serviceId: "test"
        }
      });

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

      const result = await retrieveServiceList(
        mocks.anUserId,
        mocks.anInstitution,
        10,
        0
      );

      expect(getServiceListMock).toHaveBeenCalledWith(
        mocks.anUserId,
        10,
        0,
        undefined
      );
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
            ...toServiceListItem(mocks.serviceTopicsMaps)(
              mocks.aBaseServiceLifecycle
            ),
            id: aServiceinPublicationId,
            visibility: "published"
          },
          {
            ...toServiceListItem(mocks.serviceTopicsMaps)(
              mocks.aBaseServiceLifecycle
            ),
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

      const result = await retrieveServiceList(
        mocks.anUserId,
        mocks.anInstitution,
        10,
        90
      );

      expect(getServiceListMock).toHaveBeenCalledWith(
        mocks.anUserId,
        10,
        90,
        undefined
      );
      expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
      expect(bulkFetchPublicationMock).not.toHaveBeenCalled();

      expect(result).toStrictEqual({
        value: [],
        pagination: { count: 90, limit: 10, offset: 90 }
      });
    });

    it("when APIM returns 404 neither service-lifecycle or service-publication bulkFetch method should be called", async () => {
      const bulkFetchLifecycleMock = vi.fn(() => TE.right([]));
      const bulkFetchPublicationMock = vi.fn(() => TE.right([]));

      const getServiceListMock = vi.fn(() =>
        TE.left({
          message: "Received 404 response",
          response: { status: 404 }
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

      isAxiosError.mockReturnValueOnce(true);

      const result = await retrieveServiceList(
        mocks.anUserId,
        mocks.anInstitution,
        10,
        90
      );

      expect(getServiceListMock).toHaveBeenCalledWith(
        mocks.anUserId,
        10,
        90,
        undefined
      );
      expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
      expect(bulkFetchPublicationMock).not.toHaveBeenCalled();

      expect(result).toStrictEqual({
        value: [],
        pagination: { count: 0, limit: 10, offset: 90 }
      });
    });

    // This is a BORDER CASE, this can happen only if a service is manually deleted from services-lifecycle cosmos container
    // and not on apim, in such remote case we still return the list of services
    it("when a service is found on apim and not service-lifecycle a placeholder should be included in list", async () => {
      const aServiceInLifecycleId = "aServiceInLifecycleId";
      const aServiceNotInLifecycleId = "aServiceNotInLifecycleId";
      const aServiceNotInLifecycleCreateDate = new Date();

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
              name: aServiceNotInLifecycleId,
              createdDate: aServiceNotInLifecycleCreateDate
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

      const result = await retrieveServiceList(
        mocks.anUserId,
        mocks.anInstitution,
        10,
        0
      );

      expect(getServiceListMock).toHaveBeenCalledWith(
        mocks.anUserId,
        10,
        0,
        undefined
      );
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
            ...toServiceListItem(mocks.serviceTopicsMaps)(
              mocks.aBaseServiceLifecycle
            ),
            id: aServiceInLifecycleId,
            visibility: "published"
          },
          expect.objectContaining({
            description: MISSING_SERVICE_DESCRIPTION,
            id: aServiceNotInLifecycleId,
            last_update: aServiceNotInLifecycleCreateDate.toISOString(),
            name: MISSING_SERVICE_NAME,
            organization: {
              fiscal_code: mocks.anInstitution.fiscalCode,
              name: mocks.anInstitution.name
            },
            status: {
              value: ServiceLifecycleStatusTypeEnum.deleted
            }
          })
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
        retrieveServiceList(mocks.anUserId, mocks.anInstitution, 10, 0)
      ).rejects.toThrowError();

      expect(getServiceListMock).toHaveBeenCalledWith(
        mocks.anUserId,
        10,
        0,
        undefined
      );
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
        retrieveServiceList(mocks.anUserId, mocks.anInstitution, 10, 0)
      ).rejects.toThrowError();

      expect(getServiceListMock).toHaveBeenCalledWith(
        mocks.anUserId,
        10,
        0,
        undefined
      );
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
        retrieveServiceList(mocks.anUserId, mocks.anInstitution, 10, 0)
      ).rejects.toThrowError();

      expect(getServiceListMock).toHaveBeenCalledWith(
        mocks.anUserId,
        10,
        0,
        undefined
      );
      expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
      expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    });
  });
  describe("subscriptions migration", () => {
    it("should return a list of delegates", async () => {
      const getDelegatesByOrganization = vi.fn(() =>
        TE.right({
          delegates: [mocks.migrationDelegate]
        })
      );

      getSubscriptionsMigrationClient.mockReturnValueOnce({
        getDelegatesByOrganization
      });

      const result = await retrieveOrganizationDelegates("anOrganizationId");

      expect(getDelegatesByOrganization).toBeCalledWith("anOrganizationId");
      expect(result).toStrictEqual({
        delegates: [mocks.migrationDelegate]
      });
    });

    it("should propagate a not detailed error", async () => {
      const getDelegatesByOrganization = vi.fn(() =>
        TE.left(new Error("Error calling subscriptions migration"))
      );

      getSubscriptionsMigrationClient.mockReturnValueOnce({
        getDelegatesByOrganization
      });

      await expect(
        retrieveOrganizationDelegates("anOrganizationId")
      ).rejects.toThrowError(
        "Error calling subscriptions migration getDelegatesByOrganization API"
      );

      expect(getDelegatesByOrganization).toBeCalledWith("anOrganizationId");
    });
  });
});
