import * as H from "@pagopa/handler-kit";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import { flow } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { lookup } from "fp-ts/lib/Record";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Decoder } from "io-ts";

export const RequiredQueryParamMiddleware: <T>(
  schema: Decoder<unknown, T>,
  queryParam: NonEmptyString
) => RTE.ReaderTaskEither<H.HttpRequest, H.HttpBadRequestError, T> = <T>(
  schema: Decoder<unknown, T>,
  queryParam: NonEmptyString
) =>
  flow(
    (req) => req.query,
    lookup(queryParam),
    TE.fromOption(
      () =>
        new H.HttpBadRequestError(`Missing "${queryParam}" in request query`)
    ),
    TE.chainEitherK(
      flow(
        H.parse(schema, `Invalid "${queryParam}" supplied in request query`),
        E.mapLeft((err) => new H.HttpBadRequestError(err.message))
      )
    )
  );

export const RequiredWithDefaultQueryParamMiddleware: <T>(
  schema: Decoder<unknown, T>,
  queryParam: NonEmptyString,
  defaultValue: T
) => RTE.ReaderTaskEither<H.HttpRequest, H.HttpBadRequestError, T> = <T>(
  schema: Decoder<unknown, T>,
  queryParam: NonEmptyString,
  defaultValue: T
) =>
  flow(
    (req) => req.query,
    lookup(queryParam),
    O.fold(
      () => E.right(defaultValue),
      (value) =>
        flow(
          H.parse(schema, `Invalid "${queryParam}" supplied in request query`),
          E.mapLeft((err) => new H.HttpBadRequestError(err.message))
        )(value)
    ),
    TE.fromEither
  );

export const OptionalQueryParamMiddleware: <T>(
  schema: Decoder<unknown, T>,
  queryParam: NonEmptyString
) => RTE.ReaderTaskEither<H.HttpRequest, H.HttpBadRequestError, O.Option<T>> = <
  T
>(
  schema: Decoder<unknown, T>,
  queryParam: NonEmptyString
) =>
  flow(
    (req) => req.query,
    lookup(queryParam),
    O.fold(
      () => E.right(O.none),
      (value) =>
        flow(
          H.parse(schema, `Invalid "${queryParam}" supplied in request query`),
          E.map(O.some),
          E.mapLeft((err) => new H.HttpBadRequestError(err.message))
        )(value)
    ),
    TE.fromEither
  );
