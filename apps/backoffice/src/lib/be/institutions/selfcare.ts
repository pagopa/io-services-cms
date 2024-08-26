import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { Institution } from "@/generated/selfcare/Institution";
import {
  InstitutionNotFoundError,
  ManagedInternalError
} from "@/lib/be/errors";
import { getSelfcareClient, UserInstitutions } from "@/lib/be/selfcare-client";
import { isAxiosError } from "axios";
import * as E from "fp-ts/lib/Either";

export const getUserAuthorizedInstitutions = async (
  userId: string
): Promise<UserInstitutions> => {
  const apiResult = await getSelfcareClient().getUserAuthorizedInstitutions(
    userId
  )();

  // errore validazione parametri chiamata
  if (E.isLeft(apiResult)) {
    throw new ManagedInternalError(
      "Error calling selfcare getInstitutionsUsingGET API",
      apiResult.left
    );
  }

  return apiResult.right;
};

export const getInstitutionById = async (id: string): Promise<Institution> => {
  const apiResult = await getSelfcareClient().getInstitutionById(id)();

  if (E.isLeft(apiResult)) {
    const errorResult = apiResult.left;
    if (
      isAxiosError(errorResult) &&
      errorResult.response?.status === HTTP_STATUS_NOT_FOUND
    ) {
      throw new InstitutionNotFoundError(
        `Institution having id '${id}' does not exists`
      );
    }

    throw new ManagedInternalError(
      "Error calling selfcare getInstitution API",
      apiResult.left
    );
  }

  return apiResult.right;
};
