import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getManageSubscriptions,
  upsertManageSubscription,
  deleteManageSubscription,
} from "../business";

const { upsertSubscription, getUserSubscriptions, deleteSubscription } =
  vi.hoisted(() => ({
    upsertSubscription: vi.fn(),
    getUserSubscriptions: vi.fn(),
    deleteSubscription: vi.fn(),
  }));

vi.mock("../../apim-service", () => ({
  upsertSubscription,
  getApimService: () => ({
    getUserSubscriptions,
    deleteSubscription,
  }),
}));

const mocks = {
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
  upsertSubscription,
  getUserSubscriptions,
  deleteSubscription,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Subscriptions Business Logic", () => {
  describe("upsertManageSubscription", () => {
    it.each`
      scenario              | upsertSubResult                                | excpectedErrorMessage
      ${"an ApimRestError"} | ${TE.left({ statusCode: 500 })}                | ${"Error creating subscription"}
      ${"a generic Error"}  | ${TE.left(new Error("generic error message"))} | ${"Error creating subscription"}
      ${"an invalid"}       | ${TE.right({ id: undefined, name: "name" })}   | ${"Partial data received"}
      ${"an invalid"}       | ${TE.right({ id: "id", name: undefined })}     | ${"Partial data received"}
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
      const groupId = "gid1";
      mocks.getUserSubscriptions.mockReturnValueOnce(TE.right([]));

      await expect(
        getManageSubscriptions(subscriptionType, ownerId, limit, offset, [
          groupId,
        ]),
      ).resolves.toStrictEqual([]);

      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        offset,
        limit,
        `name eq 'MANAGE-GROUP-${groupId}'`,
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
    it("should throw an error when the getUserSubscriptions fails", async () => {
      //given
      const subscriptionId = "subscriptionId";
      const ownerId = mocks.anOwnerId;
      const errorMessage = "Error retrieving user's subscriptions";
      const filter = `name eq '${subscriptionId}'`;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.left({ statusCode: 500 }),
      );

      //when and then
      await expect(
        deleteManageSubscription(ownerId, { subscriptionId }),
      ).rejects.toThrowError(errorMessage);
      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        undefined,
        undefined,
        filter,
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
        deleteManageSubscription(ownerId, { subscriptionId }),
      ).rejects.toThrowError(errorMessage);
      expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
        ownerId,
        undefined,
        undefined,
        filter,
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
          TE.right([mocks.aSubscriptionContract]),
        );
        mocks.deleteSubscription.mockReturnValueOnce(deleteSubscriptionResult);

        //when and then
        await expect(
          deleteManageSubscription(ownerId, { subscriptionId }),
        ).rejects.toThrowError(expectedErrorMessage);
        expect(mocks.deleteSubscription).toHaveBeenCalledOnce();
        expect(mocks.deleteSubscription).toHaveBeenCalledWith(subscriptionId);
      },
    );

    it("should success when the delete subscription success", async () => {
      //given
      const subscriptionId = "subscriptionId";
      const ownerId = mocks.anOwnerId;
      mocks.getUserSubscriptions.mockReturnValueOnce(
        TE.right([mocks.aSubscriptionContract]),
      );
      mocks.deleteSubscription.mockReturnValueOnce(TE.right(void 0));

      //when and then
      await expect(
        deleteManageSubscription(ownerId, { subscriptionId }),
      ).resolves.toBe(undefined);
      expect(mocks.deleteSubscription).toHaveBeenCalledOnce();
      expect(mocks.deleteSubscription).toHaveBeenCalledWith(subscriptionId);
    });
  });
});
