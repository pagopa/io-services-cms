import * as E from "fp-ts/lib/Either";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DelegationWithPaginationResponse } from "../../../generated/selfcare/DelegationWithPaginationResponse";
import { InstitutionResponse } from "../../../generated/selfcare/InstitutionResponse";
import { PageOfUserGroupResource } from "../../../generated/selfcare/PageOfUserGroupResource";
import { StatusEnum } from "../../../generated/selfcare/UserGroupResource";
import {
  getSelfcareClient,
  resetInstance,
  UserInstitutions,
} from "../selfcare-client";

const mocks: {
  institution: InstitutionResponse;
  userInstitutions: UserInstitutions;
  aSelfcareUserId: string;
  institutionGroups: PageOfUserGroupResource;
  delegations: DelegationWithPaginationResponse;
} = {
  institution: { id: "institutionId" } as InstitutionResponse,
  userInstitutions: [
    {
      institutionId: "institutionId1",
      userId: "userId",
    },
    {
      institutionId: "institutionId2",
      userId: "userId",
    },
  ],
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
  delegations: {
    delegations: [
      {
        institutionId: "institutionGroupsInstID",
        institutionName: "institutionGroupsName",
      },
      {
        institutionId: "institutionGroupsInstID2",
        institutionName: "institutionGroupsName2",
      },
    ],
    pageInfo: {
      pageNo: 0,
      pageSize: 10,
      totalElements: 2,
      totalPages: 1,
    },
  },
};

const { create, isAxiosError, getMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  return {
    create: vi.fn(() => ({
      get: getMock,
    })),
    getMock,
    isAxiosError: vi.fn().mockReturnValue(false),
  };
});

vi.mock("axios", async () => {
  const actual = await vi.importActual("axios");
  return {
    ...(actual as any),
    default: { create, isAxiosError },
  };
});

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    SELFCARE_EXTERNAL_API_BASE_URL: "https://example.com",
    SELFCARE_API_KEY: "abc123",
    SELFCARE_API_MOCKING: "false",
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
  // reset selfcare client instance
  resetInstance();
});

