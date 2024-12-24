import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { getGroup } from "../selfcare";

// import { UserInstitutions, getSelfcareClient } from "@/lib/be/selfcare-client";

const mocks: { getSelfcareClient: Mock; getGroup: Mock; isAxiosError: Mock } =
  vi.hoisted(() => {
    const getGroup = vi.fn();
    return {
      getSelfcareClient: vi.fn(() => ({ getGroup })),
      getGroup,
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
});
