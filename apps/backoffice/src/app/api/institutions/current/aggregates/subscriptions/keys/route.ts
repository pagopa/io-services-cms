import { AggregatedInstitutionsManageKeysExportFileMetadata } from "@/generated/api/AggregatedInstitutionsManageKeysExportFileMetadata";
import { RequestAggregatedInstitutionsManageKeysPayload } from "@/generated/api/RequestAggregatedInstitutionsManageKeysPayload";
import { ResponseError } from "@/generated/api/ResponseError";
import {
  BadRequestError,
  NotFoundError,
  PreconditionFailedError,
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handleNotFoundErrorResponse,
  handlePreconditionFailedErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { parseBody } from "@/lib/be/req-res-utils";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import {
  generateApiKeysExports,
  retrieveApiKeysExportMetadata,
  updateApiKeysExportsDownloadLink,
} from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Get Aggregated Institutions API Keys export Metadata
 * @operationId getAggregatedInstitutionsManageKeysMetadata
 */
export const GET = withJWTAuthHandler(
  async (
    _request: NextRequest,
    {
      backofficeUser,
    }: {
      backofficeUser: BackOfficeUserEnriched;
    },
  ): Promise<
    NextResponse<
      AggregatedInstitutionsManageKeysExportFileMetadata | ResponseError
    >
  > => {
    if (!backofficeUser.institution.isAggregator) {
      return handleForbiddenErrorResponse(
        "Only aggregators are authorized to request metadata about download procedure",
      );
    }

    try {
      const result = await retrieveApiKeysExportMetadata(
        backofficeUser.institution.id,
        backofficeUser.parameters.userId,
      );
      return sanitizedNextResponseJson(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        handlerErrorLog(error.message, error);
        return handleNotFoundErrorResponse("Export not found", error);
      }
      return handleInternalErrorResponse(
        "GetAggregatedInstitutionsManageKeysMetadata",
        error,
        `An Error has occurred while getting metadata for aggregated institutions for aggregatorId '${backofficeUser.institution.id}'`,
      );
    }
  },
);

/**
 * @description Request to generate a manage keys exports file for aggregated institutions allowed to use by the current aggregator
 * @operationId requestAggregatedInstitutionsManageKeys
 */
export const POST = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      backofficeUser,
    }: {
      backofficeUser: BackOfficeUserEnriched;
    },
  ): Promise<NextResponse<ResponseError | undefined>> => {
    if (!backofficeUser.institution.isAggregator) {
      return handleForbiddenErrorResponse(
        "Only aggregators are authorized to request manage keys exports for aggregated institutions",
      );
    }

    let requestPayload;
    try {
      requestPayload = await parseBody(
        request,
        RequestAggregatedInstitutionsManageKeysPayload,
      );
    } catch (error) {
      return handleBadRequestErrorResponse(
        error instanceof Error ? error.message : "Failed to parse JSON body",
      );
    }

    try {
      await generateApiKeysExports(
        backofficeUser.institution.id,
        backofficeUser.parameters.userId,
        requestPayload.password,
      );
      return new NextResponse(undefined, { status: 202 });
    } catch (error) {
      if (error instanceof PreconditionFailedError) {
        const errorMessage =
          "Precondition Failed: Unable to generate manage keys exports file";
        handlerErrorLog(errorMessage, error);
        return handlePreconditionFailedErrorResponse(errorMessage, error);
      }
      return handleInternalErrorResponse(
        "RequestAggregatedInstitutionsManageKeysError",
        error,
        `An Error has occurred while requesting manage keys exports for aggregated institutions for aggregatorId '${backofficeUser.institution.id}'`,
      );
    }
  },
);

/**
 * @description Generate download link for Aggregated Institutions API Keys export
 * @operationId generateDirectDownloadLinkForAggregatedInstitutionsManageKeys
 */
export const PUT = withJWTAuthHandler(
  async (
    _request: NextRequest,
    {
      backofficeUser,
    }: {
      backofficeUser: BackOfficeUserEnriched;
    },
  ): Promise<
    NextResponse<
      AggregatedInstitutionsManageKeysExportFileMetadata | ResponseError
    >
  > => {
    if (!backofficeUser.institution.isAggregator) {
      return handleForbiddenErrorResponse(
        "Only aggregators are authorized to request link about download procedure",
      );
    }

    try {
      const result = await updateApiKeysExportsDownloadLink(
        backofficeUser.institution.id,
        backofficeUser.parameters.userId,
      );
      return sanitizedNextResponseJson(result, 201);
    } catch (error) {
      if (error instanceof BadRequestError) {
        handlerErrorLog(error.message, error);
        return handleBadRequestErrorResponse(error.message);
      }
      return handleInternalErrorResponse(
        "GenerateDirectDownloadLinkForAggregatedInstitutionsManageKeys",
        error,
        `An Error has occurred while generating download link for aggregated institutions for aggregatorId '${backofficeUser.institution.id}'`,
      );
    }
  },
);
