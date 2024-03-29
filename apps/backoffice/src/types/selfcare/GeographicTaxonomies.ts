/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";

// required attributes
const GeographicTaxonomiesR = t.interface({});

// optional attributes
const GeographicTaxonomiesO = t.partial({
  code: t.string,

  country: t.string,

  country_abbreviation: t.string,

  desc: t.string,

  enabled: t.boolean,

  istat_code: t.string,

  province_abbreviation: t.string,

  province_id: t.string,

  region_id: t.string
});

export const GeographicTaxonomies = t.exact(
  t.intersection(
    [GeographicTaxonomiesR, GeographicTaxonomiesO],
    "GeographicTaxonomies"
  )
);

export type GeographicTaxonomies = t.TypeOf<typeof GeographicTaxonomies>;
