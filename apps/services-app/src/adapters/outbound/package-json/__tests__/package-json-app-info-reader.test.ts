import { describe, expect, it } from "vitest";

import { PackageJsonAppInfoReader } from "../package-json-app-info-reader.js";

describe("PackageJsonAppInfoReader", () => {
  it("returns the app info built from name and version", async () => {
    const reader = new PackageJsonAppInfoReader("services-app", "1.2.3");

    const result = await reader.getAppInfo();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      name: "services-app",
      version: "1.2.3",
    });
  });
});
