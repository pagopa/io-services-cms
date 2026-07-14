import type { GenericError, UseCase } from "@pagopa/hexagonal-core";

import type { AppInfo, AppInfoReader } from "../ports/app-info.js";

export const makeGetInfoUseCase =
  (
    appInfoReader: AppInfoReader,
  ): UseCase<Record<string, never>, AppInfo, GenericError> =>
  async () =>
    appInfoReader.getAppInfo();
