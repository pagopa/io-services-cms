import { beforeEach, describe, expect, it, Mock, Mocked, vi } from "vitest";
import { ApimUtils } from "@io-services-cms/external-clients";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import { mapStateFromGroupToSubscription, getSubscription } from "../utils";

const mocks = vi.hoisted(() => ({
  ApimService: {
    getSubscription: vi.fn(),
    updateSubscription: vi.fn(),
  } as unknown as Mocked<ApimUtils.ApimService>,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getSubscription", () => {
  const expectedSubscription = {
    name: "name",
    eTag: "eTag",
    state: "active" as const,
  };

  it("should return the subscription when found", async () => {
    const subscriptionName = "sub1";
    mocks.ApimService.getSubscription.mockReturnValue(
      TE.right(expectedSubscription),
    );

    const result = await getSubscription(mocks.ApimService)(subscriptionName)();
    expect(result).toEqual(E.right(O.some(expectedSubscription)));
  });

  it("should return none when subscription is not found", async () => {
    const subscriptionName = "sub2";
    const error = {
      statusCode: 404,
      message: "Not found",
    } as ApimUtils.ApimRestError;
    mocks.ApimService.getSubscription.mockReturnValue(TE.left(error));

    const result = await getSubscription(mocks.ApimService)(subscriptionName)();
    expect(result).toEqual(E.right(O.none));
  });

  it("should return an error for other failures", async () => {
    const subscriptionName = "sub3";
    const error = {
      statusCode: 500,
      message: "Internal Server Error",
    } as ApimUtils.ApimRestError;
    mocks.ApimService.getSubscription.mockReturnValue(TE.left(error));

    const result = await getSubscription(mocks.ApimService)(subscriptionName)();
    expect(result).toEqual(
      E.left(
        new Error(`Failed to get subscription ${subscriptionName}, reason: ${JSON.stringify(error)}`),
      ),
    );
  });
});

describe("mapStateFromGroupToSubscription", () => {
  it.each`
    status         | expectedState
    ${"ACTIVE"}    | ${"active"}
    ${"SUSPENDED"} | ${"suspended"}
    ${"DELETED"}   | ${"cancelled"}
  `("should map $status to $expectedState", ({ status, expectedState }) => {
    expect(mapStateFromGroupToSubscription(status)).toBe(expectedState);
  });

  it("should throw an error for invalid status", () => {
    expect(() =>
      mapStateFromGroupToSubscription("INVALID_STATUS" as any),
    ).toThrow("Invalid status");
  });
});
