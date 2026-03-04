import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import { Cidr } from "../../../../generated/api/Cidr";
import { SubscriptionKeyTypeEnum } from "../../../../generated/api/SubscriptionKeyType";
import {
  deleteManageSubscription,
  getManageSubscriptions,
  regenerateManageSubscritionApiKey,
  retrieveManageSubscriptionApiKeys,
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscription,
  upsertManageSubscriptionAuthorizedCIDRs
} from "../business";

const mocks: {
  anOwnerId: string;
  aGroup: { id: string; name: string };
  aSubscriptionContract: { name: string; displayName: string; state: string };
  upsertSubscription: Mock<any>;
  getUserSubscriptions: Mock<any>;
  deleteSubscription: Mock<any>;
  findLastVersionByModelId: Mock<any>;
  upsert: Mock<(...args: Parameters<SubscriptionCIDRsModel["upsert"]>) => any>;
  cidrs: Set<Cidr>;
  aSubscriptionId: string;
  aPrimaryKey: string;
  aSecondaryKey: string;
  listSecrets: Mock<any>;
  regenerateSubscriptionKey: Mock<any>;
} = vi.hoisted(() => ({
  anOwnerId: "anOwnerId",
  aGroup: {
    id: "aGroupId",
    name: "aGroupName"
  },
  aSubscriptionContract: {
    name: "name",
    displayName: "displayName",
    state: "active"
  },
  cidrs: new Set(["127.0.0.1/8", "127.0.0.2/8"]) as Set<Cidr>,
  aSubscriptionId: "aSubscriptionId",
  aPrimaryKey: "primary",
  aSecondaryKey: "secondary",
  upsertSubscription: vi.fn(),
  getUserSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
  findLastVersionByModelId: vi.fn(),
  upsert: vi.fn(),
  listSecrets: vi.fn(),
  regenerateSubscriptionKey: vi.fn()
}));

vi.mock("@/lib/be/legacy-cosmos", () => ({
  getSubscriptionCIDRsModel: () => ({
    findLastVersionByModelId: mocks.findLastVersionByModelId,
    upsert: mocks.upsert
  })
}));

