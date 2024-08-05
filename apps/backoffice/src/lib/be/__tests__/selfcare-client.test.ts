import * as E from "fp-ts/lib/Either";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Institution } from "../../../generated/selfcare/Institution";
import { UserInstitutionResponse } from "../../../generated/selfcare/UserInstitutionResponse";
import {
  getSelfcareClient,
  resetInstance,
  UserInstitutions
} from "../selfcare-client";

const mocks: {
  institution: Institution;
  userInstitutions: UserInstitutions;
  aSelfcareUserId: string;
} = {
  institution: { id: "institutionId" } as Institution,
  userInstitutions: [
    { institutionId: "institutionId1" } as UserInstitutionResponse,
    { institutionId: "institutionId2" } as UserInstitutionResponse
  ],
  aSelfcareUserId: "aSelfcareUserId"
};

const { create, isAxiosError } = vi.hoisted(() => ({
  create: vi.fn().mockReturnValue({
    get: vi.fn(),
    post: vi.fn()
  }),
  isAxiosError: vi.fn().mockReturnValue(false)
}));

vi.mock("axios", async () => {
  const actual = await vi.importActual("axios");
  return {
    ...(actual as any),
    default: { create, isAxiosError }
  };
});

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    SELFCARE_EXTERNAL_API_BASE_URL: "https://example.com",
    SELFCARE_API_KEY: "abc123",
    SELFCARE_API_MOCKING: "false"
  };
});

const { cacheMock } = vi.hoisted(() => ({
  cacheMock: func => func
}));
vi.mock("react", () => ({
  cache: cacheMock
}));

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});
describe("Selfcare Client", () => {
  describe("getUserAuthorizedInstitutions", () => {
    it("should return the institutions found", async () => {
      const get = vi.fn(() =>
        Promise.resolve({ status: 200, data: mocks.userInstitutions })
      );

      create.mockReturnValueOnce({
        get
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().getUserAuthorizedInstitutions(
        mocks.aSelfcareUserId
      )();

      expect(get).toHaveBeenCalledWith("/institutions", {
        params: {
          userId: mocks.aSelfcareUserId
        }
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(mocks.userInstitutions);
      }
    });

    it("should return an error when received an error from selfcare", async () => {
      const get = vi.fn(() =>
        Promise.reject({
          message: "Axios Error Message",
          response: { status: 500 }
        })
      );
      isAxiosError.mockReturnValueOnce(true);

      create.mockReturnValueOnce({
        get
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().getUserAuthorizedInstitutions(
        mocks.aSelfcareUserId
      )();

      expect(get).toHaveBeenCalledWith("/institutions", {
        params: {
          userIdForAuth: mocks.aSelfcareUserId
        }
      });
      expect(isAxiosError).toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should return an error when received a bad response from selfcare", async () => {
      const get = vi.fn(() => Promise.resolve({ status: 200, data: "" }));

      create.mockReturnValueOnce({
        get
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().getUserAuthorizedInstitutions(
        mocks.aSelfcareUserId
      )();

      expect(get).toHaveBeenCalledWith("/institutions", {
        params: {
          userIdForAuth: mocks.aSelfcareUserId
        }
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
    });
  });

  describe("getInstitutionById", () => {
    it("should return the institution found", async () => {
      const get = vi.fn(() =>
        Promise.resolve({ status: 200, data: mocks.institution })
      );

      create.mockReturnValueOnce({
        get
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().getInstitutionById(
        mocks.institution.id as string
      )();

      expect(get).toHaveBeenCalledWith(`/institutions/${mocks.institution.id}`);
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(mocks.institution);
      }
    });

    it("should return an error when received an error from selfcare", async () => {
      const get = vi.fn(() =>
        Promise.reject({
          message: "Received 404 response",
          response: { status: 404 }
        })
      );
      isAxiosError.mockReturnValueOnce(true);

      create.mockReturnValueOnce({
        get
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().getInstitutionById(
        mocks.institution.id as string
      )();

      expect(get).toHaveBeenCalledWith(`/institutions/${mocks.institution.id}`);
      expect(isAxiosError).toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should return an error when received a bad response from selfcare", async () => {
      const get = vi.fn(() => Promise.resolve({ status: 200, data: "" }));

      create.mockReturnValueOnce({
        get
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().getInstitutionById(
        mocks.institution.id as string
      )();

      expect(get).toHaveBeenCalledWith(`/institutions/${mocks.institution.id}`);
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isLeft(result)).toBeTruthy();
    });
  });
});
