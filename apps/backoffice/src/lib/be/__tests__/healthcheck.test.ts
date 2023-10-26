import { describe, expect, test } from "vitest";

import { HealthChecksError } from "../errors";
import healthcheck from "../healthcheck";

describe("healthcheck", () => {
  test("status=fail when there are failures", async () => {
    expect.assertions(2);
    const health = await healthcheck([
      Promise.reject(
        new HealthChecksError("service1", new Error("failure error message"))
      ),
      Promise.resolve()
    ]);
    expect(health.status).toBe("fail");
    if (health.status === "fail") {
      expect(health.failures).toEqual([
        { service: "service1", errorMessage: "failure error message" }
      ]);
    }
  });
  test("status=ok when there are no checks", async () => {
    const health = await healthcheck([]);
    expect(health.status).toBe("ok");
  });
  test("status=ok when all checks succeed", async () => {
    const health = await healthcheck([Promise.resolve(), Promise.resolve()]);
    expect(health.status).toBe("ok");
  });
  test("set unknown as failure reason if a checker does not throw an HealthChecksError", async () => {
    const health = await healthcheck([
      Promise.reject("not an HealthChecksError")
    ]);
    expect.assertions(1);
    if (health.status === "fail") {
      expect(health.failures).toEqual([
        { service: "unknown", errorMessage: "unknown error" }
      ]);
    }
  });
});
