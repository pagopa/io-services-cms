import { BlobServiceClient, RestError } from "@azure/storage-blob";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as B from "fp-ts/boolean";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

/**
 * Get a blob content as a typed (io-ts) object.
 *
 * @param blobServiceClient     the Azure blob service client
 * @param containerName         the name of the Azure blob storage container
 * @param blobName              blob file name
 */
export const getBlobAsObject = <A, O, I>(
  type: t.Type<A, O, I>,
  blobServiceClient: BlobServiceClient,
  containerName: string,
  blobName: string
): TE.TaskEither<RestError | Error, O.Option<A>> =>
  pipe(
    TE.tryCatch(
      () =>
        blobServiceClient
          .getContainerClient(containerName)
          .getBlockBlobClient(blobName)
          .downloadToBuffer(),
      (error) =>
        pipe(
          error instanceof RestError,
          B.fold(
            () => error as RestError,
            () => E.toError(error)
          )
        )
    ),
    TE.chainW((buffer) =>
      pipe(
        E.tryCatch(() => buffer.toString(), E.toError),
        TE.fromEither
      )
    ),
    TE.chainW((blobContent) =>
      pipe(
        type.decode(JSON.parse(blobContent)),
        E.fold(
          (errors) =>
            TE.left(new Error(`Cannot decode blob content: ${errors}`)),
          (result) => TE.right(O.some(result))
        )
      )
    ),
    TE.orElseW((error) =>
      pipe(
        error instanceof RestError && error.statusCode === 404,
        B.fold(
          () => TE.left(E.toError(error)),
          () => TE.right(O.none)
        )
      )
    )
  );
