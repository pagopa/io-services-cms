import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import {
  InstitutionNotFoundError,
  handleBadRequestErrorResponse,
  handleInternalErrorResponse,
} from "@/lib/be/errors";
import { getDelegatedInstitutions } from "@/lib/be/institutions/business";
import {
  parseLimitQueryParam,
  parseOffsetQueryParam,
  parseQueryParam,
} from "@/lib/be/req-res-utils";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Retrieve all active delegated institutions
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { institutionId: string };
    },
  ) => {
    const maybeLimit = parseLimitQueryParam(request);
    if (E.isLeft(maybeLimit)) {
      return maybeLimit.left;
    }

    const maybeOffset = parseOffsetQueryParam(request);
    if (E.isLeft(maybeOffset)) {
      return maybeOffset.left;
    }

    const maybeSearch = parseQueryParam(
      request,
      "search",
      t.union([NonEmptyString, t.null]),
    );
    if (E.isLeft(maybeSearch)) {
      return handleBadRequestErrorResponse(
        `'search' query param is not a valid ${NonEmptyString.name}`,
      );
    }

    try {
      const institutionResponse = await getDelegatedInstitutions(
        params.institutionId,
        maybeLimit.right,
        maybeOffset.right,
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while searching institutionId: ${params.institutionId}, caused by: `,
        error,
      );

      if (error instanceof InstitutionNotFoundError) {
        return NextResponse.json(
          {
            detail: error.message,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: HTTP_STATUS_NOT_FOUND as any,
            title: "InstitutionNotFoundError",
          },
          { status: HTTP_STATUS_NOT_FOUND },
        );
      }

      return handleInternalErrorResponse("InstitutionRetrieveError", error);
    }
  },
);
