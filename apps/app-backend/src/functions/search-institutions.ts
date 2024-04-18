import * as H from "@pagopa/handler-kit";
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
import { Institution } from "../generated/definitions/internal/Institution";
import { InstitutionsResource } from "../generated/definitions/internal/InstitutionsResource";
import { ScopeType } from "../generated/definitions/internal/ScopeType";
import {
  OptionalQueryParamMiddleware,
  RequiredQueryParamMiddleware,
} from "../middleware/request";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";
/**
 * GET /intitutions AZF HttpTrigger
 * Search for institutions on Azure Search Index
 */
type SearchInstitutionsRequestQueryParams = {
  search: NonEmptyString;
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
  requestQueryParams: SearchInstitutionsRequestQueryParams
) => RTE.ReaderTaskEither<
  AzureSearchClientDependency<Institution>,
  H.HttpError,
  InstitutionsResource
> =
  (requestQueryParams: SearchInstitutionsRequestQueryParams) =>
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
          searchText: requestQueryParams.search,
          searchParams: ["name"],
          filter: calculateScopeFilter(requestQueryParams.scope),
        })
      ),
      TE.map(({ paginationProperties, results }) => ({
        institutions: results.resources,
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
  SearchInstitutionsRequestQueryParams
> = (paginationConfig: PaginationConfig) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      search: RequiredQueryParamMiddleware("search", NonEmptyString),
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
        IntegerFromString.pipe(NonNegativeInteger)
      ),
    })
  );

export const makeSearchInstitutionsHandler: (
  paginationConfig: PaginationConfig
) => H.Handler<
  H.HttpRequest,
  H.HttpResponse<InstitutionsResource, 200>,
  AzureSearchClientDependency<Institution>
> = (paginationConfig: PaginationConfig) =>
  H.of((request: H.HttpRequest) =>
    pipe(
      request,
      extractQueryParams(paginationConfig),
      RTE.fromTaskEither,
      RTE.chain(executeSearch),
      RTE.map(H.successJson)
    )
  );

export const SearchInstitutionsFn = (paginationConfig: PaginationConfig) =>
  httpAzureFunction(makeSearchInstitutionsHandler(paginationConfig));
