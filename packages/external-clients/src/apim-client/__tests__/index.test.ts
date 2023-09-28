import { ApiManagementClient } from "@azure/arm-apimanagement";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";
import {
  getApimService,
  parseOwnerIdFullPath,
  subscriptionsExceptManageOneApimFilter,
} from "..";
import { SubscriptionKeyTypeEnum } from "../../generated/api/SubscriptionKeyType";

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

  describe("getUser", () => {
    it("should return a user", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          get: vi.fn((_, __, userId) =>
            Promise.resolve({
              _etag: "_etag",
              userId,
            })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUser(anUserId)();

      // expect result
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
            })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUser(anUserId)();

      // expect result
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
    it("should return a user", async () => {
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserByEmail(anUserEmail)();

      // expect result
      expect(mockApimClient.user.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `email eq '${anUserEmail}'`,
        }
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

    it("should return none when no user found", async () => {
      // mock ApimClient
      const mockApimClient = {
        user: {
          listByService: vi.fn(() => []),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserByEmail(anUserEmail)();

      // expect result
      expect(mockApimClient.user.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `email eq '${anUserEmail}'`,
        }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserByEmail(anUserEmail)();

      // expect result
      expect(mockApimClient.user.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `email eq '${anUserEmail}'`,
        }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserGroups(anUserId)();

      // expect result
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserGroups(anUserId)();

      // expect result
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserGroups(anUserId)();

      // expect result
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
            })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getSubscription(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getSubscription(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
            })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.listSecrets(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
            Promise.reject({ statusCode: 503 })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.listSecrets(aServiceId)();

      // expect result
      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
    it("should return the upsert subscription", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          createOrUpdate: vi.fn(() =>
            Promise.resolve({
              _etag: "_etag",
            })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.upsertSubscription(
        aProductId,
        anOwnerId,
        aServiceId
      )();

      // expect result
      expect(mockApimClient.subscription.createOrUpdate).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
        {
          displayName: aServiceId,
          ownerId: anOwnerId,
          scope: `/products/${aProductId}`,
          state: "active",
        }
      );

      expect(E.isRight(result)).toBeTruthy();
    });

    it("should return an error when apim respond with an error", async () => {
      // mock ApimClient
      const mockApimClient = {
        subscription: {
          createOrUpdate: vi.fn(() => Promise.reject({ statusCode: 503 })),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.upsertSubscription(
        aProductId,
        anOwnerId,
        aServiceId
      )();

      // expect result
      expect(mockApimClient.subscription.createOrUpdate).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId,
        {
          displayName: aServiceId,
          ownerId: anOwnerId,
          scope: `/products/${aProductId}`,
          state: "active",
        }
      );

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          statusCode: 503,
        });
      }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.getProductByName(
        aProductName as unknown as NonEmptyString
      )();

      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${aProductName}'`,
        }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getProductByName(
        aProductName as unknown as NonEmptyString
      )();

      // expect result
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${aProductName}'`,
        }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getProductByName(
        aProductName as unknown as NonEmptyString
      )();

      // expect result
      expect(mockApimClient.product.listByService).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        {
          filter: `name eq '${aProductName}'`,
        }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.getUserSubscriptions(anUserId)();

      expect(mockApimClient.userSubscription.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
        {
          filter: subscriptionsExceptManageOneApimFilter(),
        }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserSubscriptions(anUserId)();

      // expect result
      expect(mockApimClient.userSubscription.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
        {
          filter: subscriptionsExceptManageOneApimFilter(),
        }
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      // call getUser
      const result = await apimService.getUserSubscriptions(anUserId)();

      // expect result
      expect(mockApimClient.userSubscription.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId,
        {
          filter: subscriptionsExceptManageOneApimFilter(),
        }
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
            })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.regenerateSubscriptionKey(
        aServiceId,
        SubscriptionKeyTypeEnum.primary
      )();

      expect(
        mockApimClient.subscription.regeneratePrimaryKey
      ).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
      );

      expect(
        mockApimClient.subscription.regenerateSecondaryKey
      ).not.toHaveBeenCalled();

      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
            })
          ),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.regenerateSubscriptionKey(
        aServiceId,
        SubscriptionKeyTypeEnum.secondary
      )();

      expect(
        mockApimClient.subscription.regeneratePrimaryKey
      ).not.toHaveBeenCalled();

      expect(
        mockApimClient.subscription.regenerateSecondaryKey
      ).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
      );

      expect(mockApimClient.subscription.listSecrets).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
            Promise.reject({ statusCode: 500 })
          ),
          regenerateSecondaryKey: vi.fn(),
        },
      } as unknown as ApiManagementClient;

      // create ApimService
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.regenerateSubscriptionKey(
        aServiceId,
        SubscriptionKeyTypeEnum.secondary
      )();

      expect(
        mockApimClient.subscription.regeneratePrimaryKey
      ).not.toHaveBeenCalled();

      expect(
        mockApimClient.subscription.regenerateSecondaryKey
      ).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
            })
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
            })
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
      );

      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
      );

      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
            })
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
            })
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
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
            })
          ),
        },
        user: {
          get: vi.fn(() =>
            Promise.reject({
              statusCode: 503,
            })
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
      );
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
            })
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
            })
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
      const apimService = getApimService(
        mockApimClient,
        anApimResourceGroup,
        anApimServiceName
      );

      const result = await apimService.getDelegateFromServiceId(
        aServiceId as unknown as NonEmptyString
      )();

      expect(mockApimClient.subscription.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        aServiceId
      );
      expect(mockApimClient.user.get).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
      );
      expect(mockApimClient.userGroup.list).toHaveBeenCalledWith(
        anApimResourceGroup,
        anApimServiceName,
        anUserId
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
      const res = parseOwnerIdFullPath(
        "/subscriptions/subid/resourceGroups/{resourceGroup}/providers/Microsoft.ApiManagement/service/{apimService}/users/1234a75ae4bbd512a88c680x" as NonEmptyString
      );
      expect(res).toBe("1234a75ae4bbd512a88c680x");
    });
  });
});
