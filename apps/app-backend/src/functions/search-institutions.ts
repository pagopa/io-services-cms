import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as L from "@pagopa/logger";
import {
  IWithinRangeIntegerTag,
  IntegerFromString,
  NonNegativeInteger,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/Option";
import * as B from "fp-ts/boolean";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

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
interface SearchInstitutionsRequestQueryParams {
  limit: number;
  offset: O.Option<number>;
  scope: O.Option<ScopeType>;
  search: O.Option<NonEmptyString>;
}
export const DEFAULT_ORDER_BY = "name asc";

const calculateScopeFilter = (scope: O.Option<ScopeType>): string | undefined =>
  pipe(
    scope,
    O.map((s) => `scope eq '${s}'`),
    O.toUndefined,
  );

const calculateScoringProfile = (
  azureSearchConfig: AzureSearchConfig,
  scope: O.Option<ScopeType>,
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
              scoringParameters: [
                azureSearchConfig.AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PARAMETER,
              ],
              scoringProfile:
                azureSearchConfig.AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE,
            }),
          ),
        ),
      (_) => ({}),
    ),
  );

const executeSearch: (
  config: IConfig,
  requestQueryParams: SearchInstitutionsRequestQueryParams,
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
          filter: calculateScopeFilter(requestQueryParams.scope),
          orderBy: pipe(
            requestQueryParams.search,
            O.isNone,
            B.fold(
              () => undefined, // when search text is provided, result will be ordered by relevance(search rank)
              () => [DEFAULT_ORDER_BY], // when no search text is provided, result will be ordered by name asc
            ),
          ),
          searchParams: pipe(
            requestQueryParams.search,
            O.map((_) => ["name"]),
            O.toUndefined,
          ),
          searchText: pipe(requestQueryParams.search, O.toUndefined),
        }),
      ),
      TE.map(({ paginationProperties, results }) => ({
        count: calculateSearchResultCount(
          O.isSome(requestQueryParams.search)
            ? config.PAGINATION_MAX_OFFSET
            : (config.PAGINATION_MAX_OFFSET_AI_SEARCH as NonNegativeInteger),
          results.count,
        ),
        institutions: results.resources,
        limit: paginationProperties.top,
        offset: paginationProperties.skip ?? 0,
      })),
      TE.mapLeft((error) => new H.HttpError(error.message)),
    );

const extractQueryParams: (
  paginationConfig: PaginationConfig,
) => RTE.ReaderTaskEither<
  H.HttpRequest,
  H.HttpBadRequestError,
  SearchInstitutionsRequestQueryParams
> = (paginationConfig: PaginationConfig) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
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
      scope: OptionalQueryParamMiddleware("scope", ScopeType),
      search: OptionalQueryParamMiddleware("search", NonEmptyString),
    }),
    RTE.chain((queryParams) =>
      pipe(
        OptionalQueryParamMiddleware(
          "offset",
          IntegerFromString.pipe(
            WithinRangeInteger<
              0,
              NonNegativeInteger,
              IWithinRangeIntegerTag<0, NonNegativeInteger>
            >(
              0,
              (O.isSome(queryParams.search)
                ? paginationConfig.PAGINATION_MAX_OFFSET + 1
                : paginationConfig.PAGINATION_MAX_OFFSET_AI_SEARCH +
                  1) as NonNegativeInteger,
            ),
          ),
        ),
        RTE.map((offset) => ({ ...queryParams, offset })),
      ),
    ),
  );

export const makeSearchInstitutionsHandler: (
  config: IConfig,
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>
  | H.HttpResponse<InstitutionsResource, 200>,
  AzureSearchClientDependency<Institution>
> = (config: IConfig) =>
  H.of((request: H.HttpRequest) =>
    pipe(
      request,
      extractQueryParams(config),
      RTE.fromTaskEither,
      RTE.chain((requestQueryParams) =>
        executeSearch(config, requestQueryParams),
      ),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message }),
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(`Error executing SearchInstitutionsFn`, errorResponse),
          ),
        ),
      ),
    ),
  );

// This will return:
// - In case Azure Search response count value exceed MAX_PAGINATION_OFFSET => MAX_PAGINATION_OFFSET + request.top queryparam value
// - In Other case the actual Azure Search response count value

const calculateSearchResultCount = (
  paginationMaxOffset: NonNegativeInteger,
  actualSearchResultCount: number,
) =>
  pipe(
    actualSearchResultCount > paginationMaxOffset,
    B.fold(
      () => actualSearchResultCount,
      () => paginationMaxOffset,
    ),
  );

export const SearchInstitutionsFn = (config: IConfig) =>
  httpAzureFunction(makeSearchInstitutionsHandler(config));
