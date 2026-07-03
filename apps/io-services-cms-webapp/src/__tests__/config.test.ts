import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";

import { IConfig, RuntimeModeConfiguration } from "../config";

const managedIdentitySettings = {
  CMS_COSMOSDB__accountEndpoint: "https://cms-account.documents.azure.com:443/",
  CMS_INTERNAL_STORAGE__blobServiceUri:
    "https://cmsstorage.blob.core.windows.net",
  CMS_INTERNAL_STORAGE__queueServiceUri:
    "https://cmsstorage.queue.core.windows.net",
  CMS_LEGACY_COSMOSDB__accountEndpoint:
    "https://legacy-account.documents.azure.com:443/",
  SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE:
    "cms-namespace.servicebus.windows.net",
};

const fallbackSettings = {
  ACTIVATIONS_EVENT_HUB_CONNECTION_STRING:
    "Endpoint=sb://activation/;SharedAccessKeyName=test;SharedAccessKey=test",
  COSMOSDB_CONNECTIONSTRING:
    "AccountEndpoint=https://cms-account.documents.azure.com:443/;AccountKey=test;",
  COSMOSDB_KEY: "test-key",
  LEGACY_COSMOSDB_CONNECTIONSTRING:
    "AccountEndpoint=https://legacy-account.documents.azure.com:443/;AccountKey=test;",
  LEGACY_COSMOSDB_KEY: "legacy-key",
  SERVICES_HISTORY_EVENT_HUB_CONNECTION_STRING:
    "Endpoint=sb://history/;SharedAccessKeyName=test;SharedAccessKey=test",
  SERVICES_LIFECYCLE_EVENT_HUB_CONNECTION_STRING:
    "Endpoint=sb://lifecycle/;SharedAccessKeyName=test;SharedAccessKey=test",
  SERVICES_PUBLICATION_EVENT_HUB_CONNECTION_STRING:
    "Endpoint=sb://publication/;SharedAccessKeyName=test;SharedAccessKey=test",
  SERVICES_TOPICS_EVENT_HUB_CONNECTION_STRING:
    "Endpoint=sb://topics/;SharedAccessKeyName=test;SharedAccessKey=test",
};

const sharedSettings = {
  APIM_USER_GROUPS: "group-1,group-2",
  APPLICATIONINSIGHTS_CONNECTION_STRING:
    "InstrumentationKey=00000000-0000-0000-0000-000000000000",
  ASSET_STORAGE_CONNECTIONSTRING: "UseDevelopmentStorage=true",
  AZURE_APIM: "test-apim",
  AZURE_APIM_RESOURCE_GROUP: "test-rg",
  AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME: "test-product",
  AZURE_SUBSCRIPTION_ID: "test-subscription-id",
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: "10.0.0.0/24",
  COSMOSDB_APP_BE_NAME: "app-backend-db",
  COSMOSDB_CONTAINER_SERVICES_DETAILS: "services-details",
  COSMOSDB_CONTAINER_SERVICES_HISTORY: "services-history",
  COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: "services-lifecycle",
  COSMOSDB_CONTAINER_SERVICES_PUBLICATION: "services-publication",
  COSMOSDB_NAME: "cms-db",
  COSMOSDB_URI: "https://cms-account.documents.azure.com:443/",
  INTERNAL_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true",
  isProduction: false,
  JIRA_CONTRACT_CUSTOM_FIELD: "customfield_1",
  JIRA_DELEGATE_EMAIL_CUSTOM_FIELD: "customfield_2",
  JIRA_DELEGATE_NAME_CUSTOM_FIELD: "customfield_3",
  JIRA_NAMESPACE_URL: "https://jira.example.com",
  JIRA_ORGANIZATION_CF_CUSTOM_FIELD: "customfield_4",
  JIRA_ORGANIZATION_NAME_CUSTOM_FIELD: "customfield_5",
  JIRA_PROJECT_NAME: "CMS",
  JIRA_TOKEN: "jira-token",
  JIRA_TRANSITION_UPDATED_ID: "31",
  JIRA_USERNAME: "cms@example.com",
  LEGACY_COSMOSDB_CONTAINER_SERVICES: "legacy-services",
  LEGACY_COSMOSDB_CONTAINER_SERVICES_LEASE: "legacy-services-lease",
  LEGACY_COSMOSDB_NAME: "legacy-db",
  LEGACY_COSMOSDB_URI: "https://legacy-account.documents.azure.com:443/",
  LEGACY_JIRA_PROJECT_NAME: "LEGACY",
  LEGACY_SERVICE_WATCHER_MAX_ITEMS_PER_INVOCATION: "10",
  MANUAL_REVIEW_PROPERTIES: "field1,field2",
  PDV_TOKENIZER_API_KEY: "tokenizer-key",
  PDV_TOKENIZER_BASE_PATH: "/api/v1",
  PDV_TOKENIZER_BASE_URL: "https://tokenizer.example.com",
  PREFIX_CF_TEST: "AAAAAA",
  REQUEST_DETAIL_QUEUE: "request-detail",
  REQUEST_HISTORICIZATION_QUEUE: "request-historicization",
  REQUEST_PUBLICATION_QUEUE: "request-publication",
  REQUEST_REVIEW_LEGACY_QUEUE: "request-review-legacy",
  REQUEST_REVIEW_QUEUE: "request-review",
  REQUEST_SYNC_CMS_QUEUE: "request-sync-cms",
  REQUEST_SYNC_LEGACY_QUEUE: "request-sync-legacy",
  REQUEST_VALIDATION_QUEUE: "request-validation",
  REVIEWER_DB_HOST: "localhost",
  REVIEWER_DB_NAME: "reviewer",
  REVIEWER_DB_PASSWORD: "password",
  REVIEWER_DB_PORT: "5432",
  REVIEWER_DB_SCHEMA: "public",
  REVIEWER_DB_TABLE: "reviews",
  REVIEWER_DB_USER: "postgres",
  SELFCARE_API_KEY: "selfcare-api-key",
  SELFCARE_EXTERNAL_API_BASE_URL: "https://selfcare.example.com",
  SERVICES_HISTORY_EVENT_HUB_NAME: "history",
  SERVICES_LIFECYCLE_EVENT_HUB_NAME: "lifecycle",
  SERVICES_PUBLICATION_EVENT_HUB_NAME: "publication",
  SERVICES_TOPICS_EVENT_HUB_NAME: "topics",
  STORAGE_ACCOUNT_NAME: "cmsstorage",
  TEST_FISCAL_CODES: "AAAAAA00A00A000A",
  TOPIC_DB_SCHEMA: "public",
  TOPIC_DB_TABLE: "topics",
  ACTIVATIONS_CONTAINER_NAME: "activations",
  ACTIVATIONS_EVENT_HUB_NAME: "activations",
};

