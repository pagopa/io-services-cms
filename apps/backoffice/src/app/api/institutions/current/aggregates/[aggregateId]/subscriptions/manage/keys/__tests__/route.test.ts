import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../../../../../types/next-auth";
import { GET } from "../route";

const mocks: {
  backofficeUser: BackOfficeUser;
  errorResponse: NextResponse;
  sanitizedResponse: NextResponse;
  retrieveInstitutionAggregateManageSubscriptionsKeys: Mock<any>;
  withJWTAuthHandler: Mock<any>;
  handleInternalErrorResponse: Mock<any>;
  sanitizedNextResponseJson: Mock<any>;
} = vi.hoisted(() => ({
  backofficeUser: {
    parameters: { userId: "userId" },
    permissions: {},
    institution: { id: "institutionId" },
  } as BackOfficeUser,
  errorResponse: "errorResponse" as unknown as NextResponse,
  sanitizedResponse: "sanitizedResponse" as unknown as NextResponse,
  retrieveInstitutionAggregateManageSubscriptionsKeys: vi.fn(),
  sanitizedNextResponseJson: vi.fn(() => mocks.sanitizedResponse),
  handleInternalErrorResponse: vi.fn(() => mocks.errorResponse),
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

vi.mock("@/lib/be/errors", () => ({
  handleInternalErrorResponse: mocks.handleInternalErrorResponse,
}));

vi.mock("@/lib/be/sanitize", () => ({
  sanitizedNextResponseJson: mocks.sanitizedNextResponseJson,
}));

vi.mock("@/lib/be/subscriptions/business", () => ({
  retrieveInstitutionAggregateManageSubscriptionsKeys:
    mocks.retrieveInstitutionAggregateManageSubscriptionsKeys,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("retrieveInstitutionAggregateManageSubscriptionsKeys", () => {
  it("should return an internal error response when an error is thrown during the retrieval of subscription keys", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const aggregateId = "aggregateId";
    const error = new Error("test error message");
    mocks.retrieveInstitutionAggregateManageSubscriptionsKeys.mockRejectedValueOnce(
      error,
    );

    // when and then
    await expect(
      GET(nextRequest, {
        params: { aggregateId: aggregateId },
      } as any),
    ).resolves.toEqual(mocks.errorResponse);
    expect(
      mocks.retrieveInstitutionAggregateManageSubscriptionsKeys,
    ).toHaveBeenCalledOnce();
    expect(
      mocks.retrieveInstitutionAggregateManageSubscriptionsKeys,
    ).toHaveBeenCalledWith(aggregateId, mocks.backofficeUser.institution.id);
    expect(mocks.handleInternalErrorResponse).toHaveBeenCalledOnce();
    expect(mocks.handleInternalErrorResponse).toHaveBeenCalledWith(
      "InstitutionAggregateManageSubscriptionsKeysError",
      error,
      `An Error has occurred while retrieving Manage Group Subscription Keys for aggregateId '${aggregateId}' requested by aggregatorId '${mocks.backofficeUser.institution.id}'`,
    );
    expect(mocks.sanitizedNextResponseJson).not.toHaveBeenCalled();
  });

  it("should return a sanitized response with the retrieved subscription keys", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const aggregateId = "aggregateId";
    const subscriptionKeysResponse = { foo: "bar" };
    mocks.retrieveInstitutionAggregateManageSubscriptionsKeys.mockResolvedValueOnce(
      subscriptionKeysResponse,
    );

    // when and then
    await expect(
      GET(nextRequest, {
        params: { aggregateId: aggregateId },
      } as any),
    ).resolves.toEqual(mocks.sanitizedResponse);
    expect(
      mocks.retrieveInstitutionAggregateManageSubscriptionsKeys,
    ).toHaveBeenCalledOnce();
    expect(
      mocks.retrieveInstitutionAggregateManageSubscriptionsKeys,
    ).toHaveBeenCalledWith(aggregateId, mocks.backofficeUser.institution.id);
    expect(mocks.sanitizedNextResponseJson).toHaveBeenCalledOnce();
    expect(mocks.sanitizedNextResponseJson).toHaveBeenCalledWith(
      subscriptionKeysResponse,
    );
    expect(mocks.handleInternalErrorResponse).not.toHaveBeenCalled();
  });
});
