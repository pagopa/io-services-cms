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
  // TODO: Capire se metterlo direttamente nello storageAccount della function in tal caso recuperarlo come QueueStorageConnection nella sezione globale
  FEATURED_ITEMS_BLOB_CONNECTION_STRING: NonEmptyString,
  FEATURED_ITEMS_CONTAINER_NAME: NonEmptyString,
  FEATURED_ITEMS_FILE_NAME: NonEmptyString,
});

export type AzureSearchConfig = t.TypeOf<typeof AzureSearchConfig>;
export const AzureSearchConfig = t.intersection([
  t.type({
    AZURE_SEARCH_ENDPOINT: NonEmptyString,
    AZURE_SEARCH_INSTITUTIONS_INDEX_NAME: NonEmptyString,
    AZURE_SEARCH_SERVICES_INDEX_NAME: NonEmptyString,
  }),
  t.partial({
    AZURE_SEARCH_API_KEY: NonEmptyString, // If not provided AzureSearch will authenticate with managed identity
    AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE: NonEmptyString,
    AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PARAMETER: NonEmptyString,
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
    "101" as unknown as NonNegativeInteger
  ),
  PAGINATION_MAX_OFFSET: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "101" as unknown as NonNegativeInteger
  ),
});

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.intersection([
  t.type({
    APPINSIGHTS_INSTRUMENTATIONKEY: NonEmptyString,

    // Default is 10 sec timeout
    FETCH_TIMEOUT_MS: withDefault(t.string, "10000").pipe(NumberFromString),

    isProduction: t.boolean,
  }),
  FeaturedItemsConfig,
  AzureSearchConfig,
  PaginationConfig,
]);

export const envConfig = {
  ...process.env,
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