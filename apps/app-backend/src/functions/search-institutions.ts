import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";
import * as O from "fp-ts/Option";
import * as B from "fp-ts/boolean";
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
import { AzureSearchConfig, IConfig, PaginationConfig } from "../config";
import { Institution } from "../generated/definitions/internal/Institution";
import { InstitutionsResource } from "../generated/definitions/internal/InstitutionsResource";
import { ScopeType } from "../generated/definitions/internal/ScopeType";
import { OptionalQueryParamMiddleware } from "../middleware/query-params-middlewares";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";
/**
 * GET /intitutions AZF HttpTrigger
 * Search for institutions on Azure Search Index
 */
type SearchInstitutionsRequestQueryParams = {
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

const calculateScoringProfile = (
  azureSearchConfig: AzureSearchConfig,
  scope: O.Option<ScopeType>
) =>
  pipe(
    scope,
    O.fold(
      () =>
        pipe(
          !!azureSearchConfig.AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE &&
            !!azureSearchConfig.AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PARAMETER,
          B.fold(
            () => ({}),
            () => ({
              scoringProfile:
                azureSearchConfig.AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE,
              scoringParameters: [
                azureSearchConfig.AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PARAMETER,
              ],
            })
          )
        ),
      (_) => ({})
    )
  );

const executeSearch: (
  config: IConfig,
  requestQueryParams: SearchInstitutionsRequestQueryParams
) => RTE.ReaderTaskEither<
  AzureSearchClientDependency<Institution>,
  H.HttpError,
  InstitutionsResource
> =
  (config: IConfig, requestQueryParams: SearchInstitutionsRequestQueryParams) =>
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
          ...calculateScoringProfile(config, requestQueryParams.scope),
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
        institutions: results.resources,
        count: calculateSearchResultCount(
          config,
          results.count,
          paginationProperties.top
        ),
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
  SearchInstitutionsRequestQueryParams
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

export const makeSearchInstitutionsHandler: (
  config: IConfig
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<InstitutionsResource, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  AzureSearchClientDependency<Institution>
> = (config: IConfig) =>
  H.of((request: H.HttpRequest) =>
    pipe(
      request,
      extractQueryParams(config),
      RTE.fromTaskEither,
      RTE.chain((requestQueryParams) =>
        executeSearch(config, requestQueryParams)
      ),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message })
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(`Error executing SearchInstitutionsFn`, errorResponse)
          )
        )
      )
    )
  );

// This will return:
// - In case Azure Search response count value exceed MAX_PAGINATION_OFFSET => MAX_PAGINATION_OFFSET + request.top queryparam value
// - In Other case the actual Azure Search response count value

const calculateSearchResultCount = (
  paginationConfig: PaginationConfig,
  actualSearchResultCount: number,
  requestLimit: number
) =>
  pipe(
    actualSearchResultCount > paginationConfig.PAGINATION_MAX_OFFSET,
    B.fold(
      () => actualSearchResultCount,
      () => paginationConfig.PAGINATION_MAX_OFFSET + requestLimit
    )
  );

export const SearchInstitutionsFn = (config: IConfig) =>
  httpAzureFunction(makeSearchInstitutionsHandler(config));
