import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeHandler } from "../on-selfcare-group-change";
import {
  GroupChangeEvent,
  syncServices,
  syncSubscription,
} from "../../utils/sync-group-utils";
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
  syncSubscription: vi.fn(),
  syncServices: vi.fn(),
}));

vi.mock("@io-services-cms/external-clients", () => ({
  ApimUtils: mocks.ApimUtils,
}));

vi.mock("@io-services-cms/models", () => ({
  ServiceLifecycle: mocks.ServiceLifecycle,
}));

vi.mock("../../utils/sync-group-utils", () => ({
  syncSubscription: mocks.syncSubscription,
  syncServices: mocks.syncServices,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("makeOnSelfcareGroupChangeHandler", () => {
  const deps = {
    apimService: mocks.ApimUtils.ApimService,
    serviceLifecycleStore: mocks.ServiceLifecycle.LifecycleStore,
  } as unknown as Parameters<typeof makeHandler>[0];

  it("should complete successfully but do nothing when productId is different from prod-io", async () => {
    // given
    const item = { productId: "others" } as GroupChangeEvent;

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.syncSubscription).not.toHaveBeenCalled();
    expect(mocks.syncServices).not.toHaveBeenCalled();
    expect(mocks.ServiceLifecycle.LifecycleStore).not.toHaveBeenCalled();
  });

  it("should fail when the productId is equal to prod-io and syncSubscription fails", async () => {
    // given
    const item = { productId: "prod-io" } as GroupChangeEvent;
    const error = new Error("error from syncSubscription");
    mocks.syncSubscription.mockReturnValueOnce(() => TE.left(error));

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(mocks.syncSubscription).toHaveBeenCalledOnce();
    expect(mocks.syncSubscription).toHaveBeenCalledWith(
      mocks.ApimUtils.ApimService,
    );
    expect(mocks.syncServices).not.toHaveBeenCalled();
  });

  it("should fail when the productId is equal to prod-io and syncServices fails", async () => {
    // given
    const item = { productId: "prod-io" } as GroupChangeEvent;
    const error = new Error("error from syncServices");
    mocks.syncSubscription.mockReturnValueOnce(() => TE.right(void 0));
    mocks.syncServices.mockReturnValueOnce(() => TE.left(error));

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(mocks.syncSubscription).toHaveBeenCalledOnce();
    expect(mocks.syncSubscription).toHaveBeenCalledWith(
      mocks.ApimUtils.ApimService,
    );
    expect(mocks.syncServices).toHaveBeenCalledOnce();
    expect(mocks.syncServices).toHaveBeenCalledWith(
      mocks.ServiceLifecycle.LifecycleStore,
    );
  });

  it("should complete successfully when the productId is equal to prod-io", async () => {
    // given
    const item = { productId: "prod-io" } as GroupChangeEvent;
    const error = new Error("error from syncServices");
    mocks.syncSubscription.mockReturnValueOnce(() => TE.right(void 0));
    mocks.syncServices.mockReturnValueOnce(() => TE.right(void 0));

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.syncSubscription).toHaveBeenCalledOnce();
    expect(mocks.syncSubscription).toHaveBeenCalledWith(
      mocks.ApimUtils.ApimService,
    );
    expect(mocks.syncServices).toHaveBeenCalledOnce();
    expect(mocks.syncServices).toHaveBeenCalledWith(
      mocks.ServiceLifecycle.LifecycleStore,
    );
  });
});
