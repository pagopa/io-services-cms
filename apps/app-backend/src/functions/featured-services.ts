import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { getBlobAsObject } from "@pagopa/io-functions-commons/dist/src/utils/azure_storage";
import * as L from "@pagopa/logger";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { FeaturedItemsConfig } from "../config";
import { BlobServiceDependency } from "../utils/blob-storage/dependency";
import { FeaturedServices } from "../generated/definitions/internal/FeaturedServices";

/**
 * GET /services/featured AZF HttpTrigger
 * Retrieve the featured items Services from the blob storage
 */

export const retrieveFeaturedServices: (
  featuredItemsConfig: FeaturedItemsConfig
) => RTE.ReaderTaskEither<
  BlobServiceDependency,
  H.HttpError,
  FeaturedServices
> =
  (featuredItemsConfig: FeaturedItemsConfig) =>
  ({ blobService }) =>
    pipe(
      TE.tryCatch(
        () =>
          getBlobAsObject(
            FeaturedServices,
            blobService,
            featuredItemsConfig.FEATURED_ITEMS_CONTAINER_NAME,
            featuredItemsConfig.FEATURED_SERVICES_FILE_NAME
          ),
        (err) =>
          new H.HttpError(`Unexpected error: [${E.toError(err).message}]`)
      ),
      TE.chainEitherK(
        E.mapLeft(
          (err) =>
            new H.HttpError(
              `An error occurred retrieving featuredServices file from blobService: [${err.message}]`
            )
        )
      ),
      TE.map(O.getOrElse(() => ({ services: [] } as FeaturedServices))) // Return an empty list if the file is not found
    );

export const makeFeaturedServicesHandler: (
  featuredItemsConfig: FeaturedItemsConfig
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<FeaturedServices, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  BlobServiceDependency
> = (featuredItemsConfig: FeaturedItemsConfig) =>
  H.of((_: H.HttpRequest) =>
    pipe(
      // Retrieve the featured Services from blobStorage
      retrieveFeaturedServices(featuredItemsConfig),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message })
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(`Error executing GetFeaturedServicesFn`, errorResponse)
          )
        )
      )
    )
  );

export const GetFeaturedServicesFn = (
  featuredItemsConfig: FeaturedItemsConfig
) => httpAzureFunction(makeFeaturedServicesHandler(featuredItemsConfig));
