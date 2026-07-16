import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import * as RE from "fp-ts/lib/ReaderEither";
import { lookup } from "fp-ts/lib/Record";
import { flow, pipe } from "fp-ts/lib/function";

import { XUser, getByXUserToken } from "../utils/x-user-token";

const X_USER_HEADER_NAME = "x-user";

/**
 * Middleware that decodes and validates the `x-user` header injected by the
 * APIM proxy (a base64-encoded JSON `UserIdentity`).
 *
 * On success the decoded `XUser` (with `date_of_birth` parsed as a `Date`) is
 * passed to the handler. If the header is missing or invalid, it fails with a
 * `401 Unauthorized`.
 *
 * Adapted from io-backend `xUserMiddleware`/`getByXUserToken`.
 */
export const XUserMiddleware: RE.ReaderEither<
  H.HttpRequest,
  H.HttpUnauthorizedError,
  XUser
> = flow(
  (req) => req.headers,
  lookup(X_USER_HEADER_NAME),
  E.fromOption(
    () => new H.HttpUnauthorizedError(`Missing '${X_USER_HEADER_NAME}' header`),
  ),
  E.chain((token) =>
    pipe(
      getByXUserToken(token),
      E.chain(E.fromOption(() => new Error("Empty user identity"))),
      E.mapLeft(
        () =>
          new H.HttpUnauthorizedError(`Invalid '${X_USER_HEADER_NAME}' header`),
      ),
    ),
  ),
);
