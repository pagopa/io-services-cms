import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { cache } from "react";
import { HealthChecksError } from "./errors";

const Config = t.type({
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString,
  AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME: NonEmptyString,
  AZURE_SUBSCRIPTION_ID: NonEmptyString,
  AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
  AZURE_APIM: NonEmptyString
});

const getApimConfig = cache(() => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error(
      `error parsing apim config, ${readableReport(result.left)}`
    );
  }
  return result.right;
});

export const getApimService = cache(() => {
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

export const getApimHealth = async () => {
  try {
    const { AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME } = getApimConfig();
    const apimService = getApimService();
    const res = await apimService.getProductByName(
      AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME
    )();
    if (!res) {
      throw new Error();
    }
  } catch (e) {
    throw new HealthChecksError("APIM", e);
  }
};
