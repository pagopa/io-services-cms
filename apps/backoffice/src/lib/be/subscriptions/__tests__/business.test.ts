import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import { Cidr } from "../../../../generated/api/Cidr";
import { SubscriptionKeyTypeEnum } from "../../../../generated/api/SubscriptionKeyType";
import {
  deleteManageSubscription,
  getManageSubscriptions,
  regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
  regenerateManageSubscriptionApiKey,
  retrieveInstitutionAggregateManageSubscriptionsKeys,
  retrieveManageSubscriptionApiKeys,
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscription,
  upsertManageSubscriptionAuthorizedCIDRs,
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
  regenerateSubscriptionKey: Mock<any>;
  getInstitutionGroups: Mock<any>;
  listSubscriptionSecrets: Mock<any>;
} = vi.hoisted(() => ({
  anOwnerId: "anOwnerId",
  aGroup: {
    id: "aGroupId",
    name: "aGroupName",
  },
  aSubscriptionContract: {
    name: "name",
    displayName: "displayName",
    state: "active",
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
  regenerateSubscriptionKey: vi.fn(),
  getInstitutionGroups: vi.fn(),
  listSubscriptionSecrets: vi.fn(),
}));

vi.mock("@/lib/be/legacy-cosmos", () => ({
  getSubscriptionCIDRsModel: () => ({
    findLastVersionByModelId: mocks.findLastVersionByModelId,
    upsert: mocks.upsert,
  }),
}));

vi.mock("@/lib/be/apim-service", () => ({
  upsertSubscription: mocks.upsertSubscription,
  getApimService: () => ({
    getUserSubscriptions: mocks.getUserSubscriptions,
    deleteSubscription: mocks.deleteSubscription,
  }),
}));

vi.mock("../../institutions/selfcare", () => ({
  getInstitutionGroups: mocks.getInstitutionGroups,
}));

vi.mock("../apim", () => ({
  listSubscriptionSecrets: mocks.listSubscriptionSecrets,
  regenerateSubscriptionKey: mocks.regenerateSubscriptionKey,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const validateSubscriptionOwnershipExpectation = (
  ownerId: string,
  subscriptionId: string,
) => {
  expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
  expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
    ownerId,
    undefined,
    undefined,
    `name eq '${subscriptionId}'`,
  );
};

const validateSubscriptionOwnershipTestFn =
  <T extends any[]>(
    functionToTest: (
      apimUserId: string,
      subscriptionId: string,
      ...args: T
    ) => any,
    args: T = [] as unknown as T,
  ) =>
  async ({
    getUserSubscriptionsMockResult,
    expectedErrorMessage,
    toNotHaveBeenCalledMocks,
  }: {
    getUserSubscriptionsMockResult: Mock<any>;
    expectedErrorMessage: string;
    toNotHaveBeenCalledMocks: Mock<any>[];
  }) => {
    const subscriptionId = "subscriptionId";
    const ownerId = mocks.anOwnerId;
    mocks.getUserSubscriptions.mockReturnValueOnce(
      getUserSubscriptionsMockResult,
    );

    await expect(() =>
      functionToTest(ownerId, subscriptionId, ...args),
    ).rejects.toThrowError(expectedErrorMessage);
    validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
    toNotHaveBeenCalledMocks.forEach((mock) => {
      expect(mock).not.toHaveBeenCalled();
    });
  };

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
          upsertManageSubscription(ownerId),
        ).rejects.toThrowError(excpectedErrorMessage);

        expect(mocks.upsertSubscription).toHaveBeenCalledOnce();
        expect(mocks.upsertSubscription).toHaveBeenCalledWith(
          "MANAGE",
          ownerId,
        );
      },
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
            bar: "bar",
          }),
        );

        // when and then
        await expect(
          upsertManageSubscription(ownerId, group),
        ).resolves.toStrictEqual({ id: name, name: displayName, state });
        const params = group ? [subType, ownerId, group] : [subType, ownerId];
        expect(mocks.upsertSubscription).toHaveBeenCalledOnce();
        expect(mocks.upsertSubscription).toHaveBeenCalledWith(...params);
      },
    );
  });

  describe("getManageSubscriptions", () => {
    const subscriptionType = "MANAGE_GROUP";
    it("should throw an error when received an ApimRestError response", async () => {
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.left({ statusCode: 500 }),
      );

      await expect(() =>
        getManageSubscriptions(subscriptionType, ownerId, limit, offset),
      ).rejects.toThrowError("Error retrieving manage group subscriptions");

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        "startswith(name, 'MANAGE-GROUP-')",
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
            bar: "bar",
          },
        ]),
      );

      await expect(
        getManageSubscriptions(subscriptionType, ownerId, limit, offset),
      ).resolves.toStrictEqual([{ id: name, name: displayName, state }]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        "startswith(name, 'MANAGE-GROUP-')",
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
          group,
        ]),
      ).resolves.toStrictEqual([]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        `name eq 'MANAGE-GROUP-${group.id}'`,
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
          TE.right([mocks.aSubscriptionContract]),
        );

        await expect(
          getManageSubscriptions(
            subscriptionType,
            ownerId,
            limit,
            offset,
            selcGroups,
          ),
        ).resolves.toStrictEqual([
          {
            id: mocks.aSubscriptionContract.name,
            name: mocks.aSubscriptionContract.displayName,
            state: mocks.aSubscriptionContract.state,
          },
        ]);

        expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
        expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
          ownerId,
          offset,
          limit,
          `name eq 'MANAGE-${ownerId}'`,
        );
      },
    );

    it("should return an empty array when the root manage is requested and selcGroups contains at least one item", async () => {
      const subscriptionType = "MANAGE_ROOT";
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      const selcGroups = ["item"];
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );

      await expect(
        getManageSubscriptions(
          subscriptionType,
          ownerId,
          limit,
          offset,
          selcGroups,
        ),
      ).resolves.toStrictEqual([]);

      expect(mocks.getUserSubscriptions).not.toHaveBeenCalled();
    });
  });

  describe("deleteManageSubscription", () => {
    it.each`
      scenario                                                              | getUserSubscriptionsMockResult  | expectedErrorMessage                       | toNotHaveBeenCalledMocks
      ${"validateSubscriptionOwnership fails to retrieve the subscription"} | ${TE.left({ statusCode: 500 })} | ${"Error retrieving user's subscriptions"} | ${[mocks.deleteSubscription]}
      ${"user doesn't own the subscription"}                                | ${TE.right([])}                 | ${"The user doesn't own the subscription"} | ${[mocks.deleteSubscription]}
    `(
      "should throw an error when $scenario",
      validateSubscriptionOwnershipTestFn(deleteManageSubscription),
    );

    it.each`
      scenario              | deleteSubscriptionResult                       | expectedErrorMessage
      ${"an ApimRestError"} | ${TE.left({ statusCode: 500 })}                | ${"Error deleting subscription"}
      ${"a generic Error"}  | ${TE.left(new Error("generic error message"))} | ${"Error deleting subscription"}
    `(
      "should throw an error when received $scenario response from deleteSubscription",
      async ({ deleteSubscriptionResult, expectedErrorMessage }) => {
        //given
        const subscriptionId = mocks.aSubscriptionId;
        const ownerId = mocks.anOwnerId;
        mocks.getUserSubscriptions.mockReturnValueOnce(
          TE.right([mocks.aSubscriptionContract]),
        );
        mocks.deleteSubscription.mockReturnValueOnce(deleteSubscriptionResult);

        //when and then
        await expect(
          deleteManageSubscription(ownerId, subscriptionId),
        ).rejects.toThrowError(expectedErrorMessage);
        validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
        expect(mocks.deleteSubscription).toHaveBeenCalledOnce();
        expect(mocks.deleteSubscription).toHaveBeenCalledWith(subscriptionId);
      },
    );

    it("should success when the delete subscription success", async () => {
      //given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.deleteSubscription.mockReturnValueOnce(TE.right(void 0));

      //when and then
      await expect(
        deleteManageSubscription(ownerId, subscriptionId),
      ).resolves.toBe(undefined);
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.deleteSubscription).toHaveBeenCalledOnce();
      expect(mocks.deleteSubscription).toHaveBeenCalledWith(subscriptionId);
    });
  });
});

