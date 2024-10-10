import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { SelfcareRoles } from "../../../../types/auth";
import { POST } from "../route";
import { ServicePayload } from "../../../../generated/api/ServicePayload";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ScopeEnum } from "../../../../generated/api/ServiceBaseMetadata";

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

const { retrieveInstitutionGroups } = vi.hoisted(() => ({
  retrieveInstitutionGroups: vi.fn(),
}));

vi.mock("@/lib/be/services/business", () => ({
  forwardIoServicesCmsRequest: forwardIoServicesCmsRequestMock,
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

vi.mock("@/lib/be/institutions/business", () => ({
  retrieveInstitutionGroups,
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
    it.each`
      scenario                 | body
      ${"is not present"}      | ${undefined}
      ${"is not a valid JSON"} | ${"not a valid json"}
    `(
      "should return a bad request when request body $scenario",
      async ({ body }) => {
        // Mock NextRequest
        const request = new NextRequest(new URL("http://localhost"), {
          method: "POST",
          body,
        });

        const result = await POST(request, {});

        expect(result.status).toBe(400);
        const responseBody = await result.json();
        expect(responseBody.detail).not.empty;
        expect(retrieveInstitutionGroups).not.toHaveBeenCalled();
        expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
      },
    );

    it("should return a bad request when request body is not a valid ServicePayload", async () => {
      // Mock NextRequest
      const jsonBodyMock = { foo: "bar" };
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(jsonBodyMock),
      });

      const result = await POST(request, {});

      expect(result.status).toBe(400);
      const responseBody = await result.json();
      expect(responseBody.detail).toMatch(/is not a valid/);
      expect(retrieveInstitutionGroups).not.toHaveBeenCalled();
      expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
    });

    it.each`
      scenario                  | selcGroups
      ${"but he has no groups"} | ${undefined}
      ${"he is not a member"}   | ${faker.helpers.multiple(faker.string.uuid)}
    `(
      "should return a forbidden response when user is not admin and try to set a group but $scenario",
      async ({ selcGroups }) => {
        backofficeUserMock.institution.role = SelfcareRoles.operator;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id: `different-${faker.string.uuid()}`,
          },
        };
        const request = new NextRequest(new URL("http://localhost"), {
          method: "POST",
          body: JSON.stringify(jsonBodyMock),
        });

        const result = await POST(request, {});

        expect(result.status).toBe(403);
        const responseBody = await result.json();
        expect(responseBody.detail).toEqual(
          "Cannot set service group relationship",
        );
        expect(retrieveInstitutionGroups).not.toHaveBeenCalled();
        expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
      },
    );

    it.each`
      scenario        | selcGroups
      ${"has groups"} | ${undefined}
      ${"has groups"} | ${["aGroupId"]}
    `(
      "should return a bad request when group is set but is not valid and user is admin and $scenario",
      async ({ selcGroups }) => {
        retrieveInstitutionGroups.mockResolvedValueOnce({ value: [aGroup] });
        backofficeUserMock.institution.role = SelfcareRoles.admin;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id: "nonExistingGroupId",
          },
        };
        const request = new NextRequest(new URL("http://localhost"), {
          method: "POST",
          body: JSON.stringify(jsonBodyMock),
        });

        const result = await POST(request, {});

        expect(result.status).toBe(400);
        const responseBody = await result.json();
        expect(responseBody.detail).toEqual(
          "Provided group_id does not exists",
        );
        expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
        expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
          backofficeUserMock.institution.id,
          1000,
          0,
        );
        expect(forwardIoServicesCmsRequestMock).not.toHaveBeenCalled();
      },
    );

    it.each`
      scenario                                                           | userRole                  | selcGroups      | group_id      | mockRetrieveInstitutionGroups
      ${"user is operator and has no groups and group is not set"}       | ${SelfcareRoles.operator} | ${undefined}    | ${undefined}  | ${undefined}
      ${"user is operator and has groups and group is set and included"} | ${SelfcareRoles.operator} | ${["aGroupId"]} | ${"aGroupId"} | ${undefined}
      ${"user is admin and has no groups and group is not set"}          | ${SelfcareRoles.admin}    | ${undefined}    | ${undefined}  | ${undefined}
      ${"user is admin and has groups and group is not set"}             | ${SelfcareRoles.admin}    | ${["aGroupId"]} | ${undefined}  | ${undefined}
      ${"user is admin and has groups and group is set and valid"}       | ${SelfcareRoles.admin}    | ${["aGroupId"]} | ${aGroup.id}  | ${{ value: [aGroup] }}
      ${"user is admin and has no groups and group is not set"}          | ${SelfcareRoles.admin}    | ${undefined}    | ${undefined}  | ${undefined}
      ${"user is admin and has no groups and group is set and valid"}    | ${SelfcareRoles.admin}    | ${undefined}    | ${aGroup.id}  | ${{ value: [aGroup] }}
    `(
      "should forward request when $scenario",
      async ({
        userRole,
        selcGroups,
        group_id,
        mockRetrieveInstitutionGroups,
      }) => {
        if (mockRetrieveInstitutionGroups) {
          retrieveInstitutionGroups.mockResolvedValueOnce(
            mockRetrieveInstitutionGroups,
          );
        }
        backofficeUserMock.institution.role = userRole;
        backofficeUserMock.permissions.selcGroups = selcGroups;
        const jsonBodyMock = {
          ...aValidServicePayload,
          metadata: {
            ...aValidServicePayload.metadata,
            group_id,
          },
        };
        const request = new NextRequest(new URL("http://localhost"), {
          method: "POST",
          body: JSON.stringify(jsonBodyMock),
        });
        const result = await POST(request, {});

        expect(result.status).toBe(200);
        if (mockRetrieveInstitutionGroups) {
          expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
          expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
            backofficeUserMock.institution.id,
            1000,
            0,
          );
        } else {
          expect(retrieveInstitutionGroups).not.toHaveBeenCalled();
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
