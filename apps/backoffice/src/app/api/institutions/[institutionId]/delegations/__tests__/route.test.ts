import { faker } from "@faker-js/faker/locale/it";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { SubscriptionType } from "../../../../../../generated/api/SubscriptionType";
import { ManagedInternalError } from "../../../../../../lib/be/errors";
import { SelfcareRoles } from "../../../../../../types/auth";
import { GET } from "../route";

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
    isAggregator: faker.datatype.boolean(),
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

const stubs = { aGroup: { id: "aGroupId", name: "aGroupName" } };

const mocks = vi.hoisted(() => {
  const getUser = vi.fn(() => userMock);
  return {
    getUser,
    upsertManageSubscription: vi.fn(),
    getManageSubscriptions: vi.fn(),
    parseBody: vi.fn(),
    parseQueryParam: vi.fn(),
    parseLimitQueryParam: vi.fn(),
    parseOffsetQueryParam: vi.fn(),
    getGroup: vi.fn(),
    withJWTAuthHandler: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { backofficeUser: BackOfficeUser; params: any },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) =>
          handler(nextRequest, {
            backofficeUser: getUser(),
            params,
          }),
    ),
  };
});

vi.mock("@/lib/be/req-res-utils", async () => {
  const actual = await vi.importActual("@/lib/be/req-res-utils");
  return {
    ...(actual as any),
    parseBody: mocks.parseBody,
    parseQueryParam: mocks.parseQueryParam,
    parseLimitQueryParam: mocks.parseLimitQueryParam,
    parseOffsetQueryParam: mocks.parseOffsetQueryParam,
  };
});

vi.mock("@/lib/be/subscriptions/business", () => ({
  upsertManageSubscription: mocks.upsertManageSubscription,
  getManageSubscriptions: mocks.getManageSubscriptions,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mocks.withJWTAuthHandler,
}));
vi.mock("@/lib/be/institutions/business", () => ({
  getGroup: mocks.getGroup,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Institution's Delegations API", () => {
  describe("Retrieve instutution's delegations API", () => {
    // it("should return an error response when kind query param is not valid", async () => {
    //   // given
    //   mocks.parseQueryParam.mockReturnValueOnce(E.left(void 0));
    //   const request = new NextRequest("http://localhost?limit=0");

    //   // when
    //   const result = await GET(request, {});

    //   // then
    //   expect(result.status).toBe(400);
    //   const responseBody = await result.json();
    //   expect(responseBody.title).toEqual("Bad Request");
    //   expect(responseBody.detail).toEqual(
    //     `'kind' query param is not a valid ${SubscriptionType.name}`,
    //   );
    //   expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
    //   expect(mocks.parseQueryParam).toHaveBeenCalledWith(
    //     request,
    //     "kind",
    //     SubscriptionType,
    //   );
    //   expect(mocks.parseLimitQueryParam).not.toHaveBeenCalled();
    //   expect(mocks.parseOffsetQueryParam).not.toHaveBeenCalled();
    //   expect(mocks.getManageSubscriptions).not.toHaveBeenCalled();
    // });

    it("should return an error response when limit query param is not valid", async () => {
      // given
      const errorResponse = "errorResponse";
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.left(errorResponse));
      const request = new NextRequest("http://localhost");

      // when
      const result = await GET(request, {});

      // then
      expect(result).toBe(errorResponse);
      expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledWith(request);
      expect(mocks.parseOffsetQueryParam).not.toHaveBeenCalled();
      expect(mocks.getManageSubscriptions).not.toHaveBeenCalled();
    });

    it("should return an error response when offset query param is not valid", async () => {
      // given
      const kind = "MANAGE_ROOT";
      const limit = 10;
      mocks.parseQueryParam.mockReturnValueOnce(E.right(kind));
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
      const errorResponse = "errorResponse";
      mocks.parseOffsetQueryParam.mockReturnValueOnce(E.left(errorResponse));
      const request = new NextRequest("http://localhost?offset=-1");

      // when
      const result = await GET(request, {});

      // then
      expect(result).toBe(errorResponse);
      expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseOffsetQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseOffsetQueryParam).toHaveBeenCalledWith(request);
      expect(mocks.getManageSubscriptions).not.toHaveBeenCalled();
    });

    it("should return forbidden response when kind query param is MANAGE_GROUP, user role is OPERATOR and user groups is empty", async () => {
      // given
      const kind = "MANAGE_GROUP";
      const limit = 10;
      const offset = 5;
      const request = new NextRequest(
        `http://localhost?limit=${limit}&offset=${offset}`,
      );
      mocks.parseQueryParam.mockReturnValueOnce(E.right(kind));
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
      mocks.parseOffsetQueryParam.mockReturnValueOnce(E.right(offset));
      mocks.getUser.mockImplementationOnce(() => ({
        ...userMock,
        institution: {
          ...userMock.institution,
          role: SelfcareRoles.operator,
        },
        permissions: {
          ...userMock.permissions,
          selcGroups: [],
        },
      }));

      // when
      const result = await GET(request, {});

      // then
      expect(result.status).toBe(403);
      const jsonBody = await result.json();
      expect(jsonBody.detail).toEqual("Role not authorized");
      expect(mocks.getManageSubscriptions).not.toHaveBeenCalledOnce();
    });

    it("should return an error response when getManageSubscriptions fails", async () => {
      // given
      const kind = "MANAGE_ROOT";
      const limit = 10;
      const offset = 5;
      const request = new NextRequest(
        `http://localhost?limit=${limit}&offset=${offset}`,
      );
      mocks.parseQueryParam.mockReturnValueOnce(E.right(kind));
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
      mocks.parseOffsetQueryParam.mockReturnValueOnce(E.right(offset));
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
      expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseOffsetQueryParam).toHaveBeenCalledOnce();
      expect(mocks.getManageSubscriptions).toHaveBeenCalledOnce();
      expect(mocks.getManageSubscriptions).toHaveBeenCalledWith(
        kind,
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
        const kind = "MANAGE_ROOT";
        const limit = 10;
        const offset = 5;
        const request = new NextRequest("http://localhost");
        mocks.parseQueryParam.mockReturnValueOnce(E.right(kind));
        mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
        mocks.parseOffsetQueryParam.mockReturnValueOnce(E.right(offset));
        const expectedSubscriptions = [{ id: "id", name: "name" }];
        mocks.getManageSubscriptions.mockResolvedValueOnce(
          expectedSubscriptions,
        );
        mocks.getUser.mockImplementationOnce(() => ({
          ...userMock,
          institution: {
            ...userMock.institution,
            role: userRole,
          },
          permissions: {
            ...userMock.permissions,
            selcGroups: selcGroups,
          },
        }));

        // when
        const result = await GET(request, {});

        // then
        expect(result.status).toBe(200);
        const responseBody = await result.json();
        expect(responseBody).toStrictEqual({
          value: expectedSubscriptions,
          pagination: {
            count: expectedSubscriptions.length,
            limit,
            offset,
          },
        });
        expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
        expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
        expect(mocks.parseOffsetQueryParam).toHaveBeenCalledOnce();
        expect(mocks.getManageSubscriptions).toHaveBeenCalledOnce();
        expect(mocks.getManageSubscriptions).toHaveBeenCalledWith(
          kind,
          userMock.parameters.userId,
          limit,
          offset,
          userRole === SelfcareRoles.admin ? undefined : selcGroups,
        );
      },
    );
  });
});
