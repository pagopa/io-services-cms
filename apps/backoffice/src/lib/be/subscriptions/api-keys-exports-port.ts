import {
  AggregatedInstitutionsManageKeysExportFileState,
  AggregatedInstitutionsManageKeysExportFileStateEnum,
} from "@/generated/api/AggregatedInstitutionsManageKeysExportFileState";
import Stream from "stream";

export const FileState = AggregatedInstitutionsManageKeysExportFileState;
export type FileState = AggregatedInstitutionsManageKeysExportFileState;
export const FileStateEnum =
  AggregatedInstitutionsManageKeysExportFileStateEnum;

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
    state?: FileState,
  ): Promise<
    {
      fileName: string;
      state?: FileState;
    }[]
  >;

  initializeFile(
    fileName: string,
    institutionId: string,
    userId: string,
  ): Promise<void>;

  markFileAsFailed(
    fileName: string,
    institutionId: string,
    userId: string,
  ): Promise<void>;
}
