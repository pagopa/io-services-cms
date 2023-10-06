import { AzureClientSecretCredential } from "@io-services-cms/external-clients/apim-client/definitions";
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

  // NodeJS Environment mode
  IS_DEVELOPMENT: boolean;
  IS_TEST: boolean;

  // window guards (useful to configure MSW to work in the browser or in Node environment)
  IS_BROWSER: boolean;
  IS_SERVER: boolean;
};
export function getConfiguration() {
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

    // URLs
    SELFCARE_URL: process.env.NEXT_PUBLIC_SELFCARE_URL as string,
    SELFCARE_TOKEN_EXCHANGE_URL: process.env
      .NEXT_PUBLIC_SELFCARE_TOKEN_EXCHANGE_URL as string,

    // NodeJS Environment mode
    IS_DEVELOPMENT: process.env.NODE_ENV === "development",
    IS_TEST: process.env.NODE_ENV === "test",
    IS_PRODUCTION: process.env.NODE_ENV === "production",

    // window guards (useful to configure MSW to work in the browser or in Node environment)
    IS_BROWSER: typeof window !== "undefined",
    IS_SERVER: typeof window === "undefined",

    // Apim configuration
    AZURE_APIM: process.env.AZURE_APIM as NonEmptyString,
    AZURE_APIM_RESOURCE_GROUP: process.env
      .AZURE_APIM_RESOURCE_GROUP as NonEmptyString,
    AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID as NonEmptyString,
    AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME: process.env
      .AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME as NonEmptyString,

    // Apim Secrets  configuration
    azureClientSecretCredential: {
      AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: process.env
        .AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID as NonEmptyString,
      AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: process.env
        .AZURE_CLIENT_SECRET_CREDENTIAL_SECRET as NonEmptyString,
      AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: process.env
        .AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID as NonEmptyString
    }
  };
}

const getApimConfiguration = () => {
  return {
    azureClientSecretCredential: {
      AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: process.env
        .AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID as NonEmptyString,
      AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: process.env
        .AZURE_CLIENT_SECRET_CREDENTIAL_SECRET as NonEmptyString,
      AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: process.env
        .AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID as NonEmptyString
    },
    AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID as string
  };
};
