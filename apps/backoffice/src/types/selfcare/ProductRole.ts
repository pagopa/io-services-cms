/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";

// required attributes
const ProductRoleR = t.interface({
  code: t.string,

  description: t.string,

  label: t.string
});

// optional attributes
const ProductRoleO = t.partial({});

export const ProductRole = t.exact(
  t.intersection([ProductRoleR, ProductRoleO], "ProductRole")
);

export type ProductRole = t.TypeOf<typeof ProductRole>;