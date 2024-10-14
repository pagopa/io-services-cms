import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { ScopeEnum } from "../../../../../generated/api/ServiceBaseMetadata";
import { ServicePayload } from "../../../../../generated/api/ServicePayload";
import { ManagedInternalError } from "../../../../../lib/be/errors";
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
const aGroup = { id: "group_id", name: "group name" };

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

const { parseBody, groupExists } = vi.hoisted(() => ({
  parseBody: vi.fn(),
  groupExists: vi.fn(),
}));

vi.mock("@/lib/be/services/business", () => ({
  forwardIoServicesCmsRequest: forwardIoServicesCmsRequestMock,
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

vi.mock("@/lib/be/institutions/business", () => ({
  groupExists,
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

      const result = await PUT(request, {});

      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(errorMessage);
      expect(parseBody).toHaveBeenCalledOnce();
      expect(parseBody).toHaveBeenCalledWith(request, ServicePayload);
      expect(groupExists).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it.each`
      scenario           | selcGroups
      ${"has no groups"} | ${undefined}
      ${"has groups"}    | ${faker.helpers.multiple(faker.string.uuid)}
    `(
      "should return a forbidden response when group_id is set and user is not admin and $scenario",
      async ({ selcGroups }) => {
        // given
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id: `different-${faker.string.uuid()}`,
          },
        };
        parseBody.mockResolvedValueOnce(jsonBodyMock);
        backofficeUserMock.institution.role = SelfcareRoles.operator;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await PUT(request, {});

        // then
        expect(result.status).toBe(403);
        const responseBody = await result.json();
        expect(responseBody.detail).toEqual(
          "Cannot set service group relationship",
        );
        expect(parseBody).toHaveBeenCalledOnce();
        expect(parseBody).toHaveBeenCalledWith(request, ServicePayload);
        expect(groupExists).not.toHaveBeenCalled();
        expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
      },
    );

    it("should return an internal error when group is set but checking group fn fails ", async () => {
      // given
      const jsonBodyMock = {
        ...aValidServicePayload,
        metadata: {
          ...aValidServicePayload.metadata,
          group_id: "nonExistingGroupId",
        },
      };
      parseBody.mockResolvedValueOnce(jsonBodyMock);
      const errorMessage = "errorMessage";
      groupExists.mockRejectedValueOnce(new ManagedInternalError(errorMessage));
      backofficeUserMock.institution.role = SelfcareRoles.admin;
      const request = new NextRequest(new URL("http://localhost"));

      const result = await PUT(request, { params: { serviceId: "serviceId" } });

      expect(result.status).toBe(500);
      const responseBody = await result.json();
      expect(responseBody.detail).toEqual("errorMessage");
      expect(groupExists).toHaveBeenCalledOnce();
      expect(groupExists).toHaveBeenCalledWith(
        backofficeUserMock.institution.id,
        jsonBodyMock.metadata.group_id,
      );
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it.each`
      scenario        | selcGroups
      ${"has groups"} | ${undefined}
      ${"has groups"} | ${["aGroupId"]}
    `(
      "should return a bad request when group is set but doesn't exists and user is admin and $scenario",
      async ({ selcGroups }) => {
        // given
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id: "nonExistingGroupId",
          },
        };
        parseBody.mockResolvedValueOnce(jsonBodyMock);
        groupExists.mockResolvedValueOnce(false);
        backofficeUserMock.institution.role = SelfcareRoles.admin;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const request = new NextRequest(new URL("http://localhost"));

        const result = await PUT(request, {});

        expect(result.status).toBe(400);
        const responseBody = await result.json();
        expect(responseBody.detail).toEqual(
          "Provided group_id does not exists",
        );
        expect(groupExists).toHaveBeenCalledOnce();
        expect(groupExists).toHaveBeenCalledWith(
          backofficeUserMock.institution.id,
          jsonBodyMock.metadata.group_id,
        );
        expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
      },
    );

    it.each`
      scenario                                      | selcGroups      | group_id     | mockGroupExists
      ${"has no groups and group is not set"}       | ${undefined}    | ${undefined} | ${undefined}
      ${"has groups and group is not set"}          | ${["aGroupId"]} | ${undefined} | ${undefined}
      ${"has groups and group is set and valid"}    | ${["aGroupId"]} | ${aGroup.id} | ${true}
      ${"has no groups and group is not set"}       | ${undefined}    | ${undefined} | ${undefined}
      ${"has no groups and group is set and valid"} | ${undefined}    | ${aGroup.id} | ${true}
    `(
      "should forward request when user is admin and $scenario",
      async ({ selcGroups, group_id, mockGroupExists }) => {
        // given
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id,
          },
        };
        parseBody.mockResolvedValueOnce(jsonBodyMock);
        if (mockGroupExists !== undefined) {
          groupExists.mockResolvedValueOnce(mockGroupExists);
        }
        backofficeUserMock.institution.role = SelfcareRoles.admin;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const params = { serviceId: faker.string.uuid() };
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await PUT(request, { params });

        // then
        expect(result.status).toBe(200);
        if (mockGroupExists !== undefined) {
          expect(groupExists).toHaveBeenCalledOnce();
          expect(groupExists).toHaveBeenCalledWith(
            backofficeUserMock.institution.id,
            jsonBodyMock.metadata.group_id,
          );
        } else {
          expect(groupExists).not.toHaveBeenCalled();
        }
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
      },
    );
  });
});
