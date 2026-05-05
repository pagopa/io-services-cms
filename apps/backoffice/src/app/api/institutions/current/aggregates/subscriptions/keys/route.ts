import { RequestAggregatedInstitutionsManageKeysPayload } from "@/generated/api/RequestAggregatedInstitutionsManageKeysPayload";
import { ResponseError } from "@/generated/api/ResponseError";
import {
  PreconditionFailedError,
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlePreconditionFailedErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { parseBody } from "@/lib/be/req-res-utils";
import { generateApiKeysExports } from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

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