describe("RuntimeModeConfiguration", () => {
  it("should allow managed identity mode without fallback connection strings", () => {
    const result = RuntimeModeConfiguration.decode({
      USE_MANAGED_IDENTITY: "true",
      ...managedIdentitySettings,
    });

    expect(E.isRight(result)).toBe(true);
  });

  it("should require managed identity settings when managed identity mode is enabled", () => {
    const result = RuntimeModeConfiguration.decode({
      USE_MANAGED_IDENTITY: "true",
      CMS_COSMOSDB__accountEndpoint:
        managedIdentitySettings.CMS_COSMOSDB__accountEndpoint,
      CMS_INTERNAL_STORAGE__blobServiceUri:
        managedIdentitySettings.CMS_INTERNAL_STORAGE__blobServiceUri,
      CMS_LEGACY_COSMOSDB__accountEndpoint:
        managedIdentitySettings.CMS_LEGACY_COSMOSDB__accountEndpoint,
      SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE:
        managedIdentitySettings.SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE,
    });

    expect(E.isLeft(result)).toBe(true);
  });

  it("should require fallback connection strings when managed identity mode is disabled", () => {
    const { ACTIVATIONS_EVENT_HUB_CONNECTION_STRING, ...partialFallback } =
      fallbackSettings;

    const result = RuntimeModeConfiguration.decode({
      USE_MANAGED_IDENTITY: "false",
      ...partialFallback,
    });

    expect(E.isLeft(result)).toBe(true);
  });

  it("should allow connection string mode when all fallback settings are provided and no managed identity settings are present", () => {
    const result = RuntimeModeConfiguration.decode({
      USE_MANAGED_IDENTITY: "false",
      ...fallbackSettings,
    });

    if (E.isLeft(result)) {
      throw new Error(readableReport(result.left));
    }

    expect(result.right.USE_MANAGED_IDENTITY).toBe(false);
  });
});

describe("IConfig", () => {
  it("should allow only managed identity mode without fallback connection strings", () => {
    const result = IConfig.decode({
      ...sharedSettings,
      USE_MANAGED_IDENTITY: "true",
      ...managedIdentitySettings,
    });

    expect(E.isRight(result)).toBe(true);
  });

  it("should require all managed identity settings when managed identity mode is enabled", () => {
    const { CMS_COSMOSDB__accountEndpoint, ...partialManagedIdentitySettings } =
      managedIdentitySettings;

    const result = IConfig.decode({
      ...sharedSettings,
      USE_MANAGED_IDENTITY: "true",
      ...partialManagedIdentitySettings,
    });

    expect(E.isLeft(result)).toBe(true);
  });

  it("should allow only fallback connection strings when managed identity mode is disabled", () => {
    const result = IConfig.decode({
      ...sharedSettings,
      USE_MANAGED_IDENTITY: "false",
      ...fallbackSettings,
    });

    expect(E.isRight(result)).toBe(true);
  });

  it("should require all fallback connection strings when managed identity mode is disabled", () => {
    const { ACTIVATIONS_EVENT_HUB_CONNECTION_STRING, ...partialFallback } =
      fallbackSettings;

    const result = IConfig.decode({
      ...sharedSettings,
      USE_MANAGED_IDENTITY: "false",
      ...partialFallback,
    });

    expect(E.isLeft(result)).toBe(true);
  });
});
