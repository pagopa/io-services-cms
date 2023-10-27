import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import {
  InstitutionResource,
  InstitutionResources
} from "@/types/selfcare/InstitutionResource";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import { getInstitutionById, getUserAuthorizedInstitutions } from "./selfcare";

// TODO: remove me
/** @deprecated */
export const retrieveUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<InstitutionResources> => {
  const apiResult = await getUserAuthorizedInstitutions(selfCareUserId);
  return apiResult.map(toInstitution);
};
export const retrieveInstitution = async (
  institutionId: string
): Promise<BackofficeInstitution> => {
  return await getInstitutionById(institutionId);
};

// TODO: remove me
/** @deprecated */
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
  paymentServiceProvider: institutionResource.pspData,
  dataProtectionOfficer: institutionResource.dpoData,
  rea: institutionResource.companyInformations?.rea,
  shareCapital: institutionResource.companyInformations?.shareCapital,
  businessRegisterPlace:
    institutionResource.companyInformations?.businessRegisterPlace,
  supportEmail: institutionResource.assistanceContacts?.supportEmail,
  supportPhone: institutionResource.assistanceContacts?.supportPhone,
  subunitCode: institutionResource.subunitCode,
  subunitType: institutionResource.subunitType,
  aooParentCode: institutionResource.aooParentCode,
  rootParent: institutionResource.rootParent
});
