import { afterEach, describe, expect, it, vi } from "vitest";
import { upsertManageSubscription } from "../business";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { InstitutionNotFoundError, ManagedInternalError } from "../../errors";

const { upsertSubscription } = vi.hoisted(() => ({
  upsertSubscription: vi.fn(),
}));

vi.mock("../../apim-service", () => ({
  upsertSubscription,
}));

const mocks = {
  anOwnerId: "anOwnerId",
  aGroupId: "aGroupId",
  upsertSubscription,
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
      const ownerId = mocks.anOwnerId;
      mocks.upsertSubscription.mockReturnValueOnce(
        TE.right({ id: "id", name: "name", foo: "foo", bar: "bar" }),
      );

      await expect(
        upsertManageSubscription(ownerId, groupId),
      ).resolves.toStrictEqual({ id: "id", name: "name" });

      const params = groupId ? [subType, ownerId, groupId] : [subType, ownerId];
      expect(mocks.upsertSubscription).toHaveBeenCalledOnce();
      expect(mocks.upsertSubscription).toHaveBeenCalledWith(...params);
    },
  );
});
