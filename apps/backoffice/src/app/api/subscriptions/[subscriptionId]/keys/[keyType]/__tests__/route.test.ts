import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUserEnriched } from "../../../../../../../lib/be/wrappers";
import { PUT } from "../route";

const backofficeUserMock = {
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUserEnriched;

const mock: {
  regenerateManageSubscriptionKeyHandler: Mock;
  withJWTAuthHandler: Mock;
} = vi.hoisted(() => ({
  regenerateManageSubscriptionKeyHandler: vi.fn(),
  withJWTAuthHandler: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { backofficeUser: BackOfficeUserEnriched; params: any },
      ) => Promise<NextResponse> | Promise<Response>,
    ) =>
      async (nextRequest: NextRequest, { params }: { params: {} }) =>
        handler(nextRequest, {
          backofficeUser: backofficeUserMock,
          params,
        }),
  ),
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mock.withJWTAuthHandler,
}));

vi.mock("../handler", () => ({
  regenerateManageSubscriptionKeyHandler:
    mock.regenerateManageSubscriptionKeyHandler,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API key API route handlers", () => {
  expect(mock.withJWTAuthHandler).toHaveBeenCalledOnce();
  expect(mock.withJWTAuthHandler).toHaveBeenCalledWith(
    mock.regenerateManageSubscriptionKeyHandler,
  );
  describe("PUT", () => {
    it("should call the generic handler", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "aSubscriptionId";
      const expectedResponse = NextResponse.json({
        primary_key: "aPrimaryKey",
        secondary_key: "aSecondaryKey",
      });
      mock.regenerateManageSubscriptionKeyHandler.mockResolvedValueOnce(
        expectedResponse,
      );

      // when
      const result = await PUT(nextRequest, {
        params: { subscriptionId },
      });

      // then
      expect(result).toBe(expectedResponse);
    });
  });
});
