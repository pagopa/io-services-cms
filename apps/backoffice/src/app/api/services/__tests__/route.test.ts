import { beforeEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { BulkPatchServicePayload } from "../../../../generated/api/BulkPatchServicePayload";
import { CreateServicePayload } from "../../../../generated/api/CreateServicePayload";
import { ScopeEnum } from "../../../../generated/api/ServiceBaseMetadata";
import { GroupNotFoundError } from "../../../../lib/be/errors";
import { BackOfficeUserEnriched } from "../../../../lib/be/wrappers";
import { SelfcareRoles } from "../../../../types/auth";
import { PATCH, POST } from "../route";

const backofficeUserMock: BackOfficeUserEnriched = {
  id: faker.string.uuid(),
  institution: {
    id: faker.string.uuid(),
    name: faker.company.name(),
    fiscalCode: faker.string.numeric(),
    role: faker.helpers.arrayElement(Object.values(SelfcareRoles)),
    logo_url: faker.image.url(),
    isAggregate: faker.datatype.boolean(),
    isAggregator: faker.datatype.boolean(),
    selcSpecialGroups: [],
  },
  permissions: {
    apimGroups: faker.helpers.multiple(faker.string.alpha),
    selcGroups: faker.helpers.multiple(faker.string.alpha),
  },
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

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    GROUP_AUTHZ_ENABLED: "true",
  };
});

const {
  isAdminMock,
  userAuthzMock,
  getGroupPermissionCheckStrategyMock,
  groupPermissionCheckStrategyMock,
  parseBodyMock,
  groupExistsMock,
  getGroupMock,
  forwardIoServicesCmsRequestMock,
  bulkPatchMock,
  withJWTAuthHandlerMock,
  isSpecialGroupMock,
} = vi.hoisted(() => {
  const isAdminMock = vi.fn(() => true);
  const groupPermissionCheckStrategyMock = vi.fn();
  return {
    isAdminMock,
    getGroupPermissionCheckStrategyMock: vi.fn(
      () => groupPermissionCheckStrategyMock,
    ),
    groupPermissionCheckStrategyMock,
    isSpecialGroupMock: vi.fn(() => false),
    userAuthzMock: vi.fn(() => ({
      isAdmin: isAdminMock,
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

vi.mock("../factory", () => ({
  getGroupPermissionCheckStrategy: getGroupPermissionCheckStrategyMock,
}));

vi.mock("@/lib/be/req-res-utils", () => ({
  parseBody: parseBodyMock,
}));

vi.mock("@/lib/be/institutions/business", () => ({
  groupExists: groupExistsMock,
  getGroup: getGroupMock,
  isSpecialGroup: isSpecialGroupMock,
}));

vi.mock("@/lib/be/services/business", () => ({
  forwardIoServicesCmsRequest: forwardIoServicesCmsRequestMock,
  bulkPatch: bulkPatchMock,
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Services API", () => {
  describe("Create Service", () => {
    it("should return a bad request when fails to parse request body", async () => {
      // given
      const errorMessage = "errorMessage";
      parseBodyMock.mockRejectedValueOnce(new Error(errorMessage));
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await POST(request, {});

      // then
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

    it("should return the authorization error from the group permission strategy", async () => {
      // given
      const groupId = "groupId";
      const request = new NextRequest(new URL("http://localhost"));
      const servicePayload = {
        ...aValidServicePayload,
        metadata: { ...aValidServicePayload.metadata, group_id: groupId },
      };
      const authorizationError = NextResponse.json(
        { detail: "Provided group is out of your scope" },
        { status: 403 },
      );
      parseBodyMock.mockResolvedValueOnce(servicePayload);
      groupPermissionCheckStrategyMock.mockReturnValueOnce(authorizationError);

      // when
      const result = await POST(request, {});

      // then
      expect(result).toBe(authorizationError);
      expect(getGroupPermissionCheckStrategyMock).toHaveBeenCalledWith(groupId);
      expect(groupPermissionCheckStrategyMock).toHaveBeenCalledWith(
        backofficeUserMock,
      );
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should forward the request when the group permission strategy allows access", async () => {
      // given
      const request = new NextRequest(new URL("http://localhost"));
      const servicePayload = {
        ...aValidServicePayload,
        metadata: { ...aValidServicePayload.metadata, group_id: "groupId" },
      };
      parseBodyMock.mockResolvedValueOnce(servicePayload);
      groupPermissionCheckStrategyMock.mockReturnValue(undefined);

      // when
      const result = await POST(request, {});

      // then
      expect(result.status).toBe(200);
      expect(getGroupPermissionCheckStrategyMock).toHaveBeenCalledWith(
        servicePayload.metadata.group_id,
      );
      expect(groupPermissionCheckStrategyMock).toHaveBeenCalledWith(
        backofficeUserMock,
      );
      expect(forwardIoServicesCmsRequestMock).toHaveBeenCalledWith(
        "createService",
        expect.objectContaining({
          backofficeUser: backofficeUserMock,
          nextRequest: request,
        }),
      );
    });
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
      expect(getGroupMock).not.toHaveBeenCalled();
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
      expect(getGroupMock).not.toHaveBeenCalled();
      expect(bulkPatchMock).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return a bad request when provided group is not active", async () => {
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
      getGroupMock.mockReturnValueOnce(aSelcGroupNotActive[0]);

      // when
      const result = await PATCH(request, {});

      // then
      expect(result.status).toBe(403);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(
        `Provided group_id '${requestPayload.services[0].metadata.group_id}' is not active`,
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
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(
        requestPayload.services[0].metadata.group_id,
        backofficeUserMock.institution.id,
      );
      expect(bulkPatchMock).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return a bad request when provided group doesn't exist", async () => {
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
      const groupNotFoundError = new GroupNotFoundError("group not found");
      parseBodyMock.mockResolvedValueOnce(requestPayload);
      getGroupMock.mockRejectedValueOnce(groupNotFoundError);

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
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(
        requestPayload.services[0].metadata.group_id,
        backofficeUserMock.institution.id,
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
      getGroupMock.mockReturnValue(aSelcGroupActive[0]);
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
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(
        requestPayload.services[0].metadata.group_id,
        backofficeUserMock.institution.id,
      );
      expect(bulkPatchMock).toHaveBeenCalledOnce();
      expect(bulkPatchMock).toHaveBeenCalledWith(requestPayload.services);
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
      getGroupMock.mockReturnValue(aSelcGroupActive[0]);
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
      expect(getGroupMock).toHaveBeenCalledTimes(requestPayloadFiltered.length);
      requestPayloadFiltered.forEach((item, i) =>
        expect(getGroupMock).toHaveBeenNthCalledWith(
          i + 1,
          item.metadata.group_id,
          backofficeUserMock.institution.id,
        ),
      );
      expect(bulkPatchMock).toHaveBeenCalledOnce();
      expect(bulkPatchMock).toHaveBeenCalledWith(requestPayload.services);
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });
  });
});
