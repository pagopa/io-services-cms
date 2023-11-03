import { SubscriptionCollection } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { cache } from "react";
import { getAzureAccessToken } from "./azure-access-token";
import { HealthChecksError } from "./errors";

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  AZURE_APIM_PRODUCT_NAME: NonEmptyString,
  AZURE_SUBSCRIPTION_ID: NonEmptyString,
  AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
  AZURE_APIM: NonEmptyString,
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


const buildApimRestClient = cache((azureAccessToken: string) => {
  const apimConfig = getApimConfig();
  const axiosInstance = axios.create({
    baseURL: apimConfig.AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL,
    timeout: 5000,
    headers: { Authorization: `Bearer ${azureAccessToken}` }
  });

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
});

export const getApimRestClient = async () => {
  const azureAccessToken = await getAzureAccessToken();
  return buildApimRestClient(azureAccessToken);
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
