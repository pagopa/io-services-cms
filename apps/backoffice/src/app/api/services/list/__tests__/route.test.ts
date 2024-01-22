import { describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { ServiceLifecycle } from "@io-services-cms/models";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { SelfcareRoles } from "../../../../../types/auth";
import { GET } from "../route";

const backofficeUserMock = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  institution: {
    id: faker.string.uuid(),
    name: faker.company.name(),
    fiscalCode: faker.string.numeric(),
    role: faker.helpers.arrayElement(Object.values(SelfcareRoles)),
    logo_url: faker.image.url()
  },
  authorizedInstitutions: [
    {
      id: faker.string.uuid(),
      name: faker.company.name(),
      role: faker.helpers.arrayElement(Object.values(SelfcareRoles)),
      logo_url: faker.image.url()
    }
  ],
  permissions: faker.helpers.multiple(faker.string.alpha),
  parameters: {
    userId: faker.string.uuid(),
    userEmail: faker.internet.email(),
    subscriptionId: faker.string.uuid()
  }
};

const aBaseServiceLifecycle = ({
  id: "aServiceId",
  last_update: "aServiceLastUpdate",
  data: {
    name: "aServiceName",
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL"
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901"
    },
    require_secure_channel: false
  },
  fsm: {
    state: "draft"
  }
} as unknown) as ServiceLifecycle.ItemType;

const { retrieveServiceListMock, withJWTAuthHandlerMock } = vi.hoisted(() => ({
  retrieveServiceListMock: vi.fn().mockReturnValue(
    Promise.resolve({
      value: [],
      pagination: { offset: 0, limit: 0, count: 1 }
    })
  ),
  withJWTAuthHandlerMock: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { params: any; backofficeUser: BackOfficeUser }
      ) => Promise<NextResponse> | Promise<Response>
    ) => async (nextRequest: NextRequest, { params }: { params: {} }) => {
      return handler(nextRequest, {
        params,
        backofficeUser: backofficeUserMock
      });
    }
  )
}));

vi.mock("@/lib/be/services/business", () => ({
  retrieveServiceList: retrieveServiceListMock
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock
}));

describe("Retrieve Services List API", () => {
  it("when no limit and offset queryParam are provided should call with the default", async () => {
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const result = await GET(nextRequest, {});

    expect(result.status).toBe(200);
    expect(retrieveServiceListMock).toHaveBeenCalledWith(
      nextRequest,
      backofficeUserMock.parameters.userId,
      backofficeUserMock.institution,
      100,
      0,
      undefined
    );
  });

  it("should call with the provided limit and offset queryParam", async () => {
    const url = new URL("http://localhost");

    const queryParams = new URLSearchParams(url.search);
    queryParams.set("limit", "20");
    queryParams.set("offset", "5");

    url.search = queryParams.toString();

    const nextRequest = new NextRequest(url);

    const result = await GET(nextRequest, {});

    expect(result.status).toBe(200);
    expect(retrieveServiceListMock).toHaveBeenCalledWith(
      nextRequest,
      backofficeUserMock.parameters.userId,
      backofficeUserMock.institution,
      20,
      5,
      undefined
    );
  });

  it("should ignore the provided limit and offset queryParam when id queryParam is provided", async () => {
    const url = new URL("http://localhost");

    const queryParams = new URLSearchParams(url.search);
    queryParams.set("limit", "20");
    queryParams.set("offset", "5");
    queryParams.set("id", "aServiceId");

    url.search = queryParams.toString();

    const nextRequest = new NextRequest(url);

    const result = await GET(nextRequest, {});

    expect(result.status).toBe(200);
    expect(retrieveServiceListMock).toHaveBeenCalledWith(
      nextRequest,
      backofficeUserMock.parameters.userId,
      backofficeUserMock.institution,
      1,
      0,
      "aServiceId"
    );
  });
});
