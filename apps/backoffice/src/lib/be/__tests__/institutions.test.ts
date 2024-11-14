import { afterEach, describe, expect, it, vi } from "vitest";
import { Institution } from "../../../generated/selfcare/Institution";
import { UserInstitutionResponse } from "../../../generated/selfcare/UserInstitutionResponse";
import { UserInstitutions } from "../../../lib/be/selfcare-client";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { PageOfUserGroupResource } from "../../../generated/selfcare/PageOfUserGroupResource";
import { StatusEnum } from "../../../generated/selfcare/UserGroupResource";
import {
  groupExists,
  retrieveInstitution,
  retrieveInstitutionGroups,
  retrieveUserAuthorizedInstitutions,
} from "../institutions/business";

const mocks: {
  institution: Institution;
  userInstitutions: UserInstitutions;
  aSelfcareUserId: string;
  institutionGroups: PageOfUserGroupResource;
} = vi.hoisted(() => ({
  institution: { id: "institutionId" } as Institution,
  userInstitutions: [
    {
      id: "0ff2d229-d592-4b68-84c0-4533c6547756",
      userId: "2b10852f-a4fd-4ae8-9dfc-ac3578fc5b21",
      institutionId: "1dd8cdaa-8cdc-41cf-9922-f35a8429b366",
      institutionDescription: "Vaccari, Francesca e Massari Group",
      institutionRootName: "Caggiano e figli",
      userMailUuid: "9e22fb49-a0fd-4c98-bb5b-5efe0dbdabfa",
      products: [
        {
          productId: "prod-io",
          status: "ACTIVE",
          productRole: "admin",
          role: "SUB_DELEGATE",
          env: "ROOT",
        },
      ],
    } as UserInstitutionResponse,
  ] as UserInstitutions,
  aSelfcareUserId: "aSelfcareUserId",
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
} = vi.hoisted(() => ({
  getUserAuthorizedInstitutionsMock: vi.fn(),
  getInstitutionByIdMock: vi.fn(),
  getInstitutionGroupsMock: vi.fn(),
}));

vi.mock("@/lib/be/institutions/selfcare", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...(mod as any),
    getUserAuthorizedInstitutions: getUserAuthorizedInstitutionsMock,
    getInstitutionById: getInstitutionByIdMock,
    getInstitutionGroups: getInstitutionGroupsMock,
  };
});

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

    // it("should rejects when getInstitutionGroups return an error response", async () => {
    //   const errorMessage = "errorMessage";
    //   getInstitutionGroups.mockRejectedValueOnce(new Error(errorMessage));
    //   getSelfcareClient.mockReturnValueOnce({
    //     getInstitutionGroups,
    //   });

    //   expect(
    //     retrieveInstitutionGroups(
    //       (mocks.institutionGroups.content as any[])[0].institutionId,
    //     ),
    //   ).rejects.toThrowError(errorMessage);

    //   expect(getInstitutionGroups).toHaveBeenCalledWith(
    //     (mocks.institutionGroups.content as any[])[0].institutionId,
    //     undefined,
    //     undefined,
    //   );
    // });

    // it("should rejects on error response if group ID or group Name is not present or undefined", async () => {
    //   getInstitutionGroups.mockResolvedValueOnce({
    //     content: [
    //       {
    //         description: "institutionGroups description",
    //         id: "institutionGroupsID",
    //         institutionId: "institutionGroupsInstID",
    //         name: "institutionGroupsName",
    //         productId: "institutionGroupsProdID",
    //         status: "ACTIVE" as StatusEnum,
    //       },
    //       {
    //         description: "institutionGroupsDescription2",
    //         institutionId: "institutionGroupsInstID2",
    //         name: "institutionGroupsName2",
    //         productId: "institutionGroupsProdID2",
    //         status: "ACTIVE" as StatusEnum,
    //       },
    //     ],
    //     number: 0,
    //     size: 0,
    //     totalElements: 2,
    //     totalPages: 0,
    //   });

    //   isAxiosError.mockReturnValueOnce(true);

    //   await expect(() =>
    //     retrieveInstitutionGroups("institutionGroupsInstID"),
    //   ).rejects.toThrowError(
    //     new ManagedInternalError("Error toGroups mapping"),
    //   );

    //   expect(getInstitutionGroups).toHaveBeenCalledWith(
    //     mocks.institutionGroups.content[0].institutionId,
    //     undefined,
    //     undefined,
    //   );
    // });
  });

  describe("groupExists", () => {
    it("should fail when getInstitutionGroups fails", async () => {
      const institutionId = "institutionId";
      const groupId = "groupId" as NonEmptyString;
      const errorMessage = "errorMessage";
      getInstitutionGroupsMock.mockRejectedValueOnce(new Error(errorMessage));

      // when and then
      await expect(() =>
        groupExists(institutionId, groupId),
      ).rejects.toThrowError(errorMessage);
      expect(getInstitutionGroupsMock).toHaveBeenCalledOnce();
      expect(getInstitutionGroupsMock).toHaveBeenCalledWith(
        institutionId,
        1000,
        0,
      );
    });

    it("should return false when provided groupId does not exists", async () => {
      const institutionId = "institutionId";
      const groupId = "nonExistingGroupId" as NonEmptyString;
      getInstitutionGroupsMock.mockResolvedValueOnce(mocks.institutionGroups);

      // when and then
      expect(groupExists(institutionId, groupId)).resolves.toStrictEqual(false);
      expect(getInstitutionGroupsMock).toHaveBeenCalledOnce();
      expect(getInstitutionGroupsMock).toHaveBeenCalledWith(
        institutionId,
        1000,
        0,
      );
    });

    it("should return true when provided groupId does exists", async () => {
      const institutionId = "institutionId";
      const groupId = (mocks.institutionGroups.content as any[])[0]
        .id as NonEmptyString;
      getInstitutionGroupsMock.mockResolvedValueOnce(mocks.institutionGroups);

      // when and then
      expect(groupExists(institutionId, groupId)).resolves.toStrictEqual(true);
      expect(getInstitutionGroupsMock).toHaveBeenCalledOnce();
      expect(getInstitutionGroupsMock).toHaveBeenCalledWith(
        institutionId,
        1000,
        0,
      );
    });
  });
});
