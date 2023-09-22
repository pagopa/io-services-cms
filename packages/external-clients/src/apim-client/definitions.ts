import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { enumType } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

export const AzureClientSecretCredential = t.type({
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString,
});
export type AzureClientSecretCredential = t.TypeOf<
  typeof AzureClientSecretCredential
>;

// TODO: this is a generated definitions from the openapi generator
// we needs to find a way to import it from the generated code

export enum SubscriptionKeyTypeEnum {
  "primary" = "primary",

  "secondary" = "secondary",
}

export type SubscriptionKeyType = t.TypeOf<typeof SubscriptionKeyType>;
export const SubscriptionKeyType = enumType<SubscriptionKeyTypeEnum>(
  SubscriptionKeyTypeEnum,
  "SubscriptionKeyType"
);

/**
 * Utilities to handle subscriptions api keys
 */
export enum ApiKeyTypeEnum {
  "MANAGE" = "MANAGE",
}

export const MANAGE_APIKEY_PREFIX = "MANAGE-";
