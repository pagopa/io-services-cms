import * as H from "@pagopa/handler-kit";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import {
  IntegerFromString,
  IWithinRangeIntegerTag,
  NonNegativeInteger,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { sequenceS } from "fp-ts/lib/Apply";
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
type RequestQueryParams = {
  search: NonEmptyString;
  scope: O.Option<ScopeType>;
  limit: O.Option<number>;
  offset: O.Option<number>;
};
const calculateSkip = (offset: O.Option<number>): number | undefined =>
  pipe(offset, O.toUndefined);

const calculateTop = (limit: O.Option<number>): number =>
  pipe(
    limit,
    O.getOrElse(() => 20) // TODO: get from config
  );

const calculateScopeFilter = (scope: O.Option<ScopeType>): string | undefined =>
  pipe(
    scope,
    O.map((s) => `scope eq '${s}'`),
    O.toUndefined
  );

const executeSearch: (
  search: NonEmptyString,
  scope: O.Option<ScopeType>,
  limit: O.Option<number>,
  offset: O.Option<number>
) => RTE.ReaderTaskEither<
  AzureSearchClientDependency<Institution>,
  H.HttpError,
  InstitutionsResource
> =
  (
    search: NonEmptyString,
    scope: O.Option<ScopeType>,
    limit: O.Option<number>,
    offset: O.Option<number>
  ) =>
  ({ searchClient }) =>
    pipe(
      sequenceS(TE.ApplyPar)({
        skip: TE.right(calculateSkip(offset)),
        top: TE.right(calculateTop(limit)),
      }),
      TE.bindTo("paginationProperties"),
      TE.bind("results", ({ paginationProperties }) =>
        searchClient.fullTextSearch({
          ...paginationProperties,
          searchText: search,
          searchParams: ["name"],
          filter: calculateScopeFilter(scope),
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

const extractQueryParams: RTE.ReaderTaskEither<
  H.HttpRequest,
  H.HttpBadRequestError,
  RequestQueryParams
> = pipe(
  sequenceS(RTE.ApplyPar)({
    search: RequiredQueryParamMiddleware("search", NonEmptyString),
    scope: OptionalQueryParamMiddleware("scope", ScopeType),
    limit: OptionalQueryParamMiddleware(
      "limit",
      IntegerFromString.pipe(
        WithinRangeInteger<
          1,
          NonNegativeInteger,
          IWithinRangeIntegerTag<1, NonNegativeInteger>
        >(1, 100 as NonNegativeInteger) // TODO: Get from config
      )
    ),
    offset: OptionalQueryParamMiddleware(
      "offset",
      IntegerFromString.pipe(NonNegativeInteger)
    ),
  })
);

export const makeSearchInstitutionsHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<InstitutionsResource, 200>,
  AzureSearchClientDependency<Institution>
> = H.of((request: H.HttpRequest) =>
  pipe(
    request,
    extractQueryParams,
    RTE.fromTaskEither,
    RTE.chain(({ search, scope, offset, limit }) =>
      executeSearch(search, scope, limit, offset)
    ),
    RTE.map(H.successJson)
  )
);

export const SearchInstitutionsFn = httpAzureFunction(
  makeSearchInstitutionsHandler
);
