import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { getSelfcareService } from "@/lib/be/selfcare-service";

import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { Institution as SelfcareInstitution } from "@/lib/be/selfcare/Institution";
import { InstitutionResources } from "@/lib/be/selfcare/InstitutionResource";
import * as E from "fp-ts/lib/Either";
import { InstitutionNotFoundError } from "../errors";

export const getUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<InstitutionResources> => {
  const callResult = await getSelfcareService().getUserAuthorizedInstitutions(
    selfCareUserId
  )();

  if (E.isLeft(callResult)) {
    throw callResult.left;
  }

  return callResult.right.value;
};
export const getInstitutionById = async (
  institutionId: string
): Promise<SelfcareInstitution> => {
  const callResult = await getSelfcareService().getInstitutionById(
    institutionId
  )();

  if (E.isLeft(callResult)) {
    throw callResult.left;
  }

  const { value, status } = callResult.right;
  if (status === HTTP_STATUS_NOT_FOUND) {
    throw new InstitutionNotFoundError(
      `Institution having id '${institutionId} does not exists`
    );
  }

  return value;
};

const selfcareToBackofficeInstitution = (
  selfcareInstitution: SelfcareInstitution
): BackofficeInstitution => ({
  address: selfcareInstitution.address,
  externalId: selfcareInstitution.externalId,
  fiscalCode: selfcareInstitution.taxCode,
  id: selfcareInstitution.id,
  mailAddress: selfcareInstitution.supportEmail,
  name: selfcareInstitution.description,
  origin: selfcareInstitution.origin,
  originId: selfcareInstitution.originId,
  status: selfcareInstitution.status,
  userProductRoles: selfcareInstitution.userProductRoles,
  assistanceContacts: selfcareInstitution.assistanceContacts,
  companyInformations: selfcareInstitution.companyInformations,
  dpoData: selfcareInstitution.dpoData,
  institutionType: selfcareInstitution.institutionType,
  pspData: selfcareInstitution.pspData,
  recipientCode: selfcareInstitution.recipientCode
});
