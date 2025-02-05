import { beforeEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { BulkPatchServicePayload } from "../../../../generated/api/BulkPatchServicePayload";
import { CreateServicePayload } from "../../../../generated/api/CreateServicePayload";
import { ScopeEnum } from "../../../../generated/api/ServiceBaseMetadata";
import {
  GroupNotFoundError,
  ManagedInternalError,
} from "../../../../lib/be/errors";
import { SelfcareRoles } from "../../../../types/auth";
import { PATCH, POST } from "../route";

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
const aSelcGroupActive = [
  { id: "aGroupId", name: "groupName", state: "ACTIVE" },
];
const aSelcGroupNotActive = [
  { id: "aGroupId", name: "groupName", state: "SUSPENDED" },
];
const aGroup = { id: "group_id", name: "group name" };

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    GROUP_AUTHZ_ENABLED: "true",
  };
});

const {
  isAdminMock,
  isGroupAllowedMock,
  userAuthzMock,
  parseBodyMock,
  groupExistsMock,
  getGroupMock,
  forwardIoServicesCmsRequestMock,
  bulkPatchMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => {
  const isAdminMock = vi.fn(() => true);
  const isGroupAllowedMock = vi.fn(() => true);
  return {
    isAdminMock,
    isGroupAllowedMock,
    userAuthzMock: vi.fn(() => ({
      isAdmin: isAdminMock,
      isGroupAllowed: isGroupAllowedMock,
    })),
    parseBodyMock: vi.fn(),
    groupExistsMock: vi.fn(),
    getGroupMock: vi.fn(),
    forwardIoServicesCmsRequestMock: vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    ),
    bulkPatchMock: vi.fn(),
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
  };
});

vi.mock("@/lib/be/authz", () => ({
  userAuthz: userAuthzMock,
}));

vi.mock("@/lib/be/req-res-utils", () => ({
  parseBody: parseBodyMock,
}));

vi.mock("@/lib/be/institutions/business", () => ({
  groupExists: groupExistsMock,
  getGroup: getGroupMock,
}));

