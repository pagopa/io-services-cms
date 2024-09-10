import {
  AccessToken,
  AzureAuthorityHosts,
  ClientSecretCredential,
} from "@azure/identity";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

import { HealthChecksError } from "./errors";

//Instanza contentente le credenziali per accedere ad Azure
let accessToken: AccessToken;

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString,
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

const refreshAzureAccessToken = async (): Promise<AccessToken> => {
  const apimConfig = getAzureConfig();

  let tokenResponse: AccessToken;
  try {
    const credential = new ClientSecretCredential(
      apimConfig.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID,
      apimConfig.AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID,
      apimConfig.AZURE_CLIENT_SECRET_CREDENTIAL_SECRET,
      {
        authorityHost: AzureAuthorityHosts.AzurePublicCloud,
      },
    );
    tokenResponse = await credential.getToken(
      apimConfig.AZURE_CREDENTIALS_SCOPE_URL,
    );
  } catch (e) {
    console.error("Error retrieving on Azure Access Token", e);
    throw e;
  }

  if (!tokenResponse.token) {
    throw new Error("Error retrieving on Azure Access Token => null response");
  }

  return tokenResponse;
};

export const getAzureAccessToken = async (): Promise<string> => {
  // Lazy init accessToken
  if (!accessToken) {
    accessToken = await refreshAzureAccessToken();
    console.debug(
      `Azure AccessToken initialized: Expiration Date is => $${new Date(
        accessToken.expiresOnTimestamp,
      )}`,
    );
  } else {
    // Lazy Referesh accessToken
    const now = new Date();
    const expires = new Date(accessToken.expiresOnTimestamp);
    if (now > expires) {
      accessToken = await refreshAzureAccessToken();
      console.debug(
        `Azure AccessToken has expired and was refreshed: Old Expiration Date was => $${expires}, New Expiration Date is => $${new Date(
          accessToken.expiresOnTimestamp,
        )}`,
      );
    } else {
      console.debug(
        `Azure AccessToken is still good expired and was refreshed: Expiration Date was => $${expires}`,
      );
    }
  }
  return accessToken.token;
};

export const getAzureAccessTokenHealth: () => Promise<void> = async () => {
  try {
    getAzureConfig();
  } catch (e) {
    throw new HealthChecksError("azure-access-token", e);
  }
};
