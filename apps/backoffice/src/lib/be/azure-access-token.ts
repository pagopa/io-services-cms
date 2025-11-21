import { AccessToken, DefaultAzureCredential } from "@azure/identity";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

import { HealthChecksError } from "./errors";

// Istanza contenente le credenziali per accedere ad Azure
let accessToken: AccessToken;

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  AZURE_CREDENTIALS_SCOPE_URL: NonEmptyString,
});

let azureConfig: Config;

const getAzureConfig = (): Config => {
  if (!azureConfig) {
    const result = Config.decode(process.env);

    if (E.isLeft(result)) {
      throw new Error(
        `error parsing azure access-token config, ${readableReport(
          result.left,
        )}`,
      );
    }
    azureConfig = result.right;
  }

  return azureConfig;
};

const isMockEnabled = () => process.env.USE_MOCK_AZURE_CREDENTIAL === "true";

const refreshAzureAccessToken = async (): Promise<AccessToken> => {
  if (isMockEnabled()) {
    const now = Date.now();
    const mockToken: AccessToken = {
      expiresOnTimestamp: now + 60 * 60 * 1000,
      token: "mock-azure-access-token",
    };

    console.debug(
      "[Azure AccessToken] Using MOCK token for local dev (USE_MOCK_AZURE_CREDENTIAL=true)",
    );

    return mockToken;
  }

  const apimConfig = getAzureConfig();

  let tokenResponse: AccessToken;
  try {
    const credential = new DefaultAzureCredential();
    tokenResponse = await credential.getToken(
      apimConfig.AZURE_CREDENTIALS_SCOPE_URL,
    );
  } catch (e) {
    console.error("Error retrieving Azure Access Token", e);
    throw e;
  }

  if (!tokenResponse.token) {
    throw new Error("Error retrieving Azure Access Token => null response");
  }

  return tokenResponse;
};

export const getAzureAccessToken = async (): Promise<string> => {
  // Lazy init accessToken
  if (!accessToken) {
    accessToken = await refreshAzureAccessToken();
    console.debug(
      `Azure AccessToken initialized: Expiration Date is => ${new Date(
        accessToken.expiresOnTimestamp,
      )}`,
    );
  } else {
    // Lazy refresh accessToken
    const now = new Date();
    const expires = new Date(accessToken.expiresOnTimestamp);
    if (now > expires) {
      accessToken = await refreshAzureAccessToken();
      console.debug(
        `Azure AccessToken has expired and was refreshed: Old Expiration Date was => ${expires}, New Expiration Date is => ${new Date(
          accessToken.expiresOnTimestamp,
        )}`,
      );
    } else {
      console.debug(
        `Azure AccessToken is still valid: Expiration Date is => ${expires}`,
      );
    }
  }
  return accessToken.token;
};

export const getAzureAccessTokenHealth: () => Promise<void> = async () => {
  try {
    if (isMockEnabled()) {
      console.debug(
        "[Azure AccessToken] Health check skipped (USE_MOCK_AZURE_CREDENTIAL=true)",
      );
      return;
    }

    getAzureConfig();
  } catch (e) {
    throw new HealthChecksError("azure-access-token", e);
  }
};
