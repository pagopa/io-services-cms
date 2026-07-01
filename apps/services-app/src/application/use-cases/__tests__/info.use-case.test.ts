import { GenericError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";
import { describe, expect, it } from "vitest";

import type { AppInfo, AppInfoReader } from "../../ports/app-info.js";

import { makeGetInfoUseCase } from "../info.use-case.js";

const anAppInfo: AppInfo = {
  name: "services-app",
  version: "1.2.3",
};

describe("makeGetInfoUseCase", () => {
  it("returns the app info read by the reader", async () => {
    const appInfoReader: AppInfoReader = {
      getAppInfo: () => Promise.resolve(ok(anAppInfo)),
    };

    const result = await makeGetInfoUseCase(appInfoReader)({});

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(anAppInfo);
  });

  it("returns the GenericError raised by the reader", async () => {
    const anError = new GenericError("cannot read package.json");
    const appInfoReader: AppInfoReader = {
      getAppInfo: () => Promise.resolve(err(anError)),
    };

    const result = await makeGetInfoUseCase(appInfoReader)({});

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(anError);
  });
});
