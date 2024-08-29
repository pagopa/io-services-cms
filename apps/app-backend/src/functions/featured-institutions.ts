import * as H from "@pagopa/handler-kit";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as L from "@pagopa/logger";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { FeaturedItemsConfig } from "../config";
import { Institutions } from "../generated/definitions/internal/Institutions";
import { BlobServiceClientDependency } from "../utils/blob-storage/dependency";
import { getBlobAsObject } from "../utils/blob-storage/helper";

/**
 * GET /institutions/featured AZF HttpTrigger
 * Retrieve the featured Institutions from the blob storage
 */

export const retrieveInstitutionsItems: (
  featuredItemsConfig: FeaturedItemsConfig,
) => RTE.ReaderTaskEither<
  BlobServiceClientDependency,
  H.HttpError,
  Institutions
> =
  (featuredItemsConfig: FeaturedItemsConfig) =>
  ({ blobServiceClient }) =>
    pipe(
      getBlobAsObject(
        Institutions,
        blobServiceClient,
        featuredItemsConfig.FEATURED_ITEMS_CONTAINER_NAME,
        featuredItemsConfig.FEATURED_INSTITUTIONS_FILE_NAME,
      ),
      TE.mapLeft(
        (err) =>
          new H.HttpError(
            `An error occurred retrieving featuredInstitutions file from blobService: [${err.message}]`,
          ),
      ),
      TE.map(O.getOrElse(() => ({ institutions: [] }) as Institutions)), // Return an empty list if the file is not found
    );

export const makeFeaturedInstitutionsHandler: (
  featuredItemsConfig: FeaturedItemsConfig,
) => H.Handler<
  H.HttpRequest,
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>
  | H.HttpResponse<Institutions, 200>,
  BlobServiceClientDependency
> = (featuredItemsConfig: FeaturedItemsConfig) =>
  H.of((_: H.HttpRequest) =>
    pipe(
      // Retrieve the featured Institutions from blobStorage
      retrieveInstitutionsItems(featuredItemsConfig),
      RTE.map(H.successJson),
      RTE.orElseW((error) =>
        pipe(
          RTE.right(
            H.problemJson({ status: error.status, title: error.message }),
          ),
          RTE.chainFirstW((errorResponse) =>
            L.errorRTE(
              `Error executing GetFeaturedInstitutionsFn`,
              errorResponse,
            ),
          ),
        ),
      ),
    ),
  );

export const GetFeaturedInstitutionsFn = (
  featuredItemsConfig: FeaturedItemsConfig,
) => httpAzureFunction(makeFeaturedInstitutionsHandler(featuredItemsConfig));
