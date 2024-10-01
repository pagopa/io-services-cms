import { faker } from "@faker-js/faker/locale/it";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateManageGroupSubscription } from "../../../../generated/api/CreateManageGroupSubscription";
import { Subscription } from "../../../../generated/api/Subscription";
import { ManagedInternalError } from "../../../../lib/be/errors";
import { PositiveInteger } from "../../../../lib/be/types";

import { BackOfficeUser } from "../../../../../types/next-auth";
import { SelfcareRoles } from "../../../../types/auth";
import { GET, PUT } from "../route";

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
} as BackOfficeUser;

const mocks = vi.hoisted(() => ({
  upsertManageSubscription: vi.fn(),
  getManageSubscriptions: vi.fn(),
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
  getManageSubscriptions: mocks.getManageSubscriptions,
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
    const nextRequest = new NextRequest("http://localhost");

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

describe("Retrieve manage subscriptions API", () => {
  it("should return an error response when limit query param is not valid", async () => {
    // given
    const request = new NextRequest("http://localhost?limit=0");

    // when
    const result = await GET(request, {});

    // then
    expect(result.status).toBe(400);
    const responseBody = await result.json();
    expect(responseBody.title).toEqual("Bad Request");
    expect(responseBody.detail).toEqual(
      `'limit' query param is not a valid ${PositiveInteger.name}`,
    );
    expect(mocks.getManageSubscriptions).not.toHaveBeenCalled();
  });

  it("should return an error response when offset query param is not valid", async () => {
    // given
    const request = new NextRequest("http://localhost?offset=-1");

    // when
    const result = await GET(request, {});

    // then
    expect(result.status).toBe(400);
    const responseBody = await result.json();
    expect(responseBody.title).toEqual("Bad Request");
    expect(responseBody.detail).toEqual(
      `'offset' query param is not a valid ${NonNegativeInteger.name}`,
    );
    expect(mocks.getManageSubscriptions).not.toHaveBeenCalled();
  });

  it("should return an error response when getManageSubscriptions fails", async () => {
    // given
    const limit = 10;
    const offset = 5;
    const request = new NextRequest(
      `http://localhost?limit=${limit}&offset=${offset}`,
    );
    const errorMessage = "error message";
    mocks.getManageSubscriptions.mockRejectedValueOnce(
      new ManagedInternalError(errorMessage),
    );

    // when
    const result = await GET(request, {});

    // then
    expect(result.status).toBe(500);
    const responseBody = await result.json();
    expect(responseBody.title).toEqual("SubscriptionsRetrieveError");
    expect(responseBody.detail).toEqual(errorMessage);
    expect(mocks.getManageSubscriptions).toHaveBeenCalledOnce();
    expect(mocks.getManageSubscriptions).toHaveBeenCalledWith(
      userMock.parameters.userId,
      limit,
      offset,
      undefined,
    );
  });

  it.each`
    scenario                                 | userRole                  | selcGroups
    ${"user is admin"}                       | ${SelfcareRoles.admin}    | ${undefined}
    ${"user is not admin and has no groups"} | ${SelfcareRoles.operator} | ${undefined}
    ${"user is not admin and has groups"}    | ${SelfcareRoles.operator} | ${["g1"]}
  `(
    "should return the subscriptions when getManageSubscriptions do not fails and $scenario",
    async ({ userRole, selcGroups }) => {
      // given
      const request = new NextRequest("http://localhost");
      const expectedSubscriptions = [{ id: "id", name: "name" }];
      mocks.getManageSubscriptions.mockResolvedValueOnce(expectedSubscriptions);
      userMock.institution.role = userRole;
      userMock.permissions.selcGroups = selcGroups;

      // when
      const result = await GET(request, {});

      // then
      expect(result.status).toBe(200);
      const responseBody = await result.json();
      expect(responseBody).toStrictEqual(expectedSubscriptions);
      expect(mocks.getManageSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getManageSubscriptions).toHaveBeenCalledWith(
        userMock.parameters.userId,
        20,
        0,
        userRole === SelfcareRoles.admin ? undefined : selcGroups,
      );
    },
  );
});
