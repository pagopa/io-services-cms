import { ServiceLifecycle } from "@io-services-cms/models";
import { ResponseErrorNotFound } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { fsmToApiError } from "./converters/fsm-error-converters";
import { ErrorResponseTypes } from "./logger";

export const checkService =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient) =>
  (serviceId: NonEmptyString): TE.TaskEither<ErrorResponseTypes, void> =>
    pipe(
      serviceId,
      fsmLifecycleClient.fetch,
      TE.mapLeft(fsmToApiError),
      TE.chainW(
        flow(
          O.filter((service) => service.fsm.state !== "deleted"),
          O.map(() => void 0),
          TE.fromOption(() =>
            ResponseErrorNotFound(
              "Not found",
              `no item with id ${serviceId} found`,
            ),
          ),
        ),
      ),
    );
