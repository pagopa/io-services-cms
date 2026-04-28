import { ApimUtils } from "@io-services-cms/external-clients";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupChangeEvent, syncSubscription } from "..";
import * as utils from "../utils";

const mocks = vi.hoisted(() => ({
  ApimService: {},
  getSubscription: vi.fn(),
  updateSubscription: vi.fn(),
}));

vi.mock("../utils", async () => {
  const actual = await vi.importActual<typeof import("../utils")>("../utils");

  return {
    ...actual,
    getSubscription: mocks.getSubscription,
    updateSubscription: mocks.updateSubscription,
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.getSubscription.mockReset();
  mocks.updateSubscription.mockReset();
});

describe("syncSubscription", () => {
  const deps = {
    apimService: mocks.ApimService as unknown as ApimUtils.ApimService,
  };

  it("should return Left when getSubscription fails", async () => {
    // given
    const item = {
      productId: "prod-io",
      id: "groupId",
      name: "name",
      institutionId: "institutionId",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const expectedError = new Error("my error");
    const mockedGetSubscriptionTask = vi
      .fn()
      .mockReturnValueOnce(TE.left(expectedError));
    mocks.getSubscription.mockReturnValueOnce(mockedGetSubscriptionTask);

    // when
    const result = await syncSubscription(deps.apimService)(item)();

    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(expectedError);
    }
    expect(mocks.getSubscription).toHaveBeenCalledExactlyOnceWith(deps.apimService);
    expect(mockedGetSubscriptionTask).toHaveBeenCalledExactlyOnceWith(
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
    );
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });

  it("should complete successfully when getSubscription returns none", async () => {
    // given
    const item = {
      productId: "prod-io",
      id: "groupId",
      name: "name",
      institutionId: "institutionId",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const mockedGetSubscriptionTask = vi
      .fn()
      .mockReturnValueOnce(TE.right(O.none));
    mocks.getSubscription.mockReturnValueOnce(mockedGetSubscriptionTask);

    // when
    const result = await syncSubscription(deps.apimService)(item)();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.getSubscription).toHaveBeenCalledExactlyOnceWith(deps.apimService);
    expect(mockedGetSubscriptionTask).toHaveBeenCalledExactlyOnceWith(
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
    );
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });

  it.each`
    scenario                                     | itemParam                  | subscriptionParam
    ${"subscription.displayName and group.name"} | ${{ name: "foo" }}         | ${{ displayName: "bar" }}
    ${"subscription.state and group.status"}     | ${{ status: "SUSPENDED" }} | ${{ state: "active" }}
  `(
    "should return Left when there are changes between $scenario and updateSubscription fails",
    async ({ itemParam, subscriptionParam }) => {
      // given
      const item = {
        productId: "prod-io",
        id: "groupId",
        name: "name",
        institutionId: "institutionId",
        status: "ACTIVE",
        ...itemParam,
      } as GroupChangeEvent;
      const subscription = {
        displayName: "name",
        state: "active",
        ...subscriptionParam,
      };
      const expectedError = new Error("my error");
      const mockedGetSubscriptionTask = vi
        .fn()
        .mockReturnValueOnce(TE.right(O.some(subscription)));
      const mockedUpdateSubscriptionTask = vi
        .fn()
        .mockReturnValueOnce(TE.left(expectedError));
      mocks.getSubscription.mockReturnValueOnce(mockedGetSubscriptionTask);
      mocks.updateSubscription.mockReturnValueOnce(
        mockedUpdateSubscriptionTask,
      );

      // when
      const result = await syncSubscription(deps.apimService)(item)();

      // then
      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left).toStrictEqual(expectedError);
      }
      expect(mocks.getSubscription).toHaveBeenCalledExactlyOnceWith(deps.apimService);
      expect(mockedGetSubscriptionTask).toHaveBeenCalledExactlyOnceWith(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
      );
      expect(mocks.updateSubscription).toHaveBeenCalledExactlyOnceWith(
        deps.apimService,
      );
      expect(mockedUpdateSubscriptionTask).toHaveBeenCalledExactlyOnceWith(item);
    },
  );

  it("should complete successfully when there are no changes", async () => {
    // given
    const item = {
      productId: "prod-io",
      id: "groupId",
      name: "name",
      institutionId: "institutionId",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const mockedGetSubscriptionTask = vi.fn().mockReturnValueOnce(
      TE.right(
        O.some({
          displayName: item.name,
          state: "active",
        }),
      ),
    );
    mocks.getSubscription.mockReturnValueOnce(mockedGetSubscriptionTask);

    // when
    const result = await syncSubscription(deps.apimService)(item)();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.getSubscription).toHaveBeenCalledExactlyOnceWith(deps.apimService);
    expect(mockedGetSubscriptionTask).toHaveBeenCalledExactlyOnceWith(
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
    );
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });

  it("should complete successfully", async () => {
    //given
    const item = {
      productId: "prod-io",
      id: "groupId",
      name: "name",
      institutionId: "institutionId",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const mockedGetSubscriptionTask = vi.fn().mockReturnValueOnce(
      TE.right(
        O.some({
          displayName: "old-name",
          state: "active",
        }),
      ),
    );
    const mockedUpdateSubscriptionTask = vi
      .fn()
      .mockReturnValueOnce(TE.right({}));
    mocks.getSubscription.mockReturnValueOnce(mockedGetSubscriptionTask);
    mocks.updateSubscription.mockReturnValueOnce(mockedUpdateSubscriptionTask);

    // when
    const result = await syncSubscription(deps.apimService)(item)();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.getSubscription).toHaveBeenCalledExactlyOnceWith(deps.apimService);
    expect(mockedGetSubscriptionTask).toHaveBeenCalledExactlyOnceWith(
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
    );
    expect(mocks.updateSubscription).toHaveBeenCalledExactlyOnceWith(deps.apimService);
    expect(mockedUpdateSubscriptionTask).toHaveBeenCalledExactlyOnceWith(item);
  });
});
