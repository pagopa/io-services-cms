import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { XUserMiddleware } from "../middleware/x-user-middleware";
import { computeAgeFromDateOfBirth } from "./age";

/**
 * Resolves the caller's age from the request, decoding the `x-user` header via
 * `XUserMiddleware` and computing the age from its `date_of_birth`.
 *
 * Shared by the API handlers that apply the anagraphic filter (SearchServices,
 * FeaturedServices). Fails with a `401 Unauthorized` when the header is missing
 * or invalid.
 */
export const resolveUserAge = (
  request: H.HttpRequest,
): TE.TaskEither<H.HttpUnauthorizedError, number> =>
  pipe(
    XUserMiddleware(request),
    E.map((user) => computeAgeFromDateOfBirth(user.date_of_birth)),
    TE.fromEither,
  );
