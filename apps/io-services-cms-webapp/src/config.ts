/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import { ServiceLifecycle } from "@io-services-cms/models";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import {
  IntegerFromString,
  NonNegativeInteger,
  NumberFromString,
} from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { FiscalCode } from "./generated/api/FiscalCode";

// used for internal job dispatch, temporary files, etc...
const InternalStorageAccount = t.type({
  INTERNAL_STORAGE_CONNECTION_STRING: NonEmptyString,
});

const ServicePayloadConfig = t.type({
  MAX_ALLOWED_PAYMENT_AMOUNT: withDefault(
    IntegerFromString.pipe(ServiceLifecycle.definitions.MaxAllowedAmount),
    "1000000" as unknown as ServiceLifecycle.definitions.MaxAllowedAmount
  ),
  SANDBOX_FISCAL_CODE: withDefault(
    FiscalCode,
    "AAAAAA00A00A000A" as FiscalCode
  ),
});

// Jira configuration
export const JiraConfig = t.type({
  JIRA_NAMESPACE_URL: NonEmptyString,
  JIRA_PROJECT_NAME: NonEmptyString,
  JIRA_TOKEN: NonEmptyString,
  JIRA_USERNAME: EmailAddress,
  JIRA_CONTRACT_CUSTOM_FIELD: NonEmptyString,
  JIRA_DELEGATE_EMAIL_CUSTOM_FIELD: NonEmptyString,
  JIRA_DELEGATE_NAME_CUSTOM_FIELD: NonEmptyString,
  JIRA_ORGANIZATION_CF_CUSTOM_FIELD: NonEmptyString,
  JIRA_ORGANIZATION_NAME_CUSTOM_FIELD: NonEmptyString,
});
export type JiraConfig = t.TypeOf<typeof JiraConfig>;

export type PostgreSqlConfig = t.TypeOf<typeof PostgreSqlConfig>;
export const PostgreSqlConfig = t.type({
  REVIEWER_DB_HOST: NonEmptyString,
  REVIEWER_DB_IDLE_TIMEOUT: withDefault(NumberFromString, 30000),
  REVIEWER_DB_NAME: NonEmptyString,
  REVIEWER_DB_PASSWORD: NonEmptyString,
  REVIEWER_DB_PORT: NumberFromString,
  REVIEWER_DB_SCHEMA: NonEmptyString,
  REVIEWER_DB_TABLE: NonEmptyString,
  REVIEWER_DB_USER: NonEmptyString,
  REVIEWER_DB_READ_MAX_ROW: withDefault(IntegerFromString, 50),
  REVIEWER_DB_APP_NAME: withDefault(
    NonEmptyString,
    "reviewer" as NonEmptyString
  ),
});

export type CosmosConfig = t.TypeOf<typeof CosmosConfig>;
export const CosmosConfig = t.type({
  COSMOSDB_CONNECTIONSTRING: NonEmptyString,
  COSMOSDB_URI: NonEmptyString,
  COSMOSDB_NAME: NonEmptyString,
  COSMOSDB_KEY: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_PUBLICATION: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_HISTORY: NonEmptyString,
});

export const AzureClientSecretCredential = t.type({
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString,
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString,
});
export type AzureClientSecretCredential = t.TypeOf<
  typeof AzureClientSecretCredential
>;

// Apim configuration
export const ApimConfig = t.type({
  AZURE_APIM: NonEmptyString,
  AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
  AZURE_SUBSCRIPTION_ID: NonEmptyString,
  AZURE_APIM_DEFAULT_SUBSCRIPTION_PRODUCT_NAME: NonEmptyString,
});
export type ApimConfig = t.TypeOf<typeof ApimConfig>;

// Queue configuration
export const QueueConfig = t.type({
  REQUEST_REVIEW_QUEUE: NonEmptyString,
  REQUEST_PUBLICATION_QUEUE: NonEmptyString,
  REQUEST_HISTORICIZATION_QUEUE: NonEmptyString,
});
export type QueueConfig = t.TypeOf<typeof QueueConfig>;

// Services pagination configuration
export const PaginationConfig = t.type({
  PAGINATION_DEFAULT_LIMIT: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "20" as unknown as NonNegativeInteger
  ),
  PAGINATION_MAX_LIMIT: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "100" as unknown as NonNegativeInteger
  ),
});
export type PaginationConfig = t.TypeOf<typeof PaginationConfig>;

// Global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.intersection([
  t.intersection([
    t.type({ isProduction: t.boolean }),
    InternalStorageAccount,
    JiraConfig,
    PostgreSqlConfig,
    ServicePayloadConfig,
  ]),
  t.intersection([
    CosmosConfig,
    AzureClientSecretCredential,
    ApimConfig,
    QueueConfig,
    PaginationConfig,
  ]),
]);

export const envConfig = {
  ...process.env,
  isProduction: process.env.NODE_ENV === "production",
};

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors) => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    })
  );
