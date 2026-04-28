import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupChangeEvent } from "../../utils/selfcare-group-change";
import { makeHandler } from "../on-selfcare-group-change";

const mocks = vi.hoisted(() => ({
  handleGroupChangeEvent: vi.fn(),
}));

vi.mock("../../utils/selfcare-group-change", () => ({
  handleGroupChangeEvent: mocks.handleGroupChangeEvent,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("makeOnSelfcareGroupChangeHandler", () => {
  const deps = {
    apimService: {},
    serviceLifecycleStore: {},
  } as unknown as Parameters<typeof makeHandler>[0];

  it("should complete successfully", async () => {
    // given
    const item = {
      id: "group-id",
      institutionId: "institution-id",
      name: "group-name",
      productId: "product-io",
      status: "ACTIVE",
    } as GroupChangeEvent;
    mocks.handleGroupChangeEvent.mockReturnValueOnce(() => TE.right(void 0));

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.handleGroupChangeEvent).toHaveBeenCalledExactlyOnceWith(deps);
  });

  it("should fail when handleGroupChangeEvent fails", async () => {
    // given
    const item = {
      id: "group-id",
      institutionId: "institution-id",
      name: "group-name",
      productId: "product-io",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const error = new Error("error from handleGroupChangeEvent");
    mocks.handleGroupChangeEvent.mockReturnValueOnce(() => TE.left(error));

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(mocks.handleGroupChangeEvent).toHaveBeenCalledExactlyOnceWith(deps);
  });
});
