import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { Cidr } from "../../../../../../generated/api/Cidr";
import { GET, PUT } from "../route";

const mocks: {
  authrizedCIDRs: Cidr[];
  jwtMock: BackOfficeUser;
} = vi.hoisted(() => ({
  authrizedCIDRs: ["127.0.0.1" as Cidr],
  jwtMock: ({
    permissions: ["permission1", "permission2"],
    parameters: {
      userEmail: "anEmail@email.it",
      userId: "anUserId",
      subscriptionId: "aSubscriptionId"
    }
  } as unknown) as BackOfficeUser
}));

const { getToken } = vi.hoisted(() => ({
  getToken: vi.fn().mockReturnValue(Promise.resolve(mocks.jwtMock))
}));

const {
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs
} = vi.hoisted(() => ({
  retrieveManageSubscriptionAuthorizedCIDRs: vi
    .fn()
    .mockReturnValue(Promise.resolve(mocks.authrizedCIDRs)),
  upsertManageSubscriptionAuthorizedCIDRs: vi
    .fn()
    .mockReturnValue(Promise.resolve(mocks.authrizedCIDRs))
}));

vi.mock("@/lib/be/keys/business", () => ({
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs
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
  vi.restoreAllMocks();
});

describe("Authorized CIDRs API", () => {
  describe("Retrieve", () => {
    it("should return 200", async () => {
      retrieveManageSubscriptionAuthorizedCIDRs.mockReturnValueOnce(
        Promise.resolve(mocks.authrizedCIDRs)
      );
      getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      const result = await GET(request, {});

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(result.status).toBe(200);
      expect(jsonResponse.cidrs).toEqual(mocks.authrizedCIDRs);
    });

    it("should return 500", async () => {
      retrieveManageSubscriptionAuthorizedCIDRs.mockRejectedValueOnce(
        "an error"
      );
      getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      const result = await GET(request, {});

      expect(result.status).toBe(500);
    });
  });

  describe("Update", () => {
    it("should return 200", async () => {
      upsertManageSubscriptionAuthorizedCIDRs.mockReturnValueOnce(
        Promise.resolve(mocks.authrizedCIDRs)
      );
      getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "PUT",
        body: JSON.stringify({ cidrs: mocks.authrizedCIDRs })
      });

      const result = await PUT(request, {});

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(result.status).toBe(200);
      expect(jsonResponse.cidrs).toEqual(mocks.authrizedCIDRs);
    });

    it("should return 400", async () => {
      upsertManageSubscriptionAuthorizedCIDRs.mockReturnValueOnce(
        Promise.resolve(mocks.authrizedCIDRs)
      );
      getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "PUT",
        body: JSON.stringify({ aNotValidProp: "aNotValidProp" })
      });

      const result = await PUT(request, {});

      expect(result.status).toBe(400);
    });

    //mockRejectedValueOnce

    it("should return 500", async () => {
      upsertManageSubscriptionAuthorizedCIDRs.mockRejectedValueOnce("error");
      getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "PUT",
        body: JSON.stringify({ cidrs: mocks.authrizedCIDRs })
      });

      const result = await PUT(request, {});

      expect(result.status).toBe(500);
    });
  });
});