vi.mock("@/lib/be/apim-service", () => ({
  upsertSubscription: mocks.upsertSubscription,
  getApimService: () => ({
    getUserSubscriptions: mocks.getUserSubscriptions,
    deleteSubscription: mocks.deleteSubscription,
    listSecrets: mocks.listSecrets,
    regenerateSubscriptionKey: mocks.regenerateSubscriptionKey
  })
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Subscriptions Business Logic", () => {
  describe("upsertManageSubscription", () => {
    it.each`
      scenario                                | upsertSubResult                                | excpectedErrorMessage
      ${"an ApimRestError"}                   | ${TE.left({ statusCode: 500 })}                | ${"Error creating subscription"}
      ${"a generic Error"}                    | ${TE.left(new Error("generic error message"))} | ${"Error creating subscription"}
      ${"an invalid"}                         | ${TE.right({ id: undefined, name: "name" })}   | ${"Partial data received"}
      ${"an invalid"}                         | ${TE.right({ id: "id", name: undefined })}     | ${"Partial data received"}
      ${"an ApimPreconditionFailedRestError"} | ${TE.left({ statusCode: 412 })}                | ${"Precondition Failed"}
    `(
      "should throw an error when received $scenario response",
      async ({ upsertSubResult, excpectedErrorMessage }) => {
        const ownerId = mocks.anOwnerId;
        mocks.upsertSubscription.mockReturnValueOnce(upsertSubResult);

        await expect(() =>
          upsertManageSubscription(ownerId)
        ).rejects.toThrowError(excpectedErrorMessage);

        expect(mocks.upsertSubscription).toHaveBeenCalledOnce();
        expect(mocks.upsertSubscription).toHaveBeenCalledWith(
          "MANAGE",
          ownerId
        );
      }
    );

    it.each`
      subType           | group
      ${"MANAGE"}       | ${undefined}
      ${"MANAGE_GROUP"} | ${mocks.aGroup}
    `(
      "should return the new $subType Subscription",
      async ({ subType, group }) => {
        // given
        const name = "name";
        const displayName = "displayName";
        const state = "active";
        const ownerId = mocks.anOwnerId;
        mocks.upsertSubscription.mockReturnValueOnce(
          TE.right({
            name,
            displayName,
            state,
            foo: "foo",
            bar: "bar"
          })
        );

        // when and then
        await expect(
          upsertManageSubscription(ownerId, group)
        ).resolves.toStrictEqual({ id: name, name: displayName, state });
        const params = group ? [subType, ownerId, group] : [subType, ownerId];
        expect(mocks.upsertSubscription).toHaveBeenCalledOnce();
        expect(mocks.upsertSubscription).toHaveBeenCalledWith(...params);
      }
    );
  });

  describe("getManageSubscriptions", () => {
    const subscriptionType = "MANAGE_GROUP";
    it("should throw an error when received an ApimRestError response", async () => {
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.left({ statusCode: 500 })
      );

      await expect(() =>
        getManageSubscriptions(subscriptionType, ownerId, limit, offset)
      ).rejects.toThrowError("Error retrieving manage group subscriptions");

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        "startswith(name, 'MANAGE-GROUP-')"
      );
    });

    it("should return the group manage Subscriptions", async () => {
      const name = "name";
      const displayName = "displayName";
      const state = "suspended";
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([
          {
            name,
            displayName,
            state,
            foo: "foo",
            bar: "bar"
          }
        ])
      );

      await expect(
        getManageSubscriptions(subscriptionType, ownerId, limit, offset)
      ).resolves.toStrictEqual([{ id: name, name: displayName, state }]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        "startswith(name, 'MANAGE-GROUP-')"
      );
    });

    it("should return a filtered group manage Subscriptions", async () => {
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      const group = { id: "gid1", name: "groupName", state: "ACTIVE" };
      mocks.getUserSubscriptions.mockReturnValueOnce(TE.right([]));

      await expect(
        getManageSubscriptions(subscriptionType, ownerId, limit, offset, [
          group
        ])
      ).resolves.toStrictEqual([]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        `name eq 'MANAGE-GROUP-${group.id}'`
      );
    });

    it.each`
      scenario                       | selcGroups
      ${"selcGroups is not defined"} | ${undefined}
      ${"selcGroups is empty"}       | ${[]}
    `(
      "should return a single subscription when the root manage is requested and $scenario",
      async ({ selcGroups }) => {
        const subscriptionType = "MANAGE_ROOT";
        const ownerId = mocks.anOwnerId;
        const limit = 5;
        const offset = 0;
        mocks.getUserSubscriptions.mockReturnValueOnce(
          TE.right([mocks.aSubscriptionContract])
        );

        await expect(
          getManageSubscriptions(
            subscriptionType,
            ownerId,
            limit,
            offset,
            selcGroups
          )
        ).resolves.toStrictEqual([
          {
            id: mocks.aSubscriptionContract.name,
            name: mocks.aSubscriptionContract.displayName,
            state: mocks.aSubscriptionContract.state
          }
        ]);

        expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
        expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
          ownerId,
          offset,
          limit,
          `name eq 'MANAGE-${ownerId}'`
        );
      }
    );

    it("should return an empty array when the root manage is requested and selcGroups contains at least one item", async () => {
      const subscriptionType = "MANAGE_ROOT";
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      const selcGroups = ["item"];
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract])
      );

      await expect(
        getManageSubscriptions(
          subscriptionType,
          ownerId,
          limit,
          offset,
          selcGroups
        )
      ).resolves.toStrictEqual([]);

      expect(mocks.getUserSubscriptions).not.toHaveBeenCalled();
    });
  });

  describe("deleteManageSubscription", () => {
    it("should throw an error when the getUserSubscriptions fails", async () => {
      //given
      const subscriptionId = "subscriptionId";
      const ownerId = mocks.anOwnerId;
      const errorMessage = "Error retrieving user's subscriptions";
      const filter = `name eq '${subscriptionId}'`;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.left({ statusCode: 500 })
      );

      //when and then
      await expect(
        deleteManageSubscription(ownerId, { subscriptionId })
      ).rejects.toThrowError(errorMessage);
      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        undefined,
        undefined,
        filter
      );
    });

    it("should throw an error when the getUserSubscriptions returns an empty list of subscriptions", async () => {
      //given
      const subscriptionId = "subscriptionId";
      const ownerId = mocks.anOwnerId;
      const errorMessage = "The user can't delete the subscription";
      const filter = `name eq '${subscriptionId}'`;
      mocks.getUserSubscriptions.mockReturnValueOnce(TE.right([]));

      //when and then
      await expect(
        deleteManageSubscription(ownerId, { subscriptionId })
      ).rejects.toThrowError(errorMessage);
      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        undefined,
        undefined,
        filter
      );
    });

    it.each`
      scenario              | deleteSubscriptionResult                       | expectedErrorMessage
      ${"an ApimRestError"} | ${TE.left({ statusCode: 500 })}                | ${"Error deleting subscription"}
      ${"a generic Error"}  | ${TE.left(new Error("generic error message"))} | ${"Error deleting subscription"}
    `(
      "should throw an error when received $scenario response from deleteSubscription",
      async ({ deleteSubscriptionResult, expectedErrorMessage }) => {
        //given
        const subscriptionId = "subscriptionId";
        const ownerId = mocks.anOwnerId;
        mocks.getUserSubscriptions.mockReturnValueOnce(
          TE.right([mocks.aSubscriptionContract])
        );
        mocks.deleteSubscription.mockReturnValueOnce(deleteSubscriptionResult);

        //when and then
        await expect(
          deleteManageSubscription(ownerId, { subscriptionId })
        ).rejects.toThrowError(expectedErrorMessage);
        expect(mocks.deleteSubscription).toHaveBeenCalledOnce();
        expect(mocks.deleteSubscription).toHaveBeenCalledWith(subscriptionId);
      }
    );

    it("should success when the delete subscription success", async () => {
      //given
      const subscriptionId = "subscriptionId";
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract])
      );
      mocks.deleteSubscription.mockReturnValueOnce(TE.right(void 0));

      //when and then
      await expect(
        deleteManageSubscription(ownerId, { subscriptionId })
      ).resolves.toBe(undefined);
      expect(mocks.deleteSubscription).toHaveBeenCalledOnce();
      expect(mocks.deleteSubscription).toHaveBeenCalledWith(subscriptionId);
    });
  });
});

