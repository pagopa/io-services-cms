/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import {
  IntegerFromString,
  NonNegativeInteger,
  NumberFromString,
} from "@pagopa/ts-commons/lib/numbers";
import * as reporters from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";

export type FeaturedItemsConfig = t.TypeOf<typeof FeaturedItemsConfig>;
export const FeaturedItemsConfig = t.type({
  FEATURED_ITEMS_STORAGE_ACCOUNT_NAME: NonEmptyString,
  FEATURED_ITEMS_CONTAINER_NAME: NonEmptyString,
  FEATURED_SERVICES_FILE_NAME: NonEmptyString,
  FEATURED_INSTITUTIONS_FILE_NAME: NonEmptyString,
});

export type AzureSearchConfig = t.TypeOf<typeof AzureSearchConfig>;
export const AzureSearchConfig = t.intersection([
  t.type({
    AZURE_SEARCH_ENDPOINT: NonEmptyString,
    AZURE_SEARCH_SERVICE_VERSION: NonEmptyString,
    AZURE_SEARCH_INSTITUTIONS_INDEX_NAME: NonEmptyString,
    AZURE_SEARCH_SERVICES_INDEX_NAME: NonEmptyString,
  }),
  t.partial({
    AZURE_SEARCH_API_KEY: NonEmptyString, // If not provided AzureSearch will authenticate with managed identity
    AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE: NonEmptyString,
    AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PARAMETER: NonEmptyString,
  }),
]);

// CosmosDB configuration
export type CosmosConfig = t.TypeOf<typeof CosmosConfig>;
export const CosmosConfig = t.intersection([
  t.type({
    COSMOSDB_URI: NonEmptyString,
    COSMOSDB_NAME: NonEmptyString,
    COSMOSDB_CONTAINER_SERVICE_DETAILS: NonEmptyString,
  }),
  t.partial({
    COSMOSDB_KEY: NonEmptyString,
  }),
]);

// Services pagination configuration
export type PaginationConfig = t.TypeOf<typeof PaginationConfig>;
export const PaginationConfig = t.type({
  PAGINATION_DEFAULT_LIMIT: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "20" as unknown as NonNegativeInteger
  ),
  PAGINATION_MAX_LIMIT: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "100" as unknown as NonNegativeInteger
  ),
  PAGINATION_MAX_OFFSET: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "500" as unknown as NonNegativeInteger
  ),
});

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.intersection([
  t.type({
    // Default is 10 sec timeout
    FETCH_TIMEOUT_MS: withDefault(t.string, "10000").pipe(NumberFromString),

    isProduction: t.boolean,
  }),
  FeaturedItemsConfig,
  AzureSearchConfig,
  PaginationConfig,
  CosmosConfig,
]);

export const envConfig = {
  ...process.env,
  FEATURED_ITEMS_STORAGE_ACCOUNT_NAME:
    process.env.AzureWebJobsStorage__accountName,
  isProduction: process.env.NODE_ENV === "production",
};

const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or an Error
 */
export const getConfigOrError = (): E.Either<Error, IConfig> =>
  pipe(
    errorOrConfig,
    E.mapLeft(
      (errors: ReadonlyArray<t.ValidationError>) =>
        new Error(
          `Invalid configuration: ${reporters.readableReportSimplified(errors)}`
        )
    )
  );
