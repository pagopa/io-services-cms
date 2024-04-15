import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as L from "@pagopa/logger";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";
import { FeaturedItems } from "../generated/definitions/internal/FeaturedItems";
import { BlobServiceDependency } from "../utils/blob-storage/dependency";
import { getBlobAsObject } from "@pagopa/io-functions-commons/dist/src/utils/azure_storage";

export const retrieveFeaturedItems: () => RTE.ReaderTaskEither<
  BlobServiceDependency,
  H.HttpError,
  FeaturedItems
> =
  () =>
  ({ blobService }) =>
    pipe(
      TE.tryCatch(
        () =>
          getBlobAsObject(
            FeaturedItems,
            blobService,
            "FEATURED_ITEMS_CONTAINER_NAME",
            "FEATURED_ITEMS_FILE_NAME"
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
        TE.fromOption(() => new H.HttpError("The audit log was not saved"))
      )
    );

export const makeFeaturedServicesIntitutionsHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<FeaturedItems, 200>,
  BlobServiceDependency
> = H.of((request: H.HttpRequest) =>
  pipe(
    // Retrieve the featured Items from blobStorage
    retrieveFeaturedItems(),
    RTE.map(H.successJson),
    RTE.chainFirstW((response) =>
      L.infoRTE(`Http function processed request for url "${request.url}"`, {
        response,
      })
    )
  )
);

export const GetFeaturedServicesIntitutionsFn = httpAzureFunction(
  makeFeaturedServicesIntitutionsHandler
);
