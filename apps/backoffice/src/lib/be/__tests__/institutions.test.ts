import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { Institution } from "../../../generated/selfcare/Institution";
import { UserInstitutionResponse } from "../../../generated/selfcare/UserInstitutionResponse";
import { UserInstitutions } from "../../../lib/be/selfcare-client";
import { InstitutionNotFoundError, ManagedInternalError } from "../errors";
import {
  retrieveInstitution,
  retrieveUserAuthorizedInstitutions,
  retrieveUserGroups
} from "../institutions/business";
import { PageOfUserGroupResource } from "../../../generated/selfcare/PageOfUserGroupResource";
import { StatusEnum } from "../../../generated/selfcare/UserGroupResource";

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
          env: "ROOT"
        }
      ]
    } as UserInstitutionResponse
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
        status: "ACTIVE" as StatusEnum
      },
      {
        description: "institutionGroupsDescription2",
        id: "institutionGroupsID2",
        institutionId: "institutionGroupsInstID2",
        name: "institutionGroupsName2",
        productId: "institutionGroupsProdID2",
        status: "DELETED" as StatusEnum
      }
    ],
    number: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0
  }
}));

const { getSelfcareClient } = vi.hoisted(() => ({
  getSelfcareClient: vi.fn().mockReturnValue({
    getUserAuthorizedInstitutions: vi.fn(() =>
      TE.right(mocks.userInstitutions)
    ),
    getInstitutionById: vi.fn(() => TE.right(mocks.institution)),
    getInstitutionGroups: vi.fn(() => TE.right(mocks.institutionGroups))
  })
}));

const { isAxiosError } = vi.hoisted(() => ({
  isAxiosError: vi.fn().mockReturnValue(false)
}));

vi.mock("@/lib/be/selfcare-client", () => ({
  getSelfcareClient
}));

vi.mock("axios", () => ({
  isAxiosError
}));

