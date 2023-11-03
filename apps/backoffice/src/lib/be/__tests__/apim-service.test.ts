import { AccessToken } from "@azure/identity";
import { fa, faker } from "@faker-js/faker";
import * as E from "fp-ts/lib/Either";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getApimRestClient } from "../apim-service";
import { mocked } from "vite-test-utils";
import { mocked } from "vite-test-utils";
const mocks: {
  aServiceId: string;
  anUserId: string;
} = vi.hoisted(() => ({
  aServiceId: "aServiceId",
  anUserId: "anUserId"
}));

const { create, isAxiosError } = vi.hoisted(() => ({
  create: vi.fn().mockReturnValue({
    get: vi.fn()
  }),
  isAxiosError: vi.fn().mockReturnValue(false)
}));

const { ClientSecretCredential } = vi.hoisted(() => ({
  ClientSecretCredential: vi.fn().mockImplementation(() => ({
    getToken: async () => ({
      token: "mocked-token",
      expiresOnTimestamp: 123456789
    })
  }))
}));

vi.mock("axios", async () => {
  const actual = await vi.importActual("axios");
  return {
    ...(actual as any),
    default: { create, isAxiosError }
  };
});

vi.mock("@azure/identity", async () => {
  const actual = await vi.importActual("@azure/identity");
  return {
    ...(actual as any),
    ClientSecretCredential
  };
});

const { cacheMock } = vi.hoisted(() => ({
  cacheMock: func => func
}));
vi.mock("react", () => ({
  cache: cacheMock
}));

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID:
      "AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID",
    AZURE_CLIENT_SECRET_CREDENTIAL_SECRET:
      "AZURE_CLIENT_SECRET_CREDENTIAL_SECRET",
    AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID:
      "AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID",
    AZURE_APIM_PRODUCT_NAME: "AZURE_APIM_PRODUCT_NAME",
    AZURE_SUBSCRIPTION_ID: "AZURE_SUBSCRIPTION_ID",
    AZURE_APIM_RESOURCE_GROUP: "AZURE_APIM_RESOURCE_GROUP",
    AZURE_APIM: "AZURE_APIM",
    AZURE_CREDENTIALS_SCOPE_URL: "AZURE_CREDENTIALS_SCOPE_URL",
    AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL:
      "AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL"
  };
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("Apim Rest Client", () => {
  describe("getServiceList", () => {
    it("should return the list when response is OK", async () => {
      const get = vi.fn(() =>
        Promise.resolve({ status: 200, data: { name: mocks.aServiceId } })
      );

      create.mockReturnValueOnce({
        get
      });

      const aNotExpiredAzureAccessToken = {
        token: faker.internet.password(),
        expiresOnTimestamp: faker.date.future().getTime()
      };

      const getToken = vi
        .fn()
        .mockReturnValue(Promise.resolve(aNotExpiredAzureAccessToken));

      ClientSecretCredential.mockImplementation(() => ({
        getToken
      }));

      const apimRestClient = await getApimRestClient();
      const result = await apimRestClient.getServiceList(
        mocks.anUserId,
        10,
        10
      )();

      expect(get).toHaveBeenCalledOnce();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual({ name: mocks.aServiceId });
      }
    });

    it("should retry when apim response is 401 or 403 and return the list", async () => {
      const anExpiredAzureAccessToken = {
        token: faker.internet.password(),
        expiresOnTimestamp: faker.date.past().getTime()
      };
      const aNotExpiredAzureAccessToken = {
        token: faker.internet.password(),
        expiresOnTimestamp: faker.date.future().getTime()
      };

      const get = vi
        .fn()
        .mockReturnValueOnce(Promise.reject({ response: { status: 403 } }))
        .mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { name: mocks.aServiceId } })
        );

      create.mockReturnValue({
        get
      });

      isAxiosError.mockReturnValueOnce(true);

      const getToken = vi
        .fn()
        .mockReturnValueOnce(Promise.resolve(anExpiredAzureAccessToken))
        .mockReturnValueOnce(Promise.resolve(aNotExpiredAzureAccessToken));

      ClientSecretCredential.mockImplementation(() => ({
        getToken
      }));

      const apimRestClient = await getApimRestClient();
      const result = await apimRestClient.getServiceList(
        mocks.anUserId,
        10,
        10
      )();

      // Create should be called 2 times:
      // - the first one with the expired token
      // - the second one whit the not expired token
      expect(create).toHaveBeenCalledTimes(2);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${anExpiredAzureAccessToken.token}`
          })
        })
      );
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${aNotExpiredAzureAccessToken.token}`
          })
        })
      );

      // get should be called 2 times
      expect(get).toHaveBeenCalledTimes(2);
      expect(isAxiosError).toHaveBeenCalledOnce();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual({ name: mocks.aServiceId });
      }
    });

    it("should not retry more the once when apim response is 401 or 403", async () => {
      const get = vi
        .fn()
        .mockReturnValueOnce(Promise.reject({ response: { status: 403 } }))
        .mockReturnValueOnce(Promise.reject({ response: { status: 403 } }))
        .mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { name: mocks.aServiceId } })
        );

      create.mockReturnValue({
        get
      });

      isAxiosError.mockReturnValue(true);

      const anExpiredAzureAccessToken = {
        token: faker.internet.password(),
        expiresOnTimestamp: faker.date.past().getTime()
      };

      const getToken = vi
        .fn()
        .mockReturnValue(Promise.resolve(anExpiredAzureAccessToken));

      ClientSecretCredential.mockImplementation(() => ({
        getToken
      }));

      const apimRestClient = await getApimRestClient();
      const result = await apimRestClient.getServiceList(
        mocks.anUserId,
        10,
        10
      )();

      // Create should be called 2 times
      expect(create).toHaveBeenCalledTimes(2);

      // get should be called 2 times
      expect(get).toHaveBeenCalledTimes(2);
      expect(isAxiosError).toHaveBeenCalledTimes(2);

      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should not retry when apim response is not 401 or 403 and return the error", async () => {
      const get = vi
        .fn()
        .mockReturnValueOnce(Promise.reject({ response: { status: 500 } }));

      create.mockReturnValue({
        get
      });

      isAxiosError.mockReturnValue(true);

      const aNotExpiredAzureAccessToken = {
        token: faker.internet.password(),
        expiresOnTimestamp: faker.date.future().getTime()
      };

      const getToken = vi
        .fn()
        .mockReturnValue(Promise.resolve(aNotExpiredAzureAccessToken));

      ClientSecretCredential.mockImplementation(() => ({
        getToken
      }));

      const apimRestClient = await getApimRestClient();
      const result = await apimRestClient.getServiceList(
        mocks.anUserId,
        10,
        10
      )();

      expect(create).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledTimes(1);
      expect(isAxiosError).toHaveBeenCalledTimes(1);

      expect(E.isLeft(result)).toBeTruthy();
    });
  });
});
