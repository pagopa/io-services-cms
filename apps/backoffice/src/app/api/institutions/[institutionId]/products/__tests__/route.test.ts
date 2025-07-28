import { faker } from "@faker-js/faker/locale/it";
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
    getUserInstitutionProducts: vi.fn(),
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
  };
});

vi.mock("@/lib/be/institutions/business", () => ({
  getUserInstitutionProducts: mocks.getUserInstitutionProducts,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mocks.withJWTAuthHandler,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("User Institution Products API", () => {
  describe("Retrieve user institution products API", () => {
    it("should return an error response when getUserInstitutionProducts fails", async () => {
      // given
      const institutionId = "institutionId";
      const request = new NextRequest(`http://localhost`);
      const errorMessage = "error message";
      mocks.getUserInstitutionProducts.mockRejectedValueOnce(
        new ManagedInternalError(errorMessage),
      );

      // when
      const result = await GET(request, {
        backofficeUser: userMock,
        params: { institutionId },
      });

      // then
      expect(result.status).toBe(500);
      const responseBody = await result.json();
      expect(responseBody.title).toEqual(
        "UserInstitutionProductsRetrieveError",
      );
      expect(responseBody.detail).toEqual(errorMessage);
      expect(mocks.getUserInstitutionProducts).toHaveBeenCalledOnce();
      expect(mocks.getUserInstitutionProducts).toHaveBeenCalledWith(
        institutionId,
        userMock.id,
      );
    });

    it("should return the user institution products when getUserInstitutionProducts do not fails", async () => {
      // given
      const institutionId = "institutionId";
      const request = new NextRequest("http://localhost");
      const expectedProducts = {
        products: [
          { id: "id", title: "product title", urlBO: "urlBO" },
          { id: "id2", title: "product title 2", urlBO: "urlBO2" },
        ],
      };
      mocks.getUserInstitutionProducts.mockResolvedValueOnce(expectedProducts);

      // when
      const result = await GET(request, {
        backofficeUser: userMock,
        params: { institutionId },
      });

      // then
      expect(result.status).toBe(200);
      const responseBody = await result.json();
      expect(responseBody).toStrictEqual(expectedProducts);
      expect(mocks.getUserInstitutionProducts).toHaveBeenCalledOnce();
      expect(mocks.getUserInstitutionProducts).toHaveBeenCalledWith(
        institutionId,
        userMock.id,
      );
    });
  });
});
