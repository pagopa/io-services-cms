import { faker } from "@faker-js/faker/locale/it";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
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

const mocks = vi.hoisted(() => {
  const getUser = vi.fn(() => userMock);
  return {
    getUser,
    getDelegatedInstitutions: vi.fn(),
    parseBody: vi.fn(),
    parseQueryParam: vi.fn(),
    parseLimitQueryParam: vi.fn(),
    parseOffsetQueryParam: vi.fn(),
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

vi.mock("@/lib/be/institutions/business", () => ({
  getDelegatedInstitutions: mocks.getDelegatedInstitutions,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mocks.withJWTAuthHandler,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Institution's Delegations API", () => {
  describe("Retrieve instutution's delegations API", () => {
    it("should return an error response when limit query param is not valid", async () => {
      // given
      const errorResponse = "errorResponse";
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.left(errorResponse));
      const request = new NextRequest("http://localhost");

      // when
      const result = await GET(request, {});

      // then
      expect(result).toBe(errorResponse);
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledWith(request);
      expect(mocks.parseOffsetQueryParam).not.toHaveBeenCalled();
      expect(mocks.parseQueryParam).not.toHaveBeenCalled();
      expect(mocks.getDelegatedInstitutions).not.toHaveBeenCalled();
    });

    it("should return an error response when offset query param is not valid", async () => {
      // given
      const limit = 10;
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
      const errorResponse = "errorResponse";
      mocks.parseOffsetQueryParam.mockReturnValueOnce(E.left(errorResponse));
      const request = new NextRequest("http://localhost");

      // when
      const result = await GET(request, {});

      // then
      expect(result).toBe(errorResponse);
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseOffsetQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseOffsetQueryParam).toHaveBeenCalledWith(request);
      expect(mocks.parseQueryParam).not.toHaveBeenCalled();
      expect(mocks.getDelegatedInstitutions).not.toHaveBeenCalled();
    });

    it("should return an error response when search query param is not valid", async () => {
      // given
      const limit = 10;
      const offset = 5;
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
      mocks.parseOffsetQueryParam.mockReturnValueOnce(E.right(offset));
      mocks.parseQueryParam.mockReturnValueOnce(E.left(void 0));
      const request = new NextRequest("http://localhost");

      // when
      const result = await GET(request, {});

      // then
      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.title).toEqual("Bad Request");
      expect(responseBody.detail).toEqual(
        `'search' query param is not a valid ${NonEmptyString.name}`,
      );
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseOffsetQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseQueryParam).toHaveBeenCalledWith(
        request,
        "search",
        expect.objectContaining({
          name: t.union([NonEmptyString, t.null]).name,
        }),
      );
      expect(mocks.getDelegatedInstitutions).not.toHaveBeenCalled();
    });

    it("should return an error response when getDelegatedInstitutions fails", async () => {
      // given
      const limit = 10;
      const offset = 5;
      const institutionId = "institutionId";
      const request = new NextRequest(
        `http://localhost?limit=${limit}&offset=${offset}`,
      );
      mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
      mocks.parseOffsetQueryParam.mockReturnValueOnce(E.right(offset));
      mocks.parseQueryParam.mockReturnValueOnce(E.right(null));
      const errorMessage = "error message";
      mocks.getDelegatedInstitutions.mockRejectedValueOnce(
        new ManagedInternalError(errorMessage),
      );

      // when
      const result = await GET(request, { params: { institutionId } });

      // then
      expect(result.status).toBe(500);
      const responseBody = await result.json();
      expect(responseBody.title).toEqual("InstitutionDelegationsRetrieveError");
      expect(responseBody.detail).toEqual(errorMessage);
      expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseOffsetQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
      expect(mocks.getDelegatedInstitutions).toHaveBeenCalledOnce();
      expect(mocks.getDelegatedInstitutions).toHaveBeenCalledWith(
        institutionId,
        limit,
        offset,
        undefined,
      );
    });

    it.each`
      scenario                     | actualSearch | expectedSearch
      ${"search param is not set"} | ${null}      | ${undefined}
      ${"search param is set"}     | ${"foo"}     | ${"foo"}
    `(
      "should return the delecations when getDelegatedInstitutions do not fails and $scenario",
      async ({ actualSearch, expectedSearch }) => {
        // given
        const limit = 10;
        const offset = 5;
        const institutionId = "institutionId";
        const request = new NextRequest("http://localhost");
        mocks.parseLimitQueryParam.mockReturnValueOnce(E.right(limit));
        mocks.parseOffsetQueryParam.mockReturnValueOnce(E.right(offset));
        mocks.parseQueryParam.mockReturnValueOnce(E.right(actualSearch));
        const expectedDelegations = {
          value: [{ id: "id", name: "name" }],
          pagination: {
            count: 1,
            limit,
            offset,
          },
        };
        mocks.getDelegatedInstitutions.mockResolvedValueOnce(
          expectedDelegations,
        );

        // when
        const result = await GET(request, { params: { institutionId } });

        // then
        expect(result.status).toBe(200);
        const responseBody = await result.json();
        expect(responseBody).toStrictEqual(expectedDelegations);
        expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
        expect(mocks.parseLimitQueryParam).toHaveBeenCalledOnce();
        expect(mocks.parseOffsetQueryParam).toHaveBeenCalledOnce();
        expect(mocks.getDelegatedInstitutions).toHaveBeenCalledOnce();
        expect(mocks.getDelegatedInstitutions).toHaveBeenCalledWith(
          institutionId,
          limit,
          offset,
          expectedSearch,
        );
      },
    );
  });
});
