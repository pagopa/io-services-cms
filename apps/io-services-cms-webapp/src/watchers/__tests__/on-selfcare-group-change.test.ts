import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupChangeEvent } from "../../utils/sync-group-utils";
import { makeHandler } from "../on-selfcare-group-change";

const mocks = vi.hoisted(() => ({
  syncSubscription: vi.fn(),
  syncServices: vi.fn(),
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
    apimService: {},
    serviceLifecycleStore: {},
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
    expect(mocks.syncSubscription).toHaveBeenCalledWith(deps.apimService);
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
    expect(mocks.syncSubscription).toHaveBeenCalledWith(deps.apimService);
    expect(mocks.syncServices).toHaveBeenCalledOnce();
    expect(mocks.syncServices).toHaveBeenCalledWith(deps.serviceLifecycleStore);
  });

  it("should complete successfully when the productId is equal to prod-io", async () => {
    // given
    const item = { productId: "prod-io" } as GroupChangeEvent;
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
    expect(mocks.syncSubscription).toHaveBeenCalledWith(deps.apimService);
    expect(mocks.syncServices).toHaveBeenCalledOnce();
    expect(mocks.syncServices).toHaveBeenCalledWith(deps.serviceLifecycleStore);
  });
});
