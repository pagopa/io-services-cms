/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";

// required attributes
const DataProtectionOfficerR = t.interface({});

// optional attributes
const DataProtectionOfficerO = t.partial({
  address: t.string,

  email: t.string,

  pec: t.string
});

export const DataProtectionOfficer = t.exact(
  t.intersection(
    [DataProtectionOfficerR, DataProtectionOfficerO],
    "DataProtectionOfficer"
  )
);

export type DataProtectionOfficer = t.TypeOf<typeof DataProtectionOfficer>;
