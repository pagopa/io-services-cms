import { describe, expect, it, vi } from "vitest";
import { HealthChecksError } from "../../../../lib/be/errors";
import { GET } from "../route";

const { getLegacyCosmosHealth } = vi.hoisted(() => ({
  getLegacyCosmosHealth: vi.fn().mockReturnValue(Promise.resolve())
}));

const { getSelfcareHealth } = vi.hoisted(() => ({
  getSelfcareHealth: vi.fn().mockReturnValue(Promise.resolve())
}));

const { getIoServicesCmsHealth } = vi.hoisted(() => ({
  getIoServicesCmsHealth: vi.fn().mockReturnValue(Promise.resolve())
}));

const { getApimHealth } = vi.hoisted(() => ({
  getApimHealth: vi.fn().mockReturnValue(Promise.resolve())
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

describe("test backend api info()", () => {
  it("should return 200 on healthcheck succed", async () => {
    const result = await GET();

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(200);
    expect(jsonResponse).toStrictEqual({
      status: "ok"
    });
  });

  it("should return 500 on at least one healthcheck fails", async () => {
    getLegacyCosmosHealth.mockReturnValueOnce(
      Promise.reject(
        new HealthChecksError(
          "legacy-cosmos-db",
          new Error("error reaching db")
        )
      )
    );

    const result = await GET();

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(500);
    expect(jsonResponse).toStrictEqual({
      status: "fail"
    });
  });
});
