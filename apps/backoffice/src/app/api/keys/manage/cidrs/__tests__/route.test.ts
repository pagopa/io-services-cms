import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { Cidr } from "../../../../../../generated/api/Cidr";
import { GET, PUT } from "../route";

const mocks: {
  authrizedCIDRs: Cidr[];
  jwtMock: BackOfficeUser;
} = vi.hoisted(() => ({
  authrizedCIDRs: ["127.0.0.1" as Cidr],
  jwtMock: ({
    institution: { role: "admin", id: "institutionId" },
    permissions: ["permission1", "permission2"],
    parameters: {
      userEmail: "anEmail@email.it",
      userId: "anUserId",
      subscriptionId: "aSubscriptionId"
    }
  } as unknown) as BackOfficeUser
}));

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    GROUP_AUTHZ_ENABLED: "true"
  };
});

const {
  getToken,
  getManageSubscriptionAuthorizedCidrsHandlerMock,
  updateManageSubscriptionAuthorizedCidrsHandlerMock
} = vi.hoisted(() => ({
  getToken: vi.fn(() => Promise.resolve(mocks.jwtMock)),
  getManageSubscriptionAuthorizedCidrsHandlerMock: vi.fn(),
  updateManageSubscriptionAuthorizedCidrsHandlerMock: vi.fn()
}));

vi.mock("@/app/api/subscriptions/[subscriptionId]/cidrs/handler", () => ({
  getManageSubscriptionAuthorizedCidrsHandler: getManageSubscriptionAuthorizedCidrsHandlerMock,
  updateManageSubscriptionAuthorizedCidrsHandler: updateManageSubscriptionAuthorizedCidrsHandlerMock
}));

vi.mock("next-auth/jwt", async () => {
  const actual = await vi.importActual("next-auth/jwt");
  return {
    ...(actual as any),
    getToken
  };
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("Authorized CIDRs API", () => {
  describe("getManageKeysAuthorizedCidrs", () => {
    it("should forward request", async () => {
      // given
      getManageSubscriptionAuthorizedCidrsHandlerMock.mockResolvedValueOnce(
        NextResponse.json({ cidrs: mocks.authrizedCIDRs }, { status: 200 })
      );
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await GET(request, {});

      // then
      expect(result.status).toBe(200);
      const jsonResponse = await new Response(result.body).json();
      expect(jsonResponse).toEqual({ cidrs: mocks.authrizedCIDRs });
      expect(
        getManageSubscriptionAuthorizedCidrsHandlerMock
      ).toHaveBeenCalledOnce();
      expect(
        getManageSubscriptionAuthorizedCidrsHandlerMock
      ).toHaveBeenCalledWith(request, {
        backofficeUser: expect.anything(), // FIXME: we can be more specific here
        params: { subscriptionId: mocks.jwtMock.parameters.subscriptionId }
      });
    });
  });

  describe("updateManageKeysAuthorizedCidrs", () => {
    it("should forward request", async () => {
      // given
      updateManageSubscriptionAuthorizedCidrsHandlerMock.mockResolvedValueOnce(
        NextResponse.json({ cidrs: mocks.authrizedCIDRs }, { status: 200 })
      );
      const request = new NextRequest(new URL("http://localhost"), {
        method: "PUT",
        body: JSON.stringify({ cidrs: mocks.authrizedCIDRs })
      });

      // when
      const result = await PUT(request, {});

      // then
      expect(result.status).toBe(200);
      const jsonResponse = await new Response(result.body).json();
      expect(jsonResponse).toEqual({ cidrs: mocks.authrizedCIDRs });
      expect(
        updateManageSubscriptionAuthorizedCidrsHandlerMock
      ).toHaveBeenCalledOnce();
      expect(
        updateManageSubscriptionAuthorizedCidrsHandlerMock
      ).toHaveBeenCalledWith(request, {
        backofficeUser: expect.anything(), // FIXME: we can be more specific here
        params: { subscriptionId: mocks.jwtMock.parameters.subscriptionId }
      });
    });
  });
});
