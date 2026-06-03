import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import { BackOfficeUserEnriched } from "../../../../../../lib/be/wrappers";
import { GET } from "../route";

const backofficeUserMock = {
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUserEnriched;

const mock: {
  getManageSubscriptionKeysHandler: Mock;
  withJWTAuthHandler: Mock;
} = vi.hoisted(() => ({
  getManageSubscriptionKeysHandler: vi.fn(),
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
  getManageSubscriptionKeysHandler: mock.getManageSubscriptionKeysHandler,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Subscription Keys API route handlers", () => {
  expect(mock.withJWTAuthHandler).toHaveBeenCalledOnce();
  expect(mock.withJWTAuthHandler).toHaveBeenCalledWith(
    mock.getManageSubscriptionKeysHandler,
  );
  describe("GET", () => {
    it("should call the generic handler", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "aSubscriptionId";
      const expectedResponse = NextResponse.json({
        primary_key: "aPrimaryKey",
        secondary_key: "aSecondaryKey",
      });
      mock.getManageSubscriptionKeysHandler.mockResolvedValueOnce(
        expectedResponse,
      );

      // when
      const result = await GET(nextRequest, {
        params: { subscriptionId },
      });

      // then
      expect(result).toBe(expectedResponse);
    });
  });
});
