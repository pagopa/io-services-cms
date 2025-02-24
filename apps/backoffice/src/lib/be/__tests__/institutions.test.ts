import { afterEach, describe, expect, it, vi } from "vitest";
import { InstitutionResponse } from "../../../generated/selfcare/InstitutionResponse";
import { UserInstitutions } from "../../../lib/be/selfcare-client";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { PageOfUserGroupResource } from "../../../generated/selfcare/PageOfUserGroupResource";
import {
  StatusEnum,
  UserGroupResource,
} from "../../../generated/selfcare/UserGroupResource";
import { GroupNotFoundError } from "../errors";
import {
  groupExists,
  retrieveInstitution,
  retrieveInstitutionGroups,
  retrieveUnboundInstitutionGroups,
  retrieveUserAuthorizedInstitutions,
} from "../institutions/business";

const mocks: {
  institution: InstitutionResponse;
  userInstitutions: UserInstitutions;
  aSelfcareUserId: string;
  institutionGroup: UserGroupResource;
  institutionGroups: PageOfUserGroupResource;
} = vi.hoisted(() => ({
  institution: { id: "institutionId" },
  userInstitutions: [
    {
      id: "0ff2d229-d592-4b68-84c0-4533c6547756",
      userId: "2b10852f-a4fd-4ae8-9dfc-ac3578fc5b21",
      institutionId: "1dd8cdaa-8cdc-41cf-9922-f35a8429b366",
      institutionDescription: "Vaccari, Francesca e Massari Group",
      institutionRootName: "Caggiano e figli",
      products: [
        {
          productId: "prod-io",
          status: "ACTIVE",
          productRole: "admin",
          role: "SUB_DELEGATE",
        },
      ],
    },
  ],
  aSelfcareUserId: "aSelfcareUserId",
  institutionGroup: {
    description: "institutionGroups description",
    id: "institutionGroupsID",
    institutionId: "institutionGroupsInstID",
    name: "institutionGroupsName",
    productId: "institutionGroupsProdID",
    status: "ACTIVE" as StatusEnum,
  },
  institutionGroups: {
    content: [
      {
        description: "institutionGroups description",
        id: "institutionGroupsID",
        institutionId: "institutionGroupsInstID",
        name: "institutionGroupsName",
        productId: "institutionGroupsProdID",
        status: "ACTIVE" as StatusEnum,
      },
      {
        description: "institutionGroupsDescription2",
        id: "institutionGroupsID2",
        institutionId: "institutionGroupsInstID2",
        name: "institutionGroupsName2",
        productId: "institutionGroupsProdID2",
        status: "DELETED" as StatusEnum,
      },
    ],
    number: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
  },
}));

const {
  getUserAuthorizedInstitutionsMock,
  getInstitutionByIdMock,
  getInstitutionGroupsMock,
  getManageSubscriptionsMock,
  getGroupMock,
} = vi.hoisted(() => ({
  getUserAuthorizedInstitutionsMock: vi.fn(),
  getInstitutionByIdMock: vi.fn(),
  getInstitutionGroupsMock: vi.fn(),
  getManageSubscriptionsMock: vi.fn(),
  getGroupMock: vi.fn(),
}));

vi.mock("@/lib/be/institutions/selfcare", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...(mod as any),
    getUserAuthorizedInstitutions: getUserAuthorizedInstitutionsMock,
    getInstitutionById: getInstitutionByIdMock,
    getInstitutionGroups: getInstitutionGroupsMock,
    getGroup: getGroupMock,
  };
});

