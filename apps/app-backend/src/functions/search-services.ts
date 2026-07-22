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
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig, PaginationConfig } from "../config";
import { InstitutionServicesResource } from "../generated/definitions/internal/InstitutionServicesResource";
import { OrganizationFiscalCode } from "../generated/definitions/internal/OrganizationFiscalCode";
import { ServiceMinified } from "../generated/definitions/internal/ServiceMinified";
import { PathParamValidatorMiddleware } from "../middleware/path-params-middleware";
import { OptionalQueryParamMiddleware } from "../middleware/query-params-middlewares";
import { XUserMiddleware } from "../middleware/x-user-middleware";
import { computeAgeFromDateOfBirth } from "../utils/age";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";

/**
 * GET /institutions/{institutionId}/services AZF HttpTrigger
 * Search for Istitution's Services on Azure Search Index
 */
interface SearchServicesRequestParams {
  institutionId: OrganizationFiscalCode;
  limit: number;
  offset: O.Option<number>;
  sessionId: O.Option<NonEmptyString>;
}

// Search params enriched with the caller's age, resolved from the `x-user` header
type SearchServicesResolvedParams = {
  readonly userAge: number;
} & SearchServicesRequestParams;

// Handler config: pagination + the feature flag gating the age filter
type SearchServicesConfig = PaginationConfig &
  Pick<IConfig, "FF_SUITABLE_FOR_MINORS_ENABLED">;

export const DEFAULT_ORDER_BY = "name asc";

/**
 * Builds the AI Search `$filter`. The age-based clause (`ageMin`/`ageMax`) is
 * appended only when the feature flag is enabled: until the `services` alias is
 * switched to the age-aware index, the query keeps the original org-only filter.
 */
const buildServicesFilter = (
  requestQueryParams: SearchServicesResolvedParams,
  ageFilterEnabled: boolean,
): string => {
  const orgFilter = `orgFiscalCode eq '${requestQueryParams.institutionId}'`;
  return ageFilterEnabled
    ? `${orgFilter} and ageMin le ${requestQueryParams.userAge} and ageMax ge ${requestQueryParams.userAge}`
    : orgFilter;
};

const executeSearch =
  (ageFilterEnabled: boolean) =>
  (
    requestQueryParams: SearchServicesResolvedParams,
  ): RTE.ReaderTaskEither<
    AzureSearchClientDependency<ServiceMinified>,
    H.HttpError,
    InstitutionServicesResource
  > =>
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
          filter: buildServicesFilter(requestQueryParams, ageFilterEnabled),
          orderBy: [DEFAULT_ORDER_BY],
          sessionId: pipe(requestQueryParams.sessionId, O.toUndefined),
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
      sessionId: OptionalQueryParamMiddleware("sessionId", NonEmptyString),
    }),
  );

/**
 * Resolves the caller identity from the `x-user` header (computing the user's
 * age) and the request query/path params, following the DR sequence: the
 * `x-user` resolution (401 on failure) happens before the params validation
 * (400 on failure). The `...W` combinator widens the error into the union of
 * both error types, handled downstream by `orElseW`.
 */
const resolveSearchParams =
  (paginationConfig: PaginationConfig) =>
  (
    request: H.HttpRequest,
  ): TE.TaskEither<
    H.HttpBadRequestError | H.HttpUnauthorizedError,
    SearchServicesResolvedParams
  > =>
    pipe(
      TE.Do,
      TE.apS(
        "userAge",
        pipe(
          XUserMiddleware(request),
          E.map((user) => computeAgeFromDateOfBirth(user.date_of_birth)),
          TE.fromEither,
        ),
      ),
      TE.apSW("params", extractParams(paginationConfig)(request)),
      TE.map(({ params, userAge }) => ({ ...params, userAge })),
    );

export const makeSearchServicesHandler: (
  config: SearchServicesConfig,
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>
  | H.HttpResponse<InstitutionServicesResource, 200>,
  AzureSearchClientDependency<ServiceMinified>
> = (config: SearchServicesConfig) =>
  H.of((request: H.HttpRequest) =>
    pipe(
      request,
      resolveSearchParams(config),
      RTE.fromTaskEither,
      RTE.chainW(executeSearch(config.FF_SUITABLE_FOR_MINORS_ENABLED)),
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

export const SearchServicesFn = (config: SearchServicesConfig) =>
  httpAzureFunction(makeSearchServicesHandler(config));
