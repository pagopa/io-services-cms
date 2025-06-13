import { ResponseError } from "@/generated/api/ResponseError";
import {
  NonNegativeInteger,
  NonNegativeIntegerFromString,
} from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { NextRequest, NextResponse } from "next/server";

import { handleBadRequestErrorResponse } from "./errors";
import { PositiveInteger, PositiveIntegerFromString } from "./types";

/**
 * Default value for the `limit` query param.
 * It is used when the `limit` query param is not provided in the request.
 */
export const LIMIT_DEFAULT_VALUE = 20;

/**
 * Upper bound for the `limit` query param.
 * It is used to validate the `limit` query param value.
 * If the `limit` query param value exceeds this upper bound, it will be considered invalid.
 */
export const LIMIT_UPPER_BOUND = 100;

/**
 * Default Decoder for the `limit` query param.
 * It decodes a string to a {@Link PositiveInteger} with a maximum value of {@Link LIMIT_UPPER_BOUND}.
 * If the `limit` query param is not provided, it defaults to `LIMIT_DEFAULT_VALUE`.
 */
export const LIMIT_DEFAULT_DECODER = withDefault(
  t.refinement(
    PositiveIntegerFromString,
    (i) => i < LIMIT_UPPER_BOUND,
    `PositiveIntegerMax${LIMIT_UPPER_BOUND}FromString`,
  ),
  String(LIMIT_DEFAULT_VALUE) as unknown as PositiveInteger,
);

/**
 * Default value for the `offset` query param.
 * It is used when the `offset` query param is not provided in the request.
 */
export const OFFSET_DEFAULT_VALUE = 0;

/**
 * Default Decoder for the `offset` query param.
 * It decodes a string to a {@Link NonNegativeInteger}.
 * If the `offset` query param is not provided, it defaults to {@Link OFFSET_DEFAULT_VALUE}.
 */
export const OFFSET_DEFAULT_DECODER = withDefault(
  NonNegativeIntegerFromString,
  String(OFFSET_DEFAULT_VALUE) as unknown as NonNegativeInteger,
);

/**
 * Parses a query parameter from the request and decodes it using the provided decoder.
 * @param request NextRequest to parse the query param from
 * @param param The name of the query param to parse
 * @param decoder Decoder to use for parsing the query param value
 * @returns A Validation of the decoded value, or an error if the decoding fails
 * @description This function retrieves the value of the specified query parameter from the request's URL search parameters,
 * decodes it using the provided decoder, and returns a validation result.
 * If the query parameter is not present or the decoding fails, it returns a validation error.
 * If the query parameter is present and the decoding succeeds, it returns a validation success with the decoded value.
 * If you want an optional query parameter, you can use `t.union([decoder, t.null])` as the decoder.
 * Remember that query parameters are always strings, so the decoder should handle string inputs.
 * @example
 * // Example usage:
 * const result = parseQueryParam(request, "page", PositiveIntegerFromString);
 * if (result._tag === "Left") {
 *   // Handle the error case
 *   console.error("Invalid query parameter:", result.left);
 * } else {
 *   // Handle the success case
 *   console.log("Parsed query parameter:", result.right);
 * }
 */
export const parseQueryParam = <A>(
  request: NextRequest,
  param: string,
  decoder: t.Decoder<
    ReturnType<(typeof request)["nextUrl"]["searchParams"]["get"]>,
    A
  >,
): t.Validation<A> =>
  pipe(request.nextUrl.searchParams.get(param), decoder.decode);

export const parseBody = async <T>(
  request: NextRequest,
  decoder: t.Decoder<unknown, T>,
): Promise<T> => {
  let jsonBody;
  try {
    jsonBody = await request.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Failed to parse JSON body");
    }
  }
  const maybeServicePayload = decoder.decode(jsonBody);
  if (maybeServicePayload._tag === "Left") {
    throw new Error(readableReport(maybeServicePayload.left));
  }
  return maybeServicePayload.right;
};

/**
 * Parses the `limit` query param from the request.
 * @param request NextRequest to parse the limit query param from
 * @param decoder decoder for the limit query param, defaults to {@link LIMIT_DEFAULT_DECODER}
 * @returns Either a valid {@link PositiveInteger} or a bad request error response
 */
export const parseLimitQueryParam = (
  request: NextRequest,
  decoder: Parameters<
    typeof parseQueryParam<PositiveInteger>
  >[2] = LIMIT_DEFAULT_DECODER,
): E.Either<NextResponse<ResponseError>, PositiveInteger> =>
  pipe(
    parseQueryParam(request, "limit", decoder),
    E.mapLeft(() =>
      handleBadRequestErrorResponse(
        `'limit' query param is not a valid ${decoder.name}`,
      ),
    ),
  );

/**
 * Parses the `offset` query param from the request.
 * @param request NextRequest to parse the offset query param from
 * @param decoder decoder for the offset query param, defaults to {@link OFFSET_DEFAULT_DECODER}
 * @returns Either a valid {@link NonNegativeInteger} or a bad request error response
 */
export const parseOffsetQueryParam = (
  request: NextRequest,
  decoder: Parameters<
    typeof parseQueryParam<NonNegativeInteger>
  >[2] = OFFSET_DEFAULT_DECODER,
): E.Either<NextResponse<ResponseError>, NonNegativeInteger> =>
  pipe(
    parseQueryParam(request, "offset", decoder),
    E.mapLeft(() =>
      handleBadRequestErrorResponse(
        `'offset' query param is not a valid ${decoder.name}`,
      ),
    ),
  );
