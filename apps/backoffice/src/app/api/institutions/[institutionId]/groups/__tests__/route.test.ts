import { faker } from "@faker-js/faker/locale/it";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { SelfcareRoles } from "../../../../../../types/auth";
import { GET } from "../route";

const backofficeUserMock = {
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

const { retrieveInstitutionGroupsMock, withJWTAuthHandlerMock } = vi.hoisted(
  () => ({
    retrieveInstitutionGroupsMock: vi.fn().mockReturnValue(
      Promise.resolve({
        pagination: { number: 0, size: 0, totalElements: 0, totalPages:0},
        value: [],
      }),
    ),
    withJWTAuthHandlerMock: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { backofficeUser: BackOfficeUser; params: any },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) =>
          handler(nextRequest, {
            backofficeUser: backofficeUserMock,
            params,
          }),
    ),
  }),
);

vi.mock("@/lib/be/institutions/business", () => ({
  retrieveInstitutionGroups: retrieveInstitutionGroupsMock,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Retrieve Institutions Groups API", () => {
  it("when no size and page queryParam are provided should call with the default", async () => {
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const params = { institutionId: "institutionId" };
    const result = await GET(nextRequest, {params} );
    
    expect(result.status).toBe(200);
    expect(
      retrieveInstitutionGroupsMock
    ).toHaveBeenCalledWith(
      backofficeUserMock.institution.id,
      20,
      0
    );
  });

  it("should call with the provided size and page queryParam", async () => {
    const url = new URL("http://localhost");

    const queryParams = new URLSearchParams(url.search);
    queryParams.set("size", "25");
    queryParams.set("page", "5");

    url.search = queryParams.toString();

    const nextRequest = new NextRequest(url);

    const result = await GET(nextRequest, {params: { institutionId: "institutionId" }});

    expect(result.status).toBe(200);
    expect(retrieveInstitutionGroupsMock).toHaveBeenCalledWith(
      backofficeUserMock.institution.id,
      25,
      5
    );
  });

    it("should return a bad request if size is not number", async () => {
    const url = new URL("http://localhost");

    const queryParams = new URLSearchParams(url.search);
    queryParams.set("size", "notNumber");
    queryParams.set("page", "5");

    url.search = queryParams.toString();

    const nextRequest = new NextRequest(url);

    const result = await GET(nextRequest, {params: { institutionId: "institutionId" }});
    const jsonBody = await result.json();

    expect(result.status).toBe(400);
    expect(retrieveInstitutionGroupsMock).not.toHaveBeenCalled();
    expect(jsonBody.detail).toEqual("Size is not a number")
  });

  it("should return a bad request if page is not number", async () => {
    const url = new URL("http://localhost");

    const queryParams = new URLSearchParams(url.search);
    queryParams.set("size", "10");
    queryParams.set("page", "notNumber");

    url.search = queryParams.toString();

    const nextRequest = new NextRequest(url);

    const result = await GET(nextRequest, {params: { institutionId: "institutionId" }});
    const jsonBody = await result.json();

    expect(result.status).toBe(400);
    expect(retrieveInstitutionGroupsMock).not.toHaveBeenCalled();
    expect(jsonBody.detail).toEqual("Page is not a number")
  });
});
