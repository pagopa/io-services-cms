/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";

// required attributes
const GeographicTaxonomyResourceR = t.interface({});

// optional attributes
const GeographicTaxonomyResourceO = t.partial({
  code: t.string,

  desc: t.string
});

export const GeographicTaxonomyResource = t.exact(
  t.intersection(
    [GeographicTaxonomyResourceR, GeographicTaxonomyResourceO],
    "GeographicTaxonomyResource"
  )
);

export type GeographicTaxonomyResource = t.TypeOf<
  typeof GeographicTaxonomyResource
>;
