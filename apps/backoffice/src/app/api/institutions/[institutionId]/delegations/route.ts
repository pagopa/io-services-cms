import {
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
import { NextRequest } from "next/server";

const DEFAULT_SEARCH_DECODER = t.union([NonEmptyString, t.null]);

/**
 * @description Retrieve all active delegated institutions
 * @operationId getDelegatedInstitutions
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
      DEFAULT_SEARCH_DECODER,
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
        maybeSearch.right ?? undefined,
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving delegations for institutionId: ${params.institutionId}, caused by: `,
        error,
      );

      return handleInternalErrorResponse(
        "InstitutionDelegationsRetrieveError",
        error,
      );
    }
  },
);
