import { describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { Cidr } from "../../../../../../generated/api/Cidr";
import { GET } from "../route";

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

const { retrieveManageSubscriptionAuthorizedCIDRs } = vi.hoisted(() => ({
  retrieveManageSubscriptionAuthorizedCIDRs: vi
    .fn()
    .mockReturnValue(Promise.resolve(mocks.authrizedCIDRs))
}));

vi.mock("@/lib/be/keys/business", () => ({
  retrieveManageSubscriptionAuthorizedCIDRs
}));

vi.mock("next-auth/jwt", async () => {
  const actual = await vi.importActual("next-auth/jwt");
  return {
    ...(actual as any),
    getToken
  };
});

describe("Retrieve Authorized CIDRs", () => {
  it("should return 200", async () => {
    retrieveManageSubscriptionAuthorizedCIDRs.mockReturnValueOnce(
      Promise.resolve(mocks.authrizedCIDRs)
    );
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = ({
      bodyUsed: false
    } as any) as NextRequest;

    const result = await GET(request, {});

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(200);
    expect(jsonResponse.cidrs).toEqual(mocks.authrizedCIDRs);
  });

  it("should return 500", async () => {
    retrieveManageSubscriptionAuthorizedCIDRs.mockReturnValueOnce(
      Promise.reject({ message: "an error" })
    );
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = ({
      bodyUsed: false
    } as any) as NextRequest;

    const result = await GET(request, {});

    expect(result.status).toBe(500);
  });
});
