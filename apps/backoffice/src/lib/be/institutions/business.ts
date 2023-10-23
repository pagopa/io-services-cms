import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { getSelfcareService } from "@/lib/be/selfcare-service";

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

  return callResult.right;
};
