import { faker } from "@faker-js/faker/locale/it";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Institution } from "../../../types/selfcare/Institution";
import { InstitutionResource } from "../../../types/selfcare/InstitutionResource";
import { InstitutionResources } from "../../../types/selfcare/InstitutionResources";
import { SupportRequestDto } from "../../../types/selfcare/SupportRequestDto";
import { SupportResponse } from "../../../types/selfcare/SupportResponse";
import { getSelfcareClient, resetInstance } from "../selfcare-client";

const mocks: {
  institution: Institution;
  institutions: InstitutionResources;
  aSelfcareUserId: string;
  aSupportRequest: SupportRequestDto;
  aSupportResponse: SupportResponse;
} = {
  institution: { id: "institutionId" } as Institution,
  institutions: [
    { id: "institutionId1" } as InstitutionResource,
    { id: "institutionId2" } as InstitutionResource
  ],
  aSelfcareUserId: "aSelfcareUserId",
  aSupportRequest: { email: faker.internet.email() as EmailString },
  aSupportResponse: { redirectUrl: faker.internet.url() }
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
        Promise.resolve({ status: 200, data: mocks.institutions })
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
          userIdForAuth: mocks.aSelfcareUserId
        }
      });
      expect(isAxiosError).not.toHaveBeenCalled();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(mocks.institutions);
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

  describe("sendSupportRequest", () => {
    it("should return an error when received an 'expected' error from selfcare", async () => {
      const errorMessage = "Received 404 response";
      const post = vi.fn(() =>
        Promise.reject({
          message: errorMessage,
          response: { status: 404 }
        })
      );
      isAxiosError.mockReturnValueOnce(true);

      create.mockReturnValueOnce({
        post
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().sendSupportRequest(
        mocks.aSupportRequest
      )();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).eq(
          `REST client error catched: ${errorMessage}`
        );
      }
      expect(post).toHaveBeenCalledWith("/support", mocks.aSupportRequest);
      expect(isAxiosError).toHaveBeenCalled();
    });

    it("should return an error when received an 'unexpected' error from selfcare", async () => {
      const error = new Error("unexpected error message");
      const post = vi.fn(() => Promise.reject(error));

      create.mockReturnValueOnce({
        post
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().sendSupportRequest(
        mocks.aSupportRequest
      )();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).eq(`Unexpected error: ${error}`);
      }
      expect(post).toHaveBeenCalledWith("/support", mocks.aSupportRequest);
      expect(isAxiosError).toHaveBeenCalled();
    });

    it("should return an error when received a bad response from selfcare", async () => {
      const post = vi.fn(() => Promise.resolve({ status: 200, data: "" }));

      create.mockReturnValueOnce({
        post
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().sendSupportRequest(
        mocks.aSupportRequest
      )();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).match(/is not a valid/);
      }
      expect(post).toHaveBeenCalledWith("/support", mocks.aSupportRequest);
      expect(isAxiosError).not.toHaveBeenCalled();
    });

    it("should return a support response from selfcare", async () => {
      const post = vi.fn(() =>
        Promise.resolve({ status: 200, data: mocks.aSupportResponse })
      );

      create.mockReturnValueOnce({
        post
      });

      //reset selfcare client instance
      resetInstance();

      const result = await getSelfcareClient().sendSupportRequest(
        mocks.aSupportRequest
      )();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual(mocks.aSupportResponse);
      }
      expect(post).toHaveBeenCalledWith("/support", mocks.aSupportRequest);
      expect(isAxiosError).not.toHaveBeenCalled();
    });
  });
});
