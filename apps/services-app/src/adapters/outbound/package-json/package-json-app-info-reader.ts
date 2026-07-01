import { GenericError } from "@pagopa/hexagonal-core";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { readFile } from "node:fs/promises";

import {
  type AppInfo,
  type AppInfoReader,
  appInfoSchema,
} from "../../../application/ports/app-info.js";

const readPackageJSON = (packageJsonUrl: URL) =>
  ResultAsync.fromPromise(
    readFile(packageJsonUrl, "utf-8"),
    (error) =>
      new GenericError(
        `Unable to read services-app package.json: ${String(error)}`,
      ),
  );

const safeParseStringToJSON = Result.fromThrowable(
  (data: string) => JSON.parse(data),
  (err) => new GenericError(`Unable to parse app info: ${String(err)}`),
);

const safeParseJSONToAppInfo = Result.fromThrowable(
  (jsonData: object) => appInfoSchema.parse(jsonData),
  (err) => new GenericError(`Unable to parse app info: ${String(err)}`),
);

export class PackageJsonAppInfoReader implements AppInfoReader {
  async getAppInfo(): Promise<Result<AppInfo, GenericError>> {
    const packageJsonUrl = new URL("../../../../package.json", import.meta.url);

    // Read the `package.json` content.
    const readResult = await readPackageJSON(packageJsonUrl);
    if (readResult.isErr()) {
      return err(readResult.error);
    }

    // Ensure that the content is a valid JSON.
    const parseResult = safeParseStringToJSON(readResult.value);
    if (parseResult.isErr()) {
      return err(parseResult.error);
    }

    // Once we ensured that the JSON is valid, we parse it into `AppInfo`.
    const appInfoParseResult = safeParseJSONToAppInfo(parseResult.value);
    if (appInfoParseResult.isErr()) {
      return err(appInfoParseResult.error);
    }

    const appInfo = appInfoParseResult.value;

    return ok(appInfo);
  }
}
