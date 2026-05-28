import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { Cidr } from "../../../../../../generated/api/Cidr";
import { BackOfficeUserEnriched } from "../../../../../../lib/be/wrappers";
import { GET, PUT } from "../route";

const aBackofficeUser = {
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUserEnriched;
const anAuthrizedCIDRs = ["127.0.0.1" as Cidr];

const mock: {
  getManageSubscriptionAuthorizedCidrsHandler: Mock;
  updateManageSubscriptionAuthorizedCidrsHandler: Mock;
  withJWTAuthHandler: Mock;
} = vi.hoisted(() => ({
  getManageSubscriptionAuthorizedCidrsHandler: vi.fn(),
  updateManageSubscriptionAuthorizedCidrsHandler: vi.fn(),
  withJWTAuthHandler: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { backofficeUser: BackOfficeUserEnriched; params: any },
      ) => Promise<NextResponse> | Promise<Response>,
    ) =>
      async (nextRequest: NextRequest, { params }: { params: {} }) =>
        handler(nextRequest, {
          backofficeUser: aBackofficeUser,
          params,
        }),
  ),
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mock.withJWTAuthHandler,
}));

vi.mock("../handler", () => ({
  getManageSubscriptionAuthorizedCidrsHandler:
    mock.getManageSubscriptionAuthorizedCidrsHandler,
  updateManageSubscriptionAuthorizedCidrsHandler:
    mock.updateManageSubscriptionAuthorizedCidrsHandler,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Authorized CIDRs API route handlers", () => {
  expect(mock.withJWTAuthHandler).toHaveBeenCalledTimes(2);
  expect(mock.withJWTAuthHandler).toHaveBeenNthCalledWith(
    1,
    mock.getManageSubscriptionAuthorizedCidrsHandler,
  );
  expect(mock.withJWTAuthHandler).toHaveBeenNthCalledWith(
    2,
    mock.updateManageSubscriptionAuthorizedCidrsHandler,
  );
  describe("GET", () => {
    it("should call the generic handler", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "aSubscriptionId";
      const expectedResponse = NextResponse.json({ cidrs: anAuthrizedCIDRs });
      mock.getManageSubscriptionAuthorizedCidrsHandler.mockResolvedValueOnce(
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

  describe("PUT", () => {
    it("should call the generic handler", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "aSubscriptionId";
      const expectedResponse = NextResponse.json({ cidrs: anAuthrizedCIDRs });
      mock.updateManageSubscriptionAuthorizedCidrsHandler.mockResolvedValueOnce(
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
