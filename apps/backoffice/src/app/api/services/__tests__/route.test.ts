import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { CreateServicePayload } from "../../../../generated/api/CreateServicePayload";
import { ScopeEnum } from "../../../../generated/api/ServiceBaseMetadata";
import { ManagedInternalError } from "../../../../lib/be/errors";
import { SelfcareRoles } from "../../../../types/auth";
import { POST } from "../route";

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
const aValidServicePayload: CreateServicePayload = {
  name: "aServiceName" as NonEmptyString,
  description: "aServiceDescription" as NonEmptyString,
  metadata: {
    scope: ScopeEnum.LOCAL,
    topic_id: 1,
  },
  max_allowed_payment_amount: 0 as any,
};
const aGroup = { id: "group_id", name: "group name" };

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    GROUP_AUTHZ_ENABLED: "true",
  };
});

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
  describe("Create Service", () => {
    it("should return a bad request when fails to parse request body", async () => {
      // given
      const errorMessage = "errorMessage";
      parseBody.mockRejectedValueOnce(new Error(errorMessage));
      const request = new NextRequest(new URL("http://localhost"));

      const result = await POST(request, {});

      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(errorMessage);
      expect(parseBody).toHaveBeenCalledOnce();
      expect(parseBody).toHaveBeenCalledWith(request, CreateServicePayload);
      expect(groupExists).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it.each`
      scenario                                  | group_id                              | selcGroups                                   | expectedStatusCode | expectedDetail
      ${"set a group but but he has no groups"} | ${`different-${faker.string.uuid()}`} | ${undefined}                                 | ${403}             | ${"Provided group is out of your scope"}
      ${"set a group who is not a member"}      | ${`different-${faker.string.uuid()}`} | ${faker.helpers.multiple(faker.string.uuid)} | ${403}             | ${"Provided group is out of your scope"}
      ${"not set a group but he is has groups"} | ${undefined}                          | ${faker.helpers.multiple(faker.string.uuid)} | ${400}             | ${"group_id is required"}
    `(
      "should return a forbidden response when user is not admin and $scenario",
      async ({ group_id, selcGroups, expectedStatusCode, expectedDetail }) => {
        // given
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id,
          },
        };
        parseBody.mockResolvedValueOnce(jsonBodyMock);
        backofficeUserMock.institution.role = SelfcareRoles.operator;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await POST(request, {});

        // then
        expect(result.status).toBe(expectedStatusCode);
        const responseBody = await result.json();
        expect(responseBody.detail).toEqual(expectedDetail);
        expect(parseBody).toHaveBeenCalledOnce();
        expect(parseBody).toHaveBeenCalledWith(request, CreateServicePayload);
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

      const result = await POST(request, {});

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

        const result = await POST(request, {});

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

      const result = await POST(request, {});

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
      scenario                                                           | userRole                  | selcGroups      | group_id      | mockGroupExists
      ${"user is operator and has no groups and group is not set"}       | ${SelfcareRoles.operator} | ${undefined}    | ${undefined}  | ${undefined}
      ${"user is operator and has groups and group is set and included"} | ${SelfcareRoles.operator} | ${["aGroupId"]} | ${"aGroupId"} | ${undefined}
      ${"user is admin and has no groups and group is not set"}          | ${SelfcareRoles.admin}    | ${undefined}    | ${undefined}  | ${undefined}
      ${"user is admin and has groups and group is not set"}             | ${SelfcareRoles.admin}    | ${["aGroupId"]} | ${undefined}  | ${undefined}
      ${"user is admin and has groups and group is set and valid"}       | ${SelfcareRoles.admin}    | ${["aGroupId"]} | ${aGroup.id}  | ${true}
      ${"user is admin and has no groups and group is not set"}          | ${SelfcareRoles.admin}    | ${undefined}    | ${undefined}  | ${undefined}
      ${"user is admin and has no groups and group is set and valid"}    | ${SelfcareRoles.admin}    | ${undefined}    | ${aGroup.id}  | ${true}
    `(
      "should forward request when $scenario",
      async ({ userRole, selcGroups, group_id, mockGroupExists }) => {
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
        backofficeUserMock.institution.role = userRole;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await POST(request, {});

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
          "createService",
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
          },
        );
      },
    );
  });
});