describe("Manage Keys", () => {
  describe("retrieveManageSubscriptionApiKeys", () => {
    it.each`
      scenario                                                              | getUserSubscriptionsMockResult  | expectedErrorMessage                       | toNotHaveBeenCalledMocks
      ${"validateSubscriptionOwnership fails to retrieve the subscription"} | ${TE.left({ statusCode: 500 })} | ${"Error retrieving user's subscriptions"} | ${[mocks.deleteSubscription]}
      ${"user doesn't own the subscription"}                                | ${TE.right([])}                 | ${"The user doesn't own the subscription"} | ${[mocks.deleteSubscription]}
    `(
      "should throw an error when $scenario",
      validateSubscriptionOwnershipTestFn(retrieveManageSubscriptionApiKeys),
    );

    it("should fail when the subscription's secrets retrieval fails", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      const errorMessage = "test error message";
      const error = new Error(errorMessage);
      mocks.listSubscriptionSecrets.mockRejectedValueOnce(error);

      // when and then
      await expect(
        retrieveManageSubscriptionApiKeys(ownerId, subscriptionId),
      ).rejects.toThrowError(errorMessage);
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.listSubscriptionSecrets).toHaveBeenCalledOnce();
      expect(mocks.listSubscriptionSecrets).toHaveBeenCalledWith(
        subscriptionId,
      );
    });

    it("should return the keys found", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.listSubscriptionSecrets.mockResolvedValueOnce({
        primaryKey: mocks.aPrimaryKey,
        secondaryKey: mocks.aSecondaryKey,
      });

      // when
      const result = await retrieveManageSubscriptionApiKeys(
        ownerId,
        subscriptionId,
      );

      // then
      expect(result).toStrictEqual({
        primary_key: mocks.aPrimaryKey,
        secondary_key: mocks.aSecondaryKey,
      });
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.listSubscriptionSecrets).toHaveBeenCalledOnce();
      expect(mocks.listSubscriptionSecrets).toHaveBeenCalledWith(
        subscriptionId,
      );
    });
  });

  describe("regenerateManageSubscriptionApiKey", () => {
    it.each`
      scenario                                                              | getUserSubscriptionsMockResult  | expectedErrorMessage                       | toNotHaveBeenCalledMocks
      ${"validateSubscriptionOwnership fails to retrieve the subscription"} | ${TE.left({ statusCode: 500 })} | ${"Error retrieving user's subscriptions"} | ${[mocks.regenerateSubscriptionKey]}
      ${"user doesn't own the subscription"}                                | ${TE.right([])}                 | ${"The user doesn't own the subscription"} | ${[mocks.regenerateSubscriptionKey]}
    `(
      "should throw an error when $scenario",
      validateSubscriptionOwnershipTestFn(regenerateManageSubscriptionApiKey),
    );

    it("should fail when the subscription's secret regeneration fails", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      const errorMessage = "test error message";
      const error = new Error(errorMessage);
      mocks.regenerateSubscriptionKey.mockRejectedValueOnce(error);

      // when and then
      await expect(
        regenerateManageSubscriptionApiKey(
          ownerId,
          subscriptionId,
          SubscriptionKeyTypeEnum.primary,
        ),
      ).rejects.toThrowError(errorMessage);
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.regenerateSubscriptionKey).toHaveBeenCalledWith(
        subscriptionId,
        SubscriptionKeyTypeEnum.primary,
      );
    });
  });

  it("should return the regenerated manage key", async () => {
    // given
    const subscriptionId = mocks.aSubscriptionId;
    const ownerId = mocks.anOwnerId;
    mocks.getUserSubscriptions.mockReturnValueOnce(
      TE.right([mocks.aSubscriptionContract]),
    );
    mocks.regenerateSubscriptionKey.mockResolvedValueOnce({
      primaryKey: mocks.aPrimaryKey,
      secondaryKey: mocks.aSecondaryKey,
    });

    // when
    const result = await regenerateManageSubscriptionApiKey(
      ownerId,
      subscriptionId,
      SubscriptionKeyTypeEnum.primary,
    );

    // then
    validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
    expect(mocks.regenerateSubscriptionKey).toHaveBeenCalledWith(
      mocks.aSubscriptionId,
      SubscriptionKeyTypeEnum.primary,
    );
    expect(result).toStrictEqual({
      primary_key: mocks.aPrimaryKey,
      secondary_key: mocks.aSecondaryKey,
    });
  });

  describe("retrieveInstitutionAggregateManageSubscriptionsKeys", () => {
    it("should return an error when getInstitutionGroups respond with an error", async () => {
      // given
      const aggregateId = "aggregateId";
      const aggregatorId = "aggregatorId";
      const errorMessage = "test error message";
      const error = new Error(errorMessage);
      mocks.getInstitutionGroups.mockRejectedValueOnce(error);

      // when and then
      await expect(
        retrieveInstitutionAggregateManageSubscriptionsKeys(
          aggregateId,
          aggregatorId,
        ),
      ).rejects.toThrowError(errorMessage);
      expect(mocks.getInstitutionGroups).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionGroups).toHaveBeenCalledWith(
        aggregateId,
        undefined,
        undefined,
        undefined,
        aggregatorId,
      );
      expect(mocks.listSubscriptionSecrets).not.toHaveBeenCalled();
    });

    it.each`
      mockGroupsLength
      ${0}
      ${2}
    `(
      "should return an error when $mockGroupsLength groups are found",
      async ({ mockGroupsLength }) => {
        // given
        const aggregateId = "aggregateId";
        const aggregatorId = "aggregatorId";
        mocks.getInstitutionGroups.mockResolvedValueOnce({
          totalElements: mockGroupsLength,
        });

        // when and then
        await expect(
          retrieveInstitutionAggregateManageSubscriptionsKeys(
            aggregateId,
            aggregatorId,
          ),
        ).rejects.toThrowError("Data inconsistency");
        expect(mocks.getInstitutionGroups).toHaveBeenCalledOnce();
        expect(mocks.getInstitutionGroups).toHaveBeenCalledWith(
          aggregateId,
          undefined,
          undefined,
          undefined,
          aggregatorId,
        );
        expect(mocks.listSubscriptionSecrets).not.toHaveBeenCalled();
      },
    );

    it("should return an error when the subscription's secrets retrieval fails", async () => {
      // given
      const aggregateId = "aggregateId";
      const aggregatorId = "aggregatorId";
      const errorMessage = "test error message";
      mocks.getInstitutionGroups.mockResolvedValueOnce({
        content: [mocks.aGroup],
        totalElements: 1,
      });
      const error = new Error(errorMessage);
      mocks.listSubscriptionSecrets.mockRejectedValueOnce(error);

      // when and then
      await expect(
        retrieveInstitutionAggregateManageSubscriptionsKeys(
          aggregateId,
          aggregatorId,
        ),
      ).rejects.toThrowError(errorMessage);
      expect(mocks.getInstitutionGroups).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionGroups).toHaveBeenCalledWith(
        aggregateId,
        undefined,
        undefined,
        undefined,
        aggregatorId,
      );
      expect(mocks.listSubscriptionSecrets).toHaveBeenCalledOnce();
      expect(mocks.listSubscriptionSecrets).toHaveBeenCalledWith(
        `MANAGE-GROUP-${mocks.aGroup.id}`,
      );
    });

    it.each`
      apimRespnse
      ${{ primaryKey: undefined, secondaryKey: "secondary-key" }}
      ${{ primaryKey: "primary-key", secondaryKey: undefined }}
      ${{ primaryKey: undefined, secondaryKey: undefined }}
    `(
      "should return an error when APIM responds with $apimRespnse",
      async ({ apimRespnse }) => {
        // given
        const aggregateId = "aggregateId";
        const aggregatorId = "aggregatorId";
        mocks.getInstitutionGroups.mockResolvedValueOnce({
          content: [mocks.aGroup],
          totalElements: 1,
        });
        const primaryKey = apimRespnse.primaryKey;
        const secondaryKey = apimRespnse.secondaryKey;
        mocks.listSubscriptionSecrets.mockResolvedValueOnce({
          primaryKey,
          secondaryKey,
        });

        // when and then
        await expect(
          retrieveInstitutionAggregateManageSubscriptionsKeys(
            aggregateId,
            aggregatorId,
          ),
        ).rejects.toThrowError("Data inconsistency");
        expect(mocks.getInstitutionGroups).toHaveBeenCalledOnce();
        expect(mocks.getInstitutionGroups).toHaveBeenCalledWith(
          aggregateId,
          undefined,
          undefined,
          undefined,
          aggregatorId,
        );
      },
    );

    it("should return the subscription keys related to the group found", async () => {
      // given
      const aggregateId = "aggregateId";
      const aggregatorId = "aggregatorId";
      mocks.getInstitutionGroups.mockResolvedValueOnce({
        content: [mocks.aGroup],
        totalElements: 1,
      });
      const primaryKey = `primary-key-for-${mocks.aGroup.id}`;
      const secondaryKey = `secondary-key-for-${mocks.aGroup.id}`;
      mocks.listSubscriptionSecrets.mockResolvedValueOnce({
        primaryKey,
        secondaryKey,
      });

      // when
      const result = await retrieveInstitutionAggregateManageSubscriptionsKeys(
        aggregateId,
        aggregatorId,
      );

      // then
      expect(mocks.getInstitutionGroups).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionGroups).toHaveBeenCalledWith(
        aggregateId,
        undefined,
        undefined,
        undefined,
        aggregatorId,
      );
      expect(result).toStrictEqual({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      });
    });
  });

  describe("regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator", () => {
    describe("failures from call to retrieveInstitutionAggregateInstitutionAggregatorSubscriptionId", () => {
      it("should return an error when getInstitutionGroups respond with an error", async () => {
        // given
        const aggregateId = "aggregateId";
        const aggregatorId = "aggregatorId";
        const aggregatorInstitutionId = "aggregatorInstitutionId";
        const errorMessage = "test error message";
        const error = new Error(errorMessage);
        mocks.getInstitutionGroups.mockRejectedValueOnce(error);

        // when and then
        await expect(
          regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
            aggregateId,
            aggregatorId,
            aggregatorInstitutionId,
            SubscriptionKeyTypeEnum.primary,
          ),
        ).rejects.toThrowError(errorMessage);
        expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith(
          aggregateId,
          undefined,
          undefined,
          undefined,
          aggregatorInstitutionId,
        );
        expect(mocks.getUserSubscriptions).not.toHaveBeenCalled();
        expect(mocks.regenerateSubscriptionKey).not.toHaveBeenCalled();
      });

      it.each`
        mockGroupsLength
        ${0}
        ${2}
      `(
        "should return an error when $mockGroupsLength groups are found",
        async ({ mockGroupsLength }) => {
          // given
          const aggregateId = "aggregateId";
          const aggregatorId = "aggregatorId";
          const aggregatorInstitutionId = "aggregatorInstitutionId";
          mocks.getInstitutionGroups.mockResolvedValueOnce({
            totalElements: mockGroupsLength,
          });

          // when and then
          await expect(
            regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
              aggregateId,
              aggregatorId,
              aggregatorInstitutionId,
              SubscriptionKeyTypeEnum.primary,
            ),
          ).rejects.toThrowError("Data inconsistency");
          expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith(
            aggregateId,
            undefined,
            undefined,
            undefined,
            aggregatorInstitutionId,
          );
          expect(mocks.getUserSubscriptions).not.toHaveBeenCalled();
          expect(mocks.regenerateSubscriptionKey).not.toHaveBeenCalled();
        },
      );
    });

    describe("failures from call to regenerateManageSubscriptionApiKey", () => {
      describe("failures from call to validateSubscriptionOwnership", () => {
        it.each`
          scenario                                                              | getUserSubscriptionsMockResult  | expectedErrorMessage
          ${"validateSubscriptionOwnership fails to retrieve the subscription"} | ${TE.left({ statusCode: 500 })} | ${"Error retrieving user's subscriptions"}
          ${"user doesn't own the subscription"}                                | ${TE.right([])}                 | ${"The user doesn't own the subscription"}
        `(
          "should throw an error when $scenario",
          async ({ getUserSubscriptionsMockResult, expectedErrorMessage }) => {
            // given
            const aggregateId = "aggregateId";
            const aggregatorId = "aggregatorId";
            const aggregatorInstitutionId = "aggregatorInstitutionId";
            mocks.getInstitutionGroups.mockResolvedValueOnce({
              content: [mocks.aGroup],
              totalElements: 1,
            });
            mocks.getUserSubscriptions.mockReturnValueOnce(
              getUserSubscriptionsMockResult,
            );

            // when and then
            await expect(
              regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
                aggregateId,
                aggregatorId,
                aggregatorInstitutionId,
                SubscriptionKeyTypeEnum.primary,
              ),
            ).rejects.toThrowError(expectedErrorMessage);
            expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith(
              aggregateId,
              undefined,
              undefined,
              undefined,
              aggregatorInstitutionId,
            );
            expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
              aggregatorId,
              undefined,
              undefined,
              `name eq 'MANAGE-GROUP-${mocks.aGroup.id}'`,
            );
            expect(mocks.regenerateSubscriptionKey).not.toHaveBeenCalled();
          },
        );
      });
      describe("failures from call to regenerateManageSubscriptionApiKey", () => {
        it("should return an error when the subscription's secret regeneration fails", async () => {
          // given
          const aggregateId = "aggregateId";
          const aggregatorId = "aggregatorId";
          const aggregatorInstitutionId = "aggregatorInstitutionId";
          const errorMessage = "test error message";
          mocks.getInstitutionGroups.mockResolvedValueOnce({
            content: [mocks.aGroup],
            totalElements: 1,
          });
          mocks.getUserSubscriptions
            .mockReturnValueOnce(TE.right([mocks.aSubscriptionContract]));
          mocks.regenerateSubscriptionKey.mockRejectedValueOnce(
            new Error(errorMessage),
          );

          // when and then
          await expect(
            regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
              aggregateId,
              aggregatorId,
              aggregatorInstitutionId,
              SubscriptionKeyTypeEnum.primary,
            ),
          ).rejects.toThrowError(errorMessage);
          expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith(
            aggregateId,
            undefined,
            undefined,
            undefined,
            aggregatorInstitutionId,
          );
          expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
            aggregatorId,
            undefined,
            undefined,
            `name eq 'MANAGE-GROUP-${mocks.aGroup.id}'`,
          );
          expect(mocks.regenerateSubscriptionKey).toHaveBeenCalledExactlyOnceWith(
            `MANAGE-GROUP-${mocks.aGroup.id}`,
            SubscriptionKeyTypeEnum.primary,
          );
        });
      });
    });

    describe("data inconsistency errors", () => {
      it.each`
        apimResponse
        ${{ primaryKey: undefined, secondaryKey: "secondary-key" }}
        ${{ primaryKey: "primary-key", secondaryKey: undefined }}
        ${{ primaryKey: undefined, secondaryKey: undefined }}
      `(
        "should return an error when APIM responds with $apimResponse",
        async ({ apimResponse }) => {
          // given
          const aggregateId = "aggregateId";
          const aggregatorId = "aggregatorId";
          const aggregatorInstitutionId = "aggregatorInstitutionId";
          mocks.getInstitutionGroups.mockResolvedValueOnce({
            content: [mocks.aGroup],
            totalElements: 1,
          });
          mocks.getUserSubscriptions
            .mockReturnValueOnce(TE.right([mocks.aSubscriptionContract]));
          mocks.regenerateSubscriptionKey.mockResolvedValueOnce(apimResponse);

          // when and then
          await expect(
            regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
              aggregateId,
              aggregatorId,
              aggregatorInstitutionId,
              SubscriptionKeyTypeEnum.primary,
            ),
          ).rejects.toThrowError("Data inconsistency");
          expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith(
            aggregateId,
            undefined,
            undefined,
            undefined,
            aggregatorInstitutionId,
          );
          expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
            aggregatorId,
            undefined,
            undefined,
            `name eq 'MANAGE-GROUP-${mocks.aGroup.id}'`,
          );
          expect(mocks.regenerateSubscriptionKey).toHaveBeenCalledExactlyOnceWith(
            `MANAGE-GROUP-${mocks.aGroup.id}`,
            SubscriptionKeyTypeEnum.primary,
          );
        },
      );
    });

    it("should return the regenerated subscription keys related to the group found", async () => {
      // given
      const aggregateId = "aggregateId";
      const aggregatorId = "aggregatorId";
      const aggregatorInstitutionId = "aggregatorInstitutionId";
      const primaryKey = `primary-key-for-${mocks.aGroup.id}`;
      const secondaryKey = `secondary-key-for-${mocks.aGroup.id}`;
      mocks.getInstitutionGroups.mockResolvedValueOnce({
        content: [mocks.aGroup],
        totalElements: 1,
      });
      mocks.getUserSubscriptions
        .mockReturnValueOnce(TE.right([mocks.aSubscriptionContract]));
      mocks.regenerateSubscriptionKey.mockResolvedValueOnce({
        primaryKey,
        secondaryKey,
      });

      // when
      const result =
        await regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
          aggregateId,
          aggregatorId,
          aggregatorInstitutionId,
          SubscriptionKeyTypeEnum.primary,
        );

      // then
      expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith(
        aggregateId,
        undefined,
        undefined,
        undefined,
        aggregatorInstitutionId,
      );
      expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
        aggregatorId,
        undefined,
        undefined,
        `name eq 'MANAGE-GROUP-${mocks.aGroup.id}'`,
      );
      expect(mocks.regenerateSubscriptionKey).toHaveBeenCalledExactlyOnceWith(
        `MANAGE-GROUP-${mocks.aGroup.id}`,
        SubscriptionKeyTypeEnum.primary,
      );
      expect(result).toStrictEqual({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      });
    });
  });
});

