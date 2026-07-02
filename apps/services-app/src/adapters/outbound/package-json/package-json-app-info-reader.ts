import { GenericError } from "@pagopa/hexagonal-core";
import { Result, ok } from "neverthrow";

import {
  type AppInfo,
  type AppInfoReader,
} from "../../../application/ports/app-info.js";

export class PackageJsonAppInfoReader implements AppInfoReader {
  #name: string;
  #version: string;

  constructor(name: string, version: string) {
    this.#name = name;
    this.#version = version;
  }

  async getAppInfo(): Promise<Result<AppInfo, GenericError>> {
    return ok({ name: this.#name, version: this.#version });
  }
}
