import { describe, expect, it, vi } from "vitest";
import packageJson from "../../../../../package.json";
import { HealthChecksError } from "../../../../lib/be/errors";
import { GET } from "../route";

const {
  getLegacyCosmosHealth,
  getSelfcareHealth,
  getIoServicesCmsHealth,
  getApimHealth,
  getAzureAccessTokenHealth,
  getCosmosStoreHealth,
  getSubscriptionsMigrationHealth
} = vi.hoisted(() => ({
  getLegacyCosmosHealth: vi.fn().mockReturnValue(Promise.resolve()),
  getSelfcareHealth: vi.fn().mockReturnValue(Promise.resolve()),
  getIoServicesCmsHealth: vi.fn().mockReturnValue(Promise.resolve()),
  getApimHealth: vi.fn().mockReturnValue(Promise.resolve()),
  getAzureAccessTokenHealth: vi.fn().mockReturnValue(Promise.resolve()),
  getCosmosStoreHealth: vi.fn().mockReturnValue(Promise.resolve()),
  getSubscriptionsMigrationHealth: vi.fn().mockReturnValue(Promise.resolve())
}));

vi.mock("@/lib/be/legacy-cosmos", () => ({
  getLegacyCosmosHealth
}));

vi.mock("@/lib/be/selfcare-client", () => ({
  getSelfcareHealth
}));

vi.mock("@/lib/be/cms-client", () => ({
  getIoServicesCmsHealth
}));

vi.mock("@/lib/be/apim-service", () => ({
  getApimHealth
}));

vi.mock("@/lib/be/azure-access-token", () => ({
  getAzureAccessTokenHealth
}));

vi.mock("@/lib/be/cosmos-store", () => ({
  getCosmosStoreHealth
}));

vi.mock("@/lib/be/subscription-migration-client", () => ({
  getSubscriptionsMigrationHealth
}));

describe("test backend api info()", () => {
  it("should return 200 on healthcheck succed", async () => {
    const result = await GET();

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(200);
    expect(jsonResponse).toStrictEqual({
      name: packageJson.name,
      version: packageJson.version,
      health: { status: "ok" }
    });
  });

  it("should return 500 on at least one healthcheck fails", async () => {
    getSelfcareHealth.mockReturnValueOnce(
      Promise.reject(
        new HealthChecksError("selfcare", new Error("config error"))
      )
    );

    const result = await GET();

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(500);
    expect(jsonResponse).toStrictEqual({
      name: packageJson.name,
      version: packageJson.version,
      health: {
        status: "fail",
        failures: [{ service: "selfcare", errorMessage: "config error" }]
      }
    });
  });
});
