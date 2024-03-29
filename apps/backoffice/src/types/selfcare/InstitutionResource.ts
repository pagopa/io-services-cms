/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { AssistanceContactsResource } from "./AssistanceContactsResource";
import { CompanyInformationsResource } from "./CompanyInformationsResource";
import { DpoDataResource } from "./DpoDataResource";
import { PspDataResource } from "./PspDataResource";
import { RootParentResource } from "./RootParentResource";
import * as t from "io-ts";
import { enumType } from "@pagopa/ts-commons/lib/types";

export enum InstitutionTypeEnum {
  "AS" = "AS",

  "GSP" = "GSP",

  "PA" = "PA",

  "PG" = "PG",

  "PSP" = "PSP",

  "PT" = "PT",

  "SA" = "SA",

  "SCP" = "SCP"
}

// required attributes
const InstitutionResourceR = t.interface({});

// optional attributes
const InstitutionResourceO = t.partial({
  address: t.string,

  aooParentCode: t.string,

  assistanceContacts: AssistanceContactsResource,

  city: t.string,

  companyInformations: CompanyInformationsResource,

  country: t.string,

  county: t.string,

  description: t.string,

  digitalAddress: t.string,

  dpoData: DpoDataResource,

  externalId: t.string,

  id: t.string,

  institutionType: enumType<InstitutionTypeEnum>(
    InstitutionTypeEnum,
    "institutionType"
  ),

  origin: t.string,

  originId: t.string,

  pspData: PspDataResource,

  recipientCode: t.string,

  rootParent: RootParentResource,

  status: t.string,

  subunitCode: t.string,

  subunitType: t.string,

  taxCode: t.string,

  userProductRoles: t.readonlyArray(t.string, "array of string"),

  zipCode: t.string,

  logo: t.string
});

export const InstitutionResource = t.exact(
  t.intersection(
    [InstitutionResourceR, InstitutionResourceO],
    "InstitutionResource"
  )
);

export type InstitutionResource = t.TypeOf<typeof InstitutionResource>;
