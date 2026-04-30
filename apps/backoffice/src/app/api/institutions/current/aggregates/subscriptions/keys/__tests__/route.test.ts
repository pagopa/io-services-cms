import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../../../types/next-auth";
import { PreconditionFailedError } from "../../../../../../../../lib/be/errors";
import { POST } from "../route";

const mocks: {
  backofficeUser: BackOfficeUser;
  generateApiKeysExports: Mock<any>;
  parseBody: Mock<any>;
  withJWTAuthHandler: Mock<any>;
} = vi.hoisted(() => ({
  backofficeUser: {
    parameters: { userId: "userId" },
    permissions: {},
    institution: { id: "institutionId", isAggregator: true },
  } as unknown as BackOfficeUser,
  generateApiKeysExports: vi.fn(),
  parseBody: vi.fn(),
  withJWTAuthHandler: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { backofficeUser: BackOfficeUser; params: any },
      ) => Promise<NextResponse> | Promise<Response>,
    ) =>
      async (nextRequest: NextRequest, { params }: { params: {} }) =>
        handler(nextRequest, {
          backofficeUser: mocks.backofficeUser,
          params,
        }),
  ),
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mocks.withJWTAuthHandler,
}));

vi.mock("@/lib/be/req-res-utils", () => ({
  parseBody: mocks.parseBody,
}));

vi.mock("@/lib/be/subscriptions/business", () => ({
  generateApiKeysExports: mocks.generateApiKeysExports,
}));

vi.mock("@/lib/be/errors", async () => {
  const actual = await vi.importActual("@/lib/be/errors");
  return {
    ...(actual as any),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requestAggregatedInstitutionsManageKeys", () => {
  it("should return 403 when user is not an aggregator", async () => {
    // given
    mocks.backofficeUser = {
      ...mocks.backofficeUser,
      institution: { ...mocks.backofficeUser.institution, isAggregator: false },
    } as unknown as BackOfficeUser;
    const request = new NextRequest("http://localhost", { method: "POST" });

    // when
    const result = await POST(request, {} as any);

    // then
    expect(result.status).toBe(403);
    const body = await result.json();
    expect(body.detail).toEqual(
      "Only aggregators are authorized to request manage keys exports for aggregated institutions",
    );
    expect(mocks.parseBody).not.toHaveBeenCalled();
    expect(mocks.generateApiKeysExports).not.toHaveBeenCalled();
  });

  it("should return 400 when request body parsing fails", async () => {
    // given
    mocks.backofficeUser = {
      ...mocks.backofficeUser,
      institution: { ...mocks.backofficeUser.institution, isAggregator: true },
    } as unknown as BackOfficeUser;
    const errorMessage = "Invalid password field";
    mocks.parseBody.mockRejectedValueOnce(new Error(errorMessage));
    const request = new NextRequest("http://localhost", { method: "POST" });

    // when
    const result = await POST(request, {} as any);

    // then
    expect(result.status).toBe(400);
    const body = await result.json();
    expect(body.detail).toEqual(errorMessage);
    expect(mocks.parseBody).toHaveBeenCalledOnce();
    expect(mocks.generateApiKeysExports).not.toHaveBeenCalled();
  });

  it("should return 412 when a PreconditionFailedError is thrown", async () => {
    // given
    mocks.backofficeUser = {
      ...mocks.backofficeUser,
      institution: { ...mocks.backofficeUser.institution, isAggregator: true },
    } as unknown as BackOfficeUser;
    const password = "aSecurePassword";
    mocks.parseBody.mockResolvedValueOnce({ password });
    mocks.generateApiKeysExports.mockRejectedValueOnce(
      new PreconditionFailedError(
        "An export file is already being generated",
        "details",
      ),
    );
    const request = new NextRequest("http://localhost", { method: "POST" });

    // when
    const result = await POST(request, {} as any);

    // then
    expect(result.status).toBe(412);
    const body = await result.json();
    expect(body.title).toEqual(
      "Precondition Failed: Unable to generate manage keys exports file",
    );
    expect(body.detail).toEqual("An export file is already being generated");
    expect(mocks.parseBody).toHaveBeenCalledOnce();
    expect(mocks.generateApiKeysExports).toHaveBeenCalledOnce();
    expect(mocks.generateApiKeysExports).toHaveBeenCalledWith(
      mocks.backofficeUser.institution.id,
      mocks.backofficeUser.parameters.userId,
      password,
    );
  });

  it("should return 500 when an unexpected error is thrown", async () => {
    // given
    mocks.backofficeUser = {
      ...mocks.backofficeUser,
      institution: { ...mocks.backofficeUser.institution, isAggregator: true },
    } as unknown as BackOfficeUser;
    const password = "aSecurePassword";
    mocks.parseBody.mockResolvedValueOnce({ password });
    mocks.generateApiKeysExports.mockRejectedValueOnce(
      new Error("unexpected error"),
    );
    const request = new NextRequest("http://localhost", { method: "POST" });

    // when
    const result = await POST(request, {} as any);

    // then
    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.title).toEqual("RequestAggregatedInstitutionsManageKeysError");
    expect(mocks.parseBody).toHaveBeenCalledOnce();
    expect(mocks.generateApiKeysExports).toHaveBeenCalledOnce();
    expect(mocks.generateApiKeysExports).toHaveBeenCalledWith(
      mocks.backofficeUser.institution.id,
      mocks.backofficeUser.parameters.userId,
      password,
    );
  });

  it("should return 202 when generateApiKeysExports succeeds", async () => {
    // given
    mocks.backofficeUser = {
      ...mocks.backofficeUser,
      institution: { ...mocks.backofficeUser.institution, isAggregator: true },
    } as unknown as BackOfficeUser;
    const password = "aSecurePassword";
    mocks.parseBody.mockResolvedValueOnce({ password });
    mocks.generateApiKeysExports.mockResolvedValueOnce(undefined);
    const request = new NextRequest("http://localhost", { method: "POST" });

    // when
    const result = await POST(request, {} as any);

    // then
    expect(result.status).toBe(202);
    expect(mocks.parseBody).toHaveBeenCalledOnce();
    expect(mocks.generateApiKeysExports).toHaveBeenCalledOnce();
    expect(mocks.generateApiKeysExports).toHaveBeenCalledWith(
      mocks.backofficeUser.institution.id,
      mocks.backofficeUser.parameters.userId,
      password,
    );
  });
});
