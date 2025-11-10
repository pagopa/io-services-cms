import {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_UNAUTHORIZED,
} from "@/config/constants";
import { getAzureAccessToken } from "@/lib/be/azure-access-token";
import { HealthChecksError, minifyApimError } from "@/lib/be/errors";
import { SubscriptionCollection } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import { Agent, HttpAgentConfig } from "@io-services-cms/fetch-utils";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios, { AxiosError } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export interface ApimRestClient {
  readonly getUserSubscriptions: (
    userId: string,
    filter: string,
    limit?: number,
    offset?: number,
    isRetry?: boolean,
  ) => TE.TaskEither<AxiosError | Error, SubscriptionCollection>;
}

type Config = t.TypeOf<typeof Config>;
const Config = t.intersection([
  t.type({
    API_APIM_MOCKING: BooleanFromString,
    AZURE_APIM: NonEmptyString,
    AZURE_APIM_PRODUCT_NAME: NonEmptyString,
    AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
    AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL: NonEmptyString,
    AZURE_SUBSCRIPTION_ID: NonEmptyString,
  }),
  HttpAgentConfig,
]);

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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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
  const apimClient = ApimUtils.getApimClient(apimConfig.AZURE_SUBSCRIPTION_ID);
  return ApimUtils.getApimService(
    apimClient,
    apimConfig.AZURE_APIM_RESOURCE_GROUP,
    apimConfig.AZURE_APIM,
    apimConfig.AZURE_APIM_PRODUCT_NAME,
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
    httpAgent: Agent.getHttpsAgent(apimConfig),
    httpsAgent: Agent.getHttpsAgent(apimConfig),
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

  const getUserSubscriptions: ApimRestClient["getUserSubscriptions"] = (
    userId,
    filter,
    limit,
    offset,
    isRetry = false,
  ) =>
    pipe(
      TE.tryCatch(
        () =>
          axiosInstance.get<SubscriptionCollection>(
            `${apimConfig.AZURE_SUBSCRIPTION_ID}/resourceGroups/${apimConfig.AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${apimConfig.AZURE_APIM}/users/${userId}/subscriptions`,
            {
              params: {
                $filter: filter,
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
            [
              HTTP_STATUS_FORBIDDEN as number,
              HTTP_STATUS_UNAUTHORIZED as number,
            ].includes(e.response?.status ?? 0)
          ) {
            return pipe(
              TE.fromIO(() => refreshClient()),
              TE.chain(() =>
                getUserSubscriptions(userId, filter, limit, offset, true),
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
    getUserSubscriptions,
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

type UpsertSubscriptionResult = ReturnType<
  ApimUtils.ApimService["upsertSubscription"]
>;
export function upsertSubscription(
  type: "MANAGE",
  ownerId: string,
): UpsertSubscriptionResult;
export function upsertSubscription(
  type: "MANAGE_GROUP",
  ownerId: string,
  group: { id: string; name: string },
): UpsertSubscriptionResult;
export function upsertSubscription(
  type: ApimUtils.definitions.SubscriptionType,
  ownerId: string,
  value?: { id: string; name: string },
): UpsertSubscriptionResult {
  switch (type) {
    case "MANAGE":
      return getApimService().upsertSubscription(
        ownerId,
        ApimUtils.SUBSCRIPTION_MANAGE_PREFIX + ownerId,
      );
    case "MANAGE_GROUP":
      return getApimService().upsertSubscription(
        ownerId,
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + value?.id,
        value?.name,
      );
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = type;
      throw new Error("Invalid type");
  }
}
