import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";

import { RuntimeModeConfiguration } from "../config";

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
  ACTIVATIONS_EVENT_HUB_CONNECTION_STRING: "Endpoint=sb://activation/;SharedAccessKeyName=test;SharedAccessKey=test",
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
});