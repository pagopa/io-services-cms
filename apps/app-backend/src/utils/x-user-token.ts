import { DateFromString } from "@pagopa/ts-commons/lib/dates";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";

import { UserIdentity } from "../generated/io-auth/UserIdentity";

/**
 * `UserIdentity` with `date_of_birth` parsed as a `Date`.
 *
 * The A&I OpenAPI spec (io-session-manager) types `date_of_birth` as a plain
 * string; here we adapt it to a `Date` so downstream logic (e.g. age
 * computation) can consume it directly without re-parsing.
 */
export type XUser = {
  readonly date_of_birth: Date;
} & Omit<UserIdentity, "date_of_birth">;

/**
 * Adapts a decoded `UserIdentity` into an `XUser`, parsing `date_of_birth`
 * from string to `Date`. Returns an error if the date is not valid.
 */
const toXUser = (user: UserIdentity): Either<Error, XUser> =>
  pipe(
    DateFromString.decode(user.date_of_birth),
    E.bimap(
      (err) => new Error(errorsToReadableMessages(err).join("/")),
      (date_of_birth) => ({ ...user, date_of_birth }),
    ),
  );

/**
 * Parses a string value into an `XUser` object.
 *
 * This function attempts to parse the input string as JSON, decode it into a
 * `UserIdentity` object and adapt it into an `XUser`. If the parsing, decoding
 * or adaptation fails, returns an error.
 *
 * @param value - The string value to parse
 * @returns Either an Error or an XUser object
 */
const parseUser = (value: string): Either<Error, XUser> =>
  pipe(
    E.parseJSON(value, E.toError),
    E.chain(
      flow(
        UserIdentity.decode,
        E.mapLeft((err) => new Error(errorsToReadableMessages(err).join("/"))),
      ),
    ),
    E.chain(toXUser),
  );

/**
 * Decodes an x-user token into an `XUser` object.
 *
 * This function attempts to decode the input x-user token from base64 to a
 * string and then parse it into an `XUser` object. If the decoding or parsing
 * fails, returns an error.
 *
 * @param token - The x-user token to decode
 * @returns Either an Error or an XUser object
 */
export const decodeToken = (token: string): Either<Error, XUser> =>
  pipe(
    E.tryCatch(
      () => Buffer.from(token, "base64").toString("utf-8"),
      (err) => E.toError(err),
    ),
    E.chain(
      E.fromPredicate(
        (decodedToken: string) => decodedToken !== "",
        () => new Error("Invalid token"),
      ),
    ),
    E.chain(parseUser),
  );
