import { AssistanceItem } from "@/generated/api/AssistanceItem";
import {
  handleBadRequestErrorResponse,
  handleInternalErrorResponse
} from "@/lib/be/errors";
import { sendAssistanceRequest } from "@/lib/be/institutions/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Send an assistance request
 */
export const POST = withJWTAuthHandler(async (request: NextRequest) => {
  let jsonBody;
  try {
    jsonBody = await request.json();
  } catch (_) {
    return handleBadRequestErrorResponse(
      "validationError",
      "invalid JSON body"
    );
  }

  const decodedAssistanceItem = AssistanceItem.decode(jsonBody);
  if (E.isLeft(decodedAssistanceItem)) {
    return handleBadRequestErrorResponse(
      "SendAssistanceBadRequest",
      readableReport(decodedAssistanceItem.left)
    );
  }

  try {
    const assistanceResponse = await sendAssistanceRequest(
      decodedAssistanceItem.right
    );
    return NextResponse.json(assistanceResponse);
  } catch (error) {
    console.error(
      "An Error has occurred while sending an assistance request, caused by: ",
      error
    );
    return handleInternalErrorResponse("SendAssistanceError", error);
  }
});
