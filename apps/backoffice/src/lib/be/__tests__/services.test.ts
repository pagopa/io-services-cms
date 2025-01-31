import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { ValidationError } from "io-ts";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser, Institution } from "../../../../types/next-auth";
import { Group, StateEnum } from "../../../generated/api/Group";
import { MigrationData } from "../../../generated/api/MigrationData";
import { MigrationDelegate } from "../../../generated/api/MigrationDelegate";
import { MigrationItem } from "../../../generated/api/MigrationItem";
import { ServiceLifecycleStatusTypeEnum } from "../../../generated/services-cms/ServiceLifecycleStatusType";
import { ServiceTopicList } from "../../../generated/services-cms/ServiceTopicList";
import {
  forwardIoServicesCmsRequest,
  retrieveOrganizationDelegates,
  retrieveServiceList,
  retrieveUnboundedGroupServices,
} from "../services/business";

const mocks: {
  statusOK: number;
  statusNoContent: number;
  aSamplePayload: { test: string };
  aModificationDate: Date;
  aBaseServiceLifecycle: ServiceLifecycle.ItemType;
  anUserId: string;
  anInstitution: Institution;
  migrationItem: MigrationItem;
  migrationData: MigrationData;
  migrationDelegate: MigrationDelegate;
  aServiceTopicsListResponse: ServiceTopicList;
  aGroup: Group;
} = vi.hoisted(() => {
  const aModificationDate = new Date();
  return {
    statusOK: 200,
    statusNoContent: 204,
    aSamplePayload: { test: "test" },
    aModificationDate,
    aBaseServiceLifecycle: {
      id: "aServiceId",
      modified_at: aModificationDate.getTime(),
      data: {
        name: "aServiceName",
        description: "aServiceDescription",
        authorized_recipients: [],
        authorized_cidrs: [],
        max_allowed_payment_amount: 123,
        metadata: {
          address: "via tal dei tali 123",
          email: "service@email.it",
          pec: "service@pec.it",
          scope: "LOCAL",
        },
        organization: {
          name: "anOrganizationName",
          fiscal_code: "12345678901",
        },
        require_secure_channel: false,
      },
      fsm: {
        state: "draft",
      },
    } as unknown as ServiceLifecycle.ItemType,
    anUserId: "anUserId",
    anInstitution: {
      id: "anInstitutionId",
      name: "anInstitutionName",
      fiscalCode: "12345678901",
      role: "admin",
    },
    migrationItem: {
      status: {
        completed: 99,
        failed: 7,
        initial: 63,
        processing: 94,
      },
      delegate: {
        sourceId: "3ef50230-9c1f-4cf0-9f4d-af6c0dcf6288",
        sourceName: "Name",
        sourceSurname: "Surname",
        sourceEmail: "test@email.test",
      },
      lastUpdate: "2023-05-05T14:25:49.277Z",
    } as MigrationItem,
    migrationData: {
      status: {
        completed: 31,
        failed: 64,
        initial: 31,
        processing: 25,
      },
    } as MigrationData,
    migrationDelegate: {
      sourceId: "c7fd5462-7fa2-4321-a4a4-237523445d1c",
      sourceName: "Name",
      sourceSurname: "Surname",
      sourceEmail: "test@test.test",
      subscriptionCounter: 17,
    } as MigrationDelegate,
    aServiceTopicsListResponse: {
      topics: [
        {
          id: 1,
          name: "Ambiente e animali",
        },
      ],
    } as ServiceTopicList,
    aGroup: {
      id: "group_id",
      name: "group name",
      state: "ACTIVE" as StateEnum,
    },
  };
});

const aBackofficeUser: BackOfficeUser = {
  id: "selcUserId",
  permissions: {
    apimGroups: ["permission1", "permission2"],
  },
  parameters: {
    userEmail: "anEmail@email.it",
    userId: mocks.anUserId,
    subscriptionId: "aSubscriptionId",
  },
  institution: mocks.anInstitution,
};

