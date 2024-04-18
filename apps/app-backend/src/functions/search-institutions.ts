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
import { Institutions } from "../generated/definitions/internal/Institutions";
import { InstitutionsResource } from "../generated/definitions/internal/InstitutionsResource";
import {
  OptionalQueryParamMiddleware,
  RequiredQueryParamMiddleware,
} from "../middleware/request";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";
/**
 * GET /intitutions AZF HttpTrigger
 * Search for institutions on Azure Search Index
 */

const search: (
  search: NonEmptyString,
  scope: O.Option<NonEmptyString>,
  limit: O.Option<number>,
  offset: O.Option<number>
) => RTE.ReaderTaskEither<
  AzureSearchClientDependency<Institution>,
  H.HttpError,
  Institutions
> =
  (
    search: NonEmptyString,
    scope: O.Option<NonEmptyString>, // TODO: calcolare il filtro
    limit: O.Option<number>,
    offset: O.Option<number>
  ) =>
  ({ searchClient }) =>
    pipe(
      searchClient.fullTextSearch({
        searchText: search,
        searchParams: ["name"],
        skip: calculateSkip(offset),
        top: calculateTop(limit),
        filter: calculateScopeFilter(scope),
      }),
      TE.map((results) => ({
        institutions: results.resources,
        count: results.count,
        limit,
        offset,
      })),
      TE.mapLeft((error) => new H.HttpError(error.message))
    );

export const makeSearchInstitutionsHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<InstitutionsResource, 200>,
  AzureSearchClientDependency<Institution>
> = H.of((request: H.HttpRequest) =>
  pipe(
    request,
    sequenceS(RTE.ApplyPar)({
      // The exact decode is required to remove additional headers with security information like auth token
      search: RequiredQueryParamMiddleware(
        NonEmptyString,
        "search" as NonEmptyString
      ),
      scope: OptionalQueryParamMiddleware(
        NonEmptyString, // TODO: fix scope decoder
        "scope" as NonEmptyString
      ),
      limit: OptionalQueryParamMiddleware(
        IntegerFromString.pipe(
          WithinRangeInteger<
            1,
            NonNegativeInteger,
            IWithinRangeIntegerTag<1, NonNegativeInteger>
          >(1, 100 as NonNegativeInteger) // Get from config
        ),
        "limit" as NonEmptyString
      ),
      offset: OptionalQueryParamMiddleware(
        IntegerFromString.pipe(NonNegativeInteger),
        "limit" as NonEmptyString
      ),
    }),
    RTE.fromTaskEither,
    RTE.bindTo("queryParams"),
    RTE.chainW(({ queryParams }) =>
      search(
        queryParams.search,
        queryParams.scope,
        queryParams.limit,
        queryParams.offset
      )
    ),
    RTE.map(H.successJson)
  )
);

export const SearchInstitutionsFn = httpAzureFunction(
  makeSearchInstitutionsHandler
);

const calculateSkip = (offset: O.Option<number>): number | undefined =>
  pipe(offset, O.toUndefined);

const calculateTop = (limit: O.Option<number>): number =>
  pipe(
    limit,
    O.getOrElse(() => 20) // TODO: get from config
  );
const calculateScopeFilter = (
  scope: O.Option<NonEmptyString>
): string | undefined =>
  pipe(
    scope,
    O.map((s) => `scope eq '${s}'`),
    O.toUndefined
  );
