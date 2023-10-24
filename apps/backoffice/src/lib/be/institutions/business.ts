import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { getSelfcareService } from "@/lib/be/selfcare-service";

import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import {
  InstitutionResource,
  InstitutionResources
} from "@/lib/be/selfcare/InstitutionResource";
import { InstitutionNotFoundError } from "../errors";
import { getInstitutionById, getUserAuthorizedInstitutions } from "./selfcare";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

export const retireveUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<InstitutionResources> => {
  const apiResult = await getUserAuthorizedInstitutions(selfCareUserId);
  return apiResult.map(toInstitution);
};
export const retieveInstitution = async (
  institutionId: string
): Promise<BackofficeInstitution> => {
  return getInstitutionById(institutionId);
};

const toInstitution = (
  institutionResource: InstitutionResource
): BackofficeInstitution => ({
  id: institutionResource.id,
  externalId: institutionResource.externalId,
  originId: institutionResource.originId,
  description: institutionResource.description,
  mailAddress: pipe(
    institutionResource.digitalAddress,
    EmailString.decode,
    O.fromEither,
    O.toUndefined
  ),
  address: institutionResource.address,
  zipCode: institutionResource.zipCode,
  taxCode: institutionResource.taxCode,
  origin: institutionResource.origin,
  institutionType: institutionResource.institutionType,
  //attributes: institutionResource.attributes,
  paymentServiceProvider: institutionResource.pspData,
  dataProtectionOfficer: institutionResource.dpoData,
  //geographicTaxonomies: institutionResource.geographicTaxonomies,
  rea: institutionResource.companyInformations?.rea,
  shareCapital: institutionResource.companyInformations?.shareCapital,
  businessRegisterPlace:
    institutionResource.companyInformations?.businessRegisterPlace,
  supportEmail: institutionResource.assistanceContacts?.supportEmail,
  supportPhone: institutionResource.assistanceContacts?.supportPhone,
  //imported: institutionResource.imported,
  //logo: institutionResource.logo,
  subunitCode: institutionResource.subunitCode,
  subunitType: institutionResource.subunitType,
  aooParentCode: institutionResource.aooParentCode,
  rootParent: institutionResource.rootParent
});
