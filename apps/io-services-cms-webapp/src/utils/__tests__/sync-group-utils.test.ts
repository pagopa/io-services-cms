import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncSubscription } from "../sync-group-utils";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

const mocks = vi.hoisted(() => ({
  ApimUtils: {
    ApimService: { getSubscription: vi.fn(), updateSubscription: vi.fn() },
    SUBSCRIPTION_MANAGE_GROUP_PREFIX: "FOO",
  },
  ServiceLifecycle: {
    LifecycleStore: vi.fn(),
  },
}));

vi.mock("@io-services-cms/external-clients", () => ({
  ApimUtils: mocks.ApimUtils,
}));

vi.mock("@io-services-cms/models", () => ({
  ServiceLifecycle: mocks.ServiceLifecycle,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("syncSubscription", () => {
  const deps = {
    apimService: mocks.ApimUtils.ApimService,
    serviceLifecycleStore: mocks.ServiceLifecycle.LifecycleStore,
  } as unknown as Parameters<typeof makeHandler>[0];

  it("should complete successfully but do nothing when productId is different from prod-io", async () => {
    // given
    const item = { productId: "others" } as GroupChangeEvent;

    // when
    const result = await syncSubscription(deps)({ item })();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.ApimUtils.ApimService.getSubscription).not.toHaveBeenCalled();
    expect(
      mocks.ApimUtils.ApimService.updateSubscription,
    ).not.toHaveBeenCalled();
    expect(mocks.ServiceLifecycle.LifecycleStore).not.toHaveBeenCalled();
  });

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
      mocks.ApimUtils.ApimService.getSubscription.mockReturnValueOnce(
        TE.left(error),
      );

      // when
      const result = await makeHandler(deps)({ item })();

      // then
      expect(result._tag === testOutput).toBeTruthy();
      const unionRes = E.toUnion(result);
      expect(unionRes).toStrictEqual(expectedResult);
      expect(
        mocks.ApimUtils.ApimService.getSubscription,
      ).toHaveBeenCalledOnce();
      expect(mocks.ApimUtils.ApimService.getSubscription).toHaveBeenCalledWith(
        mocks.ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
      );
      expect(
        mocks.ApimUtils.ApimService.updateSubscription,
      ).not.toHaveBeenCalled();
      expect(mocks.ServiceLifecycle.LifecycleStore).not.toHaveBeenCalled();
    },
  );

  //   it("should complete successfully but do nothing when productId is different from prod-io", async () => {
  //     // given
  //     const item = {
  //       productId: "prod-io",
  //       id: "groupId",
  //       name: "foo",
  //       status: "ACTIVE",
  //     } as GroupChangeEvent;
  //     const expectedSubscription = {
  //       name: "name",
  //       displayName: "bar",
  //       eTag: "eTag",
  //     };
  //     mocks.ApimUtils.ApimService.getSubscription.mockReturnValueOnce(
  //       TE.right(expectedSubscription),
  //     );
  //     const error = new Error("my error");
  //     mocks.ApimUtils.ApimService.updateSubscription.mockReturnValueOnce(
  //       TE.left(error),
  //     );

  //     // when
  //     const result = await makeHandler(deps)({ item })();

  //     // then
  //     expect(E.isLeft(result)).toBeTruthy();
  //     if (E.isLeft(result)) {
  //       expect(result.left).toStrictEqual(error);
  //     }
  //     expect(mocks.ApimUtils.ApimService.getSubscription).toHaveBeenCalledOnce();
  //     expect(mocks.ApimUtils.ApimService.getSubscription).toHaveBeenCalledWith(
  //       mocks.ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
  //     );
  //     expect(
  //       mocks.ApimUtils.ApimService.updateSubscription,
  //     ).toHaveBeenCalledOnce();
  //     expect(mocks.ApimUtils.ApimService.updateSubscription).toHaveBeenCalledWith(
  //       expectedSubscription.name,
  //       {
  //         displayName: item.name,
  //         state: "active",
  //       },
  //       expectedSubscription.eTag,
  //     );
  //     expect(mocks.ServiceLifecycle.LifecycleStore).not.toHaveBeenCalled();
  //   });

  it.each`
    scenario                                     | itemParam              | expSubParam
    ${"subscription.displayName and group.name"} | ${{ name: "foo" }}     | ${{ displayName: "bar" }}
    ${"subscription.state and group.status"}     | ${{ state: "active" }} | ${{ status: "SUSPENDED" }}
    ${"subscription.state and group.status"}     | ${{ state: "active" }} | ${{ status: "DELETED" }}
  `(
    "should fail when there are changes between $scenario and updateSubscription fails",
    async ({ itemParam, expSubParam }) => {
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
      mocks.ApimUtils.ApimService.getSubscription.mockReturnValueOnce(
        TE.right(expectedSubscription),
      );
      const error = new Error("my error");
      mocks.ApimUtils.ApimService.updateSubscription.mockReturnValueOnce(
        TE.left(error),
      );

      // when
      const result = await makeHandler(deps)({ item })();

      // then
      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toStrictEqual(error);
      }
      expect(
        mocks.ApimUtils.ApimService.getSubscription,
      ).toHaveBeenCalledOnce();
      expect(mocks.ApimUtils.ApimService.getSubscription).toHaveBeenCalledWith(
        mocks.ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
      );
      expect(
        mocks.ApimUtils.ApimService.updateSubscription,
      ).toHaveBeenCalledOnce();
      expect(
        mocks.ApimUtils.ApimService.updateSubscription,
      ).toHaveBeenCalledWith(
        expectedSubscription.name,
        {
          displayName: item.name,
          state: "active",
        },
        expectedSubscription.eTag,
      );
      expect(mocks.ServiceLifecycle.LifecycleStore).not.toHaveBeenCalled();
    },
  );
});
