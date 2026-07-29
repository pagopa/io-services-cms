import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as L from "@pagopa/logger";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { FeaturedItemsConfig, IConfig } from "../config";
import { FeaturedServices } from "../generated/definitions/internal/FeaturedServices";
import { CONSERVATIVE_AGE_MAX, CONSERVATIVE_AGE_MIN } from "../utils/age";
import { BlobServiceClientDependency } from "../utils/blob-storage/dependency";
import { getBlobAsObject } from "../utils/blob-storage/helper";
import { resolveUserAge } from "../utils/user-age";

// Handler config: featured items + the feature flag gating the age filter
type FeaturedServicesConfig = FeaturedItemsConfig &
  Pick<IConfig, "FF_SUITABLE_FOR_MINORS_ENABLED">;

/**
 * GET /institutions/featured AZF HttpTrigger
 * Retrieve the featured Institutions from the blob storage
 */

export const retrieveFeaturedServices: (
  featuredItemsConfig: FeaturedItemsConfig,
) => RTE.ReaderTaskEither<
  BlobServiceClientDependency,
  H.HttpError,
  FeaturedServices
> =
  (featuredItemsConfig: FeaturedItemsConfig) =>
  ({ blobServiceClient }) =>
    pipe(
      getBlobAsObject(
        FeaturedServices,
        blobServiceClient,
        featuredItemsConfig.FEATURED_ITEMS_CONTAINER_NAME,
        featuredItemsConfig.FEATURED_SERVICES_FILE_NAME,
      ),
      TE.mapLeft(
        (err) =>
          new H.HttpError(
            `An error occurred retrieving featuredServices file from blobService: [${err.message}]`,
          ),
      ),
      TE.map(O.getOrElse(() => ({ services: [] }) as FeaturedServices)), // Return an empty list if the file is not found
    );

/**
 * Applies the in-memory anagraphic filter to the featured services, using the
 * conservative defaults for services without an explicit age range
 * (`min ?? 18`, `max ?? 999`). A service is kept when the user's age falls
 * within the effective `[min, max]` range.
 */
const filterFeaturedServicesByAge = (
  featuredServices: FeaturedServices,
  userAge: number,
): FeaturedServices => ({
  ...featuredServices,
  services: featuredServices.services.filter(
    (service) =>
      userAge >= (service.age?.min ?? CONSERVATIVE_AGE_MIN) &&
      userAge <= (service.age?.max ?? CONSERVATIVE_AGE_MAX),
  ),
});

export const makeFeaturedServicesHandler: (
  config: FeaturedServicesConfig,
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<FeaturedServices, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  BlobServiceClientDependency
> = (config: FeaturedServicesConfig) =>
  H.of((request: H.HttpRequest) =>
    pipe(
      RTE.Do,
      // x-user resolution first (401 on failure), then the blob fetch
      RTE.apSW("userAge", RTE.fromTaskEither(resolveUserAge(request))),
      RTE.apSW("featuredServices", retrieveFeaturedServices(config)),
      RTE.map(({ featuredServices, userAge }) =>
        config.FF_SUITABLE_FOR_MINORS_ENABLED
          ? filterFeaturedServicesByAge(featuredServices, userAge)
          : featuredServices,
      ),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message }),
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(`Error executing GetFeaturedServicesFn`, errorResponse),
          ),
        ),
      ),
    ),
  );

export const GetFeaturedServicesFn = (config: FeaturedServicesConfig) =>
  httpAzureFunction(makeFeaturedServicesHandler(config));
