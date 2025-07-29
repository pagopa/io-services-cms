import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import {
  getGroup,
  getInstitutionDelegations,
  getInstitutionProducts,
} from "../selfcare";

// import { UserInstitutions, getSelfcareClient } from "@/lib/be/selfcare-client";

const mocks: {
  getSelfcareClient: Mock;
  getGroup: Mock;
  getInstitutionDelegations: Mock;
  getInstitutionProducts: Mock;
  isAxiosError: Mock;
} = vi.hoisted(() => {
  const getGroup = vi.fn();
  const getInstitutionDelegations = vi.fn();
  const getInstitutionProducts = vi.fn();
  return {
    getSelfcareClient: vi.fn(() => ({
      getGroup,
      getInstitutionDelegations,
      getInstitutionProducts,
    })),
    getGroup,
    getInstitutionDelegations,
    getInstitutionProducts,
    isAxiosError: vi.fn(),
  };
});

vi.mock("@/lib/be/selfcare-client", () => ({
  getSelfcareClient: mocks.getSelfcareClient,
}));

vi.mock("axios", () => ({
  isAxiosError: mocks.isAxiosError,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Selfcare Institutions", () => {
  describe("getGroup", () => {
    it.each`
      scenario                                          | error                            | isAxiosErrorMockRes | expectedErrorFn
      ${"with a generic error"}                         | ${"error"}                       | ${false}            | ${() => "Error calling selfcare getGroup API"}
      ${"with an axios error different from not found"} | ${{ response: { status: 404 } }} | ${true}             | ${(groupId) => `Group having id '${groupId}' does not exists`}
    `(
      "should rejct when getGroup fail $scenario",
      async ({ error, isAxiosErrorMockRes, expectedErrorFn }) => {
        // given
        const groupId = "groupId" as NonEmptyString;
        const institutionId = "institutionId";
        mocks.getGroup.mockReturnValueOnce(TE.left(error));
        mocks.isAxiosError.mockReturnValueOnce(isAxiosErrorMockRes);

        // when and then
        await expect(() =>
          getGroup(groupId, institutionId),
        ).rejects.toThrowError(expectedErrorFn(groupId));
        expect(mocks.getGroup).toHaveBeenCalledOnce();
        expect(mocks.getGroup).toHaveBeenCalledWith(groupId);
        expect(mocks.isAxiosError).toHaveBeenCalledOnce();
        expect(mocks.isAxiosError).toHaveBeenCalledWith(error);
      },
    );

    it("should rejct when group is found but from different instutution", async () => {
      // given
      const groupId = "groupId" as NonEmptyString;
      const institutionId = "institutionId";
      mocks.getGroup.mockReturnValueOnce(
        TE.right({ institutionId: "differentInstitutionId" }),
      );

      // when and then
      await expect(() => getGroup(groupId, institutionId)).rejects.toThrowError(
        `Group having id '${groupId}' does not exists for instutution '${institutionId}'`,
      );
      expect(mocks.getGroup).toHaveBeenCalledOnce();
      expect(mocks.getGroup).toHaveBeenCalledWith(groupId);
      expect(mocks.isAxiosError).not.toHaveBeenCalled();
    });

    it("should return the group", async () => {
      // given
      const groupId = "groupId" as NonEmptyString;
      const institutionId = "institutionId";
      const expectedGroup = { institutionId };
      mocks.getGroup.mockReturnValueOnce(TE.right(expectedGroup));

      // when and then
      await expect(getGroup(groupId, institutionId)).resolves.toStrictEqual(
        expectedGroup,
      );
      expect(mocks.getGroup).toHaveBeenCalledOnce();
      expect(mocks.getGroup).toHaveBeenCalledWith(groupId);
      expect(mocks.isAxiosError).not.toHaveBeenCalled();
    });
  });

  describe("getInstitutionDelegations", () => {
    const institutionId = "institutionId";
    const error = "error";
    it("should rejct when getInstitutionDelegations fail", async () => {
      // given
      mocks.getInstitutionDelegations.mockReturnValueOnce(TE.left(error));

      // when and then
      await expect(() =>
        getInstitutionDelegations(institutionId),
      ).rejects.toThrowError(
        "Error calling selfcare getDelegatedInstitutions API",
      );
      expect(mocks.getInstitutionDelegations).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionDelegations).toHaveBeenCalledWith(
        institutionId,
        undefined,
        undefined,
        undefined,
      );
      expect(mocks.isAxiosError).not.toHaveBeenCalled();
    });

    it("should return the delegated institutions", async () => {
      // given
      const expectedInstitutionDelegations = [{ foo: "bar" }];
      mocks.getInstitutionDelegations.mockReturnValueOnce(
        TE.right(expectedInstitutionDelegations),
      );

      // when and then
      await expect(
        getInstitutionDelegations(institutionId),
      ).resolves.toStrictEqual(expectedInstitutionDelegations);
      expect(mocks.getInstitutionDelegations).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionDelegations).toHaveBeenCalledWith(
        institutionId,
        undefined,
        undefined,
        undefined,
      );
      expect(mocks.isAxiosError).not.toHaveBeenCalled();
    });
  });

  describe("getInstitutionProducts", () => {
    const institutionId = "institutionId";
    const userId = "userId";
    const error = "error";

    it("should rejct when getInstitutionProducts fail", async () => {
      // given
      mocks.getInstitutionProducts.mockReturnValueOnce(TE.left(error));

      // when and then
      await expect(() =>
        getInstitutionProducts(institutionId, userId),
      ).rejects.toThrowError(
        "Error calling selfcare getInstitutionProducts API",
      );
      expect(mocks.getInstitutionProducts).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionProducts).toHaveBeenCalledWith(
        institutionId,
        userId,
      );
      expect(mocks.isAxiosError).not.toHaveBeenCalled();
    });

    it("should return the user institution products", async () => {
      // given
      const expectedInstitutionProducts = [
        {
          contractTemplatePath: "path/to/contractTemplatePath",
          contractTemplateVersion: "1.0.0",
          createdAt: "2019-08-24T14:15:22Z",
          depictImageUrl: "https://depictImageUrl",
          description: "product description",
          id: "id1",
          identityTokenAudience: "identityTokenAudience",
          logo: "https://logo",
          logoBgColor: "logoBgColor",
          parentId: "parentId",
          roleManagementURL: "https://roleManagementURL",
          roleMappings: {
            property1: {
              multiroleAllowed: true,
              phasesAdditionAllowed: ["phase1"],
              roles: [
                {
                  code: "code1",
                  description: "description1",
                  label: "label1",
                  productLabel: "productLabel1",
                },
              ],
              skipUserCreation: true,
            },
            property2: {
              multiroleAllowed: true,
              phasesAdditionAllowed: ["phase2"],
              roles: [
                {
                  code: "code2",
                  description: "description2",
                  label: "label2",
                  productLabel: "productLabel2",
                },
              ],
              skipUserCreation: true,
            },
          },
          title: "product title 1",
          urlBO: "urlBO",
          urlPublic: "urlPublic",
        },
      ];
      mocks.getInstitutionProducts.mockReturnValueOnce(
        TE.right(expectedInstitutionProducts),
      );

      // when and then
      await expect(
        getInstitutionProducts(institutionId, userId),
      ).resolves.toStrictEqual(expectedInstitutionProducts);
      expect(mocks.getInstitutionProducts).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionProducts).toHaveBeenCalledWith(
        institutionId,
        userId,
      );
      expect(mocks.isAxiosError).not.toHaveBeenCalled();
    });
  });
});
