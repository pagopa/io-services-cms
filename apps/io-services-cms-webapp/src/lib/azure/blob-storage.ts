import { BlobService } from "azure-storage";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export const upsertBlobFromImageBuffer = (
  blobService: BlobService,
  containerName: string,
  blobName: string,
  content: Buffer,
): TE.TaskEither<Error, O.Option<BlobService.BlobResult>> =>
  pipe(
    TE.taskify<Error, BlobService.BlobResult>((cb) =>
      blobService.createBlockBlobFromText(containerName, blobName, content, cb),
    )(),
    TE.map(O.fromNullable),
  );
