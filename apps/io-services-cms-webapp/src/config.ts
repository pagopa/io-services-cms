/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";

// used for internal job dispatch, temporary files, etc...
const InternalStorageAccount = t.interface({
  INTERNAL_STORAGE_CONNECTION_STRING: NonEmptyString,
});

// Jira configuration
export const JiraConfig = t.interface({
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

export type IDecodableConfigPostgreSQL = t.TypeOf<
  typeof IDecodableConfigPostgreSQL
>;
export const IDecodableConfigPostgreSQL = t.interface({
  REVIEWER_DB_HOST: NonEmptyString,
  REVIEWER_DB_IDLE_TIMEOUT: withDefault(NumberFromString, 30000),
  REVIEWER_DB_NAME: NonEmptyString,
  REVIEWER_DB_PASSWORD: NonEmptyString,
  REVIEWER_DB_PORT: NumberFromString,
  REVIEWER_DB_SCHEMA: NonEmptyString,
  REVIEWER_DB_TABLE: NonEmptyString,
  REVIEWER_DB_USER: NonEmptyString,
});

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.intersection([
  t.type({ isProduction: t.boolean }),
  InternalStorageAccount,
  JiraConfig,
  IDecodableConfigPostgreSQL,
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
