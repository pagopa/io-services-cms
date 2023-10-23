import { getSelfcareService } from "@/lib/be/selfcare-service";

import { Institution } from "@/lib/be/selfcare/Institution";
import { InstitutionResources } from "@/lib/be/selfcare/InstitutionResource";
import * as E from "fp-ts/lib/Either";

export const getUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<InstitutionResources> => {
  const callResult = await getSelfcareService().getUserAuthorizedInstitutions(
    selfCareUserId
  )();

  if (E.isLeft(callResult)) {
    throw callResult.left;
  }

  return callResult.right;
};
export const getInstitutionById = async (
  institutionId: string
): Promise<Institution> => {
  // TODO: check if the user is authorized to access the request institution

  const callResult = await getSelfcareService().getInstitutionById(
    institutionId
  )();

  if (E.isLeft(callResult)) {
    throw callResult.left;
  }

  return callResult.right;
};