describe("Authorized CIDRs Subscription Manage", () => {
  describe("retrieveManageSubscriptionAuthorizedCIDRs", () => {
    it.each`
      scenario                                                              | getUserSubscriptionsMockResult  | expectedErrorMessage                       | toNotHaveBeenCalledMocks
      ${"validateSubscriptionOwnership fails to retrieve the subscription"} | ${TE.left({ statusCode: 500 })} | ${"Error retrieving user's subscriptions"} | ${[mocks.findLastVersionByModelId]}
      ${"user doesn't own the subscription"}                                | ${TE.right([])}                 | ${"The user doesn't own the subscription"} | ${[mocks.findLastVersionByModelId]}
    `(
      "should throw an error when $scenario",
      validateSubscriptionOwnershipTestFn(
        retrieveManageSubscriptionAuthorizedCIDRs,
      ),
    );

    it("should return the authorized cidrs found", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.findLastVersionByModelId.mockReturnValueOnce(
        TE.right(
          O.some({
            cidrs: mocks.cidrs,
          }),
        ),
      );

      // when
      const result = await retrieveManageSubscriptionAuthorizedCIDRs(
        ownerId,
        subscriptionId,
      );

      // then
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.findLastVersionByModelId).toHaveBeenCalledWith([
        subscriptionId,
      ]);
      expect(result).toStrictEqual(Array.from(mocks.cidrs));
    });

    it("should return an empty authorized cidrs list when not found are not found", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.findLastVersionByModelId.mockReturnValueOnce(TE.right(O.none));

      // when
      const result = await retrieveManageSubscriptionAuthorizedCIDRs(
        ownerId,
        subscriptionId,
      );

      // then
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.findLastVersionByModelId).toHaveBeenCalledWith([
        subscriptionId,
      ]);
      expect(result).not.toBe(null);
      expect(result).toStrictEqual(Array<Cidr>());
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.findLastVersionByModelId.mockReturnValueOnce(
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: {
            code: 500,
            body: {
              code: "Error",
              message: "Cosmos error",
            },
          },
        }),
      );

      // when and then
      await expect(
        retrieveManageSubscriptionAuthorizedCIDRs(ownerId, subscriptionId),
      ).rejects.toThrowError();
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.findLastVersionByModelId).toHaveBeenCalledWith([
        subscriptionId,
      ]);
    });
  });

  describe("upsertManageSubscriptionAuthorizedCIDRs", () => {
    it.each`
      scenario                                                              | getUserSubscriptionsMockResult  | expectedErrorMessage                       | toNotHaveBeenCalledMocks
      ${"validateSubscriptionOwnership fails to retrieve the subscription"} | ${TE.left({ statusCode: 500 })} | ${"Error retrieving user's subscriptions"} | ${[mocks.upsert]}
      ${"user doesn't own the subscription"}                                | ${TE.right([])}                 | ${"The user doesn't own the subscription"} | ${[mocks.upsert]}
    `(
      "should throw an error when $scenario",
      validateSubscriptionOwnershipTestFn(
        upsertManageSubscriptionAuthorizedCIDRs,
        [Array.from(mocks.cidrs)],
      ),
    );

    it("should return 500 when an error is returned from cosmos", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.upsert.mockReturnValueOnce(
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: {
            code: 500,
            body: {
              code: "Error",
              message: "Cosmos error",
            },
          },
        }),
      );

      // when and then
      await expect(
        upsertManageSubscriptionAuthorizedCIDRs(
          ownerId,
          subscriptionId,
          Array.from(mocks.cidrs),
        ),
      ).rejects.toThrowError();
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.upsert).toHaveBeenCalledWith({
        cidrs: mocks.cidrs,
        kind: "INewSubscriptionCIDRs",
        subscriptionId: subscriptionId,
      });
    });

    it("should return 200 when authorized cidrs are updated correctly", async () => {
      // given
      const subscriptionId = mocks.aSubscriptionId;
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.upsert.mockImplementationOnce((request) =>
        TE.right({
          cidrs: request.cidrs.values(),
        }),
      );

      // when
      const result = await upsertManageSubscriptionAuthorizedCIDRs(
        ownerId,
        subscriptionId,
        Array.from(mocks.cidrs),
      );

      // then
      validateSubscriptionOwnershipExpectation(ownerId, subscriptionId);
      expect(mocks.upsert).toHaveBeenCalledWith({
        cidrs: mocks.cidrs,
        kind: "INewSubscriptionCIDRs",
        subscriptionId: mocks.aSubscriptionId,
      });
      expect(result).toStrictEqual(Array.from(mocks.cidrs));
    });
  });
});
