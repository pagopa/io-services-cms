import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { ErrorResponseTypes } from "./logger";
import { flow, pipe } from "fp-ts/lib/function";
import { ResponseErrorInternal, ResponseErrorNotFound } from "@pagopa/ts-commons/lib/responses";


export const checkService =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient) =>
  (serviceId: NonEmptyString): TE.TaskEither<ErrorResponseTypes, void> =>
    pipe(
      serviceId,
      fsmLifecycleClient.getStore().fetch,
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
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