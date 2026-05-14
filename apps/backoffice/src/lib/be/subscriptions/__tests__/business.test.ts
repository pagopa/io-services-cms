import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { Cidr } from "../../../../generated/api/Cidr";
import { SubscriptionKeyTypeEnum } from "../../../../generated/api/SubscriptionKeyType";
import {
  deleteManageSubscription,
  generateApiKeysExports,
  getManageSubscriptions,
  regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
  regenerateManageSubscriptionApiKey,
  retrieveApiKeysExports,
  retrieveInstitutionAggregateManageSubscriptionsKeys,
  retrieveManageSubscriptionApiKeys,
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscription,
  upsertManageSubscriptionAuthorizedCIDRs,
} from "../business";
import { BadRequestError, ManagedInternalError } from "../../errors";
import { FileStateEnum } from "../api-keys-exports-port";

const mocks: {
  anOwnerId: string;
  aGroup: { id: string; name: string };
  aSubscriptionContract: { name: string; displayName: string; state: string };
  upsertSubscription: Mock<any>;
  getUserSubscriptions: Mock<any>;
  deleteSubscription: Mock<any>;
  formatEmailForOrganization: Mock<any>;
  getUserByEmail: Mock<any>;
  findLastVersionByModelId: Mock<any>;
  upsert: Mock<(...args: Parameters<SubscriptionCIDRsModel["upsert"]>) => any>;
  cidrs: Set<Cidr>;
  aSubscriptionId: string;
  aPrimaryKey: string;
  aSecondaryKey: string;
  regenerateSubscriptionKey: Mock<any>;
  getInstitutionGroups: Mock<any>;
  generateDownloadUrl: Mock<any>;
  listSubscriptionSecrets: Mock<any>;
  findExportsFiles: Mock<any>;
  initializeFile: Mock<any>;
  markFileAsFailed: Mock<any>;
  finalizeFile: Mock<any>;
  getInstitutionDelegations: Mock<any>;
  randomBytes: Mock<any>;
  archiverCreate: Mock<any>;
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
  formatEmailForOrganization: vi.fn(),
  getUserByEmail: vi.fn(),
  findLastVersionByModelId: vi.fn(),
  upsert: vi.fn(),
  regenerateSubscriptionKey: vi.fn(),
  getInstitutionGroups: vi.fn(),
  generateDownloadUrl: vi.fn(),
  listSubscriptionSecrets: vi.fn(),
  findExportsFiles: vi.fn(),
  initializeFile: vi.fn(),
  markFileAsFailed: vi.fn(),
  finalizeFile: vi.fn(),
  getInstitutionDelegations: vi.fn(),
  randomBytes: vi.fn(),
  archiverCreate: vi.fn(),
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
    getUserByEmail: mocks.getUserByEmail,
  }),
}));

vi.mock("@io-services-cms/external-clients", async () => {
  const actual = await vi.importActual<
    typeof import("@io-services-cms/external-clients")
  >("@io-services-cms/external-clients");

  return {
    ...actual,
    ApimUtils: {
      ...actual.ApimUtils,
      formatEmailForOrganization: mocks.formatEmailForOrganization,
    },
  };
});

vi.mock("../../institutions/selfcare", () => ({
  getInstitutionGroups: mocks.getInstitutionGroups,
  getInstitutionDelegations: mocks.getInstitutionDelegations,
}));

vi.mock("../apim", () => ({
  listSubscriptionSecrets: mocks.listSubscriptionSecrets,
  regenerateSubscriptionKey: mocks.regenerateSubscriptionKey,
}));

vi.mock("@/lib/be/api-keys-exports-adapter", () => ({
  ApiKeysExportsAdapter: {
    getInstance: () => ({
      findExportsFiles: mocks.findExportsFiles,
      initializeFile: mocks.initializeFile,
      markFileAsFailed: mocks.markFileAsFailed,
      finalizeFile: mocks.finalizeFile,
      generateDownloadUrl: mocks.generateDownloadUrl,
      EXPORTS_API_KEYS_DURATION_IN_HOURS: 24,
    }),
  },
}));

vi.mock("crypto", () => ({
  randomBytes: (...args: any[]) => mocks.randomBytes(...args),
}));

