import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getManageSubscriptions, upsertManageSubscription } from "../business";

const { upsertSubscription, getUserSubscriptions } = vi.hoisted(() => ({
  upsertSubscription: vi.fn(),
  getUserSubscriptions: vi.fn(),
}));

vi.mock("../../apim-service", () => ({
  upsertSubscription,
  getApimService: () => ({
    getUserSubscriptions,
  }),
}));

const mocks = {
  anOwnerId: "anOwnerId",
  aGroupId: "aGroupId",
  upsertSubscription,
  getUserSubscriptions,
};

afterEach(() => {
  vi.clearAllMocks();
});

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
      expect(mocks.upsertSubscription).toHaveBeenCalledWith("MANAGE", ownerId);
    },
  );

  it.each`
    subType           | groupId
    ${"MANAGE"}       | ${undefined}
    ${"MANAGE_GROUP"} | ${mocks.aGroupId}
  `(
    "should return the new $subType Subscription",
    async ({ subType, groupId }) => {
      const id = "id";
      const ownerId = mocks.anOwnerId;
      mocks.upsertSubscription.mockReturnValueOnce(
        TE.right({
          id: `/full/path/${id}`,
          name: "name",
          foo: "foo",
          bar: "bar",
        }),
      );

      await expect(
        upsertManageSubscription(ownerId, groupId),
      ).resolves.toStrictEqual({ id, name: "name" });

      const params = groupId ? [subType, ownerId, groupId] : [subType, ownerId];
      expect(mocks.upsertSubscription).toHaveBeenCalledOnce();
      expect(mocks.upsertSubscription).toHaveBeenCalledWith(...params);
    },
  );
});

describe("getManageSubscriptions", () => {
  it("should throw an error when received an ApimRestError response", async () => {
    const ownerId = mocks.anOwnerId;
    const limit = 5;
    const offset = 0;
    mocks.getUserSubscriptions.mockReturnValueOnce(
      TE.left({ statusCode: 500 }),
    );

    await expect(() =>
      getManageSubscriptions(ownerId, limit, offset),
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
    const ownerId = mocks.anOwnerId;
    const limit = 5;
    const offset = 0;
    mocks.getUserSubscriptions.mockReturnValueOnce(
      TE.right([
        {
          name,
          displayName,
          foo: "foo",
          bar: "bar",
        },
      ]),
    );

    await expect(
      getManageSubscriptions(ownerId, limit, offset),
    ).resolves.toStrictEqual([{ id: name, name: displayName }]);

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
      getManageSubscriptions(ownerId, limit, offset, [groupId]),
    ).resolves.toStrictEqual([]);

    expect(mocks.getUserSubscriptions).toHaveBeenCalledOnce();
    expect(mocks.getUserSubscriptions).toHaveBeenCalledWith(
      ownerId,
      offset,
      limit,
      `name eq 'MANAGE-GROUP-${groupId}'`,
    );
  });
});
