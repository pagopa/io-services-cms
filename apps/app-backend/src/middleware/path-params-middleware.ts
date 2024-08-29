import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { lookup } from "fp-ts/lib/Record";
import { flow } from "fp-ts/lib/function";
import { Decoder } from "io-ts";

export const PathParamValidatorMiddleware: <T>(
  pathParam: string,
  schema: Decoder<unknown, T>,
) => RTE.ReaderTaskEither<H.HttpRequest, H.HttpBadRequestError, T> = <T>(
  pathParam: string,
  schema: Decoder<unknown, T>,
) =>
  flow(
    (req) => req.path,
    lookup(pathParam),
    TE.fromOption(
      () =>
        new H.HttpBadRequestError(
          `Cannot extract Path param '${pathParam}' from request`,
        ),
    ),
    TE.chainEitherK(
      flow(
        H.parse(
          schema,
          `Invalid pathParam '${pathParam}' supplied in request query`,
        ),
        E.mapLeft((err) => new H.HttpBadRequestError(err.message)),
      ),
    ),
  );
