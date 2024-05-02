import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";
import * as B from "fp-ts/boolean";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";

import { flow, pipe } from "fp-ts/lib/function";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ServiceDetails } from "../generated/definitions/internal/ServiceDetails";
import { PathParamValidatorMiddleware } from "../middleware/path-params-middleware";
import { ServiceDetailsContainerDependency } from "../utils/cosmos-db/dependency";

/**
 * GET /services/{serviceId} AZF HttpTrigger
 * Get Service by Id
 */

const executeGetServiceById: (
  serviceId: NonEmptyString
) => RTE.ReaderTaskEither<
  ServiceDetailsContainerDependency,
  H.HttpError,
  ServiceDetails
> =
  (serviceId: NonEmptyString) =>
  ({ serviceDetailsContainer }) =>
    pipe(
      TE.tryCatch(
        () => serviceDetailsContainer.item(serviceId, serviceId).read(),
        (err) =>
          new H.HttpError(
            `An error has occurred while fetching service having ID ${serviceId} [${
              E.toError(err).message
            }]`
          )
      ),
      TE.chain((rr) =>
        pipe(
          rr,
          O.fromPredicate(() => rr.statusCode === 200),
          O.fold(
            () =>
              pipe(
                rr.statusCode === 404,
                B.fold(
                  () =>
                    new H.HttpError(
                      `An error has occurred while fetching service '${serviceId}', reason: ${rr.statusCode}`
                    ),
                  () =>
                    new H.HttpNotFoundError(`Service '${serviceId}' not found`)
                ),
                E.left
              ),
            ({ resource }) =>
              pipe(
                resource,
                ServiceDetails.decode,
                E.mapLeft(
                  flow(
                    readableReport,
                    (err) =>
                      new H.HttpError(
                        `An error has occurred while decoding service having ID ${serviceId} [${err}]`
                      )
                  )
                )
              )
          ),
          TE.fromEither
        )
      )
    );

export const makeGetServiceByIdHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<ServiceDetails, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  ServiceDetailsContainerDependency
> = H.of((request: H.HttpRequest) =>
  pipe(
    request,
    PathParamValidatorMiddleware("serviceId", NonEmptyString),
    RTE.fromTaskEither,
    RTE.chain(executeGetServiceById),
    RTE.map(H.successJson),
    RTE.orElseW((error) =>
      pipe(
        RTE.right(
          H.problemJson({ status: error.status, title: error.message })
        ),
        RTE.chainFirstW((errorResponse) =>
          L.errorRTE(`Error executing GetServiceByIdFn`, errorResponse)
        )
      )
    )
  )
);

export const GetServiceByIdFn = httpAzureFunction(makeGetServiceByIdHandler);
