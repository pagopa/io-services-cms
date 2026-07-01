import { GenericError } from "@pagopa/hexagonal-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppInfo } from "../../../../application/ports/app-info.js";

const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
}));

const { PackageJsonAppInfoReader } = await import(
  "../package-json-app-info-reader.js"
);

const anAppInfo: AppInfo = {
  name: "services-app",
  version: "1.2.3",
};

describe("PackageJsonAppInfoReader", () => {
  beforeEach(() => {
    readFileMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the AppInfo when the package.json is valid", async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify(anAppInfo));

    const result = await new PackageJsonAppInfoReader().getAppInfo();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(anAppInfo);
  });

  it("ignores extra fields in the package.json", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ ...anAppInfo, private: true, scripts: {} }),
    );

    const result = await new PackageJsonAppInfoReader().getAppInfo();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(anAppInfo);
  });

  it("returns a GenericError when the package.json cannot be read", async () => {
    readFileMock.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await new PackageJsonAppInfoReader().getAppInfo();

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(GenericError);
    expect(error.message).toContain("Unable to read services-app package.json");
  });

  it("returns a GenericError when the package.json is not valid JSON", async () => {
    readFileMock.mockResolvedValueOnce("{ not-a-valid-json");

    const result = await new PackageJsonAppInfoReader().getAppInfo();

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(GenericError);
    expect(error.message).toContain("Unable to parse app info");
  });

  it("returns a GenericError when a required field is missing", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ name: "services-app" }),
    );

    const result = await new PackageJsonAppInfoReader().getAppInfo();

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(GenericError);
    expect(error.message).toContain("Unable to parse app info");
  });

  it("returns a GenericError when a field has the wrong type", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ name: "services-app", version: 123 }),
    );

    const result = await new PackageJsonAppInfoReader().getAppInfo();

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(GenericError);
    expect(error.message).toContain("Unable to parse app info");
  });
});
