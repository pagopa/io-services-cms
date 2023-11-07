import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export type Configuration = {
  // IO Services CMS API configuration
  API_SERVICES_CMS_URL: string;
  API_SERVICES_CMS_BASE_PATH: string;
  API_SERVICES_CMS_MOCKING: boolean;

  // BackOffice backend for frontend API configuration
  API_BACKEND_BASE_URL: string;
  API_BACKEND_BASE_PATH: string;
  API_BACKEND_MOCKING: boolean;

  // BackOffice settings
  BACK_OFFICE_ID: string;
  BACK_OFFICE_TITLE: string;
  CDN_URL: string;
  SERVICES_LOGO_PATH: string;
  BACK_OFFICE_PRIVACY_POLICY_URL: string;
  BACK_OFFICE_TOS_URL: string;
  BACK_OFFICE_PERS_DATA_PROTECTION_URL: string;

  // Selfcare
  SELFCARE_URL: string;
  SELFCARE_TOKEN_EXCHANGE_URL: string;
  SELFCARE_EXTERNAL_API_BASE_URL: string;
  SELFCARE_JWT_ISSUER: string;
  SELFCARE_JWKS_URL: string;
  SELFCARE_API_MOCKING: boolean;

  // NodeJS Environment mode
  IS_DEVELOPMENT: boolean;
  IS_TEST: boolean;
  IS_PRODUCTION: boolean;

  // window guards (useful to configure MSW to work in the browser or in Node environment)
  IS_BROWSER: boolean;
  IS_SERVER: boolean;

  // Apim Configuration
  AZURE_SUBSCRIPTION_ID: string;
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: NonEmptyString;
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: NonEmptyString;
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: NonEmptyString;
  AZURE_APIM_RESOURCE_GROUP: string;
  AZURE_APIM_PRODUCT_NAME: NonEmptyString;
  AZURE_APIM: string;
  APIM_USER_GROUPS: string;
  API_APIM_MOCKING: boolean;

  BACKOFFICE_HOST: string;

  // Legacy CosmosDB configuration
  LEGACY_COSMOSDB_URI: string;
  LEGACY_COSMOSDB_NAME: string;
  LEGACY_COSMOSDB_KEY: string;
  LEGACY_COSMOSDB_MOCKING: boolean;

  // Subscriptions migration configuration
  SUBSCRIPTIONS_MIGRATION_MOCKING: boolean;

};

export function getConfiguration(): Configuration {
  return {
    // IO Services CMS API configuration
    API_SERVICES_CMS_URL: process.env.API_SERVICES_CMS_URL as string,
    API_SERVICES_CMS_BASE_PATH: process.env
      .API_SERVICES_CMS_BASE_PATH as string,
    API_SERVICES_CMS_MOCKING: process.env.API_SERVICES_CMS_MOCKING === "true",

    // BackOffice backend for frontend API configuration
    API_BACKEND_BASE_URL: process.env
      .NEXT_PUBLIC_API_BACKEND_BASE_URL as string,
    API_BACKEND_BASE_PATH: process.env
      .NEXT_PUBLIC_API_BACKEND_BASE_PATH as string,
    API_BACKEND_MOCKING: process.env.NEXT_PUBLIC_API_BACKEND_MOCKING === "true",

    // BackOffice settings
    BACK_OFFICE_ID: process.env.NEXT_PUBLIC_BACK_OFFICE_ID as string,
    BACK_OFFICE_TITLE: process.env.NEXT_PUBLIC_BACK_OFFICE_TITLE as string,
    CDN_URL: process.env.NEXT_PUBLIC_CDN_URL as string,
    SERVICES_LOGO_PATH: process.env.NEXT_PUBLIC_SERVICES_LOGO_PATH as string,
    BACK_OFFICE_PRIVACY_POLICY_URL: process.env
      .NEXT_PUBLIC_BACK_OFFICE_PRIVACY_POLICY_URL as string,
    BACK_OFFICE_TOS_URL: process.env.NEXT_PUBLIC_BACK_OFFICE_TOS_URL as string,
    BACK_OFFICE_PERS_DATA_PROTECTION_URL: process.env
      .NEXT_PUBLIC_BACK_OFFICE_PERS_DATA_PROTECTION_URL as string,

    // Selfcare
    SELFCARE_URL: process.env.NEXT_PUBLIC_SELFCARE_URL as string,
    SELFCARE_TOKEN_EXCHANGE_URL: process.env
      .NEXT_PUBLIC_SELFCARE_TOKEN_EXCHANGE_URL as string,
    SELFCARE_EXTERNAL_API_BASE_URL: process.env
      .SELFCARE_EXTERNAL_API_BASE_URL as string,
    SELFCARE_JWT_ISSUER: process.env.SELFCARE_JWT_ISSUER as string,
    SELFCARE_JWKS_URL: process.env.SELFCARE_JWKS_URL as string,
    SELFCARE_API_MOCKING: process.env.SELFCARE_API_MOCKING === "true",

    // NodeJS Environment mode
    IS_DEVELOPMENT: process.env.NODE_ENV === "development",
    IS_TEST: process.env.NODE_ENV === "test",
    IS_PRODUCTION: process.env.NODE_ENV === "production",

    // window guards (useful to configure MSW to work in the browser or in Node environment)
    IS_BROWSER: typeof window !== "undefined",
    IS_SERVER: typeof window === "undefined",

    AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID as string, //FIXME: fix cast

    AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: process.env
      .AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID as NonEmptyString, //FIXME: fix cast
    AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: process.env
      .AZURE_CLIENT_SECRET_CREDENTIAL_SECRET as NonEmptyString, //FIXME: fix cast
    AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: process.env
      .AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID as NonEmptyString, //FIXME: fix cast

    AZURE_APIM_RESOURCE_GROUP: process.env.AZURE_APIM_RESOURCE_GROUP as string, //FIXME: fix cast
    AZURE_APIM_PRODUCT_NAME: process.env
      .AZURE_APIM_PRODUCT_NAME as NonEmptyString, //FIXME: fix cast
    AZURE_APIM: process.env.AZURE_APIM as string, //FIXME: fix cast
    APIM_USER_GROUPS: process.env.APIM_USER_GROUPS as string, //FIXME: fix cast
    API_APIM_MOCKING: process.env.API_APIM_MOCKING === "true",

    BACKOFFICE_HOST: process.env.BACKOFFICE_HOST as string,

    // Legacy CosmosDB configuration
    LEGACY_COSMOSDB_URI: process.env.LEGACY_COSMOSDB_URI as string,
    LEGACY_COSMOSDB_NAME: process.env.LEGACY_COSMOSDB_NAME as string,
    LEGACY_COSMOSDB_KEY: process.env.LEGACY_COSMOSDB_KEY as string,
    LEGACY_COSMOSDB_MOCKING: process.env.API_APIM_MOCKING === "true",

    // Subscriptions migration configuration
    SUBSCRIPTIONS_MIGRATION_MOCKING:
      process.env.SUBSCRIPTIONS_MIGRATION_MOCKING === "true"
  };
}
