import { SubscriptionCollection } from "@azure/arm-apimanagement";
import { AzureAuthorityHosts, ClientSecretCredential } from "@azure/identity";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { cache } from "react";
import { HealthChecksError } from "./errors";

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString,
  AZURE_APIM_PRODUCT_NAME: NonEmptyString,
  AZURE_SUBSCRIPTION_ID: NonEmptyString,
  AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
  AZURE_APIM: NonEmptyString,
  AZURE_CREDENTIALS_SCOPE_URL: NonEmptyString,
  AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL: NonEmptyString
});

const getApimConfig: () => Config = cache(() => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error(
      `error parsing apim config, ${readableReport(result.left)}`
    );
  }
  return result.right;
});

export const getApimService: () => ApimUtils.ApimService = cache(() => {
  // Apim Service, used to operates on Apim resources
  const apimConfig = getApimConfig();
  const apimClient = ApimUtils.getApimClient(
    apimConfig,
    apimConfig.AZURE_SUBSCRIPTION_ID
  );
  return ApimUtils.getApimService(
    apimClient,
    apimConfig.AZURE_APIM_RESOURCE_GROUP,
    apimConfig.AZURE_APIM
  );
});

const getAxiosInstance = async () => {
  const apimConfig = getApimConfig();

  const credential = new ClientSecretCredential(
    apimConfig.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID,
    apimConfig.AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID,
    apimConfig.AZURE_CLIENT_SECRET_CREDENTIAL_SECRET,
    {
      authorityHost: AzureAuthorityHosts.AzurePublicCloud
    }
  );
  const tokenResponse = await credential.getToken(
    apimConfig.AZURE_CREDENTIALS_SCOPE_URL
  );

  const accessToken = tokenResponse?.token || null;

  if (!accessToken) {
    throw new Error("invalid or null accessToken");
  }

  return axios.create({
    baseURL: apimConfig.AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL,
    timeout: 5000,
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const getApimRestClient = async () => {
  const apimConfig = getApimConfig();
  const axiosInstance = await getAxiosInstance();

  const getServiceList = (
    userId: string,
    limit: number,
    offset: number
  ): TE.TaskEither<Error, SubscriptionCollection> =>
    pipe(
      TE.tryCatch(
        () =>
          axiosInstance.get<SubscriptionCollection>(
            `${apimConfig.AZURE_SUBSCRIPTION_ID}/resourceGroups/${apimConfig.AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${apimConfig.AZURE_APIM}/users/${userId}/subscriptions`,
            {
              params: {
                "api-version": "2022-08-01",
                $skip: offset,
                $top: limit
              }
            }
          ),
        identity
      ),
      TE.mapLeft(e => {
        if (axios.isAxiosError(e)) {
          return new Error(`Axios error catched ${e.message}`);
        } else {
          return new Error(`Error calling APIM getServiceList API: ${e}`);
        }
      }),
      TE.map(({ data }) => data)
    );

  return {
    getServiceList
  };
};

export const getApimHealth: () => Promise<void> = async () => {
  try {
    const { AZURE_APIM_PRODUCT_NAME } = getApimConfig();
    const apimService = getApimService();
    const res = await apimService.getProductByName(AZURE_APIM_PRODUCT_NAME)();
    if (E.isLeft(res)) {
      throw new Error(
        `error getting apim product, ${JSON.stringify(res.left)}`
      );
    }
  } catch (e) {
    throw new HealthChecksError("apim", e);
  }
};
