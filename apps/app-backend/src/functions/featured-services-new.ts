import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as L from "@pagopa/logger";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { FeaturedItemsConfig } from "../config";
import { FeaturedServices } from "../generated/definitions/internal/FeaturedServices";
import { BlobServiceClientDependency } from "../utils/blob-storage/dependency";
import { getBlobAsObject } from "../utils/blob-storage/helper";

/**
 * GET /institutions/featured AZF HttpTrigger
 * Retrieve the featured Institutions from the blob storage
 */

export const retrieveFeaturedServices: (
  featuredItemsConfig: FeaturedItemsConfig
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
        featuredItemsConfig.FEATURED_SERVICES_FILE_NAME
      ),
      TE.mapLeft(
        (err) =>
          new H.HttpError(
            `An error occurred retrieving featuredServices file from blobService: [${
              E.toError(err).message
            }]`
          )
      ),
      (x) => x,
      TE.map(O.getOrElse(() => ({ services: [] } as FeaturedServices))) // Return an empty list if the file is not found
    );

export const makeFeaturedServicesNewHandler: (
  featuredItemsConfig: FeaturedItemsConfig
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<FeaturedServices, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  BlobServiceClientDependency
> = (featuredItemsConfig: FeaturedItemsConfig) =>
  H.of((_: H.HttpRequest) =>
    pipe(
      // Retrieve the featured Institutions from blobStorage
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

export const GetFeaturedServicesNewFn = (
  featuredItemsConfig: FeaturedItemsConfig
) => httpAzureFunction(makeFeaturedServicesNewHandler(featuredItemsConfig));
