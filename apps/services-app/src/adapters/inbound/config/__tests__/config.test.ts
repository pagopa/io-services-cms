import { describe, expect, it } from "vitest";

import { configSchema } from "../config.js";

const baseConfig = {
  CMS_COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: "services-lifecycle",
  CMS_COSMOSDB_CONTAINER_SERVICES_PUBLICATION: "services-publication",
  CMS_COSMOSDB_NAME: "db-services-cms",
  HOST: "0.0.0.0",
  PORT: "3000",
  POSTGRES_DATABASE: "reviewer",
  POSTGRES_HOST: "localhost",
  POSTGRES_PASSWORD: "password",
  POSTGRES_PORT: "5432",
  POSTGRES_USER: "reviewerusr",
  TOPIC_SCHEMA: "taxonomy",
  TOPIC_TABLE: "topic",
  npm_package_name: "services-app",
  npm_package_version: "0.0.2",
};

describe("configSchema", () => {
  it("accepts production configuration with a Cosmos endpoint", () => {
    expect(
      configSchema.parse({
        ...baseConfig,
        CMS_COSMOSDB_ENDPOINT: "https://cosmos.example.com",
        NODE_ENV: "production",
      }),
    ).toMatchObject({ NODE_ENV: "production", PORT: 3000 });
  });

  it("requires a Cosmos endpoint in production", () => {
    expect(() =>
      configSchema.parse({ ...baseConfig, NODE_ENV: "production" }),
    ).toThrow();
  });

  it("requires a Cosmos connection string in development", () => {
    expect(() =>
      configSchema.parse({ ...baseConfig, NODE_ENV: "development" }),
    ).toThrow();
  });

  it("accepts development configuration with a Cosmos connection string", () => {
    expect(
      configSchema.parse({
        ...baseConfig,
        CMS_COSMOSDB_CONNECTION_STRING:
          "AccountEndpoint=https://localhost:8081;AccountKey=local-key;",
        NODE_ENV: "development",
      }),
    ).toMatchObject({
      CMS_COSMOSDB_CONNECTION_STRING:
        "AccountEndpoint=https://localhost:8081;AccountKey=local-key;",
      NODE_ENV: "development",
    });
  });

  it("rejects unsafe PostgreSQL identifiers", () => {
    expect(() =>
      configSchema.parse({
        ...baseConfig,
        CMS_COSMOSDB_ENDPOINT: "https://cosmos.example.com",
        NODE_ENV: "production",
        TOPIC_TABLE: "topic; DROP TABLE topic",
      }),
    ).toThrow();
  });
});
