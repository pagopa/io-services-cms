import {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_UNAUTHORIZED,
} from "@/config/constants";
import { getAzureAccessToken } from "@/lib/be/azure-access-token";
import { HealthChecksError, minifyApimError } from "@/lib/be/errors";
import { SubscriptionCollection } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  getKeepAliveAgentOptions,
  newHttpAgent,
  newHttpsAgent,
} from "@pagopa/ts-commons/lib/agent";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios, { AxiosError } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export interface ApimRestClient {
  getServiceList: (
    userId: string,
    limit: number,
    offset: number,
    serviceId?: string,
    isRetry?: boolean,
  ) => TE.TaskEither<AxiosError | Error, SubscriptionCollection>;
}

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  API_APIM_MOCKING: BooleanFromString,
  AZURE_APIM: NonEmptyString,
  AZURE_APIM_PRODUCT_NAME: NonEmptyString,
  AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
  AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString,
  AZURE_SUBSCRIPTION_ID: NonEmptyString,
});

let apimConfig: Config;
let apimService: ApimUtils.ApimService;

const getApimConfig = (): Config => {
  if (!apimConfig) {
    const result = Config.decode(process.env);

    if (E.isLeft(result)) {
      throw new Error(
        `error parsing apim config, ${readableReport(result.left)}`,
      );
    }

    if (result.right.API_APIM_MOCKING) {
      const { setupMocks } = require("../../../mocks");
      setupMocks();
    }

    apimConfig = result.right;
  }

  return apimConfig;
};

const buildApimService: () => ApimUtils.ApimService = () => {
  // Apim Service, used to operates on Apim resources
  const apimConfig = getApimConfig();
  const apimClient = ApimUtils.getApimClient(
    apimConfig,
    apimConfig.AZURE_SUBSCRIPTION_ID,
  );
  return ApimUtils.getApimService(
    apimClient,
    apimConfig.AZURE_APIM_RESOURCE_GROUP,
    apimConfig.AZURE_APIM,
  );
};

export const getApimService: () => ApimUtils.ApimService = () => {
  if (!apimService) {
    apimService = buildApimService();
  }
  return apimService;
};

const getAxiosInstance = (azureAccessToken: string) => {
  const apimConfig = getApimConfig();

  return axios.create({
    baseURL: apimConfig.AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL,
    headers: { Authorization: `Bearer ${azureAccessToken}` },
    httpAgent: newHttpAgent(getKeepAliveAgentOptions(process.env)),
    httpsAgent: newHttpsAgent(getKeepAliveAgentOptions(process.env)),
    timeout: 5000,
  });
};

export const getApimRestClient = async (): Promise<ApimRestClient> => {
  // ottengo config
  const apimConfig = getApimConfig();

  // ottengo token
  let azureAccessToken = await getAzureAccessToken();

  // ottengo client
  let axiosInstance = getAxiosInstance(azureAccessToken);
  // creo metodi client

  const refreshClient = async () => {
    // refresh token
    azureAccessToken = await getAzureAccessToken();
    // rebuild axios instance
    axiosInstance = getAxiosInstance(azureAccessToken);
  };

  const getServiceList = (
    userId: string,
    limit: number,
    offset: number,
    serviceId?: string,
    isRetry = false,
  ): TE.TaskEither<AxiosError | Error, SubscriptionCollection> =>
    pipe(
      TE.tryCatch(
        () =>
          axiosInstance.get<SubscriptionCollection>(
            `${apimConfig.AZURE_SUBSCRIPTION_ID}/resourceGroups/${apimConfig.AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${apimConfig.AZURE_APIM}/users/${userId}/subscriptions`,
            {
              params: {
                $filter: serviceId
                  ? `name eq '${serviceId}' and not startswith(name, 'MANAGE-')`
                  : `not startswith(name, 'MANAGE-')`,
                $skip: offset,
                $top: limit,
                "api-version": "2022-08-01",
              },
            },
          ),
        identity,
      ),
      TE.map(({ data }) => data),
      TE.orElse((e) => {
        if (axios.isAxiosError(e)) {
          if (
            !isRetry &&
            [HTTP_STATUS_FORBIDDEN, HTTP_STATUS_UNAUTHORIZED].includes(
              e.response?.status ?? 0,
            )
          ) {
            return pipe(
              TE.fromIO(() => refreshClient()),
              TE.chain(() =>
                getServiceList(userId, limit, offset, serviceId, true),
              ),
            );
          }
          return TE.left(e);
        }
        return TE.left(
          new Error(`Error calling APIM getServiceList API: ${e}`),
        );
      }),
    );

  // ritono client
  return {
    getServiceList,
  };
};

export const getApimHealth: () => Promise<void> = async () => {
  try {
    const { AZURE_APIM_PRODUCT_NAME } = getApimConfig();
    const apimService = getApimService();
    const res = await apimService.getProductByName(AZURE_APIM_PRODUCT_NAME)();
    if (E.isLeft(res)) {
      throw new Error(
        `error getting apim product, ${JSON.stringify(
          minifyApimError(res.left),
        )}`,
      );
    }
  } catch (e) {
    throw new HealthChecksError("apim", e);
  }
};