describe("Manage Keys", () => {
  describe("Retrieve", () => {
    it("should return the keys found", async () => {
      mocks.listSecrets.mockReturnValueOnce(
        TE.right({
          primaryKey: mocks.aPrimaryKey,
          secondaryKey: mocks.aSecondaryKey
        })
      );

      const result = await retrieveManageSubscriptionApiKeys(
        mocks.aSubscriptionId
      );

      expect(mocks.listSecrets).toHaveBeenCalledWith(mocks.aSubscriptionId);
      expect(result).toStrictEqual({
        primary_key: mocks.aPrimaryKey,
        secondary_key: mocks.aSecondaryKey
      });
    });

    it("should fail when apim respond with an error", async () => {
      mocks.listSecrets.mockReturnValueOnce(
        TE.left({
          error: {
            code: "Error",
            message: "An error has occurred on APIM"
          },
          statusCode: 500
        })
      );

      expect(
        retrieveManageSubscriptionApiKeys(mocks.aSubscriptionId)
      ).rejects.toThrowError();
      expect(mocks.listSecrets).toHaveBeenCalledWith(mocks.aSubscriptionId);
    });
  });

  describe("Regenerate", () => {
    it("should return the regenerated manage key", async () => {
      mocks.regenerateSubscriptionKey.mockReturnValueOnce(
        TE.right({
          primaryKey: mocks.aPrimaryKey,
          secondaryKey: mocks.aSecondaryKey
        })
      );

      const result = await regenerateManageSubscritionApiKey(
        mocks.aSubscriptionId,
        SubscriptionKeyTypeEnum.primary
      );

      expect(mocks.regenerateSubscriptionKey).toHaveBeenCalledWith(
        mocks.aSubscriptionId,
        SubscriptionKeyTypeEnum.primary
      );
      expect(result).toStrictEqual({
        primary_key: mocks.aPrimaryKey,
        secondary_key: mocks.aSecondaryKey
      });
    });

    it("should return an error when apim fails regenerating", async () => {
      mocks.regenerateSubscriptionKey.mockReturnValueOnce(
        TE.left({
          error: {
            code: "Error",
            message: "An error has occurred on APIM"
          },
          statusCode: 500
        })
      );

      expect(
        regenerateManageSubscritionApiKey(
          mocks.aSubscriptionId,
          SubscriptionKeyTypeEnum.primary
        )
      ).rejects.toThrowError();
      expect(mocks.regenerateSubscriptionKey).toHaveBeenCalledWith(
        mocks.aSubscriptionId,
        SubscriptionKeyTypeEnum.primary
      );
    });
  });
});

