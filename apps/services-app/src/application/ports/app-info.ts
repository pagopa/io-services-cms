import type { GenericError } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

import z from "zod";

export const appInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
});
export type AppInfo = z.TypeOf<typeof appInfoSchema>;

export interface AppInfoReader {
  /**
   * GetAppInfo returns the name and the version of the app.
   */
  getAppInfo(): Promise<Result<AppInfo, GenericError>>;
}
