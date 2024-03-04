import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import {
  InstitutionNotFoundError,
  ManagedInternalError
} from "@/lib/be/errors";
import { getSelfcareClient } from "@/lib/be/selfcare-client";
import { Institution } from "@/types/selfcare/Institution";
import { InstitutionResources } from "@/types/selfcare/InstitutionResources";
import { isAxiosError } from "axios";
import * as E from "fp-ts/lib/Either";

export const getUserAuthorizedInstitutions = async (
  userIdForAuth: string
): Promise<InstitutionResources> => {
  const apiResult = await getSelfcareClient().getUserAuthorizedInstitutions(
    userIdForAuth
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
