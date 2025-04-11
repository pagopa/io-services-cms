import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "io-ts-types/lib/NonEmptyString";

import { PdvTokenizerClient } from "../../pdvTokenizerClient";

export const enricher =
  <T extends { fiscalCode: string }>(
    pdvTokenizerClient: PdvTokenizerClient,
  ): RTE.ReaderTaskEither<
    T,
    Error,
    {
      userPDVId: NonEmptyString;
    } & T
  > =>
  (item: T) =>
    pipe(
      TE.tryCatch(
        () =>
          pdvTokenizerClient.saveUsingPUT({
            body: { pii: item.fiscalCode },
          }),
        E.toError,
      ),
      TE.chainEitherKW(
        E.mapLeft((errors) => Error(readableReportSimplified(errors))),
      ),
      TE.chain((pdvResponse) =>
        pdvResponse.status === 200
          ? TE.right<Error, string>(pdvResponse.value.token)
          : TE.left(
              Error(
                `Pdv tokenizer returned ${pdvResponse.status} with error: ${pdvResponse.value?.title}`,
              ),
            ),
      ),
      TE.chain(
        flow(
          NonEmptyString.decode,
          TE.fromEither,
          TE.mapLeft((errors) =>
            Error(
              `Unexpected empty token from tokenizer: ${readableReportSimplified(
                errors,
              )}`,
            ),
          ),
        ),
      ),
      TE.map((userPDVId) => ({
        ...item,
        userPDVId,
      })),
    );
