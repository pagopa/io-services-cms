/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { AttributesResponse } from "./AttributesResponse";
import { DataProtectionOfficerResponse } from "./DataProtectionOfficerResponse";
import { GeoTaxonomies } from "./GeoTaxonomies";
import { PaymentServiceProviderResponse } from "./PaymentServiceProviderResponse";
import * as t from "io-ts";
import { enumType } from "@pagopa/ts-commons/lib/types";

export enum InstitutionTypeEnum {
  "GSP" = "GSP",

  "PA" = "PA",

  "PG" = "PG",

  "PSP" = "PSP",

  "PT" = "PT",

  "SCP" = "SCP",

  "SA" = "SA",

  "AS" = "AS"
}

// required attributes
const InstitutionResponseR = t.interface({});

// optional attributes
const InstitutionResponseO = t.partial({
  address: t.string,

  aooParentCode: t.string,

  attributes: t.readonlyArray(
    AttributesResponse,
    "array of AttributesResponse"
  ),

  businessRegisterPlace: t.string,

  dataProtectionOfficer: DataProtectionOfficerResponse,

  description: t.string,

  digitalAddress: t.string,

  externalId: t.string,

  geographicTaxonomies: t.readonlyArray(
    GeoTaxonomies,
    "array of GeoTaxonomies"
  ),

  id: t.string,

  imported: t.boolean,

  institutionType: enumType<InstitutionTypeEnum>(
    InstitutionTypeEnum,
    "institutionType"
  ),

  origin: t.string,

  originId: t.string,

  parentDescription: t.string,

  paymentServiceProvider: PaymentServiceProviderResponse,

  rea: t.string,

  shareCapital: t.string,

  subunitCode: t.string,

  subunitType: t.string,

  supportEmail: t.string,

  supportPhone: t.string,

  taxCode: t.string,

  zipCode: t.string
});

export const InstitutionResponse = t.exact(
  t.intersection(
    [InstitutionResponseR, InstitutionResponseO],
    "InstitutionResponse"
  )
);

export type InstitutionResponse = t.TypeOf<typeof InstitutionResponse>;