vi.mock("@/lib/be/services/business", () => ({
  forwardIoServicesCmsRequest: forwardIoServicesCmsRequestMock,
  bulkPatch: bulkPatchMock,
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Services API", () => {
  describe("Create Service", () => {
    it("should return a bad request when fails to parse request body", async () => {
      // given
      const errorMessage = "errorMessage";
      parseBodyMock.mockRejectedValueOnce(new Error(errorMessage));
      const request = new NextRequest(new URL("http://localhost"));

      const result = await POST(request, {});

      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(errorMessage);
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(request, CreateServicePayload);
      expect(userAuthzMock).not.toHaveBeenCalled();
      expect(isAdminMock).not.toHaveBeenCalled();
      expect(groupExistsMock).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it.each`
      scenario                                  | group_id                              | selcGroups          | isGroupAllowed | expectedStatusCode | expectedDetail
      ${"set a group but but he has no groups"} | ${`different-${faker.string.uuid()}`} | ${undefined}        | ${false}       | ${403}             | ${"Provided group is out of your scope or inactive"}
      ${"set a group who is not a member"}      | ${`different-${faker.string.uuid()}`} | ${aSelcGroupActive} | ${false}       | ${403}             | ${"Provided group is out of your scope or inactive"}
      ${"not set a group but he is has groups"} | ${undefined}                          | ${aSelcGroupActive} | ${true}        | ${400}             | ${"group_id is required"}
    `(
      "should return a forbidden response when user is not admin and $scenario",
      async ({
        group_id,
        selcGroups,
        isGroupAllowed,
        expectedStatusCode,
        expectedDetail,
      }) => {
        // given
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id,
          },
        };
        isAdminMock.mockReturnValueOnce(false);
        isGroupAllowedMock.mockReturnValueOnce(isGroupAllowed);
        parseBodyMock.mockResolvedValueOnce(jsonBodyMock);
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await POST(request, {});

        // then
        expect(result.status).toBe(expectedStatusCode);
        const responseBody = await result.json();
        expect(responseBody.detail).toEqual(expectedDetail);
        expect(parseBodyMock).toHaveBeenCalledOnce();
        expect(parseBodyMock).toHaveBeenCalledWith(
          request,
          CreateServicePayload,
        );
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        expect(isAdminMock).toHaveBeenCalledOnce();
        expect(isAdminMock).toHaveBeenCalledWith();
        expect(groupExistsMock).not.toHaveBeenCalled();
        expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
      },
    );

    it("should return a bad request when user is admin group is set and the group doesn't exist", async () => {
      // given
      const jsonBodyMock = {
        ...aValidServicePayload,
        metadata: {
          ...aValidServicePayload.metadata,
          group_id: "nonExistingGroupId",
        },
      };
      parseBodyMock.mockResolvedValueOnce(jsonBodyMock);
      const groupNotFoundError = new GroupNotFoundError("group doesn't exist");
      getGroupMock.mockRejectedValueOnce(groupNotFoundError);
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await POST(request, {});

      // then
      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toEqual("group doesn't exist");
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(request, CreateServicePayload);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(
        jsonBodyMock.metadata.group_id,
        backofficeUserMock.institution.id,
      );
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return a forbidden response when group exists but is not active and user is admin", async () => {
      // given
      const jsonBodyMock = {
        ...aValidServicePayload,
        metadata: {
          ...aValidServicePayload.metadata,
          group_id: "group_id",
        },
      };
      parseBodyMock.mockResolvedValueOnce(jsonBodyMock);
      getGroupMock.mockResolvedValueOnce(aSelcGroupNotActive[0]);
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await POST(request, {});

      // then
      expect(result.status).toBe(403);
      const responseBody = await result.json();
      expect(responseBody.detail).toEqual("Provided group is not active");
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(request, CreateServicePayload);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(
        jsonBodyMock.metadata.group_id,
        backofficeUserMock.institution.id,
      );
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return an internal error when group is set but checking group fn fails ", async () => {
      // given
      const jsonBodyMock = {
        ...aValidServicePayload,
        metadata: {
          ...aValidServicePayload.metadata,
          group_id: "nonExistingGroupId",
        },
      };
      parseBodyMock.mockResolvedValueOnce(jsonBodyMock);
      const errorMessage = "errorMessage";
      getGroupMock.mockRejectedValueOnce(
        new ManagedInternalError(errorMessage),
      );
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await POST(request, {});

      // then
      expect(result.status).toBe(500);
      const responseBody = await result.json();
      expect(responseBody.detail).toEqual("errorMessage");
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(request, CreateServicePayload);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(
        jsonBodyMock.metadata.group_id,
        backofficeUserMock.institution.id,
      );
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it.each`
      scenario                                                                         | userRole                  | selcGroups          | group_id      | mockGetGroup
      ${"user is operator and has no groups and group is not set"}                     | ${SelfcareRoles.operator} | ${undefined}        | ${undefined}  | ${undefined}
      ${"user is operator and has groups and group is set and included and is active"} | ${SelfcareRoles.operator} | ${aSelcGroupActive} | ${"aGroupId"} | ${undefined}
      ${"user is admin and has no groups and group is not set"}                        | ${SelfcareRoles.admin}    | ${undefined}        | ${undefined}  | ${undefined}
      ${"user is admin and has groups and group is not set"}                           | ${SelfcareRoles.admin}    | ${aSelcGroupActive} | ${undefined}  | ${undefined}
      ${"user is admin and has groups and group is set and valid"}                     | ${SelfcareRoles.admin}    | ${aSelcGroupActive} | ${aGroup.id}  | ${aSelcGroupActive[0]}
      ${"user is admin and has no groups and group is set and valid"}                  | ${SelfcareRoles.admin}    | ${undefined}        | ${aGroup.id}  | ${aSelcGroupActive[0]}
    `(
      "should forward request when $scenario",
      async ({ userRole, selcGroups, group_id, mockGetGroup }) => {
        // given
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id,
          },
        };
        if (userRole !== SelfcareRoles.admin) {
          isAdminMock.mockReturnValueOnce(false);
        }
        parseBodyMock.mockResolvedValueOnce(jsonBodyMock);
        if (mockGetGroup !== undefined) {
          getGroupMock.mockResolvedValueOnce(mockGetGroup);
        }
        backofficeUserMock.institution.role = userRole;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await POST(request, {});

        // then
        expect(result.status).toBe(200);
        expect(parseBodyMock).toHaveBeenCalledOnce();
        expect(parseBodyMock).toHaveBeenCalledWith(
          request,
          CreateServicePayload,
        );
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        expect(isAdminMock).toHaveBeenCalledOnce();
        expect(isAdminMock).toHaveBeenCalledWith();
        if (mockGetGroup !== undefined) {
          expect(getGroupMock).toHaveBeenCalledOnce();
          expect(getGroupMock).toHaveBeenCalledWith(
            jsonBodyMock.metadata.group_id,
            backofficeUserMock.institution.id,
          );
        } else {
          expect(getGroupMock).not.toHaveBeenCalled();
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

  describe("bulkPatchServices", () => {
    it("should return a forbidden response when user is not an admin", async () => {
      // given
      const request = new NextRequest("http://localhost");
      isAdminMock.mockReturnValueOnce(false);

      // when
      const result = await PATCH(request, {});

      // then
      expect(result.status).toBe(403);
      const jsonBody = await result.json();
      expect(jsonBody.detail).toEqual("Role not authorized");
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(parseBodyMock).not.toHaveBeenCalled();
      expect(groupExistsMock).not.toHaveBeenCalled();
      expect(bulkPatchMock).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return a bad request when fails to parse request body", async () => {
      // given
      const errorMessage = "errorMessage";
      parseBodyMock.mockRejectedValueOnce(new Error(errorMessage));
      const request = new NextRequest("http://localhost");

      // when
      const result = await PATCH(request, {});

      // then
      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(errorMessage);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(
        request,
        BulkPatchServicePayload,
      );
      expect(groupExistsMock).not.toHaveBeenCalled();
      expect(bulkPatchMock).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return a bad request when provided group is not valid", async () => {
      // given
      const request = new NextRequest("http://localhost");
      const requestPayload = {
        services: [
          {
            id: faker.string.uuid(),
            metadata: { group_id: faker.string.uuid() },
          },
        ],
      };
      parseBodyMock.mockResolvedValueOnce(requestPayload);
      groupExistsMock.mockReturnValueOnce(false);

      // when
      const result = await PATCH(request, {});

      // then
      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(
        `Provided group_id '${requestPayload.services[0].metadata.group_id}' does not exists`,
      );
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(
        request,
        BulkPatchServicePayload,
      );
      expect(groupExistsMock).toHaveBeenCalledOnce();
      expect(groupExistsMock).toHaveBeenCalledWith(
        backofficeUserMock.institution.id,
        requestPayload.services[0].metadata.group_id,
      );
      expect(bulkPatchMock).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return an internal error response when bulkPatch fail", async () => {
      // given
      const request = new NextRequest("http://localhost");
      const requestPayload = {
        services: [
          {
            id: faker.string.uuid(),
            metadata: { group_id: faker.string.uuid() },
          },
        ],
      };
      parseBodyMock.mockResolvedValueOnce(requestPayload);
      groupExistsMock.mockReturnValue(true);
      bulkPatchMock.mockRejectedValueOnce({});

      // when
      const result = await PATCH(request, {});

      // then
      expect(result.status).toBe(500);
      const responseBody = await result.json();
      expect(responseBody.title).toStrictEqual("BulkPatchServiceError");
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(
        request,
        BulkPatchServicePayload,
      );
      expect(groupExistsMock).toHaveBeenCalledOnce();
      expect(groupExistsMock).toHaveBeenCalledWith(
        backofficeUserMock.institution.id,
        requestPayload.services[0].metadata.group_id,
      );
      expect(bulkPatchMock).toHaveBeenCalledOnce();
      expect(bulkPatchMock).toHaveBeenCalledWith(requestPayload);
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should execute bulkPatch request", async () => {
      // given
      const request = new NextRequest("http://localhost");
      const requestPayload = {
        services: [
          {
            id: faker.string.uuid(),
            metadata: { group_id: faker.string.uuid() },
          },
          {
            id: faker.string.uuid(),
            metadata: { group_id: faker.string.uuid() },
          },
          {
            id: faker.string.uuid(),
            metadata: { group_id: undefined },
          },
        ],
      };
      parseBodyMock.mockResolvedValueOnce(requestPayload);
      groupExistsMock.mockReturnValue(true);
      bulkPatchMock.mockResolvedValueOnce({});

      // when
      const result = await PATCH(request, {});

      // then
      expect(result.status).toBe(207);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(
        request,
        BulkPatchServicePayload,
      );
      const requestPayloadFiltered = requestPayload.services.filter(
        (item) => item.metadata.group_id,
      );
      expect(groupExistsMock).toHaveBeenCalledTimes(
        requestPayloadFiltered.length,
      );
      requestPayloadFiltered.forEach((item, i) =>
        expect(groupExistsMock).toHaveBeenNthCalledWith(
          i + 1,
          backofficeUserMock.institution.id,
          item.metadata.group_id,
        ),
      );
      expect(bulkPatchMock).toHaveBeenCalledOnce();
      expect(bulkPatchMock).toHaveBeenCalledWith(requestPayload);
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });
  });
});