describe("Selfcare Client", () => {
  const commonExpectation = () => {
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      baseURL: process.env.SELFCARE_EXTERNAL_API_BASE_URL,
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.SELFCARE_API_KEY,
      },
      httpAgent: expect.anything(),
      httpsAgent: expect.anything(),
      timeout: 5000,
    });
  };
  describe("getUserAuthorizedInstitutions", () => {
    it("should return the institutions found", async () => {
      // when
      getMock.mockResolvedValueOnce({
        status: 200,
        data: mocks.userInstitutions,
      });

      // when
      const result = await getSelfcareClient().getUserAuthorizedInstitutions(
        mocks.aSelfcareUserId,
      )();

      // then
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(mocks.userInstitutions);
      }
      commonExpectation();
      expect(getMock).toHaveBeenCalledWith("/users", {
        params: {
          userId: mocks.aSelfcareUserId,
          states: "ACTIVE",
          size: 10000,
        },
      });
      expect(isAxiosError).not.toHaveBeenCalled();
    });

    it("should return an error when received an error from selfcare", async () => {
      getMock.mockRejectedValueOnce({
        message: "Axios Error Message",
        response: { status: 500 },
      });
      isAxiosError.mockReturnValueOnce(true);

      const result = await getSelfcareClient().getUserAuthorizedInstitutions(
        mocks.aSelfcareUserId,
      )();

      expect(getMock).toHaveBeenCalledWith("/users", {
        params: {
          userId: mocks.aSelfcareUserId,
          states: "ACTIVE",
          size: 10000,
        },
      });
      expect(isAxiosError).toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
      commonExpectation();
    });

    it("should return an error when received a bad response from selfcare", async () => {
      getMock.mockResolvedValueOnce({ status: 200, data: "" });

      const result = await getSelfcareClient().getUserAuthorizedInstitutions(
        mocks.aSelfcareUserId,
      )();

      expect(getMock).toHaveBeenCalledWith("/users", {
        params: {
          userId: mocks.aSelfcareUserId,
          states: "ACTIVE",
          size: 10000,
        },
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
      commonExpectation();
    });
  });

  describe("getInstitutionById", () => {
    it("should return the institution found", async () => {
      getMock.mockResolvedValueOnce({ status: 200, data: mocks.institution });

      const result = await getSelfcareClient().getInstitutionById(
        mocks.institution.id as string,
      )();

      expect(getMock).toHaveBeenCalledWith(
        `/institutions/${mocks.institution.id}`,
      );
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(mocks.institution);
      }
      commonExpectation();
    });

    it.each`
      scenario             | isAxiosErrorMockResponse | error
      ${"an axios error"}  | ${true}                  | ${"axios error"}
      ${"a generic error"} | ${false}                 | ${"non axios error"}
    `(
      "should return an error when received $scenario from selfcare",
      async ({ isAxiosErrorMockResponse, error }) => {
        // given
        isAxiosError.mockReturnValueOnce(isAxiosErrorMockResponse);
        getMock.mockRejectedValueOnce(error);

        // when
        const result = await getSelfcareClient().getInstitutionById(
          mocks.institution.id as string,
        )();

        // then
        expect(getMock).toHaveBeenCalledOnce();
        expect(getMock).toHaveBeenCalledWith(
          `/institutions/${mocks.institution.id}`,
        );
        expect(isAxiosError).toHaveBeenCalledOnce();
        expect(E.isLeft(result)).toBeTruthy();
        if (E.isLeft(result)) {
          expect(result.left).toStrictEqual(
            isAxiosErrorMockResponse
              ? error
              : new Error(
                  `Error calling selfcare getInstitutionById API: ${error}`,
                ),
          );
        }
        commonExpectation();
      },
    );

    it("should return an error when received a bad response from selfcare", async () => {
      getMock.mockResolvedValueOnce({ status: 200, data: "" });

      const result = await getSelfcareClient().getInstitutionById(
        mocks.institution.id as string,
      )();

      expect(getMock).toHaveBeenCalledWith(
        `/institutions/${mocks.institution.id}`,
      );
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
      commonExpectation();
    });
  });

  describe("getInstitutionGroups", () => {
    it("should return the groups found for the institution", async () => {
      getMock.mockResolvedValueOnce({
        status: 200,
        data: mocks.institutionGroups,
      });

      const result = await getSelfcareClient().getInstitutionGroups(
        mocks.institutionGroups.content[0].institutionId as string,
      )();

      expect(getMock).toHaveBeenCalledWith("/user-groups", {
        params: {
          institutionId: mocks.institutionGroups.content[0].institutionId,
          status: "ACTIVE",
        },
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(mocks.institutionGroups);
      }
      commonExpectation();
    });

    it("should return an error when received an error from selfcare", async () => {
      getMock.mockRejectedValueOnce({
        message: "Received 404 response",
        response: { status: 404 },
      });
      isAxiosError.mockReturnValueOnce(true);

      const result = await getSelfcareClient().getInstitutionGroups(
        mocks.institutionGroups.content[0].institutionId as string,
      )();

      expect(getMock).toHaveBeenCalledWith("/user-groups", {
        params: {
          institutionId: mocks.institutionGroups.content[0].institutionId,
          status: "ACTIVE",
        },
      });
      expect(isAxiosError).toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
      commonExpectation();
    });

    it("should return an error when received a bad response from selfcare", async () => {
      getMock.mockResolvedValueOnce({ status: 200, data: "" });

      const result = await getSelfcareClient().getInstitutionGroups(
        mocks.institutionGroups.content[0].institutionId as string,
      )();

      expect(getMock).toHaveBeenCalledWith("/user-groups", {
        params: {
          institutionId: mocks.institutionGroups.content[0].institutionId,
          status: "ACTIVE",
        },
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
      commonExpectation();
    });
  });

  describe("getDelegations", () => {
    const institutionId = "instId";
    const endpoint = `/institutions/${institutionId}/delegations/delegations-with-pagination`;

    it("should return the delegated institutions for the given institution", async () => {
      // given
      const size = 5;
      const page = 0;
      const search = "search";

      getMock.mockResolvedValueOnce({
        status: 200,
        data: mocks.delegations,
      });

      // when
      const result = await getSelfcareClient().getInstitutionDelegations(
        institutionId,
        size,
        page,
        search,
      )();

      // then
      expect(getMock).toHaveBeenCalledWith(endpoint, {
        params: {
          size,
          page,
          search,
          sort: "ASC",
        },
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(mocks.delegations);
      }
      commonExpectation();
    });

    it("should return an error when received an error from selfcare", async () => {
      // given
      getMock.mockRejectedValueOnce({
        message: "Received 400 response",
        response: { status: 400 },
      });
      isAxiosError.mockReturnValueOnce(true);

      // when
      const result =
        await getSelfcareClient().getInstitutionDelegations(institutionId)();

      // then
      expect(getMock).toHaveBeenCalledWith(endpoint, {
        params: {
          size: undefined,
          page: undefined,
          search: undefined,
          sort: "ASC",
        },
      });
      expect(isAxiosError).toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
      commonExpectation();
    });

    it("should return an error when received a bad response from selfcare", async () => {
      // given
      getMock.mockResolvedValueOnce({ status: 200, data: "" });

      // when
      const result =
        await getSelfcareClient().getInstitutionDelegations(institutionId)();

      // then
      expect(getMock).toHaveBeenCalledWith(endpoint, {
        params: {
          size: undefined,
          page: undefined,
          search: undefined,
          sort: "ASC",
        },
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
      commonExpectation();
    });
  });
});
