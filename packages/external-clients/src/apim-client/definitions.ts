import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

export const AzureClientSecretCredential = t.type({
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString,
});
export type AzureClientSecretCredential = t.TypeOf<
  typeof AzureClientSecretCredential
>;

export type SubscriptionType = "MANAGE" | "MANAGE_GROUP";
