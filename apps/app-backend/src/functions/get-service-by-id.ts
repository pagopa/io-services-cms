import { ServiceDetail as CosmosDbServiceDetails } from "@io-services-cms/models";
import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as L from "@pagopa/logger";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as B from "fp-ts/boolean";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { ScopeEnum } from "../generated/definitions/internal/ServiceBaseMetadata";
import { ServiceDetails as ApiResponseServiceDetails } from "../generated/definitions/internal/ServiceDetails";
import { CategoryEnum as SpecialCategoryEnum } from "../generated/definitions/internal/SpecialServiceMetadata";
import { CategoryEnum as StandardCategoryEnum } from "../generated/definitions/internal/StandardServiceMetadata";
import { PathParamValidatorMiddleware } from "../middleware/path-params-middleware";
import { ServiceDetailsContainerDependency } from "../utils/cosmos-db/dependency";

/**
 * GET /services/{serviceId} AZF HttpTrigger
 * Get Service by Id
 */

const executeGetServiceById: (
  serviceId: NonEmptyString,
) => RTE.ReaderTaskEither<
  ServiceDetailsContainerDependency,
  H.HttpError,
  ApiResponseServiceDetails
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
            }]`,
          ),
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
                      `An error has occurred while fetching service '${serviceId}', reason: ${rr.statusCode}`,
                    ),
                  () =>
                    new H.HttpNotFoundError(`Service '${serviceId}' not found`),
                ),
                E.left,
              ),
            ({ resource }) =>
              pipe(
                resource,
                CosmosDbServiceDetails.decode,
                E.mapLeft(
                  flow(
                    readableReport,
                    (err) =>
                      new H.HttpError(
                        `An error has occurred while decoding service having ID ${serviceId} [${err}]`,
                      ),
                  ),
                ),
              ),
          ),
          TE.fromEither,
        ),
      ),
      TE.map(toApiResponseServiceDetails),
    );

export const toApiResponseServiceDetails = (
  cosmosDbServiceDetail: CosmosDbServiceDetails,
): ApiResponseServiceDetails => ({
  description: cosmosDbServiceDetail.description,
  id: cosmosDbServiceDetail.id,
  metadata: toApiResponseServiceMetadata(cosmosDbServiceDetail.metadata),
  name: cosmosDbServiceDetail.name,
  organization: cosmosDbServiceDetail.organization,
});

// TODO: in MVP0 we are not mapping the topic conversion
const toApiResponseServiceMetadata = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  topic_id,
  ...metadata
}: CosmosDbServiceDetails["metadata"]): ApiResponseServiceDetails["metadata"] => ({
  ...metadata,
  category: mapCategory(metadata.category),
  scope: mapScope(metadata.scope),
});

const mapScope = (
  scope: CosmosDbServiceDetails["metadata"]["scope"],
): ScopeEnum =>
  pipe(
    scope === ScopeEnum.NATIONAL,
    B.fold(
      () => ScopeEnum.LOCAL,
      () => ScopeEnum.NATIONAL,
    ),
  );

const mapCategory = (
  category: CosmosDbServiceDetails["metadata"]["category"],
) =>
  category === "STANDARD"
    ? StandardCategoryEnum.STANDARD
    : SpecialCategoryEnum.SPECIAL;

export const makeGetServiceByIdHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<ApiResponseServiceDetails, 200>
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
          H.problemJson({ status: error.status, title: error.message }),
        ),
        RTE.chainFirstW((errorResponse) =>
          L.errorRTE(`Error executing GetServiceByIdFn`, errorResponse),
        ),
      ),
    ),
  ),
);

export const GetServiceByIdFn = httpAzureFunction(makeGetServiceByIdHandler);