describe("Institutions", () => {
  describe("retrireveUserAuthorizedInstitutions", () => {
    it("should return the institutions found", async () => {
      const getUserAuthorizedInstitutions = vi.fn(() =>
        TE.right(mocks.userInstitutions)
      );
      getSelfcareClient.mockReturnValueOnce({
        getUserAuthorizedInstitutions
      });

      const result = await retrieveUserAuthorizedInstitutions(
        mocks.aSelfcareUserId
      );

      expect(getUserAuthorizedInstitutions).toHaveBeenCalledWith(
        mocks.aSelfcareUserId
      );
      expect(result).toEqual({
        authorizedInstitutions: mocks.userInstitutions.map(userInstitution => ({
          id: userInstitution.institutionId,
          name: userInstitution.institutionDescription,
          role: userInstitution.products?.[0].productRole,
          logo_url: `https://selfcare.pagopa.it/institutions/${userInstitution.institutionId}/logo.png`
        }))
      });
    });

    it("should rejects", async () => {
      const getUserAuthorizedInstitutions = vi.fn(() =>
        TE.left({ message: "error" })
      );
      getSelfcareClient.mockReturnValueOnce({
        getUserAuthorizedInstitutions
      });

      expect(
        retrieveUserAuthorizedInstitutions(mocks.aSelfcareUserId)
      ).rejects.toThrowError();

      expect(getUserAuthorizedInstitutions).toHaveBeenCalledWith(
        mocks.aSelfcareUserId
      );
    });
  });
  describe("retieveInstitution", () => {
    it("should return the institution found", async () => {
      const getInstitutionById = vi.fn(() => TE.right(mocks.institution));
      getSelfcareClient.mockReturnValueOnce({
        getInstitutionById
      });

      const result = await retrieveInstitution(mocks.institution.id as string);

      expect(getInstitutionById).toHaveBeenCalledWith(mocks.institution.id);
      expect(result).toEqual(mocks.institution);
    });

    it("should rejects on not found 404 response received", async () => {
      const getInstitutionById = vi.fn(() =>
        TE.left({
          message: "Received 404 response",
          response: { status: 404 }
        })
      );

      getSelfcareClient.mockReturnValueOnce({
        getInstitutionById
      });

      isAxiosError.mockReturnValueOnce(true);

      expect(
        retrieveInstitution(mocks.institution.id as string)
      ).rejects.toThrowError(
        new InstitutionNotFoundError(
          `Institution having id '${mocks.institution.id}' does not exists`
        )
      );

      expect(getInstitutionById).toHaveBeenCalledWith(mocks.institution.id);
    });

    it("should rejects on error response received different than 404", async () => {
      const getInstitutionById = vi.fn(() =>
        TE.left({
          message: "Received 500 response",
          response: { status: 500 }
        })
      );

      getSelfcareClient.mockReturnValueOnce({
        getInstitutionById
      });

      isAxiosError.mockReturnValueOnce(true);

      expect(retrieveInstitution("institutionId")).rejects.toThrowError(
        new ManagedInternalError("Error calling selfcare getInstitution API")
      );

      expect(getInstitutionById).toHaveBeenCalledWith(mocks.institution.id);
    });
  });
  describe("retrieveUserGroups", () => {
    it("should return the groups found for the institution", async () => {
      const getInstitutionGroups = vi.fn(() =>
        TE.right(mocks.institutionGroups)
      );
      getSelfcareClient.mockReturnValueOnce({
        getInstitutionGroups
      });

      const result = await retrieveUserGroups(
        mocks.institutionGroups.content[0].institutionId
      );

      expect(getInstitutionGroups).toHaveBeenCalledWith(
        mocks.institutionGroups.content[0].institutionId,
        undefined,
        undefined
      );
      expect(result).toEqual({
        value: mocks.institutionGroups.content.map(userGroupResources => ({
          id: userGroupResources.id,
          name: userGroupResources.name
        })),
        pagination: {
          count: mocks.institutionGroups.totalElements,
          limit: mocks.institutionGroups.size,
          offset: mocks.institutionGroups.number
        }
      });
    });

    it("should rejects", async () => {
      const getInstitutionGroups = vi.fn(() => TE.left({ message: "error" }));
      getSelfcareClient.mockReturnValueOnce({
        getInstitutionGroups
      });

      expect(
        retrieveUserGroups(mocks.institutionGroups.content[0].institutionId)
      ).rejects.toThrowError();

      expect(getInstitutionGroups).toHaveBeenCalledWith(
        mocks.institutionGroups.content[0].institutionId,
        undefined,
        undefined
      );
    });
    it("should rejects on error response if group ID or group Name is not present or undefined", async () => {
      const getInstitutionGroups = vi.fn(() =>
        TE.right({
          content: [
            {
              description: "institutionGroups description",
              id: "institutionGroupsID",
              institutionId: "institutionGroupsInstID",
              name: "institutionGroupsName",
              productId: "institutionGroupsProdID",
              status: "ACTIVE" as StatusEnum
            },
            {
              description: "institutionGroupsDescription2",
              institutionId: "institutionGroupsInstID2",
              name: "institutionGroupsName2",
              productId: "institutionGroupsProdID2",
              status: "ACTIVE" as StatusEnum
            }
          ],
          number: 0,
          size: 0,
          totalElements: 2,
          totalPages: 0
        })
      );

      getSelfcareClient.mockReturnValueOnce({
        getInstitutionGroups
      });

      isAxiosError.mockReturnValueOnce(true);

      expect(
        retrieveUserGroups("institutionGroupsInstID")
      ).rejects.toThrowError(
        new ManagedInternalError("Error toGroups mapping")
      );

      expect(getInstitutionGroups).toHaveBeenCalledWith(
        mocks.institutionGroups.content[0].institutionId,
        undefined,
        undefined
      );
    });
  });
});
