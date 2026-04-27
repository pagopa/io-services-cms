import { ApimUtils } from "@io-services-cms/external-clients";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupChangeEvent, syncSubscription } from "..";

const mocks = vi.hoisted(() => ({
  ApimService: { getSubscription: vi.fn(), updateSubscription: vi.fn() },
  LifecycleStore: {
    executeOnServicesFilteredByGroupId: vi.fn(),
    bulkPatch: vi.fn(),
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});
describe("syncSubscription", () => {
  const deps = {
    apimService: mocks.ApimService as unknown as ApimUtils.ApimService,
  };

  it.each`
    testOutput | failureCause                           | groupId      | error                               | expectedResult
    ${"Left"}  | ${"a generic error"}                   | ${"groupId"} | ${new Error("my error")}            | ${new Error("my error")}
    ${"Left"}  | ${"an API REST error object"}          | ${"groupId"} | ${{ statusCode: 500, details: {} }} | ${new Error(`Failed to update subcription groupId, reason: {}`)}
    ${"Right"} | ${"a Not Found API REST error object"} | ${"groupId"} | ${{ statusCode: 404 }}              | ${undefined}
  `(
    "should return $testOutput when getSubscription fail with $failureCause",
    async ({ testOutput, error, groupId, expectedResult }) => {
      // given
      const item = { productId: "prod-io", id: groupId } as GroupChangeEvent;
      mocks.ApimService.getSubscription.mockReturnValueOnce(TE.left(error));

      // when
      const result = await syncSubscription(deps.apimService)(item)();

      // then
      expect(result._tag === testOutput).toBeTruthy();
      const unionRes = E.toUnion(result);
      expect(unionRes).toStrictEqual(expectedResult);
      expect(mocks.ApimService.getSubscription).toHaveBeenCalledOnce();
      expect(mocks.ApimService.getSubscription).toHaveBeenCalledWith(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
      );
      expect(mocks.ApimService.updateSubscription).not.toHaveBeenCalled();
    },
  );

  it.each`
    scenario                                     | failureCase                            | itemParam              | expSubParam                | testOutput | error                               | expectedResult
    ${"subscription.displayName and group.name"} | ${"a generic error"}                   | ${{ name: "foo" }}     | ${{ displayName: "bar" }}  | ${"Left"}  | ${new Error("my error")}            | ${new Error("my error")}
    ${"subscription.state and group.status"}     | ${"an API REST error object"}          | ${{ state: "active" }} | ${{ status: "SUSPENDED" }} | ${"Left"}  | ${{ statusCode: 500, details: {} }} | ${new Error(`Failed to update subcription groupId, reason: {}`)}
    ${"subscription.state and group.status"}     | ${"a Not Found API REST error object"} | ${{ state: "active" }} | ${{ status: "DELETED" }}   | ${"Right"} | ${{ statusCode: 404 }}              | ${undefined}
  `(
    "should fail when there are changes between $scenario and updateSubscription fails with $failureCase",
    async ({ itemParam, expSubParam, testOutput, error, expectedResult }) => {
      // given
      const item = {
        productId: "prod-io",
        id: "groupId",
        name: "name",
        status: "ACTIVE",
        ...itemParam,
      } as GroupChangeEvent;
      const expectedSubscription = {
        name: "name",
        eTag: "eTag",
        state: "active",
        ...expSubParam,
      };
      mocks.ApimService.getSubscription.mockReturnValueOnce(
        TE.right(expectedSubscription),
      );
      mocks.ApimService.updateSubscription.mockReturnValueOnce(TE.left(error));

      // when
      const result = await syncSubscription(deps.apimService)(item)();

      // then
      expect(result._tag === testOutput).toBeTruthy();
      const unionRes = E.toUnion(result);
      expect(unionRes).toStrictEqual(expectedResult);
      expect(mocks.ApimService.getSubscription).toHaveBeenCalledOnce();
      expect(mocks.ApimService.getSubscription).toHaveBeenCalledWith(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
      );
      expect(mocks.ApimService.updateSubscription).toHaveBeenCalledOnce();
      expect(mocks.ApimService.updateSubscription).toHaveBeenCalledWith(
        expectedSubscription.name,
        {
          displayName: item.name,
          state: "active",
        },
        expectedSubscription.eTag,
      );
    },
  );

  it("should complete successfully", async () => {
    //given
    const item = {
      productId: "prod-io",
      id: "groupId",
      name: "name",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const expectedSubscription = {
      name: "name",
      eTag: "eTag",
      state: "active",
    };
    mocks.ApimService.getSubscription.mockReturnValueOnce(
      TE.right(expectedSubscription),
    );
    mocks.ApimService.updateSubscription.mockReturnValueOnce(
      TE.right(expectedSubscription),
    );
    // when
    const result = await syncSubscription(deps.apimService)(item)();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.ApimService.getSubscription).toHaveBeenCalledOnce();
    expect(mocks.ApimService.getSubscription).toHaveBeenCalledWith(
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
    );
    expect(mocks.ApimService.updateSubscription).toHaveBeenCalledOnce();
    expect(mocks.ApimService.updateSubscription).toHaveBeenCalledWith(
      expectedSubscription.name,
      {
        displayName: item.name,
        state: "active",
      },
      expectedSubscription.eTag,
    );
  });
});
