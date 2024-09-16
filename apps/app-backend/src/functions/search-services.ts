import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as L from "@pagopa/logger";
import {
  IWithinRangeIntegerTag,
  IntegerFromString,
  NonNegativeInteger,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import * as O from "fp-ts/Option";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { PaginationConfig } from "../config";
import { InstitutionServicesResource } from "../generated/definitions/internal/InstitutionServicesResource";
import { OrganizationFiscalCode } from "../generated/definitions/internal/OrganizationFiscalCode";
import { ServiceMinified } from "../generated/definitions/internal/ServiceMinified";
import { PathParamValidatorMiddleware } from "../middleware/path-params-middleware";
import { OptionalQueryParamMiddleware } from "../middleware/query-params-middlewares";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";

/**
 * GET /institutions/{institutionId}/services AZF HttpTrigger
 * Search for Istitution's Services on Azure Search Index
 */
interface SearchServicesRequestParams {
  institutionId: OrganizationFiscalCode;
  limit: number;
  offset: O.Option<number>;
}

export const DEFAULT_ORDER_BY = "name asc";

const executeSearch: (
  requestQueryParams: SearchServicesRequestParams,
) => RTE.ReaderTaskEither<
  AzureSearchClientDependency<ServiceMinified>,
  H.HttpError,
  InstitutionServicesResource
> =
  (requestQueryParams: SearchServicesRequestParams) =>
  ({ searchClient }) =>
    pipe(
      sequenceS(TE.ApplyPar)({
        skip: TE.right(pipe(requestQueryParams.offset, O.toUndefined)),
        top: TE.right(requestQueryParams.limit),
      }),
      TE.bindTo("paginationProperties"),
      TE.bind("results", ({ paginationProperties }) =>
        searchClient.fullTextSearch({
          ...paginationProperties,
          filter: `orgFiscalCode eq '${requestQueryParams.institutionId}'`,
          orderBy: [DEFAULT_ORDER_BY],
        }),
      ),
      TE.map(({ paginationProperties, results }) => ({
        count: results.count,
        limit: paginationProperties.top,
        offset: paginationProperties.skip ?? 0,
        services: results.resources,
      })),
      TE.mapLeft((error) => new H.HttpError(error.message)),
    );

const extractParams: (
  paginationConfig: PaginationConfig,
) => RTE.ReaderTaskEither<
  H.HttpRequest,
  H.HttpBadRequestError,
  SearchServicesRequestParams
> = (paginationConfig: PaginationConfig) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      institutionId: PathParamValidatorMiddleware(
        "institutionId",
        OrganizationFiscalCode,
      ),
      limit: pipe(
        OptionalQueryParamMiddleware(
          "limit",
          IntegerFromString.pipe(
            WithinRangeInteger<
              1,
              NonNegativeInteger,
              IWithinRangeIntegerTag<1, NonNegativeInteger>
            >(
              1,
              (paginationConfig.PAGINATION_MAX_LIMIT + 1) as NonNegativeInteger,
            ),
          ),
        ),
        RTE.map(O.getOrElseW(() => paginationConfig.PAGINATION_DEFAULT_LIMIT)),
      ),
      offset: OptionalQueryParamMiddleware(
        "offset",
        IntegerFromString.pipe(
          WithinRangeInteger<
            0,
            NonNegativeInteger,
            IWithinRangeIntegerTag<0, NonNegativeInteger>
          >(
            0,
            (paginationConfig.PAGINATION_MAX_OFFSET_AI_SEARCH +
              1) as NonNegativeInteger,
          ),
        ),
      ),
    }),
  );

export const makeSearchServicesHandler: (
  paginationConfig: PaginationConfig,
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>
  | H.HttpResponse<InstitutionServicesResource, 200>,
  AzureSearchClientDependency<ServiceMinified>
> = (paginationConfig: PaginationConfig) =>
  H.of((request: H.HttpRequest) =>
    pipe(
      request,
      extractParams(paginationConfig),
      RTE.fromTaskEither,
      RTE.chain(executeSearch),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message }),
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(`Error executing SearchServicesFn`, errorResponse),
          ),
        ),
      ),
    ),
  );

export const SearchServicesFn = (paginationConfig: PaginationConfig) =>
  httpAzureFunction(makeSearchServicesHandler(paginationConfig));