describe("Authorized CIDRs Subscription Manage", () => {
  describe("Retrieve", () => {
    it("should return the authorized cidrs found", async () => {
      mocks.findLastVersionByModelId.mockReturnValueOnce(
        TE.right(
          O.some({
            cidrs: mocks.cidrs
          })
        )
      );

      const result = await retrieveManageSubscriptionAuthorizedCIDRs(
        mocks.aSubscriptionId
      );

      expect(mocks.findLastVersionByModelId).toHaveBeenCalledWith([
        mocks.aSubscriptionId
      ]);
      expect(result).toStrictEqual(Array.from(mocks.cidrs));
    });

    it("should return an empty authorized cidrs list when not found are not found", async () => {
      mocks.findLastVersionByModelId.mockReturnValueOnce(TE.right(O.none));

      const result = await retrieveManageSubscriptionAuthorizedCIDRs(
        mocks.aSubscriptionId
      );

      expect(mocks.findLastVersionByModelId).toHaveBeenCalledWith([
        mocks.aSubscriptionId
      ]);
      expect(result).not.toBe(null);
      expect(result).toStrictEqual(Array<Cidr>());
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      mocks.findLastVersionByModelId.mockReturnValueOnce(
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: {
            code: 500,
            body: {
              code: "Error",
              message: "Cosmos error"
            }
          }
        })
      );

      expect(
        retrieveManageSubscriptionAuthorizedCIDRs(mocks.aSubscriptionId)
      ).rejects.toThrowError();
      expect(mocks.findLastVersionByModelId).toHaveBeenCalledWith([
        mocks.aSubscriptionId
      ]);
    });
  });

  describe("Update", () => {
    it("should return 200 when authorized cidrs are updated correctly", async () => {
      mocks.upsert.mockImplementationOnce(request =>
        TE.right({
          cidrs: request.cidrs.values()
        })
      );

      const result = await upsertManageSubscriptionAuthorizedCIDRs(
        mocks.aSubscriptionId,
        Array.from(mocks.cidrs)
      );

      expect(mocks.upsert).toHaveBeenCalledWith({
        cidrs: mocks.cidrs,
        kind: "INewSubscriptionCIDRs",
        subscriptionId: mocks.aSubscriptionId
      });
      expect(result).toStrictEqual(Array.from(mocks.cidrs));
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      mocks.upsert.mockReturnValueOnce(
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: {
            code: 500,
            body: {
              code: "Error",
              message: "Cosmos error"
            }
          }
        })
      );

      expect(
        upsertManageSubscriptionAuthorizedCIDRs(
          mocks.aSubscriptionId,
          Array.from(mocks.cidrs)
        )
      ).rejects.toThrowError();
      expect(mocks.upsert).toHaveBeenCalledWith({
        cidrs: mocks.cidrs,
        kind: "INewSubscriptionCIDRs",
        subscriptionId: mocks.aSubscriptionId
      });
    });
  });
});
