import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json } from "io-ts-types";
import { QueuePermanentError } from "./errors";

export const parseIncomingMessage =
  <A>(decoder: t.Decoder<unknown, A>) =>
  (queueItem: Json): E.Either<QueuePermanentError, A> =>
    pipe(
      queueItem,
      decoder.decode,
      E.mapLeft(
        flow(
          readableReport,
          (_) => new QueuePermanentError(`Error parsing incoming message: ${_}`)
        )
      )
    );
