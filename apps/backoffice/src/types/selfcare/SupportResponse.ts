/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";

// required attributes
const SupportResponseR = t.interface({});

// optional attributes
const SupportResponseO = t.partial({
  redirectUrl: t.string
});

export const SupportResponse = t.exact(
  t.intersection([SupportResponseR, SupportResponseO], "SupportResponse")
);

export type SupportResponse = t.TypeOf<typeof SupportResponse>;
