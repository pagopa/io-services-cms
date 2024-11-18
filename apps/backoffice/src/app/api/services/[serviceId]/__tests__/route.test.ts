import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { ScopeEnum } from "../../../../../generated/api/ServiceBaseMetadata";
import { ServicePayload } from "../../../../../generated/api/ServicePayload";
import { SelfcareRoles } from "../../../../../types/auth";
import { PUT } from "../route";

const backofficeUserMock: BackOfficeUser = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  institution: {
    id: faker.string.uuid(),
    name: faker.company.name(),
    fiscalCode: faker.string.numeric(),
    role: faker.helpers.arrayElement(Object.values(SelfcareRoles)),
    logo_url: faker.image.url(),
  },
  permissions: { apimGroups: faker.helpers.multiple(faker.string.alpha) },
  parameters: {
    userId: faker.string.uuid(),
    userEmail: faker.internet.email(),
    subscriptionId: faker.string.uuid(),
  },
};
const aValidServicePayload: ServicePayload = {
  name: "aServiceName" as NonEmptyString,
  description: "aServiceDescription" as NonEmptyString,
  metadata: {
    scope: ScopeEnum.LOCAL,
    topic_id: 1,
  },
  max_allowed_payment_amount: 0 as any,
};

const { forwardIoServicesCmsRequestMock, withJWTAuthHandlerMock } = vi.hoisted(
  () => ({
    forwardIoServicesCmsRequestMock: vi.fn(),
    withJWTAuthHandlerMock: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { params: any; backofficeUser: BackOfficeUser },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) => {
          return handler(nextRequest, {
            params,
            backofficeUser: backofficeUserMock,
          });
        },
    ),
  }),
);

const { parseBody } = vi.hoisted(() => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/be/services/business", () => ({
  forwardIoServicesCmsRequest: forwardIoServicesCmsRequestMock,
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

vi.mock("@/lib/be/req-res-utils", () => ({
  parseBody,
}));

beforeEach(() => {
  forwardIoServicesCmsRequestMock.mockResolvedValue(
    NextResponse.json({}, { status: 200 }),
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Services API", () => {
  describe("Edit Service", () => {
    it("should return a bad request when fails to parse request body", async () => {
      // given
      const errorMessage = "errorMessage";
      parseBody.mockRejectedValueOnce(new Error(errorMessage));
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await PUT(request, {});

      // then
      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(errorMessage);
      expect(parseBody).toHaveBeenCalledOnce();
      expect(parseBody).toHaveBeenCalledWith(request, ServicePayload);
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should forward request", async () => {
      // given
      const jsonBodyMock = aValidServicePayload;
      parseBody.mockResolvedValueOnce(aValidServicePayload);
      backofficeUserMock.institution.role = SelfcareRoles.admin;
      const params = { serviceId: faker.string.uuid() };
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await PUT(request, { params });

      // then
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
              fiscal_code: backofficeUserMock.institution.fiscalCode,
            },
          },
          pathParams: params,
        },
      );
    });
  });
});
