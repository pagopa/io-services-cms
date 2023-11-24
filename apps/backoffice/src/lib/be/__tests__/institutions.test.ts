import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";

import { Institution } from "../../../types/selfcare/Institution";
import {
  InstitutionResource,
  InstitutionResources
} from "../../../types/selfcare/InstitutionResource";
import { InstitutionNotFoundError, ManagedInternalError } from "../errors";
import {
  retrieveInstitution,
  retrieveUserAuthorizedInstitutions
} from "../institutions/business";

const mocks: {
  institution: Institution;
  institutionResources: InstitutionResources;
  aSelfcareUserId: string;
} = vi.hoisted(() => ({
  institution: { id: "institutionId" } as Institution,
  institutionResources: [
    {
      id: "institutionId1",
      description: "institutionName1",
      userProductRoles: ["operator"],
      logo: "institutionLogo1"
    } as InstitutionResource,
    {
      id: "institutionId2",
      description: "institutionName2",
      userProductRoles: ["admin"],
      logo: "institutionLogo2"
    } as InstitutionResource
  ],
  aSelfcareUserId: "aSelfcareUserId"
}));

const { getSelfcareClient } = vi.hoisted(() => ({
  getSelfcareClient: vi.fn().mockReturnValue({
    getUserAuthorizedInstitutions: vi.fn(() =>
      TE.right(mocks.institutionResources)
    ),
    getInstitutionById: vi.fn(() => TE.right(mocks.institution))
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
        TE.right(mocks.institutionResources)
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
        authorizedInstitutions: mocks.institutionResources.map(
          institutionResource => ({
            id: institutionResource.id,
            name: institutionResource.description,
            role: institutionResource.userProductRoles?.[0],
            logo_url: institutionResource.logo
          })
        )
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

      expect(retrieveInstitution(mocks.institution.id)).rejects.toThrowError(
        new ManagedInternalError("Error calling selfcare getInstitution API")
      );

      expect(getInstitutionById).toHaveBeenCalledWith(mocks.institution.id);
    });
  });
});
