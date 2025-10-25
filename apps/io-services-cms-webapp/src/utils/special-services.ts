import { ServiceLifecycle } from "@io-services-cms/models";
import {
  IResponseErrorForbiddenNotAuthorized,
  ResponseErrorForbiddenNotAuthorized,
} from "@pagopa/ts-commons/lib/responses";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

const SPECIAL_CATEGORY: ServiceLifecycle.definitions.Service["data"]["metadata"]["category"] =
  "SPECIAL";

// Authorization check: only services of SPECIAL_CATEGORY can proceed
export const authorizedForSpecialServicesTask = (
  category: ServiceLifecycle.definitions.Service["data"]["metadata"]["category"],
): TE.TaskEither<
  IResponseErrorForbiddenNotAuthorized,
  ServiceLifecycle.definitions.Service["data"]["metadata"]["category"]
> =>
  pipe(
    O.fromNullable(category),
    O.filter((cat) => cat === SPECIAL_CATEGORY),
    TE.fromOption(() => ResponseErrorForbiddenNotAuthorized),
  );