vi.mock("@/lib/be/subscriptions/business", () => ({
  getManageSubscriptions: getManageSubscriptionsMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Institutions", () => {
  describe("retrireveUserAuthorizedInstitutions", () => {
    it("should return the institutions found", async () => {
      // given
      getUserAuthorizedInstitutionsMock.mockResolvedValueOnce(
        mocks.userInstitutions,
      );

      // when
      const result = await retrieveUserAuthorizedInstitutions(
        mocks.aSelfcareUserId,
      );

      // then
      expect(getUserAuthorizedInstitutionsMock).toHaveBeenCalledWith(
        mocks.aSelfcareUserId,
      );
      expect(result).toEqual({
        authorizedInstitutions: mocks.userInstitutions.map(
          (userInstitution) => ({
            id: userInstitution.institutionId,
            name: userInstitution.institutionDescription,
            role: userInstitution.products?.[0].productRole,
            logo_url: `https://selfcare.pagopa.it/institutions/${userInstitution.institutionId}/logo.png`,
          }),
        ),
      });
    });

    it("should rejects", async () => {
      // given
      const error = new Error();
      getUserAuthorizedInstitutionsMock.mockRejectedValueOnce(error);

      // when and then
      expect(
        retrieveUserAuthorizedInstitutions(mocks.aSelfcareUserId),
      ).rejects.toThrowError(error);
      expect(getUserAuthorizedInstitutionsMock).toHaveBeenCalledWith(
        mocks.aSelfcareUserId,
      );
    });
  });

  describe("retieveInstitution", () => {
    it("should return the institution found", async () => {
      // given
      getInstitutionByIdMock.mockResolvedValueOnce(mocks.institution);

      // when
      const result = await retrieveInstitution(mocks.institution.id as string);

      // then
      expect(getInstitutionByIdMock).toHaveBeenCalledWith(mocks.institution.id);
      expect(result).toEqual(mocks.institution);
    });

    it("should rejects when getInstitutionById rejects", async () => {
      // given
      const error = new Error();
      getInstitutionByIdMock.mockRejectedValueOnce(error);

      // when and then
      expect(
        retrieveInstitution(mocks.institution.id as string),
      ).rejects.toThrowError(error);
      expect(getInstitutionByIdMock).toHaveBeenCalledWith(mocks.institution.id);
    });
  });

  describe("retrieveInstitutionGroups", () => {
    it("should return the groups found for the institution", async () => {
      // given
      const institutionId = "institutionId";
      getInstitutionGroupsMock
        .mockResolvedValueOnce({
          ...mocks.institutionGroups,
          totalPages: 1,
        })
        .mockResolvedValueOnce(mocks.institutionGroups);

      // when
      const result = await retrieveInstitutionGroups(institutionId);

      // then
      expect(getInstitutionGroupsMock).toHaveBeenCalledTimes(2);
      expect(getInstitutionGroupsMock).toHaveBeenNthCalledWith(
        1,
        institutionId,
        1000,
        0,
      );
      expect(getInstitutionGroupsMock).toHaveBeenNthCalledWith(
        2,
        institutionId,
        1000,
        1,
      );
      expect(result).toStrictEqual([
        ...(mocks.institutionGroups.content?.map((userGroupResources) => ({
          id: userGroupResources.id,
          name: userGroupResources.name,
          state: userGroupResources.status,
        })) as any[]),
        ...(mocks.institutionGroups.content?.map((userGroupResources) => ({
          id: userGroupResources.id,
          name: userGroupResources.name,
          state: userGroupResources.status,
        })) as any[]),
      ]);
    });

    it("should return the groups found for the institution filtered by the group list passed", async () => {
      // given
      const institutionId = "institutionId";
      getInstitutionGroupsMock.mockResolvedValueOnce({
        ...mocks.institutionGroups,
        totalPages: 0,
      });
      const groupsFilter = [
        {
          id: "institutionGroupsID",
          name: "institutionGroupsName",
          status: "ACTIVE" as StatusEnum,
        },
      ];

      // when
      const result = await retrieveInstitutionGroups(
        institutionId,
        groupsFilter,
      );

      // then
      expect(getInstitutionGroupsMock).toHaveBeenCalledOnce();
      expect(getInstitutionGroupsMock).toHaveBeenNthCalledWith(
        1,
        institutionId,
        1000,
        0,
      );
      expect(result).toStrictEqual(
        mocks.institutionGroups.content
          .filter((group) => group.id === groupsFilter[0].id)
          .map((group) => ({
            id: group.id,
            name: group.name,
            state: group.status,
          })),
      );
    });

    it("should rejects when getInstitutionGroups return an error response", async () => {
      // given
      const error = new Error("errorMessage");
      getInstitutionGroupsMock.mockRejectedValueOnce(error);

      // when and then
      expect(
        retrieveInstitutionGroups(
          (mocks.institutionGroups.content as any[])[0].institutionId,
        ),
      ).rejects.toThrowError(error);
      expect(getInstitutionGroupsMock).toHaveBeenCalledWith(
        (mocks.institutionGroups.content as any[])[0].institutionId,
        1000,
        0,
      );
    });
  });

  describe("groupExists", () => {
    it("should fail when getInstitutionGroups fails", async () => {
      const institutionId = "institutionId";
      const groupId = "groupId" as NonEmptyString;
      const errorMessage = "errorMessage";
      getGroupMock.mockRejectedValueOnce(new Error(errorMessage));

      // when and then
      await expect(() =>
        groupExists(institutionId, groupId),
      ).rejects.toThrowError(errorMessage);
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(groupId, institutionId);
    });

    it("should return false when provided groupId does not exists", async () => {
      const institutionId = "institutionId";
      const groupId = "groupId" as NonEmptyString;
      getGroupMock.mockRejectedValueOnce(new GroupNotFoundError("message"));

      // when and then
      expect(groupExists(institutionId, groupId)).resolves.toStrictEqual(false);
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(groupId, institutionId);
    });

    it("should return true when provided groupId does exists", async () => {
      const institutionId = "institutionId";
      const groupId = "groupId" as NonEmptyString;
      getGroupMock.mockResolvedValueOnce(mocks.institutionGroup);

      // when and then
      expect(groupExists(institutionId, groupId)).resolves.toStrictEqual(true);
      expect(getGroupMock).toHaveBeenCalledOnce();
      expect(getGroupMock).toHaveBeenCalledWith(groupId, institutionId);
    });
  });

  describe("retrieveUnboundInstitutionGroups", () => {
    it.each`
      scenario
      ${"getManageSubscriptions"}
      ${"getInstitutionGroups"}
    `("should reject when $scenario rejects", async ({ scenario }) => {
      // given
      const apimUserId = "apimUserId";
      const institutionId = "institutionId";
      const error = new Error();
      if (scenario === "getManageSubscriptions") {
        getManageSubscriptionsMock.mockRejectedValueOnce(error);
        getInstitutionGroupsMock.mockResolvedValueOnce({});
      } else {
        getManageSubscriptionsMock.mockResolvedValueOnce({});
        getInstitutionGroupsMock.mockRejectedValueOnce(error);
      }

      // when and then
      await expect(() =>
        retrieveUnboundInstitutionGroups(apimUserId, institutionId),
      ).rejects.toThrowError(error);
      expect(getManageSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getManageSubscriptionsMock).toHaveBeenCalledWith(
        "MANAGE_GROUP",
        apimUserId,
      );
      expect(getInstitutionGroupsMock).toHaveBeenCalledOnce();
      expect(getInstitutionGroupsMock).toHaveBeenCalledWith(
        institutionId,
        1000,
        0,
      );
    });

    it("should filter the selfcare groups based on subscriptions group", async () => {
      // given
      const apimUserId = "apimUserId";
      const institutionId = "institutionId";
      getManageSubscriptionsMock.mockResolvedValueOnce([
        {
          id: `MANAGE-GROUP-${(mocks.institutionGroups.content as any[])[1].id}`,
          name: "name",
          state: "active",
        },
      ]);
      getInstitutionGroupsMock.mockResolvedValueOnce(mocks.institutionGroups);

      // when and then
      const res = await retrieveUnboundInstitutionGroups(
        apimUserId,
        institutionId,
      );
      expect(res).toStrictEqual([
        {
          id: (mocks.institutionGroups.content as any[])[0].id,
          name: (mocks.institutionGroups.content as any[])[0].name,
          state: (mocks.institutionGroups.content as any[])[0].status,
        },
      ]);
      expect(getManageSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getManageSubscriptionsMock).toHaveBeenCalledWith(
        "MANAGE_GROUP",
        apimUserId,
      );
      expect(getInstitutionGroupsMock).toHaveBeenCalledOnce();
      expect(getInstitutionGroupsMock).toHaveBeenCalledWith(
        institutionId,
        1000,
        0,
      );
    });
  });
});
