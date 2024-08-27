import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import {
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";

/**
 * Extracts the user email from the provided header.
 * Block the request if the value is not provided or is not a valid email
 *
 * @returns either the user email or an error
 */
export const UserEmailMiddleware =
  (): IRequestMiddleware<
    "IResponseErrorForbiddenNotAuthorized" | "IResponseErrorInternal",
    EmailString
  > =>
  async (request) =>
    pipe(
      // The user email will be passed in this header by the API Gateway
      request.header("x-user-email"),
      O.fromNullable,
      E.fromOption(() => ResponseErrorForbiddenNotAuthorized),
      E.chainW(
        flow(
          EmailString.decode,
          E.mapLeft((_) =>
            ResponseErrorInternal(`Failed to decode provided email`),
          ),
        ),
      ),
    );
