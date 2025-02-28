import { beforeEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { PatchServicePayload } from "../../../../../generated/api/PatchServicePayload";
import { ServicePayload } from "../../../../../generated/api/ServicePayload";
import { SelfcareRoles } from "../../../../../types/auth";
import { PATCH, PUT } from "../route";

const backofficeUserMock = {
  id: faker.string.uuid(),
  institution: {
    id: faker.string.uuid(),
  },
} as BackOfficeUser;

const {
  isAdminMock,
  userAuthzMock,
  parseBodyMock,
  groupExistsMock,
  forwardIoServicesCmsRequestMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => {
  const isAdminMock = vi.fn(() => true);
  return {
    isAdminMock,
    userAuthzMock: vi.fn(() => ({ isAdmin: isAdminMock })),
    parseBodyMock: vi.fn(),
    groupExistsMock: vi.fn(),
    forwardIoServicesCmsRequestMock: vi.fn<any[], any>(() =>
      NextResponse.json({}, { status: 200 }),
    ),
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

vi.mock("@/lib/be/services/business", () => ({
  forwardIoServicesCmsRequest: forwardIoServicesCmsRequestMock,
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

vi.mock("@/lib/be/req-res-utils", () => ({
  parseBody: parseBodyMock,
}));

vi.mock("@/lib/be/authz", () => ({
  userAuthz: userAuthzMock,
}));

vi.mock("@/lib/be/institutions/business", () => ({
  groupExists: groupExistsMock,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Services API", () => {
  describe("Edit Service", () => {
    const aValidServicePayload = {};
    it("should return a bad request when fails to parse request body", async () => {
      // given
      const errorMessage = "errorMessage";
      parseBodyMock.mockRejectedValueOnce(new Error(errorMessage));
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await PUT(request, {});

      // then
      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(errorMessage);
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(request, ServicePayload);
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should forward request", async () => {
      // given
      const jsonBodyMock = aValidServicePayload;
      parseBodyMock.mockResolvedValueOnce(aValidServicePayload);
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

  describe("patchService", () => {
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
      expect(parseBodyMock).toHaveBeenCalledWith(request, PatchServicePayload);
      expect(groupExistsMock).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it("should return a bad request when provided group is not valid", async () => {
      // given
      const request = new NextRequest("http://localhost");
      const requestPayload = { metadata: { group_id: "groupId" } };
      parseBodyMock.mockResolvedValueOnce(requestPayload);
      groupExistsMock.mockReturnValueOnce(false);

      // when
      const result = await PATCH(request, {});

      // then
      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toStrictEqual(
        "Provided group_id does not exists",
      );
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(parseBodyMock).toHaveBeenCalledOnce();
      expect(parseBodyMock).toHaveBeenCalledWith(request, PatchServicePayload);
      expect(groupExistsMock).toHaveBeenCalledOnce();
      expect(groupExistsMock).toHaveBeenCalledWith(
        backofficeUserMock.institution.id,
        requestPayload.metadata.group_id,
      );
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it.each`
      scenario                           | requestPayload
      ${"group_id is defined and valid"} | ${{ metadata: { group_id: undefined } }}
      ${"group_id is not defined"}       | ${{ metadata: { group_id: "groupId" } }}
    `(
      "should forward patchService request when $scenario",
      async ({ requestPayload }) => {
        // given
        const request = new NextRequest("http://localhost");
        const params = { serviceId: faker.string.uuid() };
        parseBodyMock.mockResolvedValueOnce(requestPayload);
        if (requestPayload.metadata.group_id) {
          groupExistsMock.mockReturnValueOnce(true);
        }
        forwardIoServicesCmsRequestMock.mockReturnValueOnce(
          new NextResponse(null, { status: 204 }),
        );
        // when
        const result = await PATCH(request, { params });

        // then
        expect(result.status).toBe(204);
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        expect(isAdminMock).toHaveBeenCalledOnce();
        expect(isAdminMock).toHaveBeenCalledWith();
        expect(parseBodyMock).toHaveBeenCalledOnce();
        expect(parseBodyMock).toHaveBeenCalledWith(
          request,
          PatchServicePayload,
        );
        if (requestPayload.metadata.group_id) {
          expect(groupExistsMock).toHaveBeenCalledOnce();
          expect(groupExistsMock).toHaveBeenCalledWith(
            backofficeUserMock.institution.id,
            requestPayload.metadata.group_id,
          );
        } else {
          expect(groupExistsMock).not.toHaveBeenCalled();
        }
        expect(forwardIoServicesCmsRequestMock).toHaveBeenCalledOnce();
        expect(forwardIoServicesCmsRequestMock).toHaveBeenCalledWith(
          "patchServiceWorkaround",
          {
            backofficeUser: backofficeUserMock,
            jsonBody: requestPayload,
            nextRequest: request,
            pathParams: params,
          },
        );
      },
    );
  });
});