const {
  getIoServicesCmsClient,
  getTopicsProvider,
  getSubscriptionsMigrationClient,
  getSubscriptionsMock,
  retrieveLifecycleServicesMock,
  retrievePublicationServicesMock,
  retrieveInstitutionGroups,
  getGroupMock,
  retrieveAuthorizedServiceIdsMock,
  retrieveGroupUnboundedServicesMock,
  isAdminMock,
  userAuthzMock,
} = vi.hoisted(() => {
  const isAdminMock = vi.fn(() => false);
  return {
    getIoServicesCmsClient: vi.fn().mockReturnValue({
      getServices: vi.fn(() =>
        Promise.resolve(
          E.of({ status: mocks.statusOK, value: mocks.aSamplePayload }),
        ),
      ),
      createService: vi.fn(() =>
        Promise.resolve(
          E.of({ status: mocks.statusOK, value: mocks.aSamplePayload }),
        ),
      ),
      reviewService: vi.fn(() =>
        Promise.resolve(
          E.of({ status: mocks.statusNoContent, value: undefined }),
        ),
      ),
    }),
    getTopicsProvider: vi.fn(() => ({
      getServiceTopics: vi.fn(() =>
        Promise.resolve(mocks.aServiceTopicsListResponse),
      ),
    })),
    getSubscriptionsMigrationClient: vi.fn().mockReturnValue({
      getLatestOwnershipClaimStatus: vi.fn(() =>
        TE.right({
          items: [mocks.migrationItem],
        }),
      ),
      getOwnershipClaimStatus: vi.fn(() => TE.right(mocks.migrationData)),
      claimOwnership: vi.fn(() => TE.right(void 0)),
      getDelegatesByOrganization: vi.fn(() =>
        TE.right({
          delegates: [mocks.migrationDelegate],
        }),
      ),
    }),
    getSubscriptionsMock: vi.fn(),
    retrieveLifecycleServicesMock: vi.fn(),
    retrievePublicationServicesMock: vi.fn(),
    retrieveInstitutionGroups: vi.fn(),
    getGroupMock: vi.fn(),
    retrieveAuthorizedServiceIdsMock: vi.fn(),
    retrieveGroupUnboundedServicesMock: vi.fn(),
    isAdminMock,
    userAuthzMock: vi.fn(() => ({ isAdmin: isAdminMock })),
  };
});

vi.mock("@/lib/be/subscription-migration-client", () => ({
  getSubscriptionsMigrationClient,
}));

vi.mock("@/lib/be/cms-client", () => ({
  getIoServicesCmsClient,
  getTopicsProvider,
}));

vi.mock("@/lib/be/services/apim", () => ({
  getSubscriptions: getSubscriptionsMock,
}));

vi.mock("@/lib/be/services/cosmos", () => ({
  retrieveLifecycleServices: retrieveLifecycleServicesMock,
  retrievePublicationServices: retrievePublicationServicesMock,
  retrieveAuthorizedServiceIds: retrieveAuthorizedServiceIdsMock,
  retrieveGroupUnboundedServices: retrieveGroupUnboundedServicesMock,
}));

vi.mock("@/lib/be/institutions/business", () => ({
  retrieveInstitutionGroups,
  getGroup: getGroupMock,
}));

