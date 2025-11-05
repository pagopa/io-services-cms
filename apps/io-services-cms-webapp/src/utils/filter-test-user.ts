import { CommaSeparatedListOf } from "@pagopa/ts-commons/lib/comma-separated-list";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { gunzipSync } from "zlib";

/**
 * io-ts decoder for a base64 encoded gzipped string
 *
 * NOTE: Decodes into a string
 * Encode into itself, compression not supported
 * Supports UTF-8 characters
 */
export const GzipCompressedString = new t.Type<string, unknown>(
  "GzipCompressedString",
  t.string.is,
  (i, c) =>
    pipe(
      t.string.validate(i, c),
      E.mapLeft(() => t.failure<string>(i, c, "Invalid string in input")),
      E.chain((s) =>
        E.tryCatch(
          () => Buffer.from(s, "base64"),
          (e) => t.failure(i, c, `Base64 decode failed: ${e}`),
        ),
      ),
      E.chain((buffer) =>
        E.tryCatch(
          () => gunzipSync(Uint8Array.from(buffer)).toString(),
          (e) => t.failure(i, c, `Could not gunzip: ${e}`),
        ),
      ),
      E.map(t.success),
      E.getOrElseW(t.identity),
    ),
  t.identity,
);

export type GzipCompressedString = t.TypeOf<typeof GzipCompressedString>;

/**
 * Function to check if a fiscal code is in the test users set.
 *
 * @param testUsersSet - Set of test user fiscal codes
 * @returns Function that checks if a fiscal code is a test user or not
 */
export const isTestUser: (
  testUsersSet: Set<FiscalCode>,
) => (cf: FiscalCode) => boolean = (testUsersSet) => (cf) =>
  testUsersSet.has(cf);

export const TestUsersArrayDecoder = GzipCompressedString.pipe(
  CommaSeparatedListOf(FiscalCode),
);
