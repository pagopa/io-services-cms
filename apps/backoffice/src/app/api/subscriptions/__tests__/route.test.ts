import { faker } from "@faker-js/faker/locale/it";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateManageGroupSubscription } from "../../../../generated/api/CreateManageGroupSubscription";
import { Subscription } from "../../../../generated/api/Subscription";
import { ManagedInternalError } from "../../../../lib/be/errors";

import { BackOfficeUser } from "../../../../../types/next-auth";
import { SelfcareRoles } from "../../../../types/auth";
import { PUT } from "../route";

const userMock = {
  authorizedInstitutions: [
    {
      id: faker.string.uuid(),
      logo_url: faker.image.url(),
      name: faker.company.name(),
      role: SelfcareRoles.admin,
    },
  ],
  email: faker.internet.email(),
  id: faker.string.uuid(),
  institution: {
    fiscalCode: faker.string.numeric(),
    id: "institutionId",
    logo_url: faker.image.url(),
    name: faker.company.name(),
    role: SelfcareRoles.admin,
  },
  name: faker.person.fullName(),
  parameters: {
    subscriptionId: faker.string.uuid(),
    userEmail: faker.internet.email(),
    userId: faker.string.uuid(),
  },
  permissions: {
    apimGroups: faker.helpers.multiple(faker.string.alpha),
  },
};

const mocks = vi.hoisted(() => ({
  upsertManageSubscription: vi.fn(),
  withJWTAuthHandler: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { backofficeUser: BackOfficeUser; params: any },
      ) => Promise<NextResponse> | Promise<Response>,
    ) =>
      async (nextRequest: NextRequest, { params }: { params: {} }) =>
        handler(nextRequest, {
          backofficeUser: userMock,
          params,
        }),
  ),
}));

vi.mock("@/lib/be/subscriptions/business", () => ({
  upsertManageSubscription: mocks.upsertManageSubscription,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mocks.withJWTAuthHandler,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Upsert Subscription API", () => {
  const aCorrectRequestBody: CreateManageGroupSubscription = {
    groupId: "groupId",
  };

  it("should return a forbidden response when user is not an admin", async () => {
    // given
    userMock.institution.role = SelfcareRoles.operator;
    const nextRequest = new NextRequest(new URL("http://localhost"));

    // when
    const result = await PUT(nextRequest, {});

    // then
    expect(result.status).toBe(403);
    const jsonBody = await result.json();
    expect(jsonBody.detail).toEqual("Role not authorized");
    expect(mocks.upsertManageSubscription).not.toHaveBeenCalled();
  });

  it("should fails when there is no request body", async () => {
    // given
    userMock.institution.role = SelfcareRoles.admin;
    const nextRequest = new NextRequest("http://localhost");

    // when
    const result = await PUT(nextRequest, {});

    // then
    expect(result.status).toBe(400);
    const responseBody = await result.json();
    expect(responseBody.title).toEqual("ValidationError");
    expect(responseBody.detail).toEqual("invalid JSON body");
    expect(mocks.upsertManageSubscription).not.toHaveBeenCalled();
  });

  it("should fails when request body is not a valid CreateManageGroupSubscription object", async () => {
    // given
    userMock.institution.role = SelfcareRoles.admin;
    const badBody = JSON.stringify({
      foo: "foo",
    });
    const nextRequest = new NextRequest("http://localhost", {
      method: "PUT",
      body: badBody,
    });

    // when
    const result = await PUT(nextRequest, {});

    // then
    expect(result.status).toBe(400);
    const responseBody = await result.json();
    expect(responseBody.title).toEqual("ValidationError");
    expect(responseBody.detail).toMatch(/is not a valid/);
    expect(mocks.upsertManageSubscription).not.toHaveBeenCalled();
  });

  it("should fails when upsertManageSubscription return an error", async () => {
    // given
    userMock.institution.role = SelfcareRoles.admin;
    const body = aCorrectRequestBody;
    const errorMessage = "error message";
    mocks.upsertManageSubscription.mockRejectedValueOnce(
      new ManagedInternalError(errorMessage),
    );
    const nextRequest = new NextRequest("http://localhost", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // when
    const result = await PUT(nextRequest, {});

    // then
    expect(result.status).toBe(500);
    const responseBody = await result.json();
    expect(responseBody.title).toEqual("SubscriptionCreateError");
    expect(responseBody.detail).toEqual(errorMessage);
    expect(mocks.upsertManageSubscription).toHaveBeenCalledOnce();
    expect(mocks.upsertManageSubscription).toHaveBeenCalledWith(
      userMock.parameters.userId,
      body.groupId,
    );
  });

  it("should return the upserted manage subscription", async () => {
    // given
    userMock.institution.role = SelfcareRoles.admin;
    const body = aCorrectRequestBody;
    const aSubscription: Subscription = { id: "id", name: "name" };
    mocks.upsertManageSubscription.mockResolvedValueOnce(aSubscription);
    const nextRequest = new NextRequest("http://localhost", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // when
    const result = await PUT(nextRequest, {});

    // then
    expect(result.status).toBe(200);
    const responseBody = await result.json();
    expect(responseBody).toStrictEqual(aSubscription);
    expect(mocks.upsertManageSubscription).toHaveBeenCalledOnce();
    expect(mocks.upsertManageSubscription).toHaveBeenCalledWith(
      userMock.parameters.userId,
      body.groupId,
    );
  });
});
