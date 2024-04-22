import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import {
  IWithinRangeIntegerTag,
  IntegerFromString,
  NonNegativeInteger,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { sequenceS } from "fp-ts/lib/Apply";
import { PaginationConfig } from "../config";
import { ScopeType } from "../generated/definitions/internal/ScopeType";
import { OptionalQueryParamMiddleware } from "../middleware/query-params-middlewares";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";
import { InstitutionServicesResource } from "../generated/definitions/internal/InstitutionServicesResource";
import { ServiceMinified } from "../generated/definitions/internal/ServiceMinified";
/**
 * GET /Services AZF HttpTrigger
 * Search for Services on Azure Search Index
 */
type SearchServicesRequestQueryParams = {
  search: O.Option<NonEmptyString>;
  scope: O.Option<ScopeType>;
  limit: number;
  offset: O.Option<number>;
};

const calculateScopeFilter = (scope: O.Option<ScopeType>): string | undefined =>
  pipe(
    scope,
    O.map((s) => `scope eq '${s}'`),
    O.toUndefined
  );

const executeSearch: (
  requestQueryParams: SearchServicesRequestQueryParams
) => RTE.ReaderTaskEither<
  AzureSearchClientDependency<ServiceMinified>,
  H.HttpError,
  InstitutionServicesResource
> =
  (requestQueryParams: SearchServicesRequestQueryParams) =>
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
          searchText: pipe(requestQueryParams.search, O.toUndefined),
          searchParams: pipe(
            requestQueryParams.search,
            O.map((_) => ["name"]),
            O.toUndefined
          ),
          filter: calculateScopeFilter(requestQueryParams.scope),
        })
      ),
      TE.map(({ paginationProperties, results }) => ({
        services: results.resources,
        count: results.count,
        limit: paginationProperties.top,
        offset: paginationProperties.skip ?? 0,
      })),
      TE.mapLeft((error) => new H.HttpError(error.message))
    );

const extractQueryParams: (
  paginationConfig: PaginationConfig
) => RTE.ReaderTaskEither<
  H.HttpRequest,
  H.HttpBadRequestError,
  SearchServicesRequestQueryParams
> = (paginationConfig: PaginationConfig) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      search: OptionalQueryParamMiddleware("search", NonEmptyString),
      scope: OptionalQueryParamMiddleware("scope", ScopeType),
      limit: pipe(
        OptionalQueryParamMiddleware(
          "limit",
          IntegerFromString.pipe(
            WithinRangeInteger<
              1,
              NonNegativeInteger,
              IWithinRangeIntegerTag<1, NonNegativeInteger>
            >(1, paginationConfig.PAGINATION_MAX_LIMIT)
          )
        ),
        RTE.map(O.getOrElseW(() => paginationConfig.PAGINATION_DEFAULT_LIMIT))
      ),
      offset: OptionalQueryParamMiddleware(
        "offset",
        IntegerFromString.pipe(
          WithinRangeInteger<
            0,
            NonNegativeInteger,
            IWithinRangeIntegerTag<0, NonNegativeInteger>
          >(0, paginationConfig.PAGINATION_MAX_OFFSET)
        )
      ),
    })
  );

export const makeSearchServicesHandler: (
  paginationConfig: PaginationConfig
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<InstitutionServicesResource, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  AzureSearchClientDependency<ServiceMinified>
> = (paginationConfig: PaginationConfig) =>
  H.of((request: H.HttpRequest) =>
    pipe(
      request,
      extractQueryParams(paginationConfig),
      RTE.fromTaskEither,
      RTE.chain(executeSearch),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message })
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(`Error executing SearchServicesFn`, errorResponse)
          )
        )
      )
    )
  );

export const SearchServicesFn = (paginationConfig: PaginationConfig) =>
  httpAzureFunction(makeSearchServicesHandler(paginationConfig));
