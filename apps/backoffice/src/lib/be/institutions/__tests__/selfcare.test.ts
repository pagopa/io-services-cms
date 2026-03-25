import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { getMockInstitutionProducts } from "../../../../../mocks/data/selfcare-data";
import {
  getGroup,
  getInstitutionDelegations,
  getInstitutionGroups,
  getInstitutionProducts,
} from "../selfcare";

const mocks: {
  getSelfcareClient: Mock;
  getGroup: Mock;
  getInstitutionDelegations: Mock;
  getInstitutionProducts: Mock;
  getInstitutionGroups: Mock;
  isAxiosError: Mock;
} = vi.hoisted(() => {
  const getGroup = vi.fn();
  const getInstitutionDelegations = vi.fn();
  const getInstitutionProducts = vi.fn();
  const getInstitutionGroups = vi.fn();
  return {
    getSelfcareClient: vi.fn(() => ({
      getGroup,
      getInstitutionDelegations,
      getInstitutionProducts,
      getInstitutionGroups,
    })),
    getGroup,
    getInstitutionDelegations,
    getInstitutionProducts,
    getInstitutionGroups,
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
      "should reject when getGroup fail $scenario",
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

    it("should reject when group is found but from different instutution", async () => {
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
    it("should reject when getInstitutionDelegations fail", async () => {
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

    it("should reject when getInstitutionProducts fail", async () => {
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
      const expectedInstitutionProducts =
        getMockInstitutionProducts(institutionId);
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

  describe("getInstitutionGroups", () => {
    // given
    const institutionId = "institutionId";
    const error = "error";

    it("should reject when getInstitutionGroups fail", async () => {
      // given
      mocks.getInstitutionGroups.mockReturnValueOnce(TE.left(error));

      // when and then
      await expect(() =>
        getInstitutionGroups(institutionId),
      ).rejects.toThrowError("Error calling selfcare getInstitutionGroups API");
      expect(mocks.getInstitutionGroups).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionGroups).toHaveBeenCalledWith(
        institutionId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(mocks.isAxiosError).not.toHaveBeenCalled();
    });

    it.each`
      givenParams                                                                                 | expectedParams
      ${{ state: undefined, size: undefined, page: undefined, parentInstitutionId: undefined }}   | ${{ state: undefined, size: undefined, page: undefined, parentInstitutionId: undefined }}
      ${{ state: "SUSPENDED", size: undefined, page: undefined, parentInstitutionId: undefined }} | ${{ state: "SUSPENDED", size: undefined, page: undefined, parentInstitutionId: undefined }}
      ${{ state: "*", size: 5, page: 1, parentInstitutionId: "pInstId" }}                         | ${{ state: "*", size: 5, page: 1, parentInstitutionId: "pInstId" }}
    `(
      "should return the institution groups by calling selfcare with the correct params when called with $givenParams",
      async ({ givenParams, expectedParams }) => {
        // given
        const expectedInstitutionGroups = [{ foo: "bar" }];
        mocks.getInstitutionGroups.mockReturnValueOnce(
          TE.right(expectedInstitutionGroups),
        );

        // when and then
        await expect(
          getInstitutionGroups(
            institutionId,
            givenParams.size,
            givenParams.page,
            givenParams.state,
            givenParams.parentInstitutionId,
          ),
        ).resolves.toStrictEqual(expectedInstitutionGroups);
        expect(mocks.getInstitutionGroups).toHaveBeenCalledOnce();
        expect(mocks.getInstitutionGroups).toHaveBeenCalledWith(
          institutionId,
          expectedParams.size,
          expectedParams.page,
          expectedParams.state,
          expectedParams.parentInstitutionId,
        );
        expect(mocks.isAxiosError).not.toHaveBeenCalled();
      },
    );
  });
});