vi.mock("archiver", () => ({
  default: {
    create: (...args: any[]) => mocks.archiverCreate(...args),
    registerFormat: vi.fn(),
  },
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
        getManageSubscriptions({
          subscriptionType,
          apimUserId: ownerId,
          limit,
          offset,
          selcSpecialGroups: [],
        }),
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
        getManageSubscriptions({
          subscriptionType,
          apimUserId: ownerId,
          limit,
          offset,
          selcSpecialGroups: [],
        }),
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
        getManageSubscriptions({
          subscriptionType,
          apimUserId: ownerId,
          limit,
          offset,
          selcGroups: [group],
          selcSpecialGroups: [],
        }),
      ).resolves.toStrictEqual([]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        `name eq 'MANAGE-GROUP-${group.id}'`,
      );
    });

    it("should return a filtered group manage special Subscriptions", async () => {
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      const group = { id: "gid1", name: "groupName", state: "ACTIVE" };
      const specialGroup = {
        id: "p1",
        name: "parentInstitutionId",
        parentInstitutionId: "p1",
      };
      const name = "name";
      const displayName = "displayName";
      const state = "suspended";
      const expectedResult = {
        name,
        displayName,
        state,
        foo: "foo",
        bar: "bar",
      };
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([expectedResult]),
      );

      await expect(
        getManageSubscriptions({
          subscriptionType,
          apimUserId: ownerId,
          limit,
          offset,
          selcGroups: [group],
          selcSpecialGroups: [specialGroup],
        }),
      ).resolves.toStrictEqual([{ id: name, name: displayName, state }]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        `name eq 'MANAGE-GROUP-${group.id}' and not(name eq 'MANAGE-GROUP-${specialGroup.parentInstitutionId}')`,
      );
    });

    it("should return a filtered group when no groups are provided", async () => {
      const ownerId = mocks.anOwnerId;
      const limit = 5;
      const offset = 0;
      const name = "name";
      const displayName = "displayName";
      const state = "suspended";
      const expectedResult = {
        name,
        displayName,
        state,
        foo: "foo",
        bar: "bar",
      };
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([expectedResult]),
      );

      await expect(
        getManageSubscriptions({
          subscriptionType,
          apimUserId: ownerId,
          limit,
          offset,
          selcGroups: [],
          selcSpecialGroups: [],
        }),
      ).resolves.toStrictEqual([{ id: name, name: displayName, state }]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        `startswith(name, 'MANAGE-GROUP-')`,
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
          getManageSubscriptions({
            subscriptionType,
            apimUserId: ownerId,
            limit,
            offset,
            selcGroups,
            selcSpecialGroups: [],
          }),
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
        getManageSubscriptions({
          subscriptionType,
          apimUserId: ownerId,
          limit,
          offset,
          selcGroups,
          selcSpecialGroups: [],
        }),
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
      expect(mocks.getInstitutionGroups).toHaveBeenCalledWith({
        institutionId: aggregateId,
        parentInstitutionId: aggregatorId,
      });
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
        expect(mocks.getInstitutionGroups).toHaveBeenCalledWith({
          institutionId: aggregateId,
          parentInstitutionId: aggregatorId,
        });
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
      expect(mocks.getInstitutionGroups).toHaveBeenCalledWith({
        institutionId: aggregateId,
        parentInstitutionId: aggregatorId,
      });
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
        expect(mocks.getInstitutionGroups).toHaveBeenCalledWith({
          institutionId: aggregateId,
          parentInstitutionId: aggregatorId,
        });
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
      expect(mocks.getInstitutionGroups).toHaveBeenCalledWith({
        institutionId: aggregateId,
        parentInstitutionId: aggregatorId,
      });
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
            aggregatorInstitutionId,
            SubscriptionKeyTypeEnum.primary,
          ),
        ).rejects.toThrowError(errorMessage);
        expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith({
          institutionId: aggregateId,
          parentInstitutionId: aggregatorInstitutionId,
        });
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
              aggregatorInstitutionId,
              SubscriptionKeyTypeEnum.primary,
            ),
          ).rejects.toThrowError("Data inconsistency");
          expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith({
            institutionId: aggregateId,
            parentInstitutionId: aggregatorInstitutionId,
          });
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
            const apimAggregateInstitutionId = "apimAggregateInstitutionId";
            const aggregatorId = "aggregatorId";
            const aggregatorInstitutionId = "aggregatorInstitutionId";
            mocks.getInstitutionGroups.mockResolvedValueOnce({
              content: [mocks.aGroup],
              totalElements: 1,
            });
            mocks.formatEmailForOrganization.mockReturnValueOnce(
              `prefix.${aggregateId}@example.org`,
            );
            mocks.getUserByEmail.mockReturnValueOnce(
              TE.right(
                O.some({
                  id:
                    "/subscriptions/subid/resourceGroups/RESOURCE_GROUP/providers/Microsoft.ApiManagement/service/APIM_SERVICE/users/" +
                    apimAggregateInstitutionId,
                }),
              ),
            );
            mocks.getUserSubscriptions.mockReturnValueOnce(
              getUserSubscriptionsMockResult,
            );

            // when and then
            await expect(
              regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
                aggregateId,
                aggregatorInstitutionId,
                SubscriptionKeyTypeEnum.primary,
              ),
            ).rejects.toThrowError(expectedErrorMessage);
            expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith({
              institutionId: aggregateId,
              parentInstitutionId: aggregatorInstitutionId,
            });
            expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
              apimAggregateInstitutionId,
              undefined,
              undefined,
              `name eq 'MANAGE-GROUP-${mocks.aGroup.id}'`,
            );

            expect(
              mocks.formatEmailForOrganization,
            ).toHaveBeenCalledExactlyOnceWith(aggregateId);
            expect(mocks.getUserByEmail).toHaveBeenCalledExactlyOnceWith(
              `prefix.${aggregateId}@example.org`,
            );
            expect(mocks.regenerateSubscriptionKey).not.toHaveBeenCalled();
          },
        );
      });
      describe("failures from call to regenerateManageSubscriptionApiKey", () => {
        it("should return an error when the subscription's secret regeneration fails", async () => {
          // given
          const aggregateId = "aggregateId";
          const apimAggregateInstitutionId = "apimAggregateInstitutionId";
          const aggregatorId = "aggregatorId";
          const aggregatorInstitutionId = "aggregatorInstitutionId";
          const errorMessage = "test error message";
          mocks.getInstitutionGroups.mockResolvedValueOnce({
            content: [mocks.aGroup],
            totalElements: 1,
          });
          mocks.formatEmailForOrganization.mockReturnValueOnce(
            `prefix.${aggregateId}@example.org`,
          );
          mocks.getUserByEmail.mockReturnValueOnce(
            TE.right(
              O.some({
                id:
                  "/subscriptions/subid/resourceGroups/RESOURCE_GROUP/providers/Microsoft.ApiManagement/service/APIM_SERVICE/users/" +
                  apimAggregateInstitutionId,
              }),
            ),
          );
          mocks.getUserSubscriptions.mockReturnValueOnce(
            TE.right([mocks.aSubscriptionContract]),
          );
          mocks.regenerateSubscriptionKey.mockRejectedValueOnce(
            new Error(errorMessage),
          );

          // when and then
          await expect(
            regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
              aggregateId,
              aggregatorInstitutionId,
              SubscriptionKeyTypeEnum.primary,
            ),
          ).rejects.toThrowError(errorMessage);
          expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith({
            institutionId: aggregateId,
            parentInstitutionId: aggregatorInstitutionId,
          });
          expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
            apimAggregateInstitutionId,
            undefined,
            undefined,
            `name eq 'MANAGE-GROUP-${mocks.aGroup.id}'`,
          );
          expect(
            mocks.formatEmailForOrganization,
          ).toHaveBeenCalledExactlyOnceWith(aggregateId);
          expect(mocks.getUserByEmail).toHaveBeenCalledExactlyOnceWith(
            `prefix.${aggregateId}@example.org`,
          );
          expect(
            mocks.regenerateSubscriptionKey,
          ).toHaveBeenCalledExactlyOnceWith(
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
          const apimAggregateInstitutionId = "apimAggregateInstitutionId";
          const aggregatorId = "aggregatorId";
          const aggregatorInstitutionId = "aggregatorInstitutionId";
          mocks.getInstitutionGroups.mockResolvedValueOnce({
            content: [mocks.aGroup],
            totalElements: 1,
          });
          mocks.formatEmailForOrganization.mockReturnValueOnce(
            `prefix.${aggregateId}@example.org`,
          );
          mocks.getUserByEmail.mockReturnValueOnce(
            TE.right(
              O.some({
                id:
                  "/subscriptions/subid/resourceGroups/RESOURCE_GROUP/providers/Microsoft.ApiManagement/service/APIM_SERVICE/users/" +
                  apimAggregateInstitutionId,
              }),
            ),
          );
          mocks.getUserSubscriptions.mockReturnValueOnce(
            TE.right([mocks.aSubscriptionContract]),
          );
          mocks.regenerateSubscriptionKey.mockResolvedValueOnce(apimResponse);

          // when and then
          await expect(
            regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
              aggregateId,
              aggregatorInstitutionId,
              SubscriptionKeyTypeEnum.primary,
            ),
          ).rejects.toThrowError("Data inconsistency");
          expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith({
            institutionId: aggregateId,
            parentInstitutionId: aggregatorInstitutionId,
          });
          expect(
            mocks.formatEmailForOrganization,
          ).toHaveBeenCalledExactlyOnceWith(aggregateId);
          mocks.getUserByEmail.mockReturnValueOnce(
            TE.right(
              O.some({
                id:
                  "/subscriptions/subid/resourceGroups/RESOURCE_GROUP/providers/Microsoft.ApiManagement/service/APIM_SERVICE/users/" +
                  apimAggregateInstitutionId,
              }),
            ),
          );
          expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
            apimAggregateInstitutionId,
            undefined,
            undefined,
            `name eq 'MANAGE-GROUP-${mocks.aGroup.id}'`,
          );
          expect(
            mocks.regenerateSubscriptionKey,
          ).toHaveBeenCalledExactlyOnceWith(
            `MANAGE-GROUP-${mocks.aGroup.id}`,
            SubscriptionKeyTypeEnum.primary,
          );
        },
      );
    });

    it("should return the regenerated subscription keys related to the group found", async () => {
      // given
      const aggregateId = "aggregateId";
      const apimAggregateInstitutionId = "apimAggregateInstitutionId";
      const aggregatorId = "aggregatorId";
      const aggregatorInstitutionId = "aggregatorInstitutionId";
      const primaryKey = `primary-key-for-${mocks.aGroup.id}`;
      const secondaryKey = `secondary-key-for-${mocks.aGroup.id}`;
      mocks.getInstitutionGroups.mockResolvedValueOnce({
        content: [mocks.aGroup],
        totalElements: 1,
      });
      mocks.formatEmailForOrganization.mockReturnValueOnce(
        `prefix.${aggregateId}@example.org`,
      );
      mocks.getUserByEmail.mockReturnValueOnce(
        TE.right(
          O.some({
            id:
              "/subscriptions/subid/resourceGroups/RESOURCE_GROUP/providers/Microsoft.ApiManagement/service/APIM_SERVICE/users/" +
              apimAggregateInstitutionId,
          }),
        ),
      );
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.regenerateSubscriptionKey.mockResolvedValueOnce({
        primaryKey,
        secondaryKey,
      });

      // when
      const result =
        await regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
          aggregateId,
          aggregatorInstitutionId,
          SubscriptionKeyTypeEnum.primary,
        );

      // then
      expect(mocks.getInstitutionGroups).toHaveBeenCalledExactlyOnceWith({
        institutionId: aggregateId,
        parentInstitutionId: aggregatorInstitutionId,
      });
      expect(mocks.formatEmailForOrganization).toHaveBeenCalledExactlyOnceWith(
        aggregateId,
      );
      expect(mocks.getUserSubscriptions).toHaveBeenCalledExactlyOnceWith(
        apimAggregateInstitutionId,
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

  describe("generateApiKeysExports", () => {
    const aggregatorId = "aggregatorId";
    const userId = "userId";
    const password = "aSecurePassword";
    const fakeFileName = "abcdef1234567890abcdef1234567890.zip";

    beforeEach(() => {
      mocks.randomBytes.mockReturnValue({
        toString: () => "abcdef1234567890abcdef1234567890",
      });
    });

    it("should throw when findExportsFiles fails", async () => {
      // given
      mocks.findExportsFiles.mockRejectedValueOnce(
        new Error("blob storage error"),
      );

      // when and then
      await expect(
        generateApiKeysExports(aggregatorId, userId, password),
      ).rejects.toThrowError("blob storage error");
      expect(mocks.findExportsFiles).toHaveBeenCalledOnce();
      expect(mocks.findExportsFiles).toHaveBeenCalledWith(
        aggregatorId,
        userId,
        "IN_PROGRESS",
      );
      expect(mocks.initializeFile).not.toHaveBeenCalled();
    });

    it("should throw PreconditionFailedError when there are already IN_PROGRESS export files", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([
        { fileName: "existing.zip", state: "IN_PROGRESS" },
      ]);

      // when and then
      await expect(
        generateApiKeysExports(aggregatorId, userId, password),
      ).rejects.toThrowError("An export file is already being generated");
      expect(mocks.findExportsFiles).toHaveBeenCalledOnce();
      expect(mocks.findExportsFiles).toHaveBeenCalledWith(
        aggregatorId,
        userId,
        "IN_PROGRESS",
      );
      expect(mocks.initializeFile).not.toHaveBeenCalled();
    });

    it("should throw when initializeFile fails", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([]);
      mocks.initializeFile.mockRejectedValueOnce(
        new Error("initialization error"),
      );

      // when and then
      await expect(
        generateApiKeysExports(aggregatorId, userId, password),
      ).rejects.toThrowError("initialization error");
      expect(mocks.findExportsFiles).toHaveBeenCalledOnce();
      expect(mocks.findExportsFiles).toHaveBeenCalledWith(
        aggregatorId,
        userId,
        "IN_PROGRESS",
      );
      expect(mocks.initializeFile).toHaveBeenCalledOnce();
      expect(mocks.initializeFile).toHaveBeenCalledWith(
        fakeFileName,
        aggregatorId,
        userId,
      );
    });

    it("should resolve when initialization succeeds and fire-and-forget inner runs in background", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([]);
      mocks.initializeFile.mockResolvedValueOnce(undefined);
      mocks.getInstitutionGroups.mockResolvedValueOnce({
        content: [],
        totalPages: 1,
      });
      mocks.getInstitutionDelegations.mockResolvedValueOnce({
        delegations: [],
        pageInfo: { totalPages: 1 },
      });
      mocks.archiverCreate.mockReturnValueOnce({
        append: vi.fn().mockReturnThis(),
        finalize: vi.fn(),
      });
      mocks.finalizeFile.mockResolvedValueOnce(undefined);

      // when
      const result = await generateApiKeysExports(
        aggregatorId,
        userId,
        password,
      );

      // then
      expect(result).toBeUndefined();
      expect(mocks.findExportsFiles).toHaveBeenCalledOnce();
      expect(mocks.findExportsFiles).toHaveBeenCalledWith(
        aggregatorId,
        userId,
        "IN_PROGRESS",
      );
      expect(mocks.initializeFile).toHaveBeenCalledOnce();
      expect(mocks.initializeFile).toHaveBeenCalledWith(
        fakeFileName,
        aggregatorId,
        userId,
      );
    });

    it("should call markFileAsFailed when inner generation rejects", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([]);
      mocks.initializeFile.mockResolvedValueOnce(undefined);
      mocks.markFileAsFailed.mockResolvedValueOnce(undefined);
      // Make inner fail by having getInstitutionGroups reject
      mocks.getInstitutionGroups.mockRejectedValueOnce(
        new Error("inner failure"),
      );

      // when
      await generateApiKeysExports(aggregatorId, userId, password);

      // wait for background promise catch handler to execute
      await new Promise((resolve) => setTimeout(resolve, 0));

      // then
      expect(mocks.markFileAsFailed).toHaveBeenCalledOnce();
      expect(mocks.markFileAsFailed).toHaveBeenCalledWith(
        fakeFileName,
        aggregatorId,
        userId,
      );
    });
  });

  describe("retrieveApiKeysExports", () => {
    const aggregatorId = "aggregatorId";
    const userId = "userId";
    const creationDate = new Date(2026, 0, 1);
    const lastModifiedDate = new Date(2026, 0, 2);
    const aSuccessFileName = "file_success.zip";
    const aFailedFileName = "file_failed.zip";
    const anInProgressFileName = "file_wip.zip";
    const anInProgressExport = {
      creationDate,
      lastModifiedDate: creationDate,
      state: FileStateEnum.IN_PROGRESS,
      fileName: anInProgressFileName,
    };

    const aFailedExport = {
      creationDate,
      lastModifiedDate,
      state: FileStateEnum.FAILED,
      fileName: aFailedFileName,
    };

    const aDoneExport = {
      creationDate,
      lastModifiedDate,
      state: FileStateEnum.DONE,
      fileName: aSuccessFileName,
    };
    const anUrl = new URL("https://localhost");

    beforeEach(() => {
      vi.useFakeTimers({ now: lastModifiedDate.getTime() + 5000 });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should retrieve api keys exports", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([aDoneExport]);
      mocks.generateDownloadUrl.mockResolvedValueOnce(anUrl);
      const expirationDate = new Date(
        lastModifiedDate.getTime() + 24 * 60 * 60 * 1000,
      );

      // when
      const result = await retrieveApiKeysExports(aggregatorId, userId);

      // then
      expect(result).toEqual({
        downloadLink: anUrl.href,
        expirationDate: expirationDate.toISOString(),
        state: FileStateEnum.DONE,
      });
      expect(mocks.findExportsFiles).toHaveBeenCalledExactlyOnceWith(
        aggregatorId,
        userId,
      );
      expect(mocks.generateDownloadUrl).toHaveBeenCalledExactlyOnceWith(
        aSuccessFileName,
        expirationDate,
      );
    });

    it("should retrieve most recent api keys exports", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([
        aDoneExport,
        // failed export 5 minutes before
        {
          ...aFailedExport,
          lastModifiedDate: new Date(lastModifiedDate.getTime() - 300 * 1000),
        },
      ]);
      mocks.generateDownloadUrl.mockResolvedValueOnce(anUrl);
      const expirationDate = new Date(
        lastModifiedDate.getTime() + 24 * 60 * 60 * 1000,
      );

      // when
      const result = await retrieveApiKeysExports(aggregatorId, userId);

      // then
      expect(result).toEqual({
        downloadLink: anUrl.href,
        expirationDate: expirationDate.toISOString(),
        state: FileStateEnum.DONE,
      });
      expect(mocks.findExportsFiles).toHaveBeenCalledExactlyOnceWith(
        aggregatorId,
        userId,
      );
      expect(mocks.generateDownloadUrl).toHaveBeenCalledExactlyOnceWith(
        aSuccessFileName,
        expirationDate,
      );
    });

    it("should throw BadRequestError on 0 exports", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([]);

      // when & then
      await expect(
        retrieveApiKeysExports(aggregatorId, userId),
      ).rejects.toThrowError(BadRequestError);
    });

    it("should throw ManagedInternalError when findExportsFiles rejects", async () => {
      // given
      mocks.findExportsFiles.mockRejectedValueOnce(new Error("storage error"));

      // when & then
      await expect(
        retrieveApiKeysExports(aggregatorId, userId),
      ).rejects.toThrowError(ManagedInternalError);
    });

    it("should return IN_PROGRESS state when most recent export is in progress", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([anInProgressExport]);

      // when
      const result = await retrieveApiKeysExports(aggregatorId, userId);

      // then
      expect(result).toEqual({ state: FileStateEnum.IN_PROGRESS });
      expect(mocks.generateDownloadUrl).not.toHaveBeenCalled();
    });

    it("should return FAILED state when most recent export is failed", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([aFailedExport]);

      // when
      const result = await retrieveApiKeysExports(aggregatorId, userId);

      // then
      expect(result).toEqual({ state: FileStateEnum.FAILED });
      expect(mocks.generateDownloadUrl).not.toHaveBeenCalled();
    });

    it("should throw ManagedInternalError when DONE export TTL has expired", async () => {
      // set current time after a 24h expiration window
      vi.setSystemTime(lastModifiedDate.getTime() + 25 * 60 * 60 * 1000);
      mocks.findExportsFiles.mockResolvedValueOnce([aDoneExport]);

      // when & then
      await expect(
        retrieveApiKeysExports(aggregatorId, userId),
      ).rejects.toThrowError(ManagedInternalError);
      expect(mocks.generateDownloadUrl).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should throw ManagedInternalError when generateDownloadUrl rejects", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([aDoneExport]);
      mocks.generateDownloadUrl.mockRejectedValueOnce(
        new Error("download url error"),
      );

      // when & then
      await expect(
        retrieveApiKeysExports(aggregatorId, userId),
      ).rejects.toThrowError(ManagedInternalError);
    });

    it("should throw ManagedInternalError when generateDownloadUrl rejects", async () => {
      // given
      mocks.findExportsFiles.mockResolvedValueOnce([
        {
          ...aDoneExport,
          state: "UNKNOWN",
        },
      ]);

      // when & then
      await expect(
        retrieveApiKeysExports(aggregatorId, userId),
      ).rejects.toThrowError(ManagedInternalError);
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
