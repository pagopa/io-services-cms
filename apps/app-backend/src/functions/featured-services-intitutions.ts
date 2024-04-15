import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { getBlobAsObject } from "@pagopa/io-functions-commons/dist/src/utils/azure_storage";
import * as L from "@pagopa/logger";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { FeaturedItemsConfig } from "../config";
import { FeaturedItems } from "../generated/definitions/internal/FeaturedItems";
import { BlobServiceDependency } from "../utils/blob-storage/dependency";

export const retrieveFeaturedItems: (
  featuredItemsConfig: FeaturedItemsConfig
) => RTE.ReaderTaskEither<BlobServiceDependency, H.HttpError, FeaturedItems> =
  (featuredItemsConfig: FeaturedItemsConfig) =>
  ({ blobService }) =>
    pipe(
      TE.tryCatch(
        () =>
          getBlobAsObject(
            FeaturedItems,
            blobService,
            featuredItemsConfig.FEATURED_ITEMS_CONTAINER_NAME,
            featuredItemsConfig.FEATURED_ITEMS_FILE_NAME
          ),
        (err) =>
          new H.HttpError(`Unexpected error: [${E.toError(err).message}]`)
      ),
      TE.chainEitherK(
        E.mapLeft(
          (err) =>
            new H.HttpError(
              `An error occurred retrieving featuredItems file from blobService: [${err.message}]`
            )
        )
      ),
      TE.chain(
        TE.fromOption(
          () => new H.HttpError("No featuredItems file found on blobService")
        )
      )
    );

export const makeFeaturedServicesIntitutionsHandler: (
  featuredItemsConfig: FeaturedItemsConfig
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<FeaturedItems, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  BlobServiceDependency
> = (featuredItemsConfig: FeaturedItemsConfig) =>
  H.of((_: H.HttpRequest) =>
    pipe(
      // Retrieve the featured Items from blobStorage
      retrieveFeaturedItems(featuredItemsConfig),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message })
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(
              `Error executing GetFeaturedServicesIntitutionsFn`,
              errorResponse
            )
          )
        )
      )
    )
  );

export const GetFeaturedServicesIntitutionsFn = (
  featuredItemsConfig: FeaturedItemsConfig
) =>
  httpAzureFunction(
    makeFeaturedServicesIntitutionsHandler(featuredItemsConfig)
  );
