import { ApiManagementClient } from "@azure/arm-apimanagement";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getApimService,
  manageGroupSubscriptionsFilter,
  parseIdFromFullPath,
} from "..";
import { SubscriptionKeyTypeEnum } from "../../generated/api/SubscriptionKeyType";

afterEach(() => {
  vi.resetAllMocks();
});

describe("ApimService Test", () => {
  const anUserId = "123";
  const anOwnerId = `/an/owner/${anUserId}`;
  const anUserEmail = "user@email.test" as unknown as EmailString;
  const anUserGroupId = "anUserGroupId";
  const anUserGroupName = "groupDisplayName";
  const aServiceId = "aServiceId";
  const aPrimaryKey = "aPrimaryKey";
  const aSecondaryKey = "aSecondaryKey";
  const aProductId = "aProductId";
  const aProductName = "aProductName";
  const aProductDescription = "aProdusctDescription";
  const aProductState = "aProductState";
  const aFirstName = "aFirstName";
  const aLastName = "aLastName";

  const anApimResourceGroup = "rg";
  const anApimServiceName = "apimService";
  const anApimProductName = "productName" as NonEmptyString;

  // create ApimService
  const mockApimService = (mockApimClient: ApiManagementClient) =>
    getApimService(
      mockApimClient,
      anApimResourceGroup,
      anApimServiceName,
      anApimProductName,
    );

  describe("getUser", () => {
    it("should return a user", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          get: vi.fn((_, __, userId) =>
            Promise.resolve({
              _etag: "_etag",
              userId,
            }),
          ),
        },
      } as unknown as ApiManagementClient;

      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUser(anUserId)();

      // expect result
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          _etag: "_etag",
          userId: anUserId,
        });
      }
    });

    it("should return an error when apim return error", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          get: vi.fn(() =>
            Promise.reject({
              statusCode: 404,
            }),
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUser(anUserId)();

      // expect result
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 404,
        });
      }
    });
  });

  describe("getUserByEmail", () => {
    it("should return a user without groups", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          listByService: vi.fn(() => [
            Promise.resolve({
              _etag: "_etag",
              userId: anUserId,
              email: anUserEmail,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserByEmail(anUserEmail)();

      // expect result
      expect(mockApimClient.user.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `email eq '${anUserEmail}'`,
        },
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        const optionRes = result.right;
        expect(O.isSome(optionRes)).toBeTruthy();

        if (O.isSome(optionRes)) {
          expect(optionRes.value).toEqual({
            _etag: "_etag",
            userId: anUserId,
            email: anUserEmail,
          });
        }
      }
    });

    it("should return a user with groups", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          listByService: vi.fn(() => [
            Promise.resolve({
              _etag: "_etag",
              userId: anUserId,
              email: anUserEmail,
              groups: [
                {
                  type: "system",
                  name: "Developer",
                },
              ],
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserByEmail(anUserEmail, true)();

      // expect result
      expect(mockApimClient.user.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `email eq '${anUserEmail}'`,
          expandGroups: true,
        },
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        const optionRes = result.right;
        expect(O.isSome(optionRes)).toBeTruthy();

        if (O.isSome(optionRes)) {
          expect(optionRes.value).toEqual({
            _etag: "_etag",
            userId: anUserId,
            email: anUserEmail,
            groups: [
              {
                type: "system",
                name: "Developer",
              },
            ],
          });
        }
      }
    });

    it("should return none when no user found", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          listByService: vi.fn(() => []),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserByEmail(anUserEmail)();

      // expect result
      expect(mockApimClient.user.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `email eq '${anUserEmail}'`,
        },
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        const optionRes = result.right;
        expect(O.isNone(optionRes)).toBeTruthy();
      }
    });

    it("should return left on apim return error", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          listByService: vi.fn(() => [Promise.reject({ statusCode: 501 })]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserByEmail(anUserEmail)();

      // expect result
      expect(mockApimClient.user.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `email eq '${anUserEmail}'`,
        },
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 501,
        });
      }
    });
  });

  describe("getUserGroups", () => {
    it("should return the user's groups", async () => {
      // mock ApimClient
      const mockApimClient = {
        userGroup: {
          list: vi.fn((_, __, userId) => [
            Promise.resolve({
              _etag: "_etag",
              id: anUserGroupId,
              name: anUserGroupName,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserGroups(anUserId)();

      // expect result
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual([
          {
            _etag: "_etag",
            id: anUserGroupId,
            name: anUserGroupName,
          },
        ]);
      }
    });

    it("should return no user's groups when apim returns no one", async () => {
      // mock ApimClient
      const mockApimClient = {
        userGroup: {
          list: vi.fn((_, __, userId) => []),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserGroups(anUserId)();

      // expect result
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual([]);
      }
    });

    // TODO: controllare implementazione poichè sembra ignorare statusCode
    it("should return an error when apim return error", async () => {
      // mock ApimClient
      const mockApimClient = {
        userGroup: {
          list: vi.fn(() => [
            Promise.reject({
              statusCode: 500,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserGroups(anUserId)();

      // expect result
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 500,
        });
      }
    });
  });

  describe("getSubscription", () => {
    it("should return the requested subscription", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          get: vi.fn((_, __, serviceId) =>
            Promise.resolve({
              _etag: "_etag",
              id: serviceId,
            }),
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getSubscription(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          _etag: "_etag",
          id: aServiceId,
        });
      }
    });

    it("should return an error when apim respond with an error", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          get: vi.fn((_, __, userId) => Promise.reject({ statusCode: 503 })),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getSubscription(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 503,
        });
      }
    });
  });

  describe("listSecrets", () => {
    it("should return the requested subscription secrets", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          listSecrets: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              primaryKey: aPrimaryKey,
              secondaryKey: aSecondaryKey,
            }),
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.listSecrets(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          _etag: "_etag",
          primaryKey: aPrimaryKey,
          secondaryKey: aSecondaryKey,
        });
      }
    });

    it("should return an error when apim respond with an error", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          listSecrets: vi.fn((_, __, userId) =>
            Promise.reject({ statusCode: 503 }),
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.listSecrets(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 503,
        });
      }
    });
  });

  describe("upsertSubscription", () => {
    // mock ApimClient
    const mockApimClient = {
      subscription: {
        createOrUpdate: vi.fn(),
      },
      product: {
        listByService: vi.fn(),
      },
      user: {
        get: vi.fn(),
      },
    };
    it("should return the upsert subscription", async () => {
      mockApimClient.product.listByService.mockImplementationOnce(() => [
        Promise.resolve({
          _etag: "_etag",
          description: aProductDescription,
          displayName: aProductName,
          state: aProductState,
          id: aProductId,
        }),
      ]);
      mockApimClient.user.get.mockImplementationOnce((_, __, userId) =>
        Promise.resolve({
          _etag: "_etag",
          userId,
          id: anOwnerId,
        }),
      );
      mockApimClient.subscription.createOrUpdate.mockResolvedValueOnce({
        _etag: "_etag",
      });
      // create ApimService
      const apimService = getApimService(
        mockApimClient as unknown as ApiManagementClient,
        anApimResourceGroup,
        anApimServiceName,
        anApimProductName,
      );

      // call getUser
      const result = await apimService.upsertSubscription(
        anUserId,
        aServiceId,
      )();

      // expect result
      expect(E.isRight(result)).toBeTruthy();

      expect(mockApimClient.product.listByService).toHaveBeenCalledOnce();
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${anApimProductName}'`,
        },
      );
      expect(mockApimClient.user.get).toHaveBeenCalledOnce();
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );
      expect(mockApimClient.subscription.createOrUpdate).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
        {
          displayName: aServiceId,
          ownerId: anOwnerId,
          scope: `/products/${aProductId}`,
          state: "active",
        },
      );
    });

    it("should return an error when the product is not found", async () => {
      // mock ApimClient
      mockApimClient.product.listByService.mockImplementationOnce(() => []);
      mockApimClient.user.get.mockImplementationOnce((_, __, userId) =>
        Promise.resolve({
          _etag: "_etag",
          userId,
          id: anOwnerId,
        }),
      );
      mockApimClient.subscription.createOrUpdate.mockResolvedValueOnce({
        _etag: "_etag",
      });

      // create ApimService
      const apimService = getApimService(
        mockApimClient as unknown as ApiManagementClient,
        anApimResourceGroup,
        anApimServiceName,
        anApimProductName,
      );

      // call getUser
      const result = await apimService.upsertSubscription(
        anOwnerId,
        aServiceId,
      )();

      // expect result
      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toHaveProperty("message");
        if ("message" in result.left) {
          expect(result.left.message).toEqual(
            `No product found with name '${anApimProductName}'`,
          );
        }
      }

      expect(mockApimClient.product.listByService).toHaveBeenCalledOnce();
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${anApimProductName}'`,
        },
      );
      expect(mockApimClient.user.get).not.toHaveBeenCalled();
      expect(mockApimClient.subscription.createOrUpdate).not.toHaveBeenCalled();
    });
    it("should fail when cannot find apim user", async () => {
      // mock ApimClient
      mockApimClient.product.listByService.mockImplementationOnce(() => [
        Promise.resolve({
          _etag: "_etag",
          description: aProductDescription,
          displayName: aProductName,
          state: aProductState,
          id: aProductId,
        }),
      ]);
      mockApimClient.user.get.mockRejectedValueOnce({
        statusCode: 503,
      });
      mockApimClient.subscription.createOrUpdate.mockResolvedValueOnce({
        _etag: "_etag",
      });

      // create ApimService
      const apimService = getApimService(
        mockApimClient as unknown as ApiManagementClient,
        anApimResourceGroup,
        anApimServiceName,
        anApimProductName,
      );

      // call getUser
      const result = await apimService.upsertSubscription(
        anOwnerId,
        aServiceId,
      )();

      // expect result
      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 503,
        });
      }

      expect(mockApimClient.product.listByService).toHaveBeenCalledOnce();
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${anApimProductName}'`,
        },
      );
      expect(mockApimClient.user.get).toHaveBeenCalledOnce();
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anOwnerId,
      );
      expect(mockApimClient.subscription.createOrUpdate).not.toHaveBeenCalled();
    });

    it("should return an error when apim respond with an error", async () => {
      // mock ApimClient
      mockApimClient.product.listByService.mockImplementationOnce(() => [
        Promise.resolve({
          _etag: "_etag",
          description: aProductDescription,
          displayName: aProductName,
          state: aProductState,
          id: aProductId,
        }),
      ]);
      mockApimClient.user.get.mockImplementationOnce((_, __, userId) =>
        Promise.resolve({
          _etag: "_etag",
          userId,
          id: anOwnerId,
        }),
      );
      mockApimClient.subscription.createOrUpdate.mockRejectedValueOnce({
        statusCode: 503,
      });

      // create ApimService
      const apimService = getApimService(
        mockApimClient as unknown as ApiManagementClient,
        anApimResourceGroup,
        anApimServiceName,
        anApimProductName,
      );

      // call getUser
      const result = await apimService.upsertSubscription(
        anOwnerId,
        aServiceId,
      )();

      // expect result
      console.log(result);
      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 503,
        });
      }

      expect(mockApimClient.product.listByService).toHaveBeenCalledOnce();
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${anApimProductName}'`,
        },
      );
      expect(mockApimClient.user.get).toHaveBeenCalledOnce();
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anOwnerId,
      );
      expect(mockApimClient.subscription.createOrUpdate).toHaveBeenCalledOnce();
      expect(mockApimClient.subscription.createOrUpdate).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
        {
          displayName: aServiceId,
          ownerId: anOwnerId,
          scope: `/products/${aProductId}`,
          state: "active",
        },
      );
    });
  });

  describe("getProductByName", () => {
    it("should return a product", async () => {
      // mock ApimClient
      const mockApimClient = {
        product: {
          listByService: vi.fn(() => [
            Promise.resolve({
              _etag: "_etag",
              description: aProductDescription,
              displayName: aProductName,
              state: aProductState,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.getProductByName(
        aProductName as unknown as NonEmptyString,
      )();

      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${aProductName}'`,
        },
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        const optionRes = result.right;
        expect(O.isSome(optionRes)).toBeTruthy();

        if (O.isSome(optionRes)) {
          expect(optionRes.value).toEqual({
            _etag: "_etag",
            description: aProductDescription,
            displayName: aProductName,
            state: aProductState,
          });
        }
      }
    });

    it("should return none when no product found", async () => {
      // mock ApimClient
      const mockApimClient = {
        product: {
          listByService: vi.fn(() => []),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getProductByName(
        aProductName as unknown as NonEmptyString,
      )();

      // expect result
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${aProductName}'`,
        },
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        const optionRes = result.right;
        expect(O.isNone(optionRes)).toBeTruthy();
      }
    });

    it("should return left on apim return error", async () => {
      // mock ApimClient
      const mockApimClient = {
        product: {
          listByService: vi.fn(() => [Promise.reject({ statusCode: 501 })]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getProductByName(
        aProductName as unknown as NonEmptyString,
      )();

      // expect result
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${aProductName}'`,
        },
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 501,
        });
      }
    });
  });

  describe("getUserSubscriptions", () => {
    const NOT_MANAGE_FILTER = "not(startswith(name, 'MANAGE-'))";
    it("should return the user's subscriptions", async () => {
      // mock ApimClient
      const mockApimClient = {
        userSubscription: {
          list: vi.fn(() => ({
            byPage: () => [
              Promise.resolve([
                {
                  _etag: "_etag",
                  id: aServiceId,
                },
              ]),
            ],
          })),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.getUserSubscriptions(anUserId)();

      expect(mockApimClient.userSubscription.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
        {
          filter: NOT_MANAGE_FILTER,
        },
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual([
          {
            _etag: "_etag",
            id: aServiceId,
          },
        ]);
      }
    });

    it("should return no subscription when apim respond with no one", async () => {
      // mock ApimClient
      const mockApimClient = {
        userSubscription: {
          list: vi.fn(() => ({
            byPage: () => [],
          })),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserSubscriptions(anUserId)();

      // expect result
      expect(mockApimClient.userSubscription.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
        {
          filter: NOT_MANAGE_FILTER,
        },
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual([]);
      }
    });

    // TODO: controllare implementazione poichè sembra ignorare statusCode
    it("should return an error when apim respond with an error", async () => {
      // mock ApimClient

      const mockApimClient = {
        userSubscription: {
          list: vi.fn(() => ({
            byPage: () => [Promise.reject({ statusCode: 500 })],
          })),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      // call getUser
      const result = await apimService.getUserSubscriptions(anUserId)();

      // expect result
      expect(mockApimClient.userSubscription.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
        {
          filter: NOT_MANAGE_FILTER,
        },
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 500,
        });
      }
    });
  });

  describe("regenerateSubscriptionKey", () => {
    it("should regenerate PrimaryKey", async () => {
      let update: string;

      // mock ApimClient
      const mockApimClient = {
        subscription: {
          regeneratePrimaryKey: vi.fn(() => {
            update = aSecondaryKey + "upd";
            return Promise.resolve({
              _etag: "_etag",
            });
          }),
          regenerateSecondaryKey: vi.fn(),
          listSecrets: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              primaryKey: update,
              secondaryKey: aSecondaryKey,
            }),
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.regenerateSubscriptionKey(
        aServiceId,
        SubscriptionKeyTypeEnum.primary,
      )();

      expect(
        mockApimClient.subscription.regeneratePrimaryKey,
      ).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(
        mockApimClient.subscription.regenerateSecondaryKey,
      ).not.toHaveBeenCalled();

      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          _etag: "_etag",
          primaryKey: update,
          secondaryKey: aSecondaryKey,
        });
      }
    });

    it("should regenerate SecondaryKey", async () => {
      let update: string;

      // mock ApimClient
      const mockApimClient = {
        subscription: {
          regeneratePrimaryKey: vi.fn(),
          regenerateSecondaryKey: vi.fn(() => {
            update = aSecondaryKey + "upd";
            return Promise.resolve({
              _etag: "_etag",
            });
          }),
          listSecrets: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              primaryKey: aPrimaryKey,
              secondaryKey: update,
            }),
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.regenerateSubscriptionKey(
        aServiceId,
        SubscriptionKeyTypeEnum.secondary,
      )();

      expect(
        mockApimClient.subscription.regeneratePrimaryKey,
      ).not.toHaveBeenCalled();

      expect(
        mockApimClient.subscription.regenerateSecondaryKey,
      ).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          _etag: "_etag",
          primaryKey: aPrimaryKey,
          secondaryKey: update,
        });
      }
    });

    it("should return an error when apim respond with an error", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          regeneratePrimaryKey: vi.fn(() =>
            Promise.reject({ statusCode: 500 }),
          ),
          regenerateSecondaryKey: vi.fn(),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.regenerateSubscriptionKey(
        aServiceId,
        SubscriptionKeyTypeEnum.secondary,
      )();

      expect(
        mockApimClient.subscription.regeneratePrimaryKey,
      ).not.toHaveBeenCalled();

      expect(
        mockApimClient.subscription.regenerateSecondaryKey,
      ).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 500,
        });
      }
    });
  });

  describe("getDelegateFromServiceId", () => {
    it("should return the delegate for the subscription", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          get: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              scope: `/products/${aProductId}`,
              ownerId: anOwnerId,
            }),
          ),
        },
        user: {
          get: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              name: anUserId,
              firstName: aFirstName,
              lastName: aLastName,
              email: anUserEmail,
            }),
          ),
        },
        userGroup: {
          list: vi.fn(() => [
            Promise.resolve({
              _etag: "_etag",
              id: anUserGroupId,
              name: anUserGroupName,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString,
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );

      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          firstName: aFirstName,
          lastName: aLastName,
          email: anUserEmail,
          permissions: [anUserGroupName],
        });
      }
    });

    it("should return error when getSubscription return error", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          get: vi.fn(() =>
            Promise.reject({
              statusCode: 502,
            }),
          ),
        },
        user: {
          get: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              name: anUserId,
              firstName: aFirstName,
              lastName: aLastName,
              email: anUserEmail,
            }),
          ),
        },
        userGroup: {
          list: vi.fn(() => [
            Promise.resolve({
              _etag: "_etag",
              id: anUserGroupId,
              name: anUserGroupName,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString,
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );
      expect(mockApimClient.user.get).not.toHaveBeenCalled();
      expect(mockApimClient.userGroup.list).not.toHaveBeenCalled();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 502,
        });
      }
    });

    it("should return error when getUser return error", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          get: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              scope: `/products/${aProductId}`,
              ownerId: anOwnerId,
            }),
          ),
        },
        user: {
          get: vi.fn(() =>
            Promise.reject({
              statusCode: 503,
            }),
          ),
        },
        userGroup: {
          list: vi.fn(() => [
            Promise.resolve({
              _etag: "_etag",
              id: anUserGroupId,
              name: anUserGroupName,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString,
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );
      expect(mockApimClient.userGroup.list).not.toHaveBeenCalled();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 503,
        });
      }
    });

    it("should return error when getUserGroups return error", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          get: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              scope: `/products/${aProductId}`,
              ownerId: anOwnerId,
            }),
          ),
        },
        user: {
          get: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
              name: anUserId,
              firstName: aFirstName,
              lastName: aLastName,
              email: anUserEmail,
            }),
          ),
        },
        userGroup: {
          list: vi.fn(() => [
            Promise.reject({
              statusCode: 500,
            }),
          ]),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = mockApimService(mockApimClient);

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString,
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
      );
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 500,
        });
      }
    });
  });

  describe("Get Owner Id from Full Path", () => {
    it("should retrieve the ID", () => {
      const res = parseIdFromFullPath(
        "/subscriptions/subid/resourceGroups/{resourceGroup}/providers/Microsoft.ApiManagement/service/{apimService}/users/1234a75ae4bbd512a88c680x" as NonEmptyString,
      );
      expect(res).toBe("1234a75ae4bbd512a88c680x");
    });
  });

  describe("manageGroupSubscriptionsFilter", () => {
    it("should return a MANAGE-GROUP- filter when no groups are provided", () => {
      const res = manageGroupSubscriptionsFilter();

      expect(res).toEqual("startswith(name, 'MANAGE-GROUP-')");
    });

    it("should return an empty filter when empty array is provided", () => {
      const res = manageGroupSubscriptionsFilter([]);

      expect(res).toEqual("");
    });

    it("should return a single MANAGE-GROUP- filter when a single group id provided", () => {
      const groupId = "g1";
      const res = manageGroupSubscriptionsFilter([groupId]);

      expect(res).toEqual(`name eq 'MANAGE-GROUP-${groupId}'`);
    });

    it("should return a concat MANAGE-GROUP- filters based on the group ids provided", () => {
      const groupids = new Array(3);
      for (let index = 0; index < groupids.length; index++) {
        groupids[index] = "id" + index;
      }
      const res = manageGroupSubscriptionsFilter(groupids);

      const expectedRes = groupids
        .map((groupId) => `name eq 'MANAGE-GROUP-${groupId}'`)
        .join(" or ");
      expect(res).toEqual(expectedRes);
    });
  });
});