vi.mock("@/lib/be/authz", () => ({
  userAuthz: userAuthzMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Services TEST", () => {
  describe("forwardIoServicesCmsRequest", () => {
    it.each`
      scenario                                | backofficeUser
      ${"user is admin with groups"}          | ${{ ...aBackofficeUser, permissions: { ...aBackofficeUser.permissions, selcGroups: ["id"] }, institution: { role: "admin" } }}
      ${"user is not admin and has no group"} | ${{ ...aBackofficeUser, permissions: { ...aBackofficeUser.permissions, selcGroups: undefined }, institution: { role: "operator" } }}
    `(
      "request without body request and with response body when $scenario",
      async ({ backofficeUser }) => {
        // given
        isAdminMock.mockReturnValueOnce(
          backofficeUser.institution.role === "admin",
        );
        const getServices = vi.fn(() =>
          Promise.resolve(E.of({ status: 200, value: { test: "test" } })),
        );
        getIoServicesCmsClient.mockReturnValueOnce({
          getServices,
        });

        // Mock NextRequest
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await forwardIoServicesCmsRequest("getServices", {
          nextRequest: request,
          backofficeUser,
        });

        // then
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUser);
        expect(isAdminMock).toHaveBeenCalledOnce();
        expect(isAdminMock).toHaveBeenCalledWith();
        expect(getServices).toHaveBeenCalled();
        expect(getServices).toHaveBeenCalledWith(
          expect.objectContaining({
            "x-user-email": backofficeUser.parameters.userEmail,
            "x-user-id": backofficeUser.parameters.userId,
            "x-subscription-id": backofficeUser.parameters.subscriptionId,
            "x-user-groups": backofficeUser.permissions.apimGroups.join(","),
            "x-user-groups-selc":
              backofficeUser.institution.role === "admin"
                ? ""
                : (backofficeUser.permissions.selcGroups?.join(",") ?? ""),
            "x-channel": "BO",
          }),
        );

        expect(result.status).toBe(200);
        expect(result.body).not.toBe(null);
      },
    );

    it.each`
      scenario                    | aResponseBody                                                                       | expectedResponseBody
      ${"non paginated response"} | ${{ foo: "foo", metadata: { bar: "bar", group_id: mocks.aGroup.id } }}              | ${{ foo: "foo", metadata: { bar: "bar", group: mocks.aGroup } }}
      ${"paginated response"}     | ${{ value: [{ foo: "foo", metadata: { bar: "bar", group_id: mocks.aGroup.id } }] }} | ${{ value: [{ foo: "foo", metadata: { bar: "bar", group: mocks.aGroup } }] }}
    `(
      "should map the $scenario group_id into a Group model",
      async ({ scenario, aResponseBody, expectedResponseBody }) => {
        // given
        const getServices = vi.fn(() =>
          Promise.resolve(
            E.of({
              status: 200,
              value: aResponseBody,
            }),
          ),
        );
        getIoServicesCmsClient.mockReturnValueOnce({
          getServices,
        });
        if (scenario === "paginated response") {
          retrieveInstitutionGroups.mockResolvedValueOnce([mocks.aGroup]);
        } else {
          getGroupMock.mockResolvedValueOnce(mocks.aGroup);
        }

        // Mock NextRequest
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await forwardIoServicesCmsRequest("getServices", {
          nextRequest: request,
          backofficeUser: aBackofficeUser,
        });

        // then
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
        expect(isAdminMock).toHaveBeenCalledOnce();
        expect(isAdminMock).toHaveBeenCalledWith();
        expect(getServices).toHaveBeenCalled();
        expect(getServices).toHaveBeenCalledWith(
          expect.objectContaining({
            "x-user-email": aBackofficeUser.parameters.userEmail,
            "x-user-id": aBackofficeUser.parameters.userId,
            "x-subscription-id": aBackofficeUser.parameters.subscriptionId,
            "x-user-groups": aBackofficeUser.permissions.apimGroups.join(","),
            "x-user-groups-selc":
              aBackofficeUser.permissions.selcGroups?.join(",") ?? "",
            "x-channel": "BO",
          }),
        );
        if (scenario === "paginated response") {
          expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
          expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
            aBackofficeUser.institution.id,
          );
        } else {
          expect(getGroupMock).toHaveBeenCalledOnce();
          expect(getGroupMock).toHaveBeenCalledWith(
            aResponseBody.metadata.group_id,
            aBackofficeUser.institution.id,
          );
        }

        expect(result.status).toBe(200);
        const jsonBody = await result.json();
        expect(jsonBody).toStrictEqual(expectedResponseBody);
      },
    );

    it("request with body request and with response body", async () => {
      // given
      const createService = vi.fn(() =>
        Promise.resolve(E.of({ status: 200, value: { test: "test" } })),
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        createService,
      });

      const aBodyPayload = {
        name: "test",
        description: "test",
      };

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload),
      });

      // when
      const result = await forwardIoServicesCmsRequest("createService", {
        nextRequest: request,
        backofficeUser: aBackofficeUser,
        pathParams: {
          serviceId: "test",
        },
      });

      // then
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(createService).toHaveBeenCalled();
      expect(createService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": aBackofficeUser.parameters.userEmail,
          "x-user-id": aBackofficeUser.parameters.userId,
          "x-subscription-id": aBackofficeUser.parameters.subscriptionId,
          "x-user-groups": aBackofficeUser.permissions.apimGroups.join(","),
          "x-user-groups-selc":
            aBackofficeUser.permissions.selcGroups?.join(",") ?? "",
          "x-channel": "BO",
          body: aBodyPayload,
          serviceId: "test",
        }),
      );

      expect(result.status).toBe(200);
      expect(result.body).not.toBe(null);
    });

    it("request without body response", async () => {
      // given
      const reviewService = vi.fn(() =>
        Promise.resolve(E.of({ status: 204, value: undefined })),
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        reviewService,
      });

      const aBodyPayload = {
        name: "test",
      };

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload),
      });

      // when
      const result = await forwardIoServicesCmsRequest("reviewService", {
        nextRequest: request,
        backofficeUser: aBackofficeUser,
        pathParams: {
          serviceId: "test",
        },
      });

      // then
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(reviewService).toHaveBeenCalled();
      expect(reviewService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": aBackofficeUser.parameters.userEmail,
          "x-user-id": aBackofficeUser.parameters.userId,
          "x-subscription-id": aBackofficeUser.parameters.subscriptionId,
          "x-user-groups": aBackofficeUser.permissions.apimGroups.join(","),
          "x-user-groups-selc":
            aBackofficeUser.permissions.selcGroups?.join(",") ?? "",
          "x-channel": "BO",
          body: aBodyPayload,
          serviceId: "test",
        }),
      );

      expect(result.status).toBe(204);
      expect(result.body).toBe(null);
    });

    it("fn call with explicitly body and expect response body", async () => {
      // given
      const createService = vi.fn(() =>
        Promise.resolve(E.of({ status: 200, value: { test: "test" } })),
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        createService,
      });

      // Mock request body
      const aBodyPayload = {
        name: "test",
        description: "test",
      };

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload),
      });

      // when
      const result = await forwardIoServicesCmsRequest("createService", {
        nextRequest: request,
        backofficeUser: aBackofficeUser,
        jsonBody: aBodyPayload,
        pathParams: {
          serviceId: "test",
        },
      });

      // then
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(createService).toHaveBeenCalled();
      expect(createService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": aBackofficeUser.parameters.userEmail,
          "x-user-id": aBackofficeUser.parameters.userId,
          "x-subscription-id": aBackofficeUser.parameters.subscriptionId,
          "x-user-groups": aBackofficeUser.permissions.apimGroups.join(","),
          "x-user-groups-selc":
            aBackofficeUser.permissions.selcGroups?.join(",") ?? "",
          "x-channel": "BO",
          body: aBodyPayload,
          serviceId: "test",
        }),
      );

      expect(result.status).toBe(200);
      expect(result.body).not.toBe(null);
    });

    it("ValidationErrors occurs on request", async () => {
      // given
      const validationError: ValidationError[] = [
        {
          value: "test",
          context: [
            {
              key: "test",
              type: "string",
              actual: "test",
              message: "test",
            },
          ],
          message: "test",
        } as any,
      ];

      // Mock io-services-cms client
      const reviewService = vi.fn(() =>
        Promise.resolve(E.left(validationError)),
      );
      getIoServicesCmsClient.mockReturnValueOnce({
        reviewService,
      });

      const aBodyPayload = {
        name: "test",
      };

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"), {
        method: "POST",
        body: JSON.stringify(aBodyPayload),
      });

      // when
      const result = await forwardIoServicesCmsRequest("reviewService", {
        nextRequest: request,
        backofficeUser: aBackofficeUser,
        pathParams: {
          serviceId: "test",
        },
      });

      // then
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(reviewService).toHaveBeenCalled();
      expect(reviewService).toHaveBeenCalledWith(
        expect.objectContaining({
          "x-user-email": aBackofficeUser.parameters.userEmail,
          "x-user-id": aBackofficeUser.parameters.userId,
          "x-subscription-id": aBackofficeUser.parameters.subscriptionId,
          "x-user-groups": aBackofficeUser.permissions.apimGroups.join(","),
          "x-user-groups-selc":
            aBackofficeUser.permissions.selcGroups?.join(",") ?? "",
          "x-channel": "BO",
          body: aBodyPayload,
          serviceId: "test",
        }),
      );

      expect(result.status).toBe(400);
      expect(result.body).not.toBe(null);
    });
  });

  describe("retrieveServiceList", () => {
    it.each`
      scenario                                | backofficeUser
      ${"user is admin with groups"}          | ${{ ...aBackofficeUser, permissions: { ...aBackofficeUser.permissions, selcGroups: ["id"] }, institution: { role: "admin" } }}
      ${"user is not admin and has no group"} | ${{ ...aBackofficeUser, permissions: { ...aBackofficeUser.permissions, selcGroups: undefined }, institution: { role: "operator" } }}
    `(
      "should return a list of services with visibility when $scenario",
      async ({ backofficeUser }) => {
        // given
        const aServiceinPublicationId = "aServiceInPublicationId";
        const aServiceNotInPublicationId = "aServiceNotInPublicationId";
        isAdminMock.mockReturnValueOnce(
          backofficeUser.institution.role === "admin",
        );

        getSubscriptionsMock.mockReturnValueOnce(
          TE.right({
            value: [
              {
                name: aServiceinPublicationId,
              },
              {
                name: aServiceNotInPublicationId,
              },
            ],
            count: 2,
          }),
        );
        retrieveInstitutionGroups.mockResolvedValueOnce([mocks.aGroup]);
        retrieveLifecycleServicesMock.mockImplementationOnce((ids: string[]) =>
          TE.right(
            ids.map((id) => ({
              ...mocks.aBaseServiceLifecycle,
              id,
            })),
          ),
        );
        retrievePublicationServicesMock.mockImplementationOnce(
          (ids: string[]) =>
            TE.right(
              ids
                .filter((id) => id === aServiceinPublicationId)
                .map((id) => ({
                  id,
                  name: "aServiceName",
                  fsm: {
                    state: "published",
                  },
                })),
            ),
        );

        // Mock NextRequest
        const request = new NextRequest(new URL("http://localhost"));

        // when
        const result = await retrieveServiceList(
          request,
          backofficeUser,
          10,
          0,
        );

        // then
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUser);
        expect(isAdminMock).toHaveBeenCalledOnce();
        expect(isAdminMock).toHaveBeenCalledWith();
        expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
        expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
          backofficeUser.institution.id,
        );
        expect(getSubscriptionsMock).toHaveBeenCalledOnce();
        expect(getSubscriptionsMock).toHaveBeenCalledWith(
          backofficeUser.parameters.userId,
          10,
          0,
          undefined,
        );
        expect(retrieveLifecycleServicesMock).toHaveBeenCalledOnce();
        expect(retrieveLifecycleServicesMock).toHaveBeenCalledWith([
          aServiceinPublicationId,
          aServiceNotInPublicationId,
        ]);
        expect(retrievePublicationServicesMock).toHaveBeenCalledOnce();
        expect(retrievePublicationServicesMock).toHaveBeenCalledWith([
          aServiceinPublicationId,
          aServiceNotInPublicationId,
        ]);

        expect(result).toEqual({
          value: [
            {
              id: aServiceinPublicationId,
              visibility: "published",
              status: { value: "draft" },
              last_update:
                mocks.aModificationDate.toISOString() as NonEmptyString,
              name: "aServiceName",
              description: "aServiceDescription",
              organization: {
                name: "anOrganizationName",
                fiscal_code: "12345678901",
              },
              metadata: {
                address: "via tal dei tali 123",
                email: "service@email.it",
                pec: "service@pec.it",
                scope: "LOCAL",
                category: "STANDARD",
              },
              authorized_recipients: [],
              authorized_cidrs: [],
            },
            {
              id: aServiceNotInPublicationId,
              status: { value: "draft" },
              last_update:
                mocks.aModificationDate.toISOString() as NonEmptyString,
              name: "aServiceName",
              description: "aServiceDescription",
              organization: {
                name: "anOrganizationName",
                fiscal_code: "12345678901",
              },
              metadata: {
                address: "via tal dei tali 123",
                email: "service@email.it",
                pec: "service@pec.it",
                scope: "LOCAL",
                category: "STANDARD",
              },
              authorized_recipients: [],
              authorized_cidrs: [],
            },
          ],
          pagination: { count: 2, limit: 10, offset: 0 },
        });
      },
    );

    it("should return a list of services with visibility enriched with topic", async () => {
      // given
      const aServiceinPublicationId = "aServiceInPublicationId";

      getSubscriptionsMock.mockReturnValueOnce(
        TE.right({
          value: [
            {
              name: aServiceinPublicationId,
            },
          ],
          count: 1,
        }),
      );
      retrieveInstitutionGroups.mockResolvedValueOnce([mocks.aGroup]);
      retrieveLifecycleServicesMock.mockImplementationOnce((ids: string[]) =>
        TE.right(
          ids.map((id) => ({
            ...mocks.aBaseServiceLifecycle,
            id,
            data: {
              ...mocks.aBaseServiceLifecycle.data,
              metadata: {
                ...mocks.aBaseServiceLifecycle.data.metadata,
                topic_id: 1,
              },
            },
          })),
        ),
      );
      retrievePublicationServicesMock.mockImplementationOnce((ids: string[]) =>
        TE.right(
          ids
            .filter((id) => id === aServiceinPublicationId)
            .map((id) => ({
              id,
              name: "aServiceName",
              fsm: {
                state: "published",
              },
            })),
        ),
      );

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await retrieveServiceList(request, aBackofficeUser, 10, 0);

      // then
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
      expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
        aBackofficeUser.institution.id,
      );
      expect(getSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getSubscriptionsMock).toHaveBeenCalledWith(
        aBackofficeUser.parameters.userId,
        10,
        0,
        undefined,
      );
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledOnce();
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledWith([
        aServiceinPublicationId,
      ]);
      expect(retrievePublicationServicesMock).toHaveBeenCalledOnce();
      expect(retrievePublicationServicesMock).toHaveBeenCalledWith([
        aServiceinPublicationId,
      ]);

      expect(result).toEqual({
        value: [
          {
            id: aServiceinPublicationId,
            visibility: "published",
            status: { value: "draft" },
            last_update:
              mocks.aModificationDate.toISOString() as NonEmptyString,
            name: "aServiceName",
            description: "aServiceDescription",
            organization: {
              name: "anOrganizationName",
              fiscal_code: "12345678901",
            },
            metadata: {
              address: "via tal dei tali 123",
              email: "service@email.it",
              pec: "service@pec.it",
              scope: "LOCAL",
              category: "STANDARD",
              topic: {
                id: 1,
                name: "Ambiente e animali",
              },
            },
            authorized_recipients: [],
            authorized_cidrs: [],
          },
        ],
        pagination: { count: 1, limit: 10, offset: 0 },
      });
    });

    // This is a BORDER CASE, this can happen only if a service is manually deleted from services-lifecycle cosmos container
    // and not on apim, in such remote case we still return the list of services
    it("when a service is found on apim and not service-lifecycle a placeholder should be included in list", async () => {
      // given
      const aServiceInLifecycleId = "aServiceInLifecycleId";
      const aServiceNotInLifecycleId = "aServiceNotInLifecycleId";
      const aServiceNotInLifecycleCreateDate = new Date();

      getSubscriptionsMock.mockReturnValueOnce(
        TE.right({
          value: [
            {
              name: aServiceInLifecycleId,
            },
            {
              name: aServiceNotInLifecycleId,
              createdDate: aServiceNotInLifecycleCreateDate,
            },
          ],
          count: 2,
        }),
      );
      retrieveInstitutionGroups.mockResolvedValueOnce([mocks.aGroup]);
      retrieveLifecycleServicesMock.mockReturnValueOnce(
        TE.right([
          {
            ...mocks.aBaseServiceLifecycle,
            id: aServiceInLifecycleId,
          },
        ]),
      );
      retrievePublicationServicesMock.mockReturnValueOnce(
        TE.right([
          {
            id: aServiceInLifecycleId,
            name: "aServiceName",
            fsm: {
              state: "published",
            },
          },
        ]),
      );

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      // when
      const result = await retrieveServiceList(request, aBackofficeUser, 10, 0);

      // then
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
      expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
        aBackofficeUser.institution.id,
      );
      expect(getSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getSubscriptionsMock).toHaveBeenCalledWith(
        aBackofficeUser.parameters.userId,
        10,
        0,
        undefined,
      );
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledOnce();
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledWith([
        aServiceInLifecycleId,
        aServiceNotInLifecycleId,
      ]);
      expect(retrievePublicationServicesMock).toHaveBeenCalledOnce();
      expect(retrievePublicationServicesMock).toHaveBeenCalledWith([
        aServiceInLifecycleId,
      ]);

      expect(result).toEqual({
        value: [
          {
            id: aServiceInLifecycleId,
            visibility: "published",
            status: { value: "draft" },
            last_update: mocks.aModificationDate.toISOString(),
            name: "aServiceName",
            description: "aServiceDescription",
            organization: {
              name: "anOrganizationName",
              fiscal_code: "12345678901",
            },
            metadata: {
              address: "via tal dei tali 123",
              email: "service@email.it",
              pec: "service@pec.it",
              scope: "LOCAL",
              category: "STANDARD",
            },
            authorized_recipients: [],
            authorized_cidrs: [],
          },
          expect.objectContaining({
            description: "Descrizione non disponibile",
            id: aServiceNotInLifecycleId,
            last_update: aServiceNotInLifecycleCreateDate.toISOString(),
            name: "Servizio non disponibile",
            organization: {
              fiscal_code: aBackofficeUser.institution.fiscalCode,
              name: aBackofficeUser.institution.name,
            },
            status: {
              value: ServiceLifecycleStatusTypeEnum.deleted,
            },
          }),
        ],
        pagination: { count: 2, limit: 10, offset: 0 },
      });
    });

    it("when retrieveInstitutionGroups fails an error is returned", async () => {
      // given
      const error = new Error("error from retrieveInstitutionGroups");
      retrieveInstitutionGroups.mockRejectedValueOnce(error);

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      // when and then
      await expect(
        retrieveServiceList(request, aBackofficeUser, 10, 0),
      ).rejects.toThrowError(error);

      expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
      expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
        aBackofficeUser.institution.id,
      );
      expect(userAuthzMock).not.toHaveBeenCalledOnce();
      expect(isAdminMock).not.toHaveBeenCalledOnce();
      expect(getSubscriptionsMock).not.toHaveBeenCalledOnce();
      expect(retrieveLifecycleServicesMock).not.toHaveBeenCalledOnce();
      expect(retrievePublicationServicesMock).not.toHaveBeenCalledOnce();
    });

    it("when retrievePublicationServices fails an error is returned", async () => {
      // given
      getSubscriptionsMock.mockReturnValueOnce(
        TE.right({
          value: [
            {
              name: mocks.aBaseServiceLifecycle.id,
            },
          ],
          count: 1,
        }),
      );
      retrieveInstitutionGroups.mockResolvedValueOnce([mocks.aGroup]);
      retrieveLifecycleServicesMock.mockReturnValueOnce(
        TE.right([mocks.aBaseServiceLifecycle]),
      );
      retrievePublicationServicesMock.mockReturnValueOnce(
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: "error",
        }),
      );

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      // when and then
      await expect(
        retrieveServiceList(request, aBackofficeUser, 10, 0),
      ).rejects.toThrowError();
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
      expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
        aBackofficeUser.institution.id,
      );
      expect(getSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getSubscriptionsMock).toHaveBeenCalledWith(
        aBackofficeUser.parameters.userId,
        10,
        0,
        undefined,
      );
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledOnce();
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id,
      ]);
      expect(retrievePublicationServicesMock).toHaveBeenCalledOnce();
      expect(retrievePublicationServicesMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id,
      ]);
    });

    it("when retrieveLifecycleServices fails an error is returned", async () => {
      // given
      getSubscriptionsMock.mockReturnValueOnce(
        TE.right({
          value: [
            {
              name: mocks.aBaseServiceLifecycle.id,
            },
          ],
          count: 1,
        }),
      );
      retrieveInstitutionGroups.mockResolvedValueOnce([mocks.aGroup]);
      retrieveLifecycleServicesMock.mockReturnValueOnce(
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: "error",
        }),
      );

      // Mock NextRequest
      const request = new NextRequest(new URL("http://localhost"));

      // when and then
      await expect(
        retrieveServiceList(request, aBackofficeUser, 10, 0),
      ).rejects.toThrowError();
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(aBackofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
      expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
        aBackofficeUser.institution.id,
      );
      expect(getSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getSubscriptionsMock).toHaveBeenCalledWith(
        aBackofficeUser.parameters.userId,
        10,
        0,
        undefined,
      );
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledOnce();
      expect(retrieveLifecycleServicesMock).toHaveBeenCalledWith([
        mocks.aBaseServiceLifecycle.id,
      ]);
      expect(retrievePublicationServicesMock).not.toHaveBeenCalled();
    });

    it("should return an error when selcGroups has at leas one element but retrieveAuthorizedServiceIds fails", async () => {
      // given
      const error = new Error("message");
      retrieveInstitutionGroups.mockResolvedValueOnce([
        mocks.aGroup,
        { id: "g1", name: "group1", state: "ACTIVE" },
        { id: "g2", name: "group2", state: "ACTIVE" },
      ]);
      retrieveAuthorizedServiceIdsMock.mockReturnValueOnce(TE.left(error));
      const request = new NextRequest(new URL("http://localhost"));
      const backofficeUser = {
        ...aBackofficeUser,
        permissions: {
          ...aBackofficeUser.permissions,
          selcGroups: ["g1", "g2"],
        },
      };

      // when and then
      await expect(
        retrieveServiceList(request, backofficeUser, 10, 0),
      ).rejects.toThrowError(error);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUser);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(retrieveInstitutionGroups).toHaveBeenCalled();
      expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
        backofficeUser.institution.id,
      );
      expect(retrieveAuthorizedServiceIdsMock).toHaveBeenCalledOnce();
      expect(retrieveAuthorizedServiceIdsMock).toHaveBeenCalledWith(
        backofficeUser.permissions.selcGroups,
      );
      expect(getSubscriptionsMock).not.toHaveBeenCalled();
      expect(retrieveLifecycleServicesMock).not.toHaveBeenCalled();
      expect(retrievePublicationServicesMock).not.toHaveBeenCalled();
    });

    const getExpectedGetSubscriptionsFilter = (
      authzServiceIds: string[],
      selcGroups?: string[],
      serviceId?: string,
    ) =>
      selcGroups && selcGroups.length > 0
        ? authzServiceIds.length > 0
          ? serviceId
            ? authzServiceIds.includes(serviceId)
              ? serviceId
              : []
            : authzServiceIds
          : []
        : serviceId;

    const isGroupActive = (
      selcGroup: string,
      institutionGroups: Group[],
    ): boolean => {
      return institutionGroups.some(
        (group) => group.id === selcGroup && group.state === StateEnum.ACTIVE,
      );
    };

    const getExpectedActiveGroups = (
      selcGroups: string[],
      institutionGroups: Group[],
    ): string[] => {
      return selcGroups.filter((selcGroup) =>
        isGroupActive(selcGroup, institutionGroups),
      );
    };

    it.each`
      scenario                                                                                                                                                     | selcGroups      | institutionGroups                                                                                                | serviceId      | authzServiceIds
      ${"selcGroups is undefined, groupMap (doesn't matters), serviceId is undefined (authzServiceIds doesn't matters)"}                                           | ${undefined}    | ${[]}                                                                                                            | ${undefined}   | ${undefined}
      ${"selcGroups has no elements, groupMap (doesn't matters), serviceId is undefined (authzServiceIds doesn't matters)"}                                        | ${[]}           | ${[]}                                                                                                            | ${undefined}   | ${undefined}
      ${"selcGroups is undefined, groupMap (doesn't matters), serviceId is defined (authzServiceIds doesn't matters)"}                                             | ${undefined}    | ${[]}                                                                                                            | ${"serviceId"} | ${undefined}
      ${"selcGroups has no elements, groupMap (doesn't matters), serviceId is defined (authzServiceIds doesn't matters)"}                                          | ${[]}           | ${[]}                                                                                                            | ${"serviceId"} | ${undefined}
      ${"selcGroups has at least one element, groupMap has no matching group, serviceId is undefined and authzServiceIds is empty"}                                | ${["group_id"]} | ${[{ id: "g1", name: "group", state: "ACTIVE" }]}                                                                | ${undefined}   | ${[]}
      ${"selcGroups has at least one element, groupMap has matching group but is not active, serviceId is undefined and authzServiceIds is empty"}                 | ${["group_id"]} | ${[{ id: "group_id", name: "group", state: "SUSPENDED" }]}                                                       | ${undefined}   | ${[]}
      ${"selcGroups has at least one element, groupMap has an active matching group, serviceId is  undefined and authzServiceIds is empty"}                        | ${["group_id"]} | ${[{ id: "group_id", name: "group", state: "ACTIVE" }]}                                                          | ${undefined}   | ${[]}
      ${"selcGroups has at least one element, groupMap has an active matching group and a non active group, serviceId is  undefined and authzServiceIds is empty"} | ${["group_id"]} | ${[{ id: "group_id", name: "group", state: "ACTIVE" }, { id: "group_id2", name: "group2", state: "SUSPENDED" }]} | ${undefined}   | ${[]}
      ${"selcGroups has at least one element, groupMap has an active matching group, serviceId is defined and authzServiceIds is empty"}                           | ${["group_id"]} | ${[{ id: "group_id", name: "group", state: "ACTIVE" }]}                                                          | ${"serviceId"} | ${[]}
      ${"selcGroups has at least one element, groupMap has an active matching group, serviceId is undefined and authzServiceIds is not empty"}                     | ${["group_id"]} | ${[{ id: "group_id", name: "group", state: "ACTIVE" }]}                                                          | ${undefined}   | ${["authzServiceId"]}
      ${"selcGroups has at least one element, groupMap has an active matching group, serviceId is defined and authzServiceIds is not empty"}                       | ${["group_id"]} | ${[{ id: "group_id", name: "group", state: "ACTIVE" }]}                                                          | ${"serviceId"} | ${["authzServiceId"]}
    `(
      "should return an error when $scenario, but getSubscriptions fails",
      async ({ selcGroups, institutionGroups, serviceId, authzServiceIds }) => {
        // given
        const error = new Error("message");
        retrieveInstitutionGroups.mockResolvedValueOnce(institutionGroups);
        getSubscriptionsMock.mockReturnValueOnce(TE.left(error));
        const request = new NextRequest(new URL("http://localhost"));
        const backofficeUser = {
          ...aBackofficeUser,
          permissions: {
            ...aBackofficeUser.permissions,
            selcGroups,
          },
        };
        if (selcGroups && selcGroups.length > 0) {
          retrieveAuthorizedServiceIdsMock.mockReturnValueOnce(
            TE.right(authzServiceIds),
          );
        }

        // when and then
        await expect(
          retrieveServiceList(request, backofficeUser, 10, 0, serviceId),
        ).rejects.toThrowError(error);
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUser);
        expect(isAdminMock).toHaveBeenCalledOnce();
        expect(isAdminMock).toHaveBeenCalledWith();
        expect(retrieveInstitutionGroups).toHaveBeenCalled();
        expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
          backofficeUser.institution.id,
        );

        if (selcGroups && selcGroups.length > 0) {
          expect(retrieveAuthorizedServiceIdsMock).toHaveBeenCalledOnce();
          expect(retrieveAuthorizedServiceIdsMock).toHaveBeenCalledWith(
            getExpectedActiveGroups(
              backofficeUser.permissions.selcGroups,
              institutionGroups,
            ),
          );
        } else {
          expect(retrieveAuthorizedServiceIdsMock).not.toHaveBeenCalled();
        }
        expect(getSubscriptionsMock).toHaveBeenCalledOnce();
        expect(getSubscriptionsMock).toHaveBeenCalledWith(
          backofficeUser.parameters.userId,
          10,
          0,
          getExpectedGetSubscriptionsFilter(
            authzServiceIds,
            selcGroups,
            serviceId,
          ),
        );
        expect(retrieveLifecycleServicesMock).not.toHaveBeenCalled();
        expect(retrievePublicationServicesMock).not.toHaveBeenCalled();
      },
    );
  });
  describe("subscriptions migration", () => {
    it("should return a list of delegates", async () => {
      const getDelegatesByOrganization = vi.fn(() =>
        TE.right({
          delegates: [mocks.migrationDelegate],
        }),
      );

      getSubscriptionsMigrationClient.mockReturnValueOnce({
        getDelegatesByOrganization,
      });

      const result = await retrieveOrganizationDelegates("anOrganizationId");

      expect(getDelegatesByOrganization).toBeCalledWith("anOrganizationId");
      expect(result).toStrictEqual({
        delegates: [mocks.migrationDelegate],
      });
    });

    it("should propagate a not detailed error", async () => {
      const getDelegatesByOrganization = vi.fn(() =>
        TE.left(new Error("Error calling subscriptions migration")),
      );

      getSubscriptionsMigrationClient.mockReturnValueOnce({
        getDelegatesByOrganization,
      });

      await expect(
        retrieveOrganizationDelegates("anOrganizationId"),
      ).rejects.toThrowError(
        "Error calling subscriptions migration getDelegatesByOrganization API",
      );

      expect(getDelegatesByOrganization).toBeCalledWith("anOrganizationId");
    });
  });

  describe("retrieveUnboundedGroupServices", () => {
    it("should throw an error when getSubscriptions fails", async () => {
      // given
      const subscriptions = [
        {
          name: "sub_1",
        },
        {
          name: "sub_2",
        },
      ];
      const services = [
        {
          id: "id_1",
          name: "name_1",
        },
      ];
      getSubscriptionsMock.mockReturnValueOnce(
        TE.right({
          value: subscriptions,
        }),
      );
      retrieveGroupUnboundedServicesMock.mockReturnValueOnce(
        TE.right(services),
      );

      // when and then
      await expect(
        retrieveUnboundedGroupServices(aBackofficeUser),
      ).resolves.toStrictEqual(services);
      expect(getSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getSubscriptionsMock).toHaveBeenCalledWith(
        aBackofficeUser.parameters.userId,
        undefined,
        undefined,
        undefined,
      );
      expect(retrieveGroupUnboundedServicesMock).toHaveBeenCalledOnce();
      expect(retrieveGroupUnboundedServicesMock).toHaveBeenCalledWith(
        subscriptions.map((sub) => sub.name),
      );
    });
  });
});
