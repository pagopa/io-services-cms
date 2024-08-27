import { BlobService } from "azure-storage";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

export const upsertBlobFromImageBuffer = (
  blobService: BlobService,
  containerName: string,
  blobName: string,
  content: Buffer
): TE.TaskEither<Error, O.Option<BlobService.BlobResult>> =>
  pipe(
    TE.taskify<Error, BlobService.BlobResult>((cb) =>
      blobService.createBlockBlobFromText(containerName, blobName, content, cb)
    )(),
    TE.map(O.fromNullable)
  );
