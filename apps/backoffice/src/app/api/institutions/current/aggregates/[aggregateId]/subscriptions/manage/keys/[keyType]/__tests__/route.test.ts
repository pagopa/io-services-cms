import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import type { BackOfficeUser } from "../../../../../../../../../../../../types/next-auth.d.ts";
import { PUT } from "../route";
import { faker } from "@faker-js/faker/locale/it";

const mocks: {
  backofficeUser: BackOfficeUser;
  badRequestResponse: NextResponse;
  forbiddenResponse: NextResponse;
  errorResponse: NextResponse;
  sanitizedResponse: NextResponse;
  userAuthz: Mock<any>;
  isAdmin: Mock<any>;
  regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator: Mock<any>;
  withJWTAuthHandler: Mock<any>;
  handleBadRequestErrorResponse: Mock<any>;
  handleForbiddenErrorResponse: Mock<any>;
  handleInternalErrorResponse: Mock<any>;
  sanitizedNextResponseJson: Mock<any>;
  SubscriptionOwnershipError: new (message?: string) => Error;
} = vi.hoisted(() => ({
  backofficeUser: {
    parameters: { userId: "userId" },
    permissions: {},
    institution: { id: "institutionId" },
  } as BackOfficeUser,
  badRequestResponse: "badRequestResponse" as unknown as NextResponse,
  forbiddenResponse: "forbiddenResponse" as unknown as NextResponse,
  errorResponse: "errorResponse" as unknown as NextResponse,
  sanitizedResponse: "sanitizedResponse" as unknown as NextResponse,
  isAdmin: vi.fn(() => true),
  userAuthz: vi.fn(() => ({
    isAdmin: mocks.isAdmin,
  })),
  regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator: vi.fn(),
  sanitizedNextResponseJson: vi.fn(() => mocks.sanitizedResponse),
  handleBadRequestErrorResponse: vi.fn(() => mocks.badRequestResponse),
  handleForbiddenErrorResponse: vi.fn(() => mocks.forbiddenResponse),
  handleInternalErrorResponse: vi.fn(() => mocks.errorResponse),
  SubscriptionOwnershipError: class SubscriptionOwnershipError extends Error {},
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

vi.mock("@/lib/be/authz", () => ({
  userAuthz: mocks.userAuthz,
}));

vi.mock("@/lib/be/errors", () => ({
  SubscriptionOwnershipError: mocks.SubscriptionOwnershipError,
  handleBadRequestErrorResponse: mocks.handleBadRequestErrorResponse,
  handleForbiddenErrorResponse: mocks.handleForbiddenErrorResponse,
  handleInternalErrorResponse: mocks.handleInternalErrorResponse,
}));

vi.mock("@/lib/be/sanitize", () => ({
  sanitizedNextResponseJson: mocks.sanitizedNextResponseJson,
}));

vi.mock("@/lib/be/subscriptions/business", () => ({
  regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator:
    mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("regenerateInstitutionAggregateManageSubscriptionsKey", () => {
  it("should return a forbidden response when the user is not an admin", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const aggregateId = faker.string.uuid();
    const keyType = "primary";
    mocks.isAdmin.mockReturnValueOnce(false);

    // when and then
    await expect(
      PUT(nextRequest, {
        params: { aggregateId, keyType },
      } as any),
    ).resolves.toEqual(mocks.forbiddenResponse);
    expect(mocks.userAuthz).toHaveBeenCalledExactlyOnceWith(
      mocks.backofficeUser,
    );
    expect(mocks.isAdmin).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.handleForbiddenErrorResponse).toHaveBeenCalledExactlyOnceWith(
      "Role not authorized",
    );
    expect(
      mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
    ).not.toHaveBeenCalled();
    expect(mocks.handleBadRequestErrorResponse).not.toHaveBeenCalled();
    expect(mocks.handleInternalErrorResponse).not.toHaveBeenCalled();
    expect(mocks.sanitizedNextResponseJson).not.toHaveBeenCalled();
  });

  it("should return a bad request response when keyType is invalid", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const aggregateId = faker.string.uuid();
    const keyType = "invalid";

    // when and then
    await expect(
      PUT(nextRequest, {
        params: { aggregateId, keyType },
      } as any),
    ).resolves.toEqual(mocks.badRequestResponse);
    expect(mocks.userAuthz).toHaveBeenCalledExactlyOnceWith(
      mocks.backofficeUser,
    );
    expect(mocks.isAdmin).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.handleBadRequestErrorResponse).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining("invalid"),
    );
    expect(
      mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
    ).not.toHaveBeenCalled();
    expect(mocks.handleForbiddenErrorResponse).not.toHaveBeenCalled();
    expect(mocks.handleInternalErrorResponse).not.toHaveBeenCalled();
    expect(mocks.sanitizedNextResponseJson).not.toHaveBeenCalled();
  });

  it("should return an internal error response when an error is thrown during key regeneration", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const aggregateId = faker.string.uuid();
    const keyType = "primary";
    const error = new Error("test error message");
    mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator.mockRejectedValueOnce(
      error,
    );

    // when and then
    await expect(
      PUT(nextRequest, {
        params: { aggregateId, keyType },
      } as any),
    ).resolves.toEqual(mocks.errorResponse);
    expect(mocks.userAuthz).toHaveBeenCalledExactlyOnceWith(
      mocks.backofficeUser,
    );
    expect(mocks.isAdmin).toHaveBeenCalledExactlyOnceWith();
    expect(
      mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
    ).toHaveBeenCalledExactlyOnceWith(
      aggregateId,
      mocks.backofficeUser.institution.id,
      keyType,
    );
    expect(mocks.handleInternalErrorResponse).toHaveBeenCalledExactlyOnceWith(
      "InstitutionAggregateManageSubscriptionsKeyHandler",
      error,
      `An Error has occurred while regenerating ${keyType} Manage Group Subscription Key for aggregateId '${aggregateId}' requested by aggregatorId '${mocks.backofficeUser.institution.id}'`,
    );
    expect(mocks.handleForbiddenErrorResponse).not.toHaveBeenCalled();
    expect(mocks.handleBadRequestErrorResponse).not.toHaveBeenCalled();
    expect(mocks.sanitizedNextResponseJson).not.toHaveBeenCalled();
  });

  it("should return a forbidden response when the subscription is not owned by the institution", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const aggregateId = faker.string.uuid();
    const keyType = "secondary";
    const error = new mocks.SubscriptionOwnershipError("error from business");
    mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator.mockRejectedValueOnce(
      error,
    );

    // when and then
    await expect(
      PUT(nextRequest, {
        params: { aggregateId, keyType },
      } as any),
    ).resolves.toEqual(mocks.forbiddenResponse);
    expect(
      mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
    ).toHaveBeenCalledExactlyOnceWith(
      aggregateId,
      mocks.backofficeUser.institution.id,
      keyType,
    );
    expect(mocks.handleForbiddenErrorResponse).toHaveBeenCalledExactlyOnceWith(
      "You can only handle subscriptions that you own",
    );
    expect(mocks.handleBadRequestErrorResponse).not.toHaveBeenCalled();
    expect(mocks.handleInternalErrorResponse).not.toHaveBeenCalled();
    expect(mocks.sanitizedNextResponseJson).not.toHaveBeenCalled();
  });

  it("should return a sanitized response with the regenerated subscription keys", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const aggregateId = faker.string.uuid();
    const keyType = "primary";
    const subscriptionKeysResponse = { foo: "bar" };
    mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator.mockResolvedValueOnce(
      subscriptionKeysResponse,
    );

    // when and then
    await expect(
      PUT(nextRequest, {
        params: { aggregateId, keyType },
      } as any),
    ).resolves.toEqual(mocks.sanitizedResponse);
    expect(mocks.userAuthz).toHaveBeenCalledExactlyOnceWith(
      mocks.backofficeUser,
    );
    expect(mocks.isAdmin).toHaveBeenCalledExactlyOnceWith();
    expect(
      mocks.regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator,
    ).toHaveBeenCalledExactlyOnceWith(
      aggregateId,
      mocks.backofficeUser.institution.id,
      keyType,
    );
    expect(mocks.sanitizedNextResponseJson).toHaveBeenCalledExactlyOnceWith(
      subscriptionKeysResponse,
    );
    expect(mocks.handleBadRequestErrorResponse).not.toHaveBeenCalled();
    expect(mocks.handleForbiddenErrorResponse).not.toHaveBeenCalled();
    expect(mocks.handleInternalErrorResponse).not.toHaveBeenCalled();
  });
});
