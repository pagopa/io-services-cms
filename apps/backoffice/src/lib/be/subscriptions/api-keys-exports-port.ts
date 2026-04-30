import { StateEnum as StateEnumFailed } from "@/generated/api/AggregatedInstitutionsManageKeysLinkNotReady";
import { StateEnum as StateEnumSuccess } from "@/generated/api/AggregatedInstitutionsManageKeysLinkReady";
import { enumType } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";
import Stream from "stream";

// TODO: add to openapi spec as unused definition
export const StateEnum = t.union([
  enumType<StateEnumFailed>(StateEnumFailed, "state"),
  enumType<StateEnumSuccess>(StateEnumSuccess, "state"),
]);
export type StateEnum = t.TypeOf<typeof StateEnum>;

export interface ApiKeysExportsPort {
  finalizeFile(
    aggregatorId: string,
    userId: string,
    fileName: string,
    payload: Stream.Readable,
    payloadContentType?: string,
  ): Promise<void>;

  findExportsFiles(
    institutionId: string,
    userId: string,
    state?: StateEnum,
  ): Promise<
    {
      fileName: string;
      state?: StateEnum;
    }[]
  >;

  initializeFile(
    fileName: string,
    institutionId: string,
    userId: string,
  ): Promise<void>;

  markFileAsFailed(fileName: string): Promise<void>;
}
