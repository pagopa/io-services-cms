import { beforeEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { GET } from "../route";

const backofficeUserMock = {
  parameters: { subscriptionId: "subscriptionId" },
} as BackOfficeUser;

const { retrieveUnboundedGroupServicesMock, withJWTAuthHandlerMock } =
  vi.hoisted(() => ({
    retrieveUnboundedGroupServicesMock: vi.fn(),
    withJWTAuthHandlerMock: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { params: any; backofficeUser: BackOfficeUser },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) => {
          return handler(nextRequest, {
            params,
            backofficeUser: backofficeUserMock,
          });
        },
    ),
  }));

vi.mock("@/lib/be/services/business", () => ({
  retrieveUnboundedGroupServices: retrieveUnboundedGroupServicesMock,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Retrieve group-unbound Services API", () => {
  it("should return an error response when retrieveUnboundedGroupServices fails", async () => {
    // given
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const error = new Error();
    retrieveUnboundedGroupServicesMock.mockRejectedValueOnce(error);

    // when
    const result = await GET(nextRequest, {});

    // then
    expect(result.status).toBe(500);
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledOnce();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledWith(
      backofficeUserMock,
    );
  });

  it("should return OK", async () => {
    // given
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const unboundedServices = [
      { id: "id1", name: "name 1" },
      { id: "id2", name: "name 2" },
    ];
    retrieveUnboundedGroupServicesMock.mockResolvedValueOnce(unboundedServices);

    // when
    const result = await GET(nextRequest, {});

    // then
    expect(result.status).toBe(200);
    const responseBody = await result.json();
    expect(responseBody).toStrictEqual({ unboundedServices });
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledOnce();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledWith(
      backofficeUserMock,
    );
  });
});
