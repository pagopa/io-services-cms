import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import { ResponseErrorValidation } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { CommaSeparatedListOf } from "../../utils/comma-separated-list";

/**
 * Extracts the selfcare user groups from the provided header.
 * Block the request if the value is not valid
 *
 * @returns either the selfcare user groups or an error
 */
export const SelfcareUserGroupsMiddleware =
  (): IRequestMiddleware<
    "IResponseErrorValidation",
    readonly NonEmptyString[]
  > =>
  async (request) =>
    pipe(
      request.header("x-user-groups-selc"),
      CommaSeparatedListOf(NonEmptyString).decode,
      // based on current CommaSeparatedListOf implementation, actually this decoder can't fails (see Unit Tests)
      E.mapLeft((_) =>
        ResponseErrorValidation(
          "SelfcareUserGroupsMiddleware",
          "Not a comma-separated list of values",
        ),
      ),
    );
