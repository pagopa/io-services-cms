import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { SelfcareRoles } from "../../../../../types/auth";
import { PUT } from "../route";

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
const { forwardIoServicesCmsRequestMock, withJWTAuthHandlerMock } = vi.hoisted(
  () => ({
    forwardIoServicesCmsRequestMock: vi.fn(),
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
  })
);

vi.mock("@/lib/be/services/business", () => ({
  forwardIoServicesCmsRequest: forwardIoServicesCmsRequestMock
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock
}));

beforeEach(() => {
  forwardIoServicesCmsRequestMock.mockResolvedValue(
    NextResponse.json({}, { status: 200 })
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Services API", () => {
  describe("Update", () => {
    it("should return a bad request when request body is not present", async () => {
      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      const result = await PUT(request, {});

      expect(result.status).toBe(400);
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should forward request when request body is not present", async () => {
      // Mock NextRequest
      const jsonBodyMock = { mock: true };
      const request = new NextRequest(new URL("http://localhost"), {
        method: "PUT",
        body: JSON.stringify(jsonBodyMock)
      });
      const params = { serviceId: faker.string.uuid() };

      const result = await PUT(request, { params });

      expect(result.status).toBe(200);
      expect(forwardIoServicesCmsRequestMock).toHaveBeenCalledOnce();
      expect(forwardIoServicesCmsRequestMock).toHaveBeenCalledWith(
        "updateService",
        {
          nextRequest: request,
          backofficeUser: backofficeUserMock,
          jsonBody: {
            ...jsonBodyMock,
            organization: {
              name: backofficeUserMock.institution.name,
              fiscal_code: backofficeUserMock.institution.fiscalCode
            }
          },
          pathParams: params
        }
      );
    });
  });
});